import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { DurableQueueService, QueueJobPayload } from '../../queue/durable-queue.service';
import { NotificationService, NotificationPayload } from '../notification.service';

@Injectable()
export class NotificationDispatcherWorker {
  private readonly logger = new Logger(NotificationDispatcherWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly queueService: DurableQueueService,
  ) {}

  /**
   * Process queued notification jobs and persist NotificationRecord in PostgreSQL.
   */
  async processJob(job: QueueJobPayload<NotificationPayload>): Promise<{ success: boolean; recordId?: string }> {
    if (!job || !job.data) {
      throw new Error('INVALID_NOTIFICATION_JOB_PAYLOAD');
    }

    const payload = job.data;

    try {
      const record = await this.notificationService.createNotification(payload);
      await this.queueService.acknowledgeCompletion(job.jobId, 'notifications');
      this.logger.log(`[NotificationDispatcherWorker] Dispatched notification record ${record?.id} for user ${payload.userId}`);
      return { success: true, recordId: record?.id };
    } catch (err: any) {
      this.logger.error(`[NotificationDispatcherWorker] Failed notification dispatch ${job.jobId}: ${err.message}`);
      await this.queueService.handleFailure(job, err);
      throw err;
    }
  }
}
