import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditEventType } from '../../common/interfaces/user-state.enum';
import { AuditService } from '../audit/audit.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getProfile(telegramUserId: bigint) {
    const user = await this.prisma.user.findUnique({
      where: { telegramUserId },
      include: {
        onboardingProgress: true,
        educationCompletions: {
          include: { module: true },
        },
        userConsents: {
          where: { isActive: true },
        },
        readinessScores: true,
      },
    });

    if (!user) throw new NotFoundException('USER_NOT_FOUND');

    return {
      telegramUserId: Number(user.telegramUserId),
      telegramUsername: user.telegramUsername,
      firstName: user.firstName,
      lastName: user.lastName,
      photoUrl: user.photoUrl,
      languageCode: user.languageCode,
      state: user.state,
      loginCount: user.loginCount,
      lastActiveAt: user.lastActiveAt,
      createdAt: user.createdAt,
      educationScore: user.educationScore,
      readinessScore: user.readinessScore,
      isReady: user.isReady,
      onboardingProgress: user.onboardingProgress,
      educationProgress: user.educationCompletions.map((ec) => ({
        moduleId: ec.moduleId,
        moduleTitle: ec.module.title,
        status: ec.status,
        score: ec.score,
        passed: ec.passed,
        completedAt: ec.completedAt,
      })),
      consents: user.userConsents.map((c) => ({
        type: c.consentType,
        version: c.version,
        createdAt: c.createdAt,
      })),
      readiness: user.readinessScores,
    };
  }

  async updateProfile(telegramUserId: bigint, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { telegramUserId },
    });
    if (!user) throw new NotFoundException('USER_NOT_FOUND');

    const updated = await this.prisma.user.update({
      where: { telegramUserId },
      data: {
        ...(dto.firstName && { firstName: dto.firstName }),
        ...(dto.lastName && { lastName: dto.lastName }),
        ...(dto.languageCode && { languageCode: dto.languageCode }),
        ...(dto.photoUrl && { photoUrl: dto.photoUrl }),
      },
    });

    await this.auditService.create({
      telegramUserId,
      eventType: AuditEventType.USER_UPDATED,
      description: 'User profile updated',
      metadata: dto,
    });

    return this.sanitize(updated);
  }

  async getTrustProfile(telegramUserId: bigint) {
    const user = await this.prisma.user.findUnique({
      where: { telegramUserId },
      include: {
        educationCompletions: true,
        financialAccount: true,
      },
    });

    if (!user) throw new NotFoundException('USER_NOT_FOUND');

    // Real Trust Score calculation based on user state & platform activity
    let trustScore = 20; // baseline
    if (['READY', 'READY_FOR_PLATFORM', 'ELIGIBLE_USER', 'ACTIVE_USER'].includes(user.state)) {
      trustScore += 40;
    }
    trustScore += Math.min(20, (user.educationScore || 0) / 5);
    trustScore += Math.min(20, user.loginCount * 2);
    trustScore = Math.min(100, Math.max(0, trustScore));

    let reputationRank: 'Builder' | 'Guardian' | 'Architect' | 'Grandmaster' = 'Builder';
    if (trustScore >= 90) reputationRank = 'Grandmaster';
    else if (trustScore >= 75) reputationRank = 'Architect';
    else if (trustScore >= 50) reputationRank = 'Guardian';

    return {
      telegramUserId: Number(user.telegramUserId),
      trustScore,
      reputationRank,
      loginCount: user.loginCount,
      educationScore: user.educationScore,
      isReady: user.isReady,
      operatorAccess: trustScore >= 50 ? 'Unlocked' : 'Locked',
      createdAt: user.createdAt,
    };
  }

  private sanitize(user: any) {
    return {
      telegramUserId: Number(user.telegramUserId),
      telegramUsername: user.telegramUsername,
      firstName: user.firstName,
      lastName: user.lastName,
      photoUrl: user.photoUrl,
      languageCode: user.languageCode,
      state: user.state,
    };
  }

  async deleteAccount(telegramUserId: bigint) {
    // Use a transaction to ensure all deletions happen atomically
    return this.prisma.$transaction(async (tx) => {
      // 1. Delete financial operations and related data first (has Restrict relations)
      await tx.financialOperation.deleteMany({
        where: { telegramUserId },
      });

      // 2. Delete settlement sessions (has Restrict relations)
      await tx.settlementSession.deleteMany({
        where: { telegramUserId },
      });

      // 3. Delete financial account and all related financial data
      const financialAccount = await tx.financialAccount.findUnique({
        where: { telegramUserId },
      });

      if (financialAccount) {
        // Delete transactions
        await tx.financialTransaction.deleteMany({
          where: { financialAccountId: financialAccount.id },
        });

        // Delete ledger entries
        await tx.ledgerEntry.deleteMany({
          where: { financialAccountId: financialAccount.id },
        });

        // Delete the financial account
        await tx.financialAccount.delete({
          where: { telegramUserId },
        });
      }

      // 4. Delete user mining state
      await tx.userMiningState.deleteMany({
        where: { telegramUserId },
      });

      // 5. Delete user machines
      await tx.userMachine.deleteMany({
        where: { telegramUserId },
      });

      // 6. Delete crystal account and transactions
      const crystalAccount = await tx.crystalAccount.findUnique({
        where: { telegramUserId },
      });

      if (crystalAccount) {
        await tx.crystalTransaction.deleteMany({
          where: { accountId: crystalAccount.id },
        });

        await tx.crystalAccount.delete({
          where: { telegramUserId },
        });
      }

      // 7. Delete game data
      await tx.gameSession.deleteMany({
        where: { telegramUserId },
      });

      await tx.gamePlayerStat.deleteMany({
        where: { telegramUserId },
      });

      await tx.gameRewardGrant.deleteMany({
        where: { telegramUserId },
      });

      await tx.gameChallengeCompletion.deleteMany({
        where: { telegramUserId },
      });

      await tx.gameProfile.deleteMany({
        where: { telegramUserId },
      });

      // 8. Delete achievements
      await tx.achievement.deleteMany({
        where: { telegramUserId },
      });

      // 9. Delete product subscriptions
      await tx.productSubscription.deleteMany({
        where: { telegramUserId },
      });

      // 10. Delete payment invoices
      await tx.paymentInvoice.deleteMany({
        where: { telegramUserId },
      });

      // 11. Delete channel verification events
      await tx.channelVerificationEvent.deleteMany({
        where: { telegramUserId },
      });

      // 12. Delete referral relationships
      await tx.referralRelationship.deleteMany({
        where: { referrerId: telegramUserId },
      });

      await tx.referralRelationship.deleteMany({
        where: { refereeId: telegramUserId },
      });

      await tx.referralCode.deleteMany({
        where: { telegramUserId },
      });

      await tx.referralQualificationHistory.deleteMany({
        where: { telegramUserId },
      });

      // 13. Delete rewards
      await tx.reward.deleteMany({
        where: { telegramUserId },
      });

      // 14. Delete growth events
      await tx.growthEvent.deleteMany({
        where: { telegramUserId },
      });

      // 15. Delete notifications
      await tx.notificationRecord.deleteMany({
        where: { telegramUserId },
      });

      await tx.notificationPreference.deleteMany({
        where: { telegramUserId },
      });

      // 16. Delete user benefits
      await tx.userBenefit.deleteMany({
        where: { telegramUserId },
      });

      // 17. Delete user level record
      await tx.userLevelRecord.deleteMany({
        where: { telegramUserId },
      });

      // 18. Delete trust profile
      await tx.userTrustProfile.deleteMany({
        where: { telegramUserId },
      });

      // 19. Delete user preferences
      await tx.userPreferences.deleteMany({
        where: { telegramUserId },
      });

      // 20. Delete admin notes (only the user-related ones)
      // Note: There are two AdminNote models - one with telegramUserId and one with targetType/targetId
      // We can only delete the user-related ones that have telegramUserId
      // The other admin notes are linked via UniversalIdentity and will be handled differently

      // 21. Finally delete the user record
      // This will cascade delete: onboardingProgress, educationCompletions, userConsents, auditEvents, readinessScores, readinessHistory, stateTransitions, identity (SetNull)
      await tx.user.delete({
        where: { telegramUserId },
      });

      // 22. Create audit event for account deletion
      await this.auditService.create({
        telegramUserId,
        eventType: AuditEventType.ACCOUNT_DELETED,
        description: 'User account completely deleted',
        metadata: { deletedAt: new Date().toISOString() },
      });

      return { success: true, message: 'Account deleted successfully' };
    });
  }
}