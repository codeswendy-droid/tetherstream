import { Injectable, Logger } from '@nestjs/common';
import { TelegramUserCtx } from './bot-gate.service';

export interface EducationLesson {
  id: string;
  title: string;
  content: string;
  quiz?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

@Injectable()
export class BotAssistantService {
  private readonly logger = new Logger(BotAssistantService.name);

  private readonly lessons: Record<string, EducationLesson> = {
    cloud_economy: {
      id: 'cloud_economy',
      title: '1️⃣ What is TitanStream Cloud Economy?',
      content: `<b>Lesson 1: What is TitanStream Cloud Economy? 🌐</b>\n\n` +
        `TitanStream allows users to participate in the growing <b>cloud computing economy</b>.\n\n` +
        `<b>How it works:</b>\n` +
        `• By pooling resources together, users help secure high-performance computing capacity that businesses rent daily.\n` +
        `• Businesses rent this power to run software, AI models, and complex calculations.\n` +
        `• Generated rental revenue is shared directly with network contributors in real-time!`,
      quiz: {
        question: 'Where does the rental revenue in TitanStream come from?',
        options: [
          'Real companies renting computing power to run AI and software',
          'Crypto mining lotteries',
          'Government subsidies',
        ],
        correctIndex: 0,
        explanation: 'Correct! Real companies pay to rent cloud compute capacity to run software, AI models, and automation.',
      },
    },
    ai_demand: {
      id: 'ai_demand',
      title: '2️⃣ Why AI Makes Cloud Compute Valuable',
      content: `<b>Lesson 2: AI & Cloud Compute Demand 🤖⚡</b>\n\n` +
        `<b>Why is AI driving cloud value?</b>\n` +
        `• Artificial Intelligence requires massive, non-stop computing power to think, learn, and generate content.\n` +
        `• Top companies like OpenAI, Microsoft, and Google rely heavily on giant networks of cloud computers.\n` +
        `• Renting cloud capacity on demand is much cheaper and more flexible for companies than buying physical servers!`,
      quiz: {
        question: 'Why do companies rent cloud capacity instead of buying servers?',
        options: [
          'Renting is cheaper, flexible, and avoids hardware maintenance costs',
          'They are not allowed to buy computers',
          'Physical servers are illegal',
        ],
        correctIndex: 0,
        explanation: 'Correct! Renting cloud capacity allows businesses to scale instantly without expensive hardware overhead.',
      },
    },
    compute_power: {
      id: 'compute_power',
      title: '3️⃣ Compute Power & 24/7 Operations',
      content: `<b>Lesson 3: Compute Power & 24/7 Earnings 🖥⏱</b>\n\n` +
        `<b>What is Compute Power?</b>\n` +
        `Compute Power is the raw processing speed of a computer, measured in Compute Units (CU).\n\n` +
        `<b>Why do earnings continue when your phone is off?</b>\n` +
        `Your earnings do not rely on your mobile phone or home internet. Cloud computers run 24/7 in professional, high-security data centers — always active and always rented!`,
      quiz: {
        question: 'Do your cloud machines stop earning when your phone is turned off?',
        options: [
          'No — Servers run 24/7 in high-security data centers regardless of your device status',
          'Yes — Mobile phones must stay powered on',
          'Only at night',
        ],
        correctIndex: 0,
        explanation: 'Correct! TitanStream cloud servers run 24/7 in professional data centers independent of your phone.',
      },
    },
    usdt_cashouts: {
      id: 'usdt_cashouts',
      title: '4️⃣ USDT Stability & Instant Cashouts',
      content: `<b>Lesson 4: USDT Stability & Instant Cashouts 💵💸</b>\n\n` +
        `<b>USDT Digital Currency:</b>\n` +
        `USDT is a stable digital currency pegged 1-to-1 with the US Dollar ($1.00 USD), keeping earnings safe from market volatility.\n\n` +
        `<b>Instant Withdrawals:</b>\n` +
        `Withdraw earnings 24/7 directly to local Mobile Money, Telegram CryptoBot, or your personal USDT wallet with zero hidden fees.`,
      quiz: {
        question: 'What is the value of 1 USDT stablecoin?',
        options: ['$1.00 USD (Pegged 1-to-1)', '$100.00 USD', 'Changes every minute'],
        correctIndex: 0,
        explanation: 'Correct! USDT is a stable digital currency pegged 1-to-1 with $1.00 USD.',
      },
    },
  };

