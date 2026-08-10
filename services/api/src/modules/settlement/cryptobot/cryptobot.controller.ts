import { Body, Controller, Headers, HttpCode, HttpStatus, Logger, Post, Req, UnauthorizedException } from '@nestjs/common';
import { CryptoBotSignatureService } from './cryptobot.signature.service';
import { CryptoBotReconciliationService } from './cryptobot.reconciliation.service';
import { CryptoBotClient } from './cryptobot.client';
import { Public } from '../../../common/decorators/public.decorator';
import { IdempotencyService } from '../../financial-orchestration/idempotency.service';
import { OperationsQueueStatus } from '@prisma/client';

@Controller('settlement/cryptobot')
export class CryptoBotController {
  private readonly logger = new Logger(CryptoBotController.name);

  constructor(
    private readonly signatureService: CryptoBotSignatureService,
    private readonly reconciliationService: CryptoBotReconciliationService,
    private readonly client: CryptoBotClient,
    private readonly idempotency: IdempotencyService,
  ) {}

  @Post('webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  async handleWebhook() {
    this.logger.warn('[CryptoBotWebhook] Rejected webhook request for retired provider CryptoBot.');
    throw new BadRequestException('CRYPTOBOT_PROVIDER_RETIRED: CryptoBot payment webhook is retired and no longer accepts transactions.');
  }
}
