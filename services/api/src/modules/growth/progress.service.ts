import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RewardService } from './reward.service';
import { AchievementService } from './achievement.service';
import { UserLevelService } from './user-level.service';

@Injectable()
export class ProgressService {
  private readonly logger = new Logger(ProgressService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rewardService: RewardService,
    private readonly achievementService: AchievementService,
    private readonly userLevelService: UserLevelService,
  ) {}

  /**
   * Full Progress Center overview: hero stats, streak, level progress,
   * totals, recent achievements, next best action and upcoming unlock.
   */
  async getProgressOverview(telegramUserId: bigint) {
    const [levelSummary, missions, claimedRewards, achievements, user] = await Promise.all([
      this.userLevelService.getUserLevelSummary(telegramUserId),
      this.rewardService.getMissionQueue(telegramUserId),
      this.prisma.reward.findMany({
        where: { telegramUserId, status: 'CLAIMED' },
        select: { amount: true, processedAt: true },
        orderBy: { processedAt: 'desc' },
      }),
      this.achievementService.getUserAchievements(telegramUserId),
      this.prisma.user.findUnique({
        where: { telegramUserId },
        select: { firstName: true, telegramUsername: true, qualifiedReferrals: true },
      }),
    ]);

    const totalEarned = claimedRewards.reduce((acc, r) => acc + Number(r.amount), 0);
    const claimable = missions.filter((m) => m.eligible);
    const estimatedRemaining = claimable.reduce((acc, m) => acc + Number(m.amount), 0);

    const streak = await this.achievementService.getClaimStreakInfo(telegramUserId);

    const nextBestAction = this.computeNextBestAction(user, missions, levelSummary);

    const upcoming = missions
      .filter((m) => !m.eligible)
      .sort((a, b) => (b.progressPercent || 0) - (a.progressPercent || 0))[0] || null;

    const levelProgress = this.computeLevelProgress(levelSummary);

    return {
      level: {
        currentLevel: levelSummary.currentLevel,
        levelName: levelSummary.levelName,
        benefits: levelSummary.benefits,
        upgradedAt: levelSummary.upgradedAt,
        nextLevel: levelSummary.nextLevel,
        progressPercent: levelProgress.progressPercent,
        criteria: levelProgress.criteria,
      },
      streak: {
        days: streak.current,
        best: streak.best,
      },
      totals: {
        totalClaimed: claimedRewards.length,
        totalEarned,
        availableCount: claimable.length,
        estimatedRemaining,
      },
      recentAchievements: achievements.achievements
        .filter((a) => a.achieved)
        .sort((a, b) => new Date(b.achievedAt as Date).getTime() - new Date(a.achievedAt as Date).getTime())
        .slice(0, 3),
      justUnlocked: achievements.justUnlocked,
      nextBestAction,
      upcomingUnlock: upcoming
        ? {
            missionId: upcoming.id,
            ruleCode: upcoming.ruleCode,
            name: upcoming.name,
            amount: upcoming.amount,
            assetCode: upcoming.assetCode,
            progressPercent: upcoming.progressPercent,
            requirement: upcoming.requirement,
            estimatedRemaining: upcoming.estimatedRemaining,
            actionTab: upcoming.requirement?.actionTab || 'wallet',
          }
        : null,
    };
  }

  /**
   * Level progress toward next tier, computed from the real thresholds.
   */
  private computeLevelProgress(levelSummary: any) {
    const next = levelSummary.nextLevel;
    if (!next) {
      return { progressPercent: 100, criteria: [], reachedTop: true };
    }

    const tp = levelSummary.trustProfile;
    const criteria = [
      {
        key: 'settlements',
        label: 'Settlements',
        current: tp.completedSettlements,
        required: next.minSuccessfulSettlements,
        met: tp.completedSettlements >= next.minSuccessfulSettlements,
      },
      {
        key: 'trustScore',
        label: 'Trust score',
        current: tp.trustScore,
        required: next.minTrustScore,
        met: tp.trustScore >= next.minTrustScore,
      },
      {
        key: 'accountAge',
        label: 'Account age',
        current: tp.accountAgeDays,
        required: next.minAccountAgeDays,
        met: tp.accountAgeDays >= next.minAccountAgeDays,
      },
    ];

    const fractions = criteria
      .filter((c) => c.required > 0)
      .map((c) => Math.min(1, c.met ? 1 : c.current / c.required));

    const progressPercent = fractions.length
      ? Math.floor((fractions.reduce((a, b) => a + b, 0) / fractions.length) * 100)
      : 0;

    return { progressPercent, criteria };
  }

  /**
   * Deterministic next-best-action from real state (never mock).
   */
  private computeNextBestAction(user: any, missions: any[], levelSummary: any): any {
    const claimable = missions.filter((m) => m.eligible);
    if (claimable.length > 0) {
      const first = claimable[0];
      return {
        type: 'CLAIM',
        missionId: first.id,
        rewardId: first.id,
        title: 'Claim your reward',
        message: `You have ${claimable.length} ready mission${claimable.length > 1 ? 's' : ''} worth ${claimable
          .reduce((a: number, m: any) => a + Number(m.amount), 0)
          .toFixed(2)} ${first.assetCode}. Claim now — it is waiting for you.`,
        tab: 'rewards',
      };
    }

    const inProgress = missions
      .filter((m) => !m.eligible && (m.progressPercent || 0) > 0)
      .sort((a: any, b: any) => (b.progressPercent || 0) - (a.progressPercent || 0));
    if (inProgress.length > 0) {
      const closest = inProgress[0];
      return {
        type: 'COMPLETE_MISSION',
        missionId: closest.id,
        ruleCode: closest.ruleCode,
        title: `Continue: ${closest.name}`,
        message: `You are ${closest.progressPercent}% there. ${closest.estimatedRemaining} to unlock ${closest.amount} ${closest.assetCode}.`,
        tab: closest.requirement?.actionTab || 'wallet',
      };
    }

    if (user && user.qualifiedReferrals === 0) {
      return {
        type: 'INVITE',
        title: 'Invite your first friend',
        message: 'Invite a friend to join, onboard and settle — you earn a referral reward for every qualified friend.',
        tab: 'friends',
      };
    }

    if (levelSummary.trustProfile.completedSettlements === 0) {
      return {
        type: 'SETTLEMENT',
        title: 'Complete your first settlement',
        message: 'Complete a settlement to earn the First Settlement Bonus and rank up.',
        tab: 'wallet',
      };
    }

    return {
      type: 'SHARE',
      title: 'Share Titan Stream',
      message: 'Share your referral link — every qualified friend earns you a reward.',
      tab: 'friends',
    };
  }
}
