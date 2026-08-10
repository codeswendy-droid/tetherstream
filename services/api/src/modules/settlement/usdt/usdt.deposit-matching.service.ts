import { Injectable, Logger } from '@nestjs/common';
import { Prisma, SettlementStatus, UsdtTxProcessingStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { UsdtTokenTransferEvent } from './usdt.types';

@Injectable()
export class UsdtDepositMatchingService {
  private readonly logger = new Logger(UsdtDepositMatchingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Evaluates an incoming blockchain transaction against active SettlementSession records.
   * Returns matching result & processing status.
   */
  async matchTransaction(
    tx: UsdtTokenTransferEvent,
    activeReceivingAddress: string,
    canonicalTokenContract: string,
    requiredConfirmations: number,
  ): Promise<{
    status: UsdtTxProcessingStatus;
    matchedSessionId?: string;
    anomalyReason?: string;
  }> {
    // 1. Recipient Address Safety Check
    if (tx.recipientAddress.trim() !== activeReceivingAddress.trim()) {
      // Check historical addresses
      const historicalMatch = await this.prisma.usdtAddressHistory.findFirst({
        where: { address: tx.recipientAddress.trim() },
      });
      if (!historicalMatch) {
        return {
          status: UsdtTxProcessingStatus.INVALID_RECIPIENT,
          anomalyReason: `Recipient ${tx.recipientAddress} does not match active (${activeReceivingAddress}) or historical receiving addresses`,
        };
      }
    }

    // 2. Token Contract Safety Check
    if (tx.tokenContract.toLowerCase() !== canonicalTokenContract.toLowerCase()) {
      return {
        status: UsdtTxProcessingStatus.INVALID_TOKEN,
        anomalyReason: `Token contract ${tx.tokenContract} does not match canonical USDT contract ${canonicalTokenContract}`,
      };
    }

    // 3. Confirmations Check
    if (tx.confirmations < requiredConfirmations) {
      return {
        status: UsdtTxProcessingStatus.CONFIRMING,
        anomalyReason: `Transaction has ${tx.confirmations}/${requiredConfirmations} confirmations`,
      };
    }

    // 4. Duplicate Check
    const existingDbTx = await this.prisma.usdtBlockchainTransaction.findUnique({
      where: {
        usdt_tx_unique: {
          network: tx.network,
          tokenContract: tx.tokenContract,
          transactionHash: tx.transactionHash,
        },
      },
    });

    if (existingDbTx && existingDbTx.processingStatus === UsdtTxProcessingStatus.SETTLED) {
      return {
        status: UsdtTxProcessingStatus.DUPLICATE,
        matchedSessionId: existingDbTx.settlementSessionId || undefined,
        anomalyReason: `Transaction ${tx.transactionHash} was already settled in session ${existingDbTx.settlementSessionId}`,
      };
    }

    // 5. Query candidate SettlementSessions
    const txAmount = new Prisma.Decimal(tx.normalizedAmount);
    const timeWindowStart = new Date(tx.blockTimestamp.getTime() - 45 * 60 * 1000); // 45m before tx
    const timeWindowEnd = new Date(tx.blockTimestamp.getTime() + 45 * 60 * 1000);   // 45m after tx

    // Find active USDT sessions waiting for payment
    const candidateSessions = await this.prisma.settlementSession.findMany({
      where: {
        provider: 'USDT',
        asset: 'USDT',
        status: {
          in: [
            SettlementStatus.CREATED,
            SettlementStatus.WAITING_FOR_PAYMENT,
            SettlementStatus.WAITING_PAYMENT,
            SettlementStatus.VERIFYING,
          ],
        },
        createdAt: { gte: timeWindowStart, lte: timeWindowEnd },
      },
      orderBy: { createdAt: 'asc' },
    });

    // 6. Filter exact amount matches
    const exactAmountMatches = candidateSessions.filter((session) => {
      return session.expectedCryptoAmount.equals(txAmount);
    });

    if (exactAmountMatches.length === 1) {
      const matchedSession = exactAmountMatches[0];
      return {
        status: UsdtTxProcessingStatus.MATCHED,
        matchedSessionId: matchedSession.id,
      };
    }

    if (exactAmountMatches.length > 1) {
      this.logger.warn(`[UsdtDepositMatching] AMBIGUOUS_MATCH: ${exactAmountMatches.length} candidate sessions match amount ${tx.normalizedAmount}`);
      return {
        status: UsdtTxProcessingStatus.AMBIGUOUS_MATCH,
        anomalyReason: `Ambiguous match: ${exactAmountMatches.length} sessions match exact amount ${tx.normalizedAmount}. Admin resolution required.`,
      };
    }

    // 7. Check for underpayment / overpayment against active sessions
    if (candidateSessions.length > 0) {
      const underpayments = candidateSessions.filter((s) => s.expectedCryptoAmount.gt(txAmount));
      const overpayments = candidateSessions.filter((s) => s.expectedCryptoAmount.lt(txAmount));

      if (underpayments.length > 0) {
        return {
          status: UsdtTxProcessingStatus.UNDERPAYMENT,
          anomalyReason: `Received ${tx.normalizedAmount} USDT, expected ${underpayments[0].expectedCryptoAmount.toString()} USDT`,
        };
      }

      if (overpayments.length > 0) {
        return {
          status: UsdtTxProcessingStatus.OVERPAYMENT,
          anomalyReason: `Received ${tx.normalizedAmount} USDT, expected ${overpayments[0].expectedCryptoAmount.toString()} USDT`,
        };
      }
    }

    return {
      status: UsdtTxProcessingStatus.RECONCILIATION_REQUIRED,
      anomalyReason: `Unmatched deposit: No active settlement session matches amount ${tx.normalizedAmount} USDT at block ${tx.blockNumber}`,
    };
  }
}
