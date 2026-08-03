import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

export interface ProductionEventItem {
  id: string;
  timestamp: string;
  category: 'USER' | 'MACHINE' | 'TREASURY' | 'WITHDRAWAL' | 'REFERRAL' | 'SECURITY' | 'ADMIN';
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
  title: string;
  detail: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class LiveEventStreamService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetches the live stream of real production events
   */
  async getLiveEventStream(limit = 50): Promise<ProductionEventItem[]> {
    const events: ProductionEventItem[] = [];

    // 1. Audit & Security events
    const auditLogs = await this.prisma.auditEvent.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { telegramUsername: true, firstName: true } } },
    });

    for (const log of auditLogs) {
      const isSecurity = log.severity === 'WARNING' || log.severity === 'CRITICAL' || log.eventType.includes('SECURITY');
      events.push({
        id: `audit_${log.id}`,
        timestamp: log.createdAt.toISOString(),
        category: isSecurity ? 'SECURITY' : 'ADMIN',
        severity: (log.severity as any) || 'INFO',
        title: log.eventType.replace(/_/g, ' '),
        detail: `${log.user?.firstName || log.telegramUserId || 'System'}: ${log.description || 'Action recorded'}`,
        metadata: (log.metadata as any) || undefined,
      });
    }

    // 2. Settlement / Deposit / Withdrawal events
    const settlements = await this.prisma.settlementSession.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { firstName: true } } },
    });

    for (const s of settlements) {
      const isWithdrawal = s.sessionType === 'PAYOUT';
      events.push({
        id: `settle_${s.id}`,
        timestamp: s.createdAt.toISOString(),
        category: isWithdrawal ? 'WITHDRAWAL' : 'TREASURY',
        severity: s.status === 'COMPLETED' ? 'SUCCESS' : s.status === 'FAILED' ? 'CRITICAL' : 'WARNING',
        title: isWithdrawal ? 'Withdrawal Session' : 'Deposit Session',
        detail: `${s.user?.firstName || 'User'} ${s.sessionType} of ${s.requestedAmount} ${s.asset} (${s.status})`,
        metadata: { referenceCode: s.referenceCode },
      });
    }

    // 3. User Machines (Purchases/Activations)
    const userMachines = await this.prisma.userMachine.findMany({
      take: limit,
      orderBy: { purchasedAt: 'desc' },
      include: { user: { select: { firstName: true } } },
    });

    for (const m of userMachines) {
      events.push({
        id: `machine_${m.id}`,
        timestamp: m.purchasedAt.toISOString(),
        category: 'MACHINE',
        severity: 'SUCCESS',
        title: 'Machine Activated',
        detail: `${m.user?.firstName || 'Operator'} activated ${m.name} (${m.capacityGhs} GH/s)`,
        metadata: { tierCode: m.tierCode, price: m.purchasePrice },
      });
    }

    // Sort all combined by timestamp desc
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return events.slice(0, limit);
  }
}
