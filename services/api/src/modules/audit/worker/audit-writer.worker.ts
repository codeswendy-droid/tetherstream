import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { DurableQueueService, QueueJobPayload } from '../../queue/durable-queue.service';
import { AuditEventType } from '@prisma/client';

export interface AuditPayload {
  telegramUserId?: bigint;
  eventType: AuditEventType;
  description?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  correlationId?: string;
  severity?: string;
  source?: string;
}

@Injectable()
export class AuditWriterWorker {
  private readonly logger = new Logger(AuditWriterWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: DurableQueueService,
  ) {}

  /**
   * Process queued audit event jobs and persist them to PostgreSQL.
   */
  async processJob(job: QueueJobPayload<AuditPayload>): Promise<{ success: boolean; auditId?: string }> {
    if (!job || !job.data) {
      throw new Error('INVALID_AUDIT_JOB_PAYLOAD');
    }

    const { telegramUserId, eventType, description, metadata, ipAddress, userAgent, sessionId, correlationId, severity, source } = job.data;

    try {
      const record = await this.prisma.auditEvent.create({
        data: {
          telegramUserId: telegramUserId ? BigInt(telegramUserId) : null,
          eventType,
          description,
          metadata: metadata || {},
          ipAddress,
          userAgent,
          sessionId,
          correlationId: correlationId || job.idempotencyKey,
          severity: severity || 'INFO',
          source: source || 'AUDIT_WORKER',
        },
      });

      await this.queueService.acknowledgeCompletion(job.jobId, 'reconciliation');
      this.logger.log(`[AuditWriterWorker] Successfully persisted AuditEvent ${record.id} (type: ${eventType})`);

      return { success: true, auditId: record.id };
    } catch (err: any) {
      this.logger.error(`[AuditWriterWorker] Failed to process audit job ${job.jobId}: ${err.message}`);
      await this.queueService.handleFailure(job, err);
      throw err;
    }
  }
}
