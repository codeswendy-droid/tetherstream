import { Injectable, Logger } from '@nestjs/common';
import { SettlementStatus, UsdtTxProcessingStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

export interface UsdtReconciliationAnomaly {
  anomalyType:
    | 'UNMATCHED_BLOCKCHAIN_DEPOSIT'
    | 'UNSETTLED_SESSION'
    | 'AMBIGUOUS_DEPOSIT'
    | 'AMOUNT_MISMATCH'
    | 'SUCCESS_WITHOUT_LEDGER';
  transactionId?: string;
  settlementId?: string;
  transactionHash?: string;
  amount?: string;
  details: string;
}

@Injectable()
export class UsdtReconciliationService {
  private readonly logger = new Logger(UsdtReconciliationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Diagnostic sweep over USDT blockchain transactions and settlement sessions.
   * Returns list of detected anomalies. Does NOT automatically alter balances.
   */
  async sweepAnomalies(): Promise<UsdtReconciliationAnomaly[]> {
    const anomalies: UsdtReconciliationAnomaly[] = [];

    // 1. Check for ambiguous / unmatched transactions
    const anomalousTxs = await this.prisma.usdtBlockchainTransaction.findMany({
      where: {
        processingStatus: {
          in: [
            UsdtTxProcessingStatus.AMBIGUOUS_MATCH,
            UsdtTxProcessingStatus.UNDERPAYMENT,
            UsdtTxProcessingStatus.OVERPAYMENT,
            UsdtTxProcessingStatus.RECONCILIATION_REQUIRED,
          ],
        },
      },
      take: 100,
    });

    for (const tx of anomalousTxs) {
      anomalies.push({
        anomalyType:
          tx.processingStatus === UsdtTxProcessingStatus.AMBIGUOUS_MATCH
            ? 'AMBIGUOUS_DEPOSIT'
            : tx.processingStatus === UsdtTxProcessingStatus.UNDERPAYMENT || tx.processingStatus === UsdtTxProcessingStatus.OVERPAYMENT
            ? 'AMOUNT_MISMATCH'
            : 'UNMATCHED_BLOCKCHAIN_DEPOSIT',
        transactionId: tx.id,
        transactionHash: tx.transactionHash,
        amount: tx.normalizedAmount.toString(),
        details: tx.anomalyReason || `Processing status is ${tx.processingStatus}`,
      });
    }

    // 2. Check for completed sessions without ledger reference
    const brokenSessions = await this.prisma.settlementSession.findMany({
      where: {
        provider: 'USDT',
        status: SettlementStatus.COMPLETED,
        orchestratorReference: null,
      },
      take: 50,
    });

    for (const session of brokenSessions) {
      anomalies.push({
        anomalyType: 'SUCCESS_WITHOUT_LEDGER',
        settlementId: session.id,
        amount: session.expectedCryptoAmount.toString(),
        details: `Session ${session.id} is marked COMPLETED but has null orchestratorReference`,
      });
    }

    // 3. Check for stuck pending sessions (> 1 hour old)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const stuckSessions = await this.prisma.settlementSession.findMany({
      where: {
        provider: 'USDT',
        status: { in: [SettlementStatus.WAITING_FOR_PAYMENT, SettlementStatus.VERIFYING] },
        createdAt: { lt: oneHourAgo },
      },
      take: 50,
    });

    for (const session of stuckSessions) {
      anomalies.push({
        anomalyType: 'UNSETTLED_SESSION',
        settlementId: session.id,
        amount: session.expectedCryptoAmount.toString(),
        details: `Session ${session.id} created at ${session.createdAt.toISOString()} has been waiting for payment over 1 hour`,
      });
    }

    this.logger.log(`[UsdtReconciliationService] Sweep completed: ${anomalies.length} anomalies detected.`);
    return anomalies;
  }
}
