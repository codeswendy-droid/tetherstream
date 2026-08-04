import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UserLevelTier } from '@prisma/client';

export interface AchievementDefinition {
  code: string;
  name: string;
  description: string;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';
  icon: string;
  target: number;
  compute: (telegramUserId: bigint) => Promise<number>;
}

const LEVEL_ORDER: Record<string, number> = {
  NEW: 0,
  VERIFIED: 1,
  TRUSTED: 2,
  PREMIUM: 3,
  ELITE: 4,
};

@Injectable()
export class AchievementService {
  private readonly logger = new Logger(AchievementService.name);

  constructor(private readonly prisma: PrismaService) {}

  private definitions(): AchievementDefinition[] {
    return [
      {
        code: 'FIRST_REWARD',
        name: 'First Victory',
        description: 'Claim your first reward.',
        tier: 'BRONZE',
        icon: '🏆',
        target: 1,
        compute: async (id) =>
          this.prisma.reward.count({ where: { telegramUserId: id, status: 'CLAIMED' } }),
      },
      {
        code: 'REWARD_HUNTER',
        name: 'Reward Hunter',
        description: 'Claim 5 rewards.',
        tier: 'SILVER',
        icon: '🎯',
        target: 5,
        compute: async (id) =>
          this.prisma.reward.count({ where: { telegramUserId: id, status: 'CLAIMED' } }),
      },
      {
        code: 'TITAN_PATRON',
        name: 'Titan Patron',
        description: 'Claim 10 rewards.',
        tier: 'GOLD',
        icon: '💎',
        target: 10,
        compute: async (id) =>
          this.prisma.reward.count({ where: { telegramUserId: id, status: 'CLAIMED' } }),
      },
      {
        code: 'FIRST_REFERRAL',
        name: 'First Invite',
        description: 'Invite your first friend to qualify.',
        tier: 'BRONZE',
        icon: '🤝',
        target: 1,
        compute: async (id) => {
          const user = await this.prisma.user.findUnique({
            where: { telegramUserId: id },
            select: { qualifiedReferrals: true },
          });
          return user?.qualifiedReferrals ?? 0;
        },
      },
      {
        code: 'NETWORK_BUILDER',
        name: 'Network Builder',
        description: 'Qualify 3 referrals.',
        tier: 'SILVER',
        icon: '🌐',
        target: 3,
        compute: async (id) => {
          const user = await this.prisma.user.findUnique({
            where: { telegramUserId: id },
            select: { qualifiedReferrals: true },
          });
          return user?.qualifiedReferrals ?? 0;
        },
      },
      {
        code: 'REFERRAL_MAGNET',
        name: 'Referral Magnet',
        description: 'Qualify 10 referrals.',
        tier: 'PLATINUM',
        icon: '🧲',
        target: 10,
        compute: async (id) => {
          const user = await this.prisma.user.findUnique({
            where: { telegramUserId: id },
            select: { qualifiedReferrals: true },
          });
          return user?.qualifiedReferrals ?? 0;
        },
      },
      {
        code: 'FIRST_MACHINE',
        name: 'Miner',
        description: 'Own your first active mining machine.',
        tier: 'BRONZE',
        icon: '⛏️',
        target: 1,
        compute: async (id) =>
          this.prisma.userMachine.count({ where: { telegramUserId: id, status: 'ACTIVE' } }),
      },
      {
        code: 'MACHINE_COLLECTOR',
        name: 'Machine Collector',
        description: 'Own 3 active mining machines.',
        tier: 'GOLD',
        icon: '🏭',
        target: 3,
        compute: async (id) =>
          this.prisma.userMachine.count({ where: { telegramUserId: id, status: 'ACTIVE' } }),
      },
      {
        code: 'FIRST_SETTLEMENT',
        name: 'First Settlement',
        description: 'Complete your first settlement.',
        tier: 'BRONZE',
        icon: '✅',
        target: 1,
        compute: async (id) =>
          this.prisma.settlementSession.count({
            where: { telegramUserId: id, status: 'COMPLETED' },
          }),
      },
      {
        code: 'SETTLEMENT_VETERAN',
        name: 'Settlement Veteran',
        description: 'Complete 10 settlements.',
        tier: 'SILVER',
        icon: '📊',
        target: 10,
        compute: async (id) =>
          this.prisma.settlementSession.count({
            where: { telegramUserId: id, status: 'COMPLETED' },
          }),
      },
      {
        code: 'TRUSTED_MEMBER',
        name: 'Trusted Member',
        description: 'Reach the Trusted level.',
        tier: 'SILVER',
        icon: '🛡️',
        target: 2,
        compute: async (id) => {
          const rec = await this.prisma.userLevelRecord.findUnique({
            where: { telegramUserId: id },
            select: { currentLevel: true },
          });
          return LEVEL_ORDER[rec?.currentLevel || 'NEW'] ?? 0;
        },
      },
      {
        code: 'PREMIUM_MEMBER',
        name: 'Premium Member',
        description: 'Reach the Premium level.',
        tier: 'GOLD',
        icon: '👑',
        target: 3,
        compute: async (id) => {
          const rec = await this.prisma.userLevelRecord.findUnique({
            where: { telegramUserId: id },
            select: { currentLevel: true },
          });
          return LEVEL_ORDER[rec?.currentLevel || 'NEW'] ?? 0;
        },
      },
      {
        code: 'ELITE_PARTNER',
        name: 'Elite Partner',
        description: 'Reach the Elite level.',
        tier: 'DIAMOND',
        icon: '🚀',
        target: 4,
        compute: async (id) => {
          const rec = await this.prisma.userLevelRecord.findUnique({
            where: { telegramUserId: id },
            select: { currentLevel: true },
          });
          return LEVEL_ORDER[rec?.currentLevel || 'NEW'] ?? 0;
        },
      },
      {
        code: 'WEEKLY_WARRIOR',
        name: 'Weekly Warrior',
        description: 'Claim rewards 3 days in a row.',
        tier: 'SILVER',
        icon: '🔥',
        target: 3,
        compute: async (id) => this.computeClaimStreak(id),
      },
      {
        code: 'DAILY_DEDICATED',
        name: 'Daily Dedicated',
        description: 'Claim rewards 7 days in a row.',
        tier: 'GOLD',
        icon: '⚡',
        target: 7,
        compute: async (id) => this.computeClaimStreak(id),
      },
    ];
  }

