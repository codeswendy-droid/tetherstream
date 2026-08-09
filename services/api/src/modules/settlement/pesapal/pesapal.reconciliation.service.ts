import { Injectable, Logger } from '@nestjs/common';
import { SettlementProviderId, SettlementStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { PesapalClient } from './pesapal.client';
import { PesapalProvider } from './pesapal.provider';
import {
  normalizePesapalStatus,
  isProviderSuccess,
  isProviderFailure,
  isProviderUnknown,
} from './pesapal.types';

export interface ReconciliationAnomaly {
  type: string;
  settlementId: string;
  referenceCode: string;
  details: Record<string, any>;
}

@Injectable()
export class PesapalReconciliationService {
  private readonly logger = new Logger(PesapalReconciliationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pesapalClient: PesapalClient,
    private readonly pesapalProvider: PesapalProvider,
  ) {}

  /**
   * Sweep pending Pesapal settlement sessions and reconcile state against Pesapal Sandbox API.
   */
  async sweepPendingSessions(): Promise<{ swept: number; anomalies: ReconciliationAnomaly[] }> {
    this.logger.log('[PesapalReconciliation] Starting sweep of pending Pesapal sessions...');

    const pendingSessions = await this.prisma.settlementSession.findMany({
      where: {
        provider: SettlementProviderId.PESAPAL,
        status: { in: [SettlementStatus.WAITING_FOR_PAYMENT, SettlementStatus.VERIFYING] },
      },
    });

    const anomalies: ReconciliationAnomaly[] = [];

    for (const session of pendingSessions) {
      const metadata = (session.providerMetadata || {}) as Record<string, any>;
      const orderTrackingId = metadata.orderTrackingId;

      if (!orderTrackingId) {
        continue;
      }

      try {
        const liveStatus = await this.pesapalClient.getTransactionStatus(orderTrackingId);

        const normalizedStatus = normalizePesapalStatus(liveStatus);

        let currentOrchestratorRef = session.orchestratorReference;
        // Check 1: Provider reports completed, but Titan session was unverified
        if (isProviderSuccess(liveStatus)) {
          await this.pesapalProvider.handleIpn(orderTrackingId, session.referenceCode);
          const freshSession = await this.prisma.settlementSession.findUnique({ where: { id: session.id } });
          currentOrchestratorRef = freshSession?.orchestratorReference || null;
        } else if (isProviderFailure(liveStatus)) {
          await this.prisma.settlementSession.update({
            where: { id: session.id },
            data: { status: SettlementStatus.FAILED },
          });
        }

        // Check: Provider success without ledger
        if (isProviderSuccess(liveStatus) && !currentOrchestratorRef) {
          anomalies.push({
            type: 'PROVIDER_SUCCESS_WITHOUT_LEDGER',
            settlementId: session.id,
            referenceCode: session.referenceCode,
            details: {
              providerStatus: liveStatus.status_code,
              normalizedStatus,
              orchestratorReference: currentOrchestratorRef,
            },
          });
        }

        // Check: Amount mismatch
        if (liveStatus.amount !== undefined && liveStatus.amount !== null && Number(liveStatus.amount) !== Number(session.requestedAmount)) {
          anomalies.push({
            type: 'AMOUNT_MISMATCH',
            settlementId: session.id,
            referenceCode: session.referenceCode,
            details: {
              expectedAmount: Number(session.requestedAmount),
              providerAmount: Number(liveStatus.amount),
            },
          });
        }

        // Check: Currency mismatch
        const expectedCurrency = session.country === 'KE' ? 'KES' : session.country === 'UG' ? 'UGX' : 'USD';
        if (liveStatus.currency && liveStatus.currency !== expectedCurrency) {
          anomalies.push({
            type: 'CURRENCY_MISMATCH',
            settlementId: session.id,
            referenceCode: session.referenceCode,
            details: {
              expectedCurrency,
              providerCurrency: liveStatus.currency,
            },
          });
        }

        // Check: Reference mismatch
        if (liveStatus.merchant_reference && liveStatus.merchant_reference !== session.referenceCode) {
          anomalies.push({
            type: 'REFERENCE_MISMATCH',
            settlementId: session.id,
            referenceCode: session.referenceCode,
            details: {
              expectedReference: session.referenceCode,
              providerReference: liveStatus.merchant_reference,
            },
          });
        }

        // Check: Unknown provider status
        if (isProviderUnknown(liveStatus)) {
          anomalies.push({
            type: 'UNKNOWN_PROVIDER_STATUS',
            settlementId: session.id,
            referenceCode: session.referenceCode,
            details: {
              providerStatus: liveStatus.status_code,
              providerDescription: liveStatus.payment_status_description,
              normalizedStatus,
            },
          });
        }
      } catch (err: any) {
        this.logger.warn(`[PesapalReconciliation] Reconcile sweep error for ${session.id}: ${err?.message}`);
      }
    }

    this.logger.log(`[PesapalReconciliation] Sweep completed. Processed ${pendingSessions.length} sessions, found ${anomalies.length} anomalies.`);
    return { swept: pendingSessions.length, anomalies };
  }

  /**
   * Sweep sessions that have been pending for too long without any provider response.
   */
  async sweepStuckSessions(): Promise<{ swept: number; anomalies: ReconciliationAnomaly[] }> {
    this.logger.log('[PesapalReconciliation] Starting sweep of stuck Pesapal sessions...');

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const stuckSessions = await this.prisma.settlementSession.findMany({
      where: {
        provider: SettlementProviderId.PESAPAL,
        status: { in: [SettlementStatus.WAITING_FOR_PAYMENT, SettlementStatus.VERIFYING] },
        createdAt: { lt: oneHourAgo },
      },
    });

    const anomalies: ReconciliationAnomaly[] = [];

    for (const session of stuckSessions) {
      anomalies.push({
        type: 'STUCK_PENDING',
        settlementId: session.id,
        referenceCode: session.referenceCode,
        details: {
          status: session.status,
          createdAt: session.createdAt,
          timePendingMs: Date.now() - session.createdAt.getTime(),
        },
      });
    }

    this.logger.log(`[PesapalReconciliation] Stuck sessions sweep completed. Found ${anomalies.length} stuck sessions.`);
    return { swept: stuckSessions.length, anomalies };
  }
}
