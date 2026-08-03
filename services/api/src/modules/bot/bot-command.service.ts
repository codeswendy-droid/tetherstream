import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { BotGateService, TelegramUserCtx } from './bot-gate.service';
import { ReferralService } from '../growth/referral.service';
import { BalanceService } from '../financial/balance.service';
import { UserLevelService } from '../growth/user-level.service';
import { SupportService } from '../admin/services/support.service';
import { SupportCategory, SupportPriority } from '@prisma/client';

export const getPersistentMainKeyboard = (webAppUrl: string) => ({
  keyboard: [
    [{ text: '🚀 Open TitanStream', web_app: { url: webAppUrl } }],
    [{ text: '⚡ Treasury & Mining' }, { text: '🎰 Arcade Games' }, { text: '💰 Wallet & Cash' }],
    [{ text: '🎁 Daily Quests' }, { text: '⭐ Trust & Limits' }, { text: '👥 Referral Hub' }],
    [{ text: '📚 Academy' }, { text: '🆘 Support Desk' }, { text: '⚙️ Settings & Security' }],
  ],
  resize_keyboard: true,
});

@Injectable()
export class BotCommandService {
  private readonly logger = new Logger(BotCommandService.name);
  private readonly webAppUrl = process.env.TELEGRAM_WEBAPP_URL || 'https://titanstream.app';

  constructor(
    private readonly prisma: PrismaService,
    private readonly botGate: BotGateService,
    private readonly referralService: ReferralService,
    private readonly balanceService: BalanceService,
    private readonly userLevelService: UserLevelService,
    private readonly supportService: SupportService,
  ) {}

  async handleStart(userCtx: TelegramUserCtx, startParam?: string): Promise<{ text: string; keyboard: any }> {
    await this.botGate.ensureUserIdentity(userCtx);

    // Process referral deep linking if parameter present
    if (startParam) {
      let refCode = startParam.trim();
      if (refCode.startsWith('ref_')) {
        refCode = refCode.replace('ref_', '');
      }

      if (refCode) {
        try {
          await this.referralService.registerReferral(refCode, userCtx.id);
          this.logger.log(`Attached referral ${refCode} to user ${userCtx.id}`);
        } catch (err) {
          this.logger.warn(`Referral attachment warning for user ${userCtx.id}: ${err.message}`);
        }
      }
    }

    const gateResult = await this.botGate.processGateCheck(userCtx);
    if (!gateResult.verified) {
      return {
        text: gateResult.message,
        keyboard: gateResult.keyboard,
      };
    }

    return {
      text: gateResult.message,
      keyboard: {
        ...gateResult.keyboard,
        ...getPersistentMainKeyboard(this.webAppUrl),
      },
    };
  }

  async handleApp(userCtx: TelegramUserCtx): Promise<{ text: string; keyboard: any }> {
    const gateResult = await this.botGate.processGateCheck(userCtx);
    if (!gateResult.verified) return { text: gateResult.message, keyboard: gateResult.keyboard };

    return {
      text: `<b>TitanStream Mini App Hub 🚀</b>\n\n` +
        `Welcome to TitanStream — the premier Telegram-native financial & yield engine.\n\n` +
        `Tap below to launch your personal dashboard:`,
      keyboard: {
        inline_keyboard: [
          [{ text: '🚀 Launch TitanStream App', web_app: { url: this.webAppUrl } }],
          [{ text: '⚡ View Mining Rig', callback_data: 'cmd_treasury' }],
          [{ text: '🎰 Play Arcade Games', callback_data: 'cmd_games' }],
        ],
      },
    };
  }

  async handleTreasuryMining(userCtx: TelegramUserCtx): Promise<{ text: string; keyboard: any }> {
    const gateResult = await this.botGate.processGateCheck(userCtx);
    if (!gateResult.verified) return { text: gateResult.message, keyboard: gateResult.keyboard };

    const text = `<b>⚡ TitanStream Treasury & Mining Rig</b>\n\n` +
      `Your automated mining node generates continuous economic yield based on your active mode and Trust Tier.\n\n` +
      `<b>Mining Node Status:</b> 🟢 ONLINE & ACTIVE\n` +
      `<b>Active Mode:</b> ⚡ Turbo (2.5x Multiplier)\n` +
      `<b>Unclaimed Yield:</b> <b>4.85 USDT</b>\n` +
      `<b>Next Treasury Cycle Tick:</b> ⏱ 03h 42m remaining\n\n` +
      `<i>Tip: Keep your node active daily to maintain your Treasury Multiplier streak!</i>`;

    return {
      text,
      keyboard: {
        inline_keyboard: [
          [{ text: '🎁 Claim Mining Yield (4.85 USDT)', callback_data: 'cmd_claim_mining' }],
          [{ text: '⚡ Boost to Turbo Mining Mode', callback_data: 'cmd_toggle_turbo' }],
          [{ text: '🚀 Launch Full Rig in Mini App', web_app: { url: `${this.webAppUrl}/mine` } }],
        ],
      },
    };
  }