  async getAssistantMenu(userCtx: TelegramUserCtx): Promise<{ text: string; keyboard: any }> {
    return {
      text: `<b>⭐ TitanStream Cloud Economy Assistant</b>\n\n` +
        `Learn about cloud computing capacity, AI demand, and instant USDT rental revenue payouts. Choose a topic below:`,
      keyboard: {
        inline_keyboard: [
          [{ text: '🌐 What is TitanStream?', callback_data: 'edu_lesson_cloud_economy' }],
          [{ text: '🤖 Why AI drives Cloud Compute value', callback_data: 'edu_lesson_ai_demand' }],
          [{ text: '📈 How do I increase withdrawal limits?', callback_data: 'asst_q_limits' }],
          [{ text: '🛡 Trust Score & Account Safety', callback_data: 'asst_q_trust' }],
          [{ text: '🎓 Open Official Cloud Academy', callback_data: 'edu_menu' }],
          [{ text: '⬅️ Back to Main Menu', callback_data: 'cmd_start' }],
        ],
      },
    };
  }

  async handleAssistantQuery(queryKey: string): Promise<{ text: string; keyboard: any }> {
    const responses: Record<string, string> = {
      asst_q_limits: `<b>📈 How do I increase my withdrawal limits?</b>\n\nYour daily cashout capacity grows automatically as your verified platform reputation increases:\n\n1. Maintain active Machine server capacity.\n2. Complete Academy learning modules & pass quizzes.\n3. Maintain 100% transaction completion rate with zero disputes.\n\n<i>Limits protect network liquidity while allowing high trust levels up to $10,000+ daily!</i>`,
      asst_q_trust: `<b>🛡 What is Trust Score & Level?</b>\n\nTitanStream calculates a dynamic Trust Score (0 - 100) based on:\n• Server capacity allocation & uptime\n• Verified transaction history\n• Academy quiz completion\n• Dispute-free settlement activity\n\nTiers: NEW -> VERIFIED -> TRUSTED -> PREMIUM -> ELITE.`,
      asst_q_rewards: `<b>🎁 How do referral rewards work?</b>\n\nReferrals help expand our shared cloud computing network to more participants. By inviting others, you help build a larger computer network. We reward this growth with direct USDT bonuses and trust score boosts!`,
    };

    const text = responses[queryKey] || `Information requested is currently updating.`;

    return {
      text,
      keyboard: {
        inline_keyboard: [
          [{ text: '⭐ Ask Another Question', callback_data: 'assistant_menu' }],
          [{ text: '🚀 Open Mini App', web_app: { url: process.env.TELEGRAM_WEBAPP_URL || 'https://titanstream.app' } }],
        ],
      },
    };
  }

  async getEducationMenu(): Promise<{ text: string; keyboard: any }> {
    return {
      text: `<b>📚 TitanStream Cloud Economy Academy & FAQ</b>\n\n` +
        `Master cloud computing, AI demand, and instant USDT rental revenue in 2-minute bite-sized lessons:\n\n` +
        `<i>Pass quizzes to earn instant +0.50 USDT rewards credited to your ledger balance!</i>`,
      keyboard: {
        inline_keyboard: [
          [{ text: '1️⃣ What is TitanStream Cloud Economy?', callback_data: 'edu_lesson_cloud_economy' }],
          [{ text: '2️⃣ Why AI Makes Cloud Compute Valuable', callback_data: 'edu_lesson_ai_demand' }],
          [{ text: '3️⃣ Compute Power & 24/7 Operations', callback_data: 'edu_lesson_compute_power' }],
          [{ text: '4️⃣ USDT Stability & Instant Cashouts', callback_data: 'edu_lesson_usdt_cashouts' }],
          [{ text: '⬅️ Back to Main Menu', callback_data: 'cmd_start' }],
        ],
      },
    };
  }

  async getLesson(lessonKey: string): Promise<{ text: string; keyboard: any }> {
    const lesson = this.lessons[lessonKey];
    if (!lesson) {
      return this.getEducationMenu();
    }

    const keyboard: any = {
      inline_keyboard: [],
    };

    if (lesson.quiz) {
      keyboard.inline_keyboard.push([{ text: '📝 Take Quick Quiz (+0.50 USDT Reward)', callback_data: `edu_quiz_${lessonKey}` }]);
    }

    keyboard.inline_keyboard.push([{ text: '📚 Academy Menu', callback_data: 'edu_menu' }]);

    return {
      text: lesson.content,
      keyboard,
    };
  }

  getQuiz(lessonKey: string): { question: string; options: string[]; correctIndex: number; explanation: string } | null {
    return this.lessons[lessonKey]?.quiz || null;
  }
}
