import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationChannel } from '@prisma/client';

export interface NotificationTemplateDefinition {
  code: string;
  name: string;
  titleTemplate: string;
  bodyTemplate: string;
}

const DEFAULT_TEMPLATES: NotificationTemplateDefinition[] = [
  {
    code: 'SETTLEMENT_COMPLETED',
    name: 'Settlement Completed',
    titleTemplate: '✅ USDT Settlement Complete!',
    bodyTemplate: 'Your deposit of {amount} {asset} via {provider} has been approved and credited to your balance.',
  },
  {
    code: 'REFERRAL_COMPLETED',
    name: 'Referral Qualified',
    titleTemplate: '🎉 Referral Qualified!',
    bodyTemplate: 'Your referred friend {refereeName} has completed their first settlement. Your 5 USDT reward is pending approval!',
  },
  {
    code: 'REWARD_EARNED',
    name: 'Reward Granted',
    titleTemplate: '🎁 Reward Credited!',
    bodyTemplate: 'A reward of {amount} {asset} has been posted directly to your wallet via the Financial Orchestrator.',
  },
  {
    code: 'LEVEL_UPGRADED',
    name: 'Level Upgraded',
    titleTemplate: '🚀 Level Upgraded to {newLevel}!',
    bodyTemplate: 'Congratulations! Your trust and activity unlocked the {newLevelName} tier and new benefits.',
  },
  {
    code: 'SECURITY_EVENT',
    name: 'Security Alert',
    titleTemplate: '🛡️ Security Notification',
    bodyTemplate: 'Security activity detected on your TitanStream account: {details}.',
  },
  {
    code: 'GAME_DAILY_LOGIN',
    name: 'Game Daily Login',
    titleTemplate: '💎 Daily Crystals Claimed!',
    bodyTemplate: '+{amount} 💎 claimed. Day {streak} streak — keep it up!',
  },
  {
    code: 'GAME_USDT_REWARD',
    name: 'Game USDT Reward',
    titleTemplate: '🎮 Game Reward Ready!',
    bodyTemplate: 'You won {amount} USDT in {gameName}! Claim it from your rewards queue.',
  },
  {
    code: 'GAME_PERSONAL_BEST',
    name: 'Game Personal Best',
    titleTemplate: '🏅 New Personal Best!',
    bodyTemplate: 'You scored {score} points in {gameName} — a new personal best. The leaderboard is watching!',
  },
  {
    code: 'GAME_DAILY_CHALLENGE_COMPLETE',
    name: 'Daily Challenge Complete',
    titleTemplate: '🎯 Daily Challenge Complete!',
    bodyTemplate: 'You completed "{challengeTitle}" — +{crystals} 💎 and +{xp} XP. Come back tomorrow for a new challenge!',
  },
  {
    code: 'GAME_ACHIEVEMENT',
    name: 'Game Achievement Unlocked',
    titleTemplate: '🏆 Achievement Unlocked!',
    bodyTemplate: '"{achievementName}" ({tier}) unlocked. Progress in your achievements cabinet.',
  },
  {
    code: 'GAME_LEVEL_UP',
    name: 'Game Level Up',
    titleTemplate: '⭐ You reached Level {level}!',
    bodyTemplate: 'Your gameplay XP leveled you up. Keep playing to unlock bigger rewards.',
  },
  {
    code: 'GAME_EVENT_REWARD',
    name: 'Game Event Reward',
    titleTemplate: '🎉 Event Reward Claimed!',
    bodyTemplate: 'You earned {amount} during {eventName}. Enjoy the bonus!',
  },
];

@Injectable()
export class GrowthNotificationService {
  private readonly logger = new Logger(GrowthNotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Seed default notification templates.
   */
  async ensureDefaultTemplates() {
    for (const tpl of DEFAULT_TEMPLATES) {
      await this.prisma.notificationTemplate.upsert({
        where: { code: tpl.code },
        update: {},
        create: {
          code: tpl.code,
          name: tpl.name,
          titleTemplate: tpl.titleTemplate,
          bodyTemplate: tpl.bodyTemplate,
          channel: NotificationChannel.TELEGRAM,
          enabled: true,
        },
      });
    }
  }

  /**
   * Get or create notification preferences for a user.
   */
  async getPreferences(telegramUserId: bigint) {
    let pref = await this.prisma.notificationPreference.findUnique({
      where: { telegramUserId },
    });

    if (!pref) {
      pref = await this.prisma.notificationPreference.create({
        data: {
          telegramUserId,
          telegramEnabled: true,
          inAppEnabled: true,
          marketingEnabled: false,
        },
      });
    }

    return pref;
  }

  /**
   * Update notification preferences.
   */
  async updatePreferences(
    telegramUserId: bigint,
    data: { telegramEnabled?: boolean; inAppEnabled?: boolean; marketingEnabled?: boolean },
  ) {
    return this.prisma.notificationPreference.upsert({
      where: { telegramUserId },
      update: data,
      create: {
        telegramUserId,
        ...data,
      },
    });
  }

  /**
   * Dispatch a notification using a template and replace placeholder variables.
   */
  async sendNotification(data: {
    telegramUserId: bigint;
    templateCode: string;
    variables?: Record<string, string>;
  }) {
    await this.ensureDefaultTemplates();
    const prefs = await this.getPreferences(data.telegramUserId);

    if (!prefs.telegramEnabled && !prefs.inAppEnabled) {
      this.logger.log(`[GrowthNotification] User ${data.telegramUserId} disabled notifications. Skipping.`);
      return null;
    }

    const template = await this.prisma.notificationTemplate.findUnique({
      where: { code: data.templateCode },
    });

    if (!template || !template.enabled) {
      this.logger.warn(`[GrowthNotification] Template ${data.templateCode} not found or disabled.`);
      return null;
    }

    let title = template.titleTemplate;
    let body = template.bodyTemplate;

    if (data.variables) {
      Object.entries(data.variables).forEach(([key, value]) => {
        title = title.replace(new RegExp(`{${key}}`, 'g'), value);
        body = body.replace(new RegExp(`{${key}}`, 'g'), value);
      });
    }

    const message = `${title}\n\n${body}`;

    const record = await this.prisma.notificationRecord.create({
      data: {
        telegramUserId: data.telegramUserId,
        templateCode: data.templateCode,
        message,
        channel: NotificationChannel.TELEGRAM,
        status: 'SENT',
        metadata: data.variables || {},
      },
    });

    this.logger.log(`[GrowthNotification] Dispatched notification ${record.id} to user ${data.telegramUserId}`);
    return record;
  }

  /**
   * Get user notification history.
   */
  async getUserNotifications(telegramUserId: bigint, limit = 20) {
    return this.prisma.notificationRecord.findMany({
      where: { telegramUserId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
