import { Injectable, Logger } from '@nestjs/common';
import { DurableQueueService, QueueJobPayload } from '../../queue/durable-queue.service';
import { ProductionReadinessEngineService } from '../services/production-readiness-engine.service';

@Injectable()
export class ReconciliationWorker {
  private readonly logger = new Logger(ReconciliationWorker.name);

  constructor(
    private readonly readinessEngine: ProductionReadinessEngineService,
    private readonly queueService: DurableQueueService,
  ) {}

  /**
   * Process queued double-entry ledger reconciliation jobs.
   */
  async processJob(job: QueueJobPayload): Promise<{ success: boolean; metrics?: any }> {
    try {
      const result = await this.readinessEngine.reconcileLedgerIntegrity();
      await this.queueService.acknowledgeCompletion(job.jobId, 'reconciliation');
      this.logger.log(`[ReconciliationWorker] Executed ledger reconciliation: status = ${result.integrityStatus}`);
      return { success: result.integrityStatus === 'HEALTHY', metrics: result };
    } catch (err: any) {
      this.logger.error(`[ReconciliationWorker] Failed reconciliation job ${job.jobId}: ${err.message}`);
      await this.queueService.handleFailure(job, err);
      throw err;
    }
  }
}
