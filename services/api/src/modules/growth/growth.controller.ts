import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard as AuthGuard } from '../../common/guards/jwt-auth.guard';
import { TelegramUserId } from '../../common/decorators/telegram-user-id.decorator';
import { ReferralService } from './referral.service';
import { ReferralGraphService } from './referral-graph.service';
import { ReferralQualificationService } from './referral-qualification.service';
import { DiscountEligibilityService } from './discount-eligibility.service';
import { RewardService } from './reward.service';
import { TrustProfileService } from './trust-profile.service';
import { UserLevelService } from './user-level.service';
import { GrowthNotificationService } from './growth-notification.service';
import { PrismaService } from '../../database/prisma.service';

@Controller('growth')
@UseGuards(AuthGuard)
export class GrowthController {
  constructor(
    private readonly referralService: ReferralService,
    private readonly referralGraphService: ReferralGraphService,
    private readonly qualificationService: ReferralQualificationService,
    private readonly discountService: DiscountEligibilityService,
    private readonly rewardService: RewardService,
    private readonly trustProfileService: TrustProfileService,
    private readonly userLevelService: UserLevelService,
    private readonly notificationService: GrowthNotificationService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * GET /growth/dashboard
   * Dynamic Growth Engine dashboard source of truth.
   */
  @Get('dashboard')
  async getGrowthDashboard(@TelegramUserId() telegramUserId: bigint) {
    const levelSummary = await this.userLevelService.getUserLevelSummary(telegramUserId);
    const referralSummary = await this.referralService.getUserReferralSummary(telegramUserId);
    const rewards = await this.rewardService.getUserRewards(telegramUserId);

    const growthScore = Math.max(1610, (levelSummary.trustProfile.trustScore * 20) + (levelSummary.trustProfile.completedSettlements * 50));
    const totalInvited = referralSummary.totalInvited || 0;
    const qualifiedCount = referralSummary.qualifiedCount || 0;
    const qualityScore = totalInvited > 0 ? Math.round((qualifiedCount / totalInvited) * 100) : 98;

    return {
      growthScore,
      trustScore: levelSummary.trustProfile.trustScore,
      communityRank: `#${Math.max(100, 15000 - Math.floor(growthScore * 1.5))}`,
      rewardMultiplier: levelSummary.currentLevel === 'ELITE' ? 2.0 : levelSummary.currentLevel === 'PREMIUM' ? 1.5 : 1.0,
      referralMultiplier: 1.0,
      withdrawalLimit: levelSummary.currentLevel === 'ELITE' ? 1000 : 100,
      currentTier: levelSummary.levelName || 'Seed',
      nextUnlock: levelSummary.nextLevel?.name || 'Builder II',
      trustChecklist: [
        { id: 't1', label: 'Verified account', completed: true },
        { id: 't2', label: 'First payment completed', completed: levelSummary.trustProfile.completedSettlements > 0 },
        { id: 't3', label: 'Invite trusted users', completed: qualifiedCount > 0 },
        { id: 't4', label: 'Complete transactions', completed: levelSummary.trustProfile.completedSettlements >= 5 },
      ],
      availableRewards: [
        {
          id: 'r1',
          title: '$2 USDT Bonus',
          description: 'Ready to claim in wallet',
          badge: 'Unlocked',
          rewardValue: '$2 USDT',
          status: 'UNLOCKED',
          action: 'CLAIM',
        },
        {
          id: 'r2',
          title: 'Premium Status 7 Days',
          description: 'Invite 2 friends to unlock',
          badge: '2 invites away',
          rewardValue: '7-Day Pass',
          status: 'IN_PROGRESS',
          action: 'INVITE',
        },
        {
          id: 'r3',
          title: '$10 USDT Reward',
          description: 'Upgrade trust score to unlock',
          badge: 'Reach Builder Lv2',
          rewardValue: '$10 USDT',
          status: 'LOCKED',
          action: 'UPGRADE',
        },
        {
          id: 'r4',
          title: 'Special Season Badge',
          description: 'Season 1 Treasury reward',
          badge: 'Coming Soon',
          rewardValue: 'Season Badge',
          status: 'UPCOMING',
          action: 'VIEW',
        },
      ],
      todaysMissions: [
        {
          id: 'm1',
          title: 'Complete Verified Payments',
          description: 'Earn contribution points and build trust rating with every completed payment.',
          rewardPoints: 50,
          status: 'ACTIVE',
        },
        {
          id: 'm2',
          title: 'Invite Active Members',
          description: 'Unlock permanent referral rewards and rank up in the community network.',
          rewardPoints: 100,
          status: 'ACTIVE',
        },
        {
          id: 'm3',
          title: 'Support Liquidity Growth',
          description: 'Increase community rank by participating in network treasury expansion.',
          rewardPoints: 200,
          status: 'ACTIVE',
        },
      ],
      referralSummary: {
        code: referralSummary.referralCode,
        link: referralSummary.referralLink,
        totalInvited,
        qualifiedCount,
        qualityScore,
        totalEarnedUSDT: referralSummary.totalEarnedUSDT,
      },
      seasonProgress: {
        seasonNumber: 1,
        seasonTitle: 'Treasury Expansion',
        seasonProgressPower: growthScore,
        seasonTargetPower: 10000,
        daysRemaining: 18,
      },
    };
  }

  /**
   * GET /growth/profile
   * Comprehensive user trust profile, level status, benefits unlocked, and growth stats.
   */
  @Get('profile')
  async getGrowthProfile(@TelegramUserId() telegramUserId: bigint) {
    const levelSummary = await this.userLevelService.getUserLevelSummary(telegramUserId);
    const referralSummary = await this.referralService.getUserReferralSummary(telegramUserId);
    const rewards = await this.rewardService.getUserRewards(telegramUserId);

    // Calculate total settlement volume
    const completedSettlements = await this.prisma.settlementSession.findMany({
      where: { telegramUserId, status: 'COMPLETED' },
      select: { expectedCryptoAmount: true },
    });

    const totalVolumeUSDT = completedSettlements.reduce(
      (sum, item) => sum + Number(item.expectedCryptoAmount),
      0,
    );

    return {
      telegramUserId: telegramUserId.toString(),
      trustScore: levelSummary.trustProfile.trustScore,
      level: levelSummary.currentLevel,
      levelName: levelSummary.levelName,
      benefits: levelSummary.benefits,
      nextLevel: levelSummary.nextLevel,
      completedSettlements: levelSummary.trustProfile.completedSettlements,
      accountAgeDays: levelSummary.trustProfile.accountAgeDays,
      totalVolumeUSDT,
      referrals: {
        code: referralSummary.referralCode,
        link: referralSummary.referralLink,
        totalInvited: referralSummary.totalInvited,
        qualifiedCount: referralSummary.qualifiedCount,
        totalEarnedUSDT: referralSummary.totalEarnedUSDT,
      },
      rewardsCount: rewards.length,
    };
  }

  /**
   * GET /growth/referrals
   * User referral dashboard data.
   */
  @Get('referrals')
  async getReferralDashboard(@TelegramUserId() telegramUserId: bigint) {
    return this.referralService.getUserReferralSummary(telegramUserId);
  }

  /**
   * POST /growth/referral/link
   * Get or initialize referral code.
   */
  @Post('referral/link')
  async getReferralLink(@TelegramUserId() telegramUserId: bigint) {
    return this.referralService.getOrCreateReferralCode(telegramUserId);
  }

  /**
   * GET /growth/rewards
   * User rewards list.
   */
  @Get('rewards')
  async getUserRewards(@TelegramUserId() telegramUserId: bigint) {
    const rewards = await this.rewardService.getUserRewards(telegramUserId);
    return rewards.map((r) => ({
      ...r,
      telegramUserId: r.telegramUserId.toString(),
      amount: r.amount.toString(),
    }));
  }

  /**
   * GET /growth/qualification
   * Full qualification status for withdrawal and discount access.
   */
  @Get('qualification')
  async getQualificationStatus(@TelegramUserId() telegramUserId: bigint) {
    return this.qualificationService.getFullQualificationStatus(telegramUserId);
  }

  /**
   * GET /growth/qualification/withdrawal
   * Withdrawal eligibility check.
   */
  @Get('qualification/withdrawal')
  async getWithdrawalEligibility(@TelegramUserId() telegramUserId: bigint) {
    return this.qualificationService.checkWithdrawalEligibility(telegramUserId);
  }

  /**
   * GET /growth/qualification/discount
   * Discount eligibility check.
   */
  @Get('qualification/discount')
  async getDiscountEligibility(@TelegramUserId() telegramUserId: bigint) {
    return this.discountService.getUserDiscountStatus(telegramUserId);
  }

  /**
   * GET /growth/graph/tree
   * Referral tree for the current user.
   */
  @Get('graph/tree')
  async getReferralTree(@TelegramUserId() telegramUserId: bigint) {
    return this.referralGraphService.getReferralTree(telegramUserId);
  }

  /**
   * GET /growth/graph/chain
   * Referral chain (upline) for the current user.
   */
  @Get('graph/chain')
  async getReferralChain(@TelegramUserId() telegramUserId: bigint) {
    return this.referralGraphService.getReferralChain(telegramUserId);
  }

  /**
   * GET /growth/graph/downstream
   * Downstream referral counts.
   */
  @Get('graph/downstream')
  async getDownstreamCount(@TelegramUserId() telegramUserId: bigint) {
    return this.referralGraphService.getDownstreamCount(telegramUserId);
  }

  /**
   * GET /growth/levels
   * Progression levels details.
   */
  @Get('levels')
  async getUserLevels(@TelegramUserId() telegramUserId: bigint) {
    return this.userLevelService.getUserLevelSummary(telegramUserId);
  }

  /**
   * GET /growth/notifications
   * Notification history.
   */
  @Get('notifications')
  async getNotifications(
    @TelegramUserId() telegramUserId: bigint,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    const records = await this.notificationService.getUserNotifications(telegramUserId, parsedLimit);
    const preferences = await this.notificationService.getPreferences(telegramUserId);

    return {
      preferences,
      notifications: records.map((n) => ({
        ...n,
        telegramUserId: n.telegramUserId.toString(),
      })),
    };
  }

  /**
   * POST /growth/notifications/preferences
   * Update notification preferences.
   */
  @Post('notifications/preferences')
  async updateNotificationPreferences(
    @TelegramUserId() telegramUserId: bigint,
    @Body() body: { telegramEnabled?: boolean; inAppEnabled?: boolean; marketingEnabled?: boolean },
  ) {
    return this.notificationService.updatePreferences(telegramUserId, body);
  }
}
