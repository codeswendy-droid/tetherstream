import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

export interface SearchResultItem {
  id: string;
  entityType: 'USER' | 'TRANSACTION' | 'LEDGER_ENTRY' | 'SETTLEMENT' | 'MACHINE' | 'REFERRAL' | 'AUDIT' | 'SUPPORT_TICKET';
  title: string;
  subtitle: string;
  badge?: string;
  metadata?: Record<string, any>;
  linkTab: string;
}

@Injectable()
export class UniversalSearchService {
  constructor(private readonly prisma: PrismaService) {}

  async globalSearch(query: string): Promise<SearchResultItem[]> {
    if (!query || query.trim().length < 2) return [];

    const q = query.trim();
    const isNumber = /^\d+$/.test(q);
    const results: SearchResultItem[] = [];

    // 1. Search Users (by Telegram ID, username, name)
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          ...(isNumber ? [{ telegramUserId: BigInt(q) }] : []),
          { telegramUsername: { contains: q, mode: 'insensitive' } },
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 10,
    });

    for (const u of users) {
      results.push({
        id: u.telegramUserId.toString(),
        entityType: 'USER',
        title: `${u.firstName} ${u.lastName || ''} (@${u.telegramUsername || 'no_user'})`,
        subtitle: `ID: ${u.telegramUserId.toString()} • State: ${u.state} • Logins: ${u.loginCount}`,
        badge: u.isReady ? 'READY' : 'ONBOARDING',
        linkTab: 'Users & Support',
        metadata: { telegramUserId: u.telegramUserId.toString() },
      });
    }

    // 2. Search Settlement Sessions
    const settlements = await this.prisma.settlementSession.findMany({
      where: {
        OR: [
          { referenceCode: { contains: q, mode: 'insensitive' } },
          { orchestratorReference: { contains: q, mode: 'insensitive' } },
          { id: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 10,
    });

    for (const s of settlements) {
      results.push({
        id: s.id,
        entityType: 'SETTLEMENT',
        title: `Settlement #${s.referenceCode}`,
        subtitle: `${s.sessionType} of ${s.requestedAmount} ${s.asset} via ${s.provider}`,
        badge: s.status,
        linkTab: 'Treasury & Financials',
        metadata: { settlementId: s.id },
      });
    }

    // 3. Search Financial Transactions
    const transactions = await this.prisma.financialTransaction.findMany({
      where: {
        OR: [
          { reference: { contains: q, mode: 'insensitive' } },
          { id: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 10,
    });

    for (const tx of transactions) {
      results.push({
        id: tx.id,
        entityType: 'TRANSACTION',
        title: `Tx #${tx.reference}`,
        subtitle: `${tx.transactionType}: ${tx.amount} ${tx.assetCode}`,
        badge: tx.status,
        linkTab: 'Treasury & Financials',
        metadata: { transactionId: tx.id },
      });
    }

    // 4. Search Machines
    const userMachines = await this.prisma.userMachine.findMany({
      where: {
        OR: [
          { id: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
          { tierCode: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 10,
    });

    for (const m of userMachines) {
      results.push({
        id: m.id,
        entityType: 'MACHINE',
        title: `${m.name} (${m.tierCode})`,
        subtitle: `Capacity: ${m.capacityGhs} GH/s • Status: ${m.status}`,
        badge: m.status,
        linkTab: 'Operations & Infrastructure',
        metadata: { userMachineId: m.id, telegramUserId: m.telegramUserId.toString() },
      });
    }

    // 5. Search Support Tickets
    const tickets = await this.prisma.supportTicket.findMany({
      where: {
        OR: [
          { id: { contains: q, mode: 'insensitive' } },
          { subject: { contains: q, mode: 'insensitive' } },
          { channelUserId: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 10,
    });

    for (const t of tickets) {
      results.push({
        id: t.id,
        entityType: 'SUPPORT_TICKET',
        title: `Ticket #${t.id.slice(0, 8)}: ${t.subject}`,
        subtitle: `Channel: ${t.channel} (${t.channelUserId}) • Priority: ${t.priority}`,
        badge: t.status,
        linkTab: 'Users & Support',
        metadata: { ticketId: t.id },
      });
    }

    return results;
  }
}
