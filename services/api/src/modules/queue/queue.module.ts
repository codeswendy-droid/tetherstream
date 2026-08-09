import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { DurableQueueService } from './durable-queue.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [DurableQueueService],
  exports: [DurableQueueService],
})
export class QueueModule {}
