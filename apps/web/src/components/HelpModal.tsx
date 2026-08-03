import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, HelpCircle, ChevronDown, ChevronUp, Server, DollarSign, ArrowUpRight, ShieldCheck, Clock, Zap, Headphones, TrendingUp, Sparkles, Wallet, Users } from 'lucide-react';
import { useTelegram } from '../context/TelegramContext';
import { useSupportStore } from '../store/useSupportStore';
import { useWalletStore } from '../store/useWalletStore';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  icon: React.ReactNode;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const { hapticFeedback } = useTelegram();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const faqItems: FAQItem[] = [
    {
      id: 'what_is',
      question: 'What is Titan Stream?',
      answer: 'Titan Stream is a simple app that lets you earn daily money automatically with machines. You don\'t need any technical skills.',
      icon: <Server size={20} className="text-usdt-green" />
    },
    {
      id: 'how_works',
      question: 'How does it work?',
      answer: 'You get a machine that earns money for you every single day. You can collect your earnings into your wallet whenever you want.',
      icon: <Zap size={20} className="text-cyan-400" />
    },
    {
      id: 'source_funds',
      question: 'Where does the money come from?',
      answer: 'Money is generated automatically from cloud operations and paid out directly to your account.',
      icon: <DollarSign size={20} className="text-amber-400" />
    },
    {
      id: 'phone_off',
      question: 'Why do earnings continue when my phone is off?',
      answer: 'Your machines run continuously 24/7 in safe data centers. They never stop, even when your phone is turned off.',
      icon: <Clock size={20} className="text-sky-400" />
    },
    {
      id: 'compute_power',
      question: 'What is Mining Power?',
      answer: 'Mining Power is the speed of your machine. Higher mining power means you earn more money each day.',
      icon: <Zap size={20} className="text-orange-400" />
    },
    {
      id: 'machines_work',
      question: 'How do Machines work?',
      answer: 'Machines generate money for you every second. Faster machines earn higher daily profits.',
      icon: <Server size={20} className="text-indigo-400" />
    },
    {
      id: 'deposits',
      question: 'How do I add money?',
      answer: 'Adding money is fast and safe. You can use Mobile Money or Telegram to add money to your wallet immediately.',
      icon: <Wallet size={20} className="text-teal-400" />
    },
    {
      id: 'withdrawals',
      question: 'How do I take out money?',
      answer: 'You can take out your money anytime. Payouts are sent directly to your Mobile Money or crypto wallet.',
      icon: <ArrowUpRight size={20} className="text-green-400" />
    },
    {
      id: 'usdt',
      question: 'What is USDT?',
      answer: 'USDT is a digital dollar equal to 1 US Dollar. It keeps your money safe and stable.',
      icon: <DollarSign size={20} className="text-pink-400" />
    },
    {
      id: 'referrals',
      question: 'Why should I invite friends?',
      answer: 'Inviting friends earns you 5 USDT for each friend plus extra daily mining speed bonuses.',
      icon: <Users size={20} className="text-cyan-400" />
    },
    {
      id: 'safety',
      question: 'Is my money safe?',
      answer: 'Yes! All your money and payments are 100% safe, protected, and fully verified.',
      icon: <ShieldCheck size={20} className="text-emerald-400" />
    },
    {
      id: 'timing',
      question: 'How long do payments take?',
      answer: 'Payments and payouts are very fast, usually taking only a few seconds to process.',
      icon: <Clock size={20} className="text-amber-500" />
    }
  ];

  const toggleExpand = (id: string) => {
    hapticFeedback.selectionChanged();
    setExpandedId(expandedId === id ? null : id);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          className="w-full max-w-md bg-app-bg border border-white/10 rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-usdt-green/20 text-usdt-green flex items-center justify-center">
                <HelpCircle size={18} />
              </div>
              <h2 className="text-base font-extrabold text-text-primary">Help & FAQ</h2>
            </div>
            <button
              onClick={() => {
                hapticFeedback.impactOccurred('light');
                onClose();
              }}
              className="press-feedback p-1.5 rounded-full bg-white/5 border border-white/10 text-text-secondary hover:text-text-primary"
            >
              <X size={18} />
            </button>
          </div>

          {/* Introduction */}
          <div className="bg-control-bg/30 border border-white/5 rounded-2xl p-4 mb-4">
            <p className="text-xs text-text-secondary leading-relaxed font-medium">
              Titan Stream is an easy way to earn daily money automatically. Get a machine, watch your money grow, and collect your earnings into your wallet anytime.
            </p>
          </div>

          {/* FAQ Items */}
          <div className="space-y-2">
            {faqItems.map((item) => (
              <div
                key={item.id}
                className="glass-panel rounded-xl border border-white/10 overflow-hidden"
              >
                <button
                  onClick={() => toggleExpand(item.id)}
                  className="w-full p-3 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-control-bg border border-white/5 flex items-center justify-center flex-shrink-0">
                      {item.icon}
                    </div>
                    <span className="text-xs font-extrabold text-text-primary">{item.question}</span>
                  </div>
                  {expandedId === item.id ? (
                    <ChevronUp size={16} className="text-text-secondary flex-shrink-0" />
                  ) : (
                    <ChevronDown size={16} className="text-text-secondary flex-shrink-0" />
                  )}
                </button>

                <AnimatePresence>
                  {expandedId === item.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 pt-0 text-xs text-text-secondary leading-relaxed border-t border-white/5">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-white/5 space-y-2 text-center">
            <button
              onClick={() => {
                hapticFeedback.impactOccurred('medium');
                const subject = prompt('Brief description of your question:', 'Help with my account');
                if (!subject) return;
                const details = prompt('Details for support:');
                if (!details) return;

                const user = useTelegram().user;
                useSupportStore.getState().createTicket(
                  {
                    userTelegramId: user?.id?.toString() || '74829103',
                    userName: user?.first_name || 'Titan Stream User',
                    userUsername: user?.username ? `@${user.username}` : '@user',
                    userCountry: 'Uganda',
                    userBalanceUsdt: useWalletStore.getState().usdtBalance,
                    category: 'Funding',
                    priority: 'Normal',
                    status: 'Waiting for Admin',
                    subject,
                    runningMachinesCount: 1,
                  },
                  details
                );
                alert('Support request sent! We will reply to your Telegram chat soon.');
                onClose();
              }}
              className="press-feedback w-full py-2.5 rounded-xl bg-usdt-green text-app-bg font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md"
            >
              <Headphones size={14} /> Contact Support
            </button>
            <p className="text-[10px] text-text-tertiary">
              24/7 Support — Replies are sent directly to your Telegram chat.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
