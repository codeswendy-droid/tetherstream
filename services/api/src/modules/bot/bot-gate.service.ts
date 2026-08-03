import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';
import { TelegramClientService } from './telegram-client.service';
import { AuditService } from '../audit/audit.service';
import { UserState, AuditEventType } from '../../common/interfaces/user-state.enum';

export interface TelegramUserCtx {
  id: bigint;
  firstName: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
  photoUrl?: string;
}

@Injectable()
export class BotGateService {
  private readonly logger = new Logger(BotGateService.name);
  private readonly webAppUrl = process.env.TELEGRAM_WEBAPP_URL || 'https://titanstream.app';

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramClient: TelegramClientService,
    private readonly auditService: AuditService,
  ) {}

  private get defaultChannel(): { id: string; username: string; label: string } {
    const mainChannelId = process.env.TELEGRAM_CHANNEL_ID || '@titanstreamm';
    const mainChannelUser = (process.env.TELEGRAM_CHANNEL_USERNAME || 'titanstreamm').replace('@', '');
    return {
      id: mainChannelId,
      username: mainChannelUser,
      label: '📢 Join Official Channel',
    };
  }

  async verifyChannelMembership(telegramUserId: bigint, channelId?: string): Promise<{
    isMember: boolean;
    status: string;
    details?: any;
  }> {
    const targetChannel = channelId || this.defaultChannel.id;
    const member = await this.telegramClient.getChatMember(targetChannel, Number(telegramUserId));

    if (!member) {
      // If Telegram API returned error (e.g. Bot not admin in channel, or chat not found),
      // gracefully allow passage so users are never trapped in an infinite gate loop!
      this.logger.warn(`Could not verify member status in ${targetChannel} (Bot may need Admin rights in ${targetChannel}). Granting fallback passage.`);
      return { isMember: true, status: 'fallback_granted' };
    }

    const acceptedStates = ['creator', 'administrator', 'member'];
    const isMember = acceptedStates.includes(member.status);

    // Audit log verification event
    try {
      await this.prisma.channelVerificationEvent.create({
        data: {
          telegramUserId,
          channelId: targetChannel,
          status: member.status,
          metadata: { isMember },
        },
      });
    } catch (err) {
      this.logger.error(`Failed to record ChannelVerificationEvent: ${err.message}`);
    }

    return {
      isMember,
      status: member.status,
      details: member,
    };
  }

  async ensureUserIdentity(userCtx: TelegramUserCtx): Promise<{
    user: any;
    isNew: boolean;
  }> {
    let user = await this.prisma.user.findUnique({
      where: { telegramUserId: userCtx.id },
    });

    let isNew = false;
    if (!user) {
      user = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const newUser = await tx.user.create({
          data: {
            telegramUserId: userCtx.id,
            firstName: userCtx.firstName,
            lastName: userCtx.lastName,
            telegramUsername: userCtx.username,
            languageCode: userCtx.languageCode || 'en',
            photoUrl: userCtx.photoUrl,
            state: UserState.NEW,
            lastActiveAt: new Date(),
            lastLoginAt: new Date(),
            loginCount: 1,
            channelVerified: false,
          },
        });

        await tx.onboardingProgress.create({
          data: {
            telegramUserId: userCtx.id,
            currentStep: 'welcome',
            stepsCompleted: [],
          },
        });

        await tx.financialAccount.create({
          data: {
            telegramUserId: userCtx.id,
            status: 'ACTIVE',
            activatedAt: new Date(),
          },
        });

        const referralCode = `TS${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        await tx.referralCode.create({
          data: {
            telegramUserId: userCtx.id,
            code: referralCode,
            metadata: { generatedAt: new Date().toISOString() },
          },
        });

        await tx.userTrustProfile.create({
          data: {
            telegramUserId: userCtx.id,
            trustScore: 50,
            completedSettlements: 0,
            failedSettlements: 0,
            successRate: 100.0,
            accountAgeDays: 0,
            verificationStatus: 'UNVERIFIED',
          },
        });

        await tx.userLevelRecord.create({
          data: {
            telegramUserId: userCtx.id,
            currentLevel: 'NEW',
          },
        });

        await tx.notificationPreference.create({
          data: {
            telegramUserId: userCtx.id,
            telegramEnabled: true,
            inAppEnabled: true,
            marketingEnabled: false
          },
        });

        await this.auditService.createWithClient(tx, {
          telegramUserId: userCtx.id,
          eventType: AuditEventType.USER_CREATED,
          description: 'User created via Telegram Host Bot',
          metadata: { username: userCtx.username, firstName: userCtx.firstName },
        });

        return newUser;
      });

      isNew = true;
    } else {
      const updateData: any = {
        lastActiveAt: new Date(),
        loginCount: { increment: 1 },
      };
      if (userCtx.firstName) updateData.firstName = userCtx.firstName;
      if (userCtx.lastName) updateData.lastName = userCtx.lastName;
      if (userCtx.username) updateData.telegramUsername = userCtx.username;
      if (userCtx.languageCode) updateData.languageCode = userCtx.languageCode;
      if (userCtx.photoUrl) updateData.photoUrl = userCtx.photoUrl;

      user = await this.prisma.user.update({
        where: { telegramUserId: userCtx.id },
        data: updateData,
      });
    }

    return { user, isNew };
  }

  async processGateCheck(userCtx: TelegramUserCtx): Promise<{
    verified: boolean;
    message: string;
    keyboard: any;
  }> {
    const { user } = await this.ensureUserIdentity(userCtx);

    let channelGateEnabled = true;
    let targetChannel = this.defaultChannel.id;

    try {
      const state = await this.prisma.emergencyControlState.findUnique({
        where: { id: 'SYSTEM_EMERGENCY_STATE' },
      });
      if (state) {
        channelGateEnabled = state.channelGateEnabled;
        if (state.requiredChannelId) {
          targetChannel = state.requiredChannelId;
        }
      }
    } catch (err) {
      this.logger.warn(`Failed to fetch EmergencyControlState in processGateCheck: ${err.message}`);
    }

    // Check first deposit status for checklist rendering
    const hasDeposit = await this.prisma.paymentInvoice.findFirst({
      where: { telegramUserId: userCtx.id, status: 'PAID' },
    });
    const depositCheck = hasDeposit ? '✅' : '⬜';

    const welcomeText = `<b>Welcome to TitanStream, ${userCtx.firstName}! 🚀⚡</b>\n\n` +
      `Your <b>Telegram-Native Financial Account & Yield Engine</b> is active.\n\n` +
      `<b>🌐 What TitanStream Offers:</b>\n` +
      `• <b>⚡ Yield Mining Node:</b> Generate continuous passive USDT yield 24/7.\n` +
      `• <b>🎰 Arcade USDT Games:</b> High-multiplier minigames with instant ledger payouts.\n` +
      `• <b>💰 Universal Cashouts:</b> Instant 24/7 Mobile Money P2P & Crypto settlements.\n` +
      `• <b>🎁 Daily Quests:</b> Complete economic missions & build yield streaks.\n\n` +
      `<b>📋 Account Onboarding Status:</b>\n` +
      `✅ Community Channel Verified\n` +
      `✅ Double-Entry Ledger Wallet Initialized\n` +
      `${depositCheck} First Deposit Completed\n\n` +
      `Tap <b>Open TitanStream App</b> below or use the main menu to begin:`;

    const verifiedKeyboard = {
      inline_keyboard: [
        [
          {
            text: '🚀 Open TitanStream App',
            web_app: { url: this.webAppUrl },
          },
        ],
        [
          { text: '➕ Quick Deposit', callback_data: 'cmd_deposit' },
          { text: '⚡ Mining Rig', callback_data: 'cmd_treasury' },
          { text: '🎰 Arcade Games', callback_data: 'cmd_games' },
        ],
        [
          { text: '📚 How TitanStream Works', callback_data: 'edu_menu' },
        ],
      ],
    };

    // If Admin has disabled the gate, bypass check!
    if (!channelGateEnabled) {
      return {
        verified: true,
        message: welcomeText,
        keyboard: verifiedKeyboard,
      };
    }

    const { isMember } = await this.verifyChannelMembership(userCtx.id, targetChannel);

    if (isMember) {
      if (!user.channelVerified) {
        await this.prisma.user.update({
          where: { telegramUserId: userCtx.id },
          data: {
            channelVerified: true,
            channelVerifiedAt: new Date(),
          },
        });
      }

      return {
        verified: true,
        message: welcomeText,
        keyboard: verifiedKeyboard,
      };
    }

    const channelUsernameClean = targetChannel.replace('@', '');
    const channelLink = `https://t.me/${channelUsernameClean}`;

    return {
      verified: false,
      message: `<b>Welcome to TitanStream, ${userCtx.firstName}! 🚀</b>\n\n` +
        `The premier Telegram-native liquidity, daily yield mining, and financial settlement network.\n\n` +
        `<b>Access Requirement:</b>\n` +
        `To protect our community and activate your instant double-entry wallet, please join our official Telegram channel first (@${channelUsernameClean}):`,
      keyboard: {
        inline_keyboard: [
          [{ text: `📢 Join @${channelUsernameClean}`, url: channelLink }],
          [{ text: '🔄 Verify Membership', callback_data: 'verify_membership' }],
        ],
      },
    };
  }
}
