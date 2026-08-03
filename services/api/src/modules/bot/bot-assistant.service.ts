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

  // Exact FAQ content mapped directly from apps/web/src/components/HelpModal.tsx
  private readonly faqItems: Record<string, { question: string; answer: string }> = {
    what_is: {
      question: 'What is TitanStream?',
      answer: 'TitanStream is a simple way for ordinary people to participate in the growing cloud computing economy. By pooling resources together, users help secure high-performance computing capacity that businesses rent daily. We share the generated rental revenue directly with you.',
    },
    how_works: {
      question: 'How does it work?',
      answer: 'You fund a Machine to reserve a portion of our cloud computing network. Businesses rent this power to run software, AI models, and complex calculations. You receive your share of the rental fees in real-time as businesses pay to use the network.',
    },
    source_funds: {
      question: 'Where does the money come from?',
      answer: 'The money comes from real companies that pay to rent computing power. Millions of businesses need computing power every second to run their software, generate videos, and automate tasks. The rental revenue they pay is distributed directly to our network contributors.',
    },
    why_profitable: {
      question: 'Why does cloud computing make money?',
      answer: 'Computing power is the fuel of the modern internet. Every website, app, database, and game runs on a cloud server. Because digital activities are growing exponentially, the demand for computing power is higher than ever before, creating a highly profitable industry.',
    },
    ai_demand: {
      question: 'Why is AI making cloud computers more valuable?',
      answer: 'Artificial Intelligence requires massive, non-stop computing power to think, learn, and generate content. Top companies like OpenAI, Microsoft, and Google rely heavily on giant networks of cloud computers to run their AI tools. This massive demand has made cloud computing one of the fastest-growing industries in the world.',
    },
    why_rent: {
      question: 'Why do companies rent computers instead of buying them?',
      answer: 'Buying, housing, and maintaining physical servers costs companies thousands of dollars in hardware and electricity. Renting cloud capacity on demand is much cheaper, more flexible, and lets businesses scale instantly without long-term hardware maintenance costs.',
    },
    phone_off: {
      question: 'Why do earnings continue when my phone is off?',
      answer: 'Your earnings do not rely on your mobile phone or home internet. The cloud computers you support run 24/7 in professional, high-security data centers. They are always active, always rented, and always generating revenue regardless of your device status.',
    },
    compute_power: {
      question: 'What is Compute Power?',
      answer: 'Compute Power is the raw processing speed of a computer, measured in Compute Units (CU). The more Compute Power your Machine has, the more complex tasks it can handle for businesses, and the higher your share of the global rental revenue.',
    },
    machines_work: {
      question: 'How do Machines work?',
      answer: 'Machines are packages of cloud computing capacity. When you unlock a higher tier Machine, you fund a larger allocation of server power. This increases your compute contribution and unlocks higher estimated daily rewards.',
    },
    deposits: {
      question: 'How do deposits work?',
      answer: 'Funding your account is a safe payment process. You can deposit USDT or your local currency instantly using secure mobile money rails. Once verified by our system, your funds immediately activate your chosen Machine tier.',
    },
    withdrawals: {
      question: 'How do withdrawals work?',
      answer: 'You can withdraw your earnings instantly at any time. We support direct transfers to your local mobile money account, Telegram CryptoBot, or your personal USDT wallet. Withdrawals are processed immediately with zero hidden fees.',
    },
    usdt: {
      question: 'What is USDT?',
      answer: 'USDT is a stable digital currency pegged 1-to-1 with the US Dollar. It ensures your earnings and deposits remain stable, secure, and protected from the price fluctuations common in other digital currencies.',
    },
    referrals: {
      question: 'Why do I need referrals?',
      answer: 'Referrals help expand our shared cloud computing network to more participants. By inviting others, you help build a larger, more powerful computer network. We reward this growth by increasing your trust score and giving you direct bonuses.',
    },
    safety: {
      question: 'Is my money safe?',
      answer: 'Yes. All transactions are logged securely in our double-entry ledger system. We maintain full transparency, and your funds are protected by the platform\'s safety guidelines and battle-tested protocols.',
    },
    limits: {
      question: 'Why are there limits?',
      answer: 'Limits protect the network\'s liquidity and ensure fair distribution among all users. As your verified platform reputation grows, your transaction limits naturally expand, allowing you to run larger operations.',
    },
    why_learn: {
      question: 'Why do I need to learn before I start?',
      answer: 'We want every user to understand the real value of the cloud computing economy. Learning the basics builds confidence, removes fear, and helps you make smarter decisions as you scale your participation.',
    },
    balance_calc: {
      question: 'How is my balance calculated?',
      answer: 'Your balance updates continuously based on the Compute Power of your active Machines. The system calculates your share of rental fees every second and adds it directly to your available balance.',
    },
    platform_fee: {
      question: 'How does TitanStream make money?',
      answer: 'TitanStream acts as the platform orchestrator. We take a small service fee from the rental contracts paid by businesses to cover data center maintenance, electricity, and platform operations.',
    },
    why_growth: {
      question: 'Why is cloud computing growing so fast?',
      answer: 'The entire world is moving online. From AI models to video rendering, automation, and science, businesses need more power than ever. Industry giants like Amazon, Microsoft, and NVIDIA rely heavily on cloud computing, making it a trillion-dollar industry.',
    },
  };

  private readonly lessons: Record<string, EducationLesson> = {
    lesson_1: {
      id: 'lesson_1',
      title: '1️⃣ Cloud Computing Economy',
      content: `<b>Lesson 1: What is TitanStream? 🌐</b>\n\n` +
        `TitanStream is a simple way for ordinary people to participate in the growing <b>cloud computing economy</b>.\n\n` +
        `<b>How it works:</b>\n` +
        `• By pooling resources together, users help secure high-performance computing capacity that businesses rent daily.\n` +
        `• Businesses rent this power to run software, AI models, and complex calculations.\n` +
        `• We share the generated rental revenue directly with you!`,
      quiz: {
        question: 'Where does the money in TitanStream come from?',
        options: [
          'Real companies paying to rent cloud computing power for software & AI',
          'Random crypto lotteries',
          'Unbacked promissory notes',
        ],
        correctIndex: 0,
        explanation: 'Correct! Real companies pay to rent computing power to run software, AI models, and automation tasks.',
      },
    },
    lesson_2: {
      id: 'lesson_2',
      title: '2️⃣ AI & Cloud Demand',
      content: `<b>Lesson 2: Why AI Makes Cloud Computers Valuable 🤖</b>\n\n` +
        `Artificial Intelligence requires massive, non-stop computing power to think, learn, and generate content.\n\n` +
        `Top companies like OpenAI, Microsoft, and Google rely heavily on giant networks of cloud computers to run their AI tools.\n\n` +
        `Renting cloud capacity on demand is much cheaper and more flexible for businesses than buying physical servers!`,
      quiz: {
        question: 'Why do companies rent cloud computers instead of buying them?',
        options: [
          'Renting is cheaper, flexible, and lets businesses scale without physical server costs',
          'Physical servers are not allowed',
          'Renting is mandated by law',
        ],
        correctIndex: 0,
        explanation: 'Correct! Renting cloud capacity is cheaper, flexible, and lets businesses scale instantly.',
      },
    },
    lesson_3: {
      id: 'lesson_3',
      title: '3️⃣ Compute Power & 24/7 Earnings',
      content: `<b>Lesson 3: Compute Power & 24/7 Operations 🖥⏱</b>\n\n` +
        `<b>What is Compute Power?</b>\n` +
        `Compute Power is the raw processing speed of a computer, measured in <b>Compute Units (CU)</b>.\n\n` +
        `<b>Why do earnings continue when your phone is off?</b>\n` +
        `Your earnings do not rely on your mobile phone or home internet. The cloud computers you support run 24/7 in professional, high-security data centers — always active, always rented!`,
      quiz: {
        question: 'Do your earnings stop when your phone is turned off?',
        options: [
          'No — Servers run 24/7 in professional data centers regardless of your phone status',
          'Yes — Your phone screen must stay open',
          'Only during internet outages',
        ],
        correctIndex: 0,
        explanation: 'Correct! Cloud computers run 24/7 in professional data centers independent of your mobile phone.',
      },
    },
    lesson_4: {
      id: 'lesson_4',
      title: '4️⃣ USDT & Instant Cashouts',
      content: `<b>Lesson 4: USDT & Instant Cashouts 💵💸</b>\n\n` +
        `<b>What is USDT?</b>\n` +
        `USDT is a stable digital currency pegged 1-to-1 with the US Dollar ($1.00 USD), ensuring earnings remain stable and protected from price fluctuations.\n\n` +
        `<b>Withdrawals:</b>\n` +
        `You can withdraw your earnings instantly at any time via Mobile Money, CryptoBot, or your USDT wallet with zero hidden fees.`,
      quiz: {
        question: 'What is the target value of 1 USDT stablecoin?',
        options: ['$1.00 USD (Pegged 1-to-1)', '$10.00 USD', 'Fluctuates like Bitcoin'],
        correctIndex: 0,
        explanation: 'Correct! USDT is a stable digital currency pegged 1-to-1 with $1.00 USD.',
      },
    },
  };

  async getAssistantMenu(userCtx: TelegramUserCtx): Promise<{ text: string; keyboard: any }> {
    return {
      text: `<b>📚 TitanStream Education & FAQ Center</b>\n\n` +
        `Welcome! Explore our official platform FAQ or complete short Academy lessons to understand how cloud computing rental revenue works:`,
      keyboard: {
        inline_keyboard: [
          [{ text: '❓ What is TitanStream?', callback_data: 'faq_what_is' }],
          [{ text: '⚡ How does it work?', callback_data: 'faq_how_works' }],
          [{ text: '💵 Where does the money come from?', callback_data: 'faq_source_funds' }],
          [{ text: '🤖 Why is AI making cloud compute valuable?', callback_data: 'faq_ai_demand' }],
          [{ text: '⏱ Why do earnings continue when phone is off?', callback_data: 'faq_phone_off' }],
          [{ text: '🎓 Open Full Cloud Academy & Quizzes', callback_data: 'edu_menu' }],
          [{ text: '⬅️ Back to Main Menu', callback_data: 'cmd_start' }],
        ],
      },
    };
  }

  async getFaqAnswer(faqKey: string): Promise<{ text: string; keyboard: any }> {
    const item = this.faqItems[faqKey];
    if (!item) return this.getEducationMenu();

    return {
      text: `<b>❓ ${item.question}</b>\n\n${item.answer}`,
      keyboard: {
        inline_keyboard: [
          [{ text: '📚 Ask Another FAQ Question', callback_data: 'assistant_menu' }],
          [{ text: '🚀 Open Mini App', web_app: { url: process.env.TELEGRAM_WEBAPP_URL || 'https://titanstream.app' } }],
        ],
      },
    };
  }

  async handleAssistantQuery(queryKey: string): Promise<{ text: string; keyboard: any }> {
    if (queryKey.startsWith('faq_')) {
      const faqKey = queryKey.replace('faq_', '');
      return this.getFaqAnswer(faqKey);
    }

    const responses: Record<string, string> = {
      asst_q_limits: `<b>📈 Why are there limits?</b>\n\n${this.faqItems.limits.answer}`,
      asst_q_trust: `<b>🛡 Is my money safe?</b>\n\n${this.faqItems.safety.answer}`,
      asst_q_rewards: `<b>🎁 Why do I need referrals?</b>\n\n${this.faqItems.referrals.answer}`,
    };

    const text = responses[queryKey] || `Information requested is currently updating.`;

    return {
      text,
      keyboard: {
        inline_keyboard: [
          [{ text: '⭐ View All FAQs', callback_data: 'assistant_menu' }],
          [{ text: '🚀 Open Mini App', web_app: { url: process.env.TELEGRAM_WEBAPP_URL || 'https://titanstream.app' } }],
        ],
      },
    };
  }

  async getEducationMenu(): Promise<{ text: string; keyboard: any }> {
    return {
      text: `<b>📚 TitanStream Cloud Computing Academy</b>\n\n` +
        `Learn how cloud computing, AI demand, and rental revenue payouts work in 2-minute bite-sized lessons:\n\n` +
        `<i>Pass quizzes to earn instant +0.50 USDT rewards credited directly to your ledger balance!</i>`,
      keyboard: {
        inline_keyboard: [
          [{ text: '1️⃣ Cloud Computing Economy', callback_data: 'edu_lesson_lesson_1' }],
          [{ text: '2️⃣ AI & Cloud Demand', callback_data: 'edu_lesson_lesson_2' }],
          [{ text: '3️⃣ Compute Power & 24/7 Operations', callback_data: 'edu_lesson_lesson_3' }],
          [{ text: '4️⃣ USDT & Instant Cashouts', callback_data: 'edu_lesson_lesson_4' }],
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
