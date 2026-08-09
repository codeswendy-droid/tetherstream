import { Injectable, Logger, Inject, forwardRef, Optional } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { DurableQueueService, QueueJobPayload } from '../../queue/durable-queue.service';
import { WithdrawalService, InitiateWithdrawalDto } from '../withdrawal.service';
import { PlatformOperationsEngineService } from '../../admin/services/platform-operations-engine.service';

@Injectable()
export class WithdrawalWorker {
  private readonly logger = new Logger(WithdrawalWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly withdrawalService: WithdrawalService,
    private readonly queueService: DurableQueueService,
    @Optional() @Inject(forwardRef(() => PlatformOperationsEngineService)) private readonly opsEngine?: PlatformOperationsEngineService,
  ) {}

  /**
   * Process queued withdrawal jobs with Stage 2 emergency switch assertions & strict idempotency.
   */
  async processJob(job: QueueJobPayload<InitiateWithdrawalDto>): Promise<{ success: boolean; session?: any }> {
    if (!job || !job.data) {
      throw new Error('INVALID_WITHDRAWAL_JOB_PAYLOAD');
    }

    // 1. Stage 2 Operational Switch Enforcement
    if (this.opsEngine) {
      await this.opsEngine.assertOperationalModeAllowed('WITHDRAWAL', job.data.asset || 'USDT');
    }

    // 2. Strict Financial Idempotency Check
    const existingTx = await this.prisma.financialIdempotencyRecord.findUnique({
      where: {
        telegramUserId_idempotencyKey: {
          telegramUserId: BigInt(job.data.telegramUserId),
          idempotencyKey: job.idempotencyKey,
        },
      },
    });

    if (existingTx && existingTx.status === 'COMPLETED') {
      this.logger.log(`[WithdrawalWorker] Job ${job.jobId} already processed (Idempotency: ${job.idempotencyKey}). Exiting cleanly.`);
      await this.queueService.acknowledgeCompletion(job.jobId, 'withdrawals');
      return { success: true };
    }

    try {
      const result = await this.withdrawalService.initiateWithdrawal(job.data, job.idempotencyKey);
      await this.queueService.acknowledgeCompletion(job.jobId, 'withdrawals');
      this.logger.log(`[WithdrawalWorker] Processed withdrawal job ${job.jobId}`);
      return { success: true, session: result };
    } catch (err: any) {
      const errMsg = err?.message || '';
      const isTimeoutOrUnknown = errMsg.includes('TIMEOUT') || errMsg.includes('NETWORK_ERROR') || errMsg.includes('UNKNOWN');

      if (isTimeoutOrUnknown) {
        this.logger.warn(`[WithdrawalWorker] Provider timeout/network failure on job ${job.jobId}: ${errMsg}. Marking UNKNOWN_OUTCOME.`);
        // Queue reconciliation check task without duplicating payout
        await this.queueService.enqueueJob('reconciliation', `reconcile_wd_${job.idempotencyKey}`, {
          withdrawalId: job.idempotencyKey,
          reason: `Provider status lookup required for timeout: ${errMsg}`,
        });
      }

      this.logger.error(`[WithdrawalWorker] Failed withdrawal job ${job.jobId}: ${errMsg}`);
      await this.queueService.handleFailure(job, err);
      throw err;
    }
  }
}