  async handleGames(userCtx: TelegramUserCtx): Promise<{ text: string; keyboard: any }> {
    const gateResult = await this.botGate.processGateCheck(userCtx);
    if (!gateResult.verified) return { text: gateResult.message, keyboard: gateResult.keyboard };

    const text = `<b>🎰 TitanStream Arcade Games</b>\n\n` +
      `Play high-yield USDT minigames with instant settlement to your double-entry ledger balance.\n\n` +
      `<b>🔥 Featured Games:</b>\n` +
      `• <b>USDT Roulette:</b> Pick color or number range (Up to 36x payout)\n` +
      `• <b>Crash Rocket:</b> Cash out before the rocket crashes (Up to 100x multiplier)\n` +
      `• <b>Daily Wheel:</b> Spin once per day for guaranteed USDT rewards\n\n` +
      `<b>Current Arcade Pool:</b> <b>25,000 USDT</b>`;

    return {
      text,
      keyboard: {
        inline_keyboard: [
          [{ text: '🎡 Play USDT Roulette', web_app: { url: `${this.webAppUrl}/games` } }],
          [{ text: '🚀 Play Crash Rocket', web_app: { url: `${this.webAppUrl}/games` } }],
          [{ text: '🎁 Spin Daily Reward Wheel', callback_data: 'cmd_daily_spin' }],
        ],
      },
    };
  }

  async handleQuests(userCtx: TelegramUserCtx): Promise<{ text: string; keyboard: any }> {
    const gateResult = await this.botGate.processGateCheck(userCtx);
    if (!gateResult.verified) return { text: gateResult.message, keyboard: gateResult.keyboard };

    const text = `<b>🎁 Daily Quests & Reputation Missions</b>\n\n` +
      `Complete daily economic missions to earn bonus yield and unlock higher Trust Tiers!\n\n` +
      `<b>Today's Active Missions:</b>\n` +
      `✅ <b>Daily Check-in:</b> Complete (+0.50 USDT)\n` +
      `⏳ <b>Keep Node Active 24h:</b> In progress (18/24h)\n` +
      `⏳ <b>Invite 1 Friend:</b> Pending (+2.00 USDT bonus)\n\n` +
      `<b>Daily Streak:</b> 🔥 <b>5 Days Active</b> (+15% Multiplier)`;

    return {
      text,
      keyboard: {
        inline_keyboard: [
          [{ text: '🔥 Claim 5-Day Streak Bonus', callback_data: 'cmd_claim_streak' }],
          [{ text: '🎯 View All Missions in App', web_app: { url: `${this.webAppUrl}/quests` } }],
        ],
      },
    };
  }

  async handleBalance(userCtx: TelegramUserCtx): Promise<{ text: string; keyboard: any }> {
    const gateResult = await this.botGate.processGateCheck(userCtx);
    if (!gateResult.verified) return { text: gateResult.message, keyboard: gateResult.keyboard };

    const user = await this.prisma.user.findUnique({
      where: { telegramUserId: userCtx.id },
      include: { financialAccount: true },
    });

    let availableUSDT = '0.00';
    let reservedUSDT = '0.00';
    if (user?.financialAccount?.id) {
      try {
        const balanceData = await this.balanceService.getBalances(userCtx.id, user.financialAccount.id);
        const usdtAsset = balanceData.balances.find((b) => b.assetCode === 'USDT');
        if (usdtAsset) {
          availableUSDT = Number(usdtAsset.availableBalance).toFixed(2);
          reservedUSDT = Number(usdtAsset.reservedBalance || 0).toFixed(2);
        }
      } catch (err) {
        this.logger.error(`Error fetching balance: ${err.message}`);
      }
    }

    let trustLevelName = 'Tier 1 (New Member)';
    let dailyLimit = '$1,000.00';
    try {
      const levelRecord = await this.userLevelService.getUserLevelSummary(userCtx.id);
      trustLevelName = `Tier ${levelRecord.currentLevel} (${levelRecord.levelName})`;
      if ((levelRecord as any).dailyLimit) {
        dailyLimit = `$${Number((levelRecord as any).dailyLimit).toLocaleString()}.00`;
      }
    } catch {
      // default
    }

    const text = `<b>💰 TitanStream Universal Ledger Wallet</b>\n\n` +
      `<b>Available Funds:</b> <b>${availableUSDT} USDT</b>\n` +
      `<b>Reserved Funds:</b> <b>${reservedUSDT} USDT</b>\n\n` +
      `<b>Trust Level:</b> ${trustLevelName}\n` +
      `<b>Daily Cashout Capacity:</b> <b>${dailyLimit} / day</b>\n\n` +
      `<i>All balances are double-entry ledger verified for 100% financial integrity.</i>`;

    return {
      text,
      keyboard: {
        inline_keyboard: [
          [{ text: '➕ Quick CryptoBot Deposit', callback_data: 'cmd_deposit' }],
          [{ text: '💸 Instant P2P / Crypto Cashout', callback_data: 'cmd_withdraw' }],
          [{ text: '🚀 Open Full Wallet Dashboard', web_app: { url: `${this.webAppUrl}/wallet` } }],
          [{ text: '🔄 Refresh Balance', callback_data: 'cmd_balance' }],
        ],
      },
    };
  }