  /**
   * Longest consecutive-day claim streak (current streak preferred).
   */
  private async computeClaimStreak(telegramUserId: bigint): Promise<number> {
    const { current } = await this.getClaimStreakInfo(telegramUserId);
    return current;
  }

  /**
   * Current streak (anchored at today/yesterday) and best streak in history.
   */
  async getClaimStreakInfo(telegramUserId: bigint): Promise<{ current: number; best: number }> {
    const claims = await this.prisma.reward.findMany({
      where: { telegramUserId, status: 'CLAIMED', processedAt: { not: null } },
      select: { processedAt: true },
      orderBy: { processedAt: 'desc' },
    });

    const days = new Set<number>();
    for (const c of claims) {
      const d = new Date(c.processedAt as Date);
      days.add(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    }

    const sorted = [...days].sort((a, b) => b - a);
    const today = new Date();
    const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    const yesterdayUtc = todayUtc - 86400000;

    // Current streak anchored at today or yesterday.
    let anchor = 0;
    if (sorted[0] === todayUtc || sorted[0] === yesterdayUtc) anchor = sorted[0];

    let current = 0;
    if (anchor !== 0) {
      let cursor = anchor;
      for (const day of sorted) {
        if (day === cursor) {
          current += 1;
          cursor -= 86400000;
        } else if (day > cursor) {
          continue;
        } else {
          break;
        }
      }
    }

    let best = 0;
    let run = 0;
    let prev = -1;
    for (const day of sorted) {
      if (prev === -1 || day === prev - 86400000) run += 1;
      else run = 1;
      best = Math.max(best, run);
      prev = day;
    }

    return { current, best };
  }

  /**
   * Reconcile achievement rows against the real counters and persist any
   * newly unlocked achievements.
   */
  async reconcileAchievements(telegramUserId: bigint) {
    const defs = this.definitions();
    const unlocked: { code: string; name: string; tier: string }[] = [];

    for (const def of defs) {
      const progress = await def.compute(telegramUserId);
      const achievedAt = progress >= def.target ? new Date() : null;

      const existing = await this.prisma.achievement.findUnique({
        where: { telegramUserId_code: { telegramUserId, code: def.code } },
      });

      if (!existing) {
        await this.prisma.achievement.create({
          data: {
            telegramUserId,
            code: def.code,
            name: def.name,
            description: def.description,
            tier: def.tier,
            icon: def.icon,
            progress,
            target: def.target,
            achievedAt,
          },
        });
        if (achievedAt) {
          unlocked.push({ code: def.code, name: def.name, tier: def.tier });
          this.logger.log(`[Achievements] Unlocked ${def.code} for user ${telegramUserId}`);
        }
      } else if (existing.progress !== progress || (!existing.achievedAt && achievedAt)) {
        await this.prisma.achievement.update({
          where: { telegramUserId_code: { telegramUserId, code: def.code } },
          data: { progress, achievedAt: achievedAt || existing.achievedAt },
        });
        if (achievedAt && !existing.achievedAt) {
          unlocked.push({ code: def.code, name: def.name, tier: def.tier });
          this.logger.log(`[Achievements] Unlocked ${def.code} for user ${telegramUserId}`);
        }
      }
    }

    return unlocked;
  }

  /**
   * Full cabinet: every definition evaluated against real counters.
   */
  async getUserAchievements(telegramUserId: bigint) {
    const unlocked = await this.reconcileAchievements(telegramUserId);
    const rows = await this.prisma.achievement.findMany({
      where: { telegramUserId },
      orderBy: [{ achievedAt: 'desc' }, { createdAt: 'asc' }],
    });

    return {
      achievements: rows.map((a) => ({
        code: a.code,
        name: a.name,
        description: a.description,
        tier: a.tier,
        icon: a.icon,
        progress: a.progress,
        target: a.target,
        achieved: !!a.achievedAt,
        achievedAt: a.achievedAt,
      })),
      totalUnlocked: rows.filter((a) => a.achievedAt).length,
      total: rows.length,
      justUnlocked: unlocked,
    };
  }
}