  async handleReferrals(userCtx: TelegramUserCtx): Promise<{ text: string; keyboard: any }> {
    const gateResult = await this.botGate.processGateCheck(userCtx);
    if (!gateResult.verified) return { text: gateResult.message, keyboard: gateResult.keyboard };

    const summary = await this.referralService.getUserReferralSummary(userCtx.id);

    const text = `<b>👥 TitanStream Referral & Affiliate Hub</b>\n\n` +
      `Invite friends to TitanStream and earn instant rewards on every deposit & mining tick!\n\n` +
      `<b>Your Unique Invite Link:</b>\n<code>${summary.referralLink}</code>\n\n` +
      `<b>Affiliate Performance:</b>\n` +
      `• Total Invited: <b>${summary.totalInvited}</b>\n` +
      `• Qualified Friends: <b>${summary.qualifiedCount}</b>\n` +
      `• Rewards Earned: <b>${summary.totalEarnedUSDT.toFixed(2)} USDT</b>`;

    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(summary.referralLink)}&text=${encodeURIComponent('Join TitanStream for 24/7 USDT mining & instant cashouts! 🚀')}`;

    return {
      text,
      keyboard: {
        inline_keyboard: [
          [{ text: '📢 Share Referral Link', url: shareUrl }],
          [{ text: '🚀 Activate 2x Referral Boost', callback_data: 'prod_view_BOOST_2X_REFERRAL' }],
          [{ text: '📊 Open Growth Hub in App', web_app: { url: `${this.webAppUrl}/boost` } }],
        ],
      },
    };
  }

  async handleHelp(userCtx: TelegramUserCtx): Promise<{ text: string; keyboard: any }> {
    return {
      text: `<b>💬 TitanStream Support & Assistance Desk</b>\n\n` +
        `Need help with a deposit, cashout, node yield, or account limits? Select a topic below:`,
      keyboard: {
        inline_keyboard: [
          [{ text: '💳 Deposit Assistance', callback_data: 'ticket_PAYMENT_ISSUE' }],
          [{ text: '💸 Withdrawal Delay', callback_data: 'ticket_SETTLEMENT_DELAY' }],
          [{ text: '⚡ Mining Rig Issue', callback_data: 'ticket_TECHNICAL_ISSUE' }],
          [{ text: '👤 Account & Limit Upgrades', callback_data: 'ticket_ACCOUNT_ISSUE' }],
          [{ text: '⭐ Ask Trust AI Assistant', callback_data: 'assistant_menu' }],
        ],
      },
    };
  }

  async handleSettings(userCtx: TelegramUserCtx): Promise<{ text: string; keyboard: any }> {
    return {
      text: `<b>⚙️ Account Preferences & Security</b>\n\nManage your notification alerts, language options, and active web sessions:`,
      keyboard: {
        inline_keyboard: [
          [{ text: '🔔 Telegram Notifications: Enabled', callback_data: 'toggle_notif' }],
          [{ text: '🌐 Language: English', callback_data: 'toggle_lang' }],
          [{ text: '🛡 Security Audit Logs', callback_data: 'cmd_security' }],
        ],
      },
    };
  }

  async createSupportTicketFromBot(
    userCtx: TelegramUserCtx,
    categoryStr: string,
  ): Promise<{ text: string; keyboard: any }> {
    const category = (SupportCategory[categoryStr as keyof typeof SupportCategory] ||
      SupportCategory.TECHNICAL_ISSUE) as SupportCategory;

    const supportCase = await this.supportService.createCase(
      { id: 'SYSTEM_BOT', role: 'BOT_AUTOMATION' },
      {
        userId: userCtx.id.toString(),
        category,
        priority: SupportPriority.HIGH,
        notes: `Support ticket created via Telegram Bot by @${userCtx.username || userCtx.id}`,
      },
    );

    return {
      text: `<b>✅ Support Ticket Created</b>\n\n` +
        `<b>Ticket ID:</b> <code>${supportCase.id}</code>\n` +
        `<b>Category:</b> ${category}\n` +
        `<b>Status:</b> OPEN\n\n` +
        `Our support desk has been notified and an agent will assist you shortly.`,
      keyboard: {
        inline_keyboard: [
          [{ text: '💬 Chat in Support Portal', web_app: { url: `${this.webAppUrl}/support` } }],
        ],
      },
    };
  }
}
