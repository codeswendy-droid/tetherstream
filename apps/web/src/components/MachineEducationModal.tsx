import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Cpu, Zap, HelpCircle, ChevronRight, X, Sparkles, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';

interface MachineEducationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MachineEducationModal: React.FC<MachineEducationModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How are daily earnings calculated?',
      a: 'Earnings scale with your machine total hash power (GH/s) and active multiplier. Funds credit continuously into your balance in real time.',
    },
    {
      q: 'What does the Cooler Slider do?',
      a: 'The Cooler boosts your hash rate multiplier up to maximum power. If heat threshold is hit, a 5-second automatic safety cooling activates.',
    },
    {
      q: 'How do I collect my funds?',
      a: 'Tap "Collect Now" anytime on your Hub balance display to transfer accrued yield directly into your wallet balance.',
    },
    {
      q: 'How do Machine Tiers work?',
      a: 'Tier 0 (Free Trial) lets you start earning instantly. Higher tiers (Ripple X14 to StreamTitan 2028) deliver higher speed and daily payouts.',
    },
  ];

  const cards = [
    {
      title: 'How Money Is Made',
      icon: <Server size={36} className="text-usdt-green" />,
      sentence: 'Global enterprises rent compute capacity to process workloads. Titan Stream routes these contracts directly to your assigned hardware.',
    },
    {
      title: 'Your Machine Engine',
      icon: <Cpu size={36} className="text-cyan-400" />,
      sentence: 'Your machine operates automatically 24/7. Yield continuously accumulates in real time, ready for instant collection.',
    },
    {
      title: 'Bigger Machine Tiers',
      icon: <Zap size={36} className="text-amber-400" />,
      sentence: 'Higher machine tiers deliver exponentially higher compute hash rates (GH/s), maximizing your daily earnings and trust standing.',
    },
    {
      title: 'Detailed FAQ & Knowledge Base',
      icon: <HelpCircle size={36} className="text-gold" />,
      sentence: 'Access our interactive Knowledge Base & FAQs below for instant answers on rates, hardware specs, cooling, and payouts.',
      isFaqTab: true,
    },
  ];

  if (!isOpen) return null;

  const currentCard = cards[currentStep];

  const handleNext = () => {
    if (currentStep < cards.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      localStorage.setItem('has_seen_machine_education_v2', 'true');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-sm glass-panel p-5 rounded-3xl border border-usdt-green/40 bg-[#0c0e15] shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto no-scrollbar"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-usdt-green" />
              <span className="text-xs font-black uppercase tracking-wider text-text-primary">
                How Machines Work ({currentStep + 1}/4)
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-text-tertiary hover:text-white"
            >
              <X size={14} />
            </button>
          </div>

          {/* Card Body */}
          <div className="flex flex-col items-center text-center space-y-3 py-1">
            <div className="w-14 h-14 rounded-2xl bg-usdt-green/10 border border-usdt-green/30 flex items-center justify-center shadow-lg shadow-usdt-green/10 shrink-0">
              {currentCard.icon}
            </div>

            <h3 className="text-base font-black text-text-primary tracking-tight">{currentCard.title}</h3>

            <p className="text-xs font-medium text-text-secondary leading-relaxed px-1">
              "{currentCard.sentence}"
            </p>

            {/* Interactive FAQ Accordion List on Last Tab */}
            {currentCard.isFaqTab && (
              <div className="w-full mt-2 space-y-2 text-left">
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-gold flex items-center gap-1.5 mb-1 font-mono">
                  <BookOpen size={12} /> Frequently Asked Questions
                </div>
                {faqs.map((faq, idx) => {
                  const isExpanded = expandedFaq === idx;
                  return (
                    <div
                      key={idx}
                      className="bg-white/5 border border-white/10 rounded-xl overflow-hidden transition-all"
                    >
                      <button
                        onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                        className="w-full px-3 py-2 flex items-center justify-between text-xs font-bold text-white text-left gap-2"
                      >
                        <span>{faq.q}</span>
                        {isExpanded ? <ChevronUp size={14} className="text-gold shrink-0" /> : <ChevronDown size={14} className="text-text-tertiary shrink-0" />}
                      </button>
                      {isExpanded && (
                        <div className="px-3 pb-2.5 text-[11px] text-text-secondary leading-normal border-t border-white/5 pt-1.5 bg-black/20">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step Indicators & Action Button */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10 shrink-0">
            <div className="flex items-center gap-1.5">
              {cards.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentStep ? 'w-6 bg-usdt-green' : 'w-1.5 bg-white/20'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl bg-usdt-green text-app-bg font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-usdt-green/20 hover:brightness-110 active:scale-95 transition-all"
            >
              <span>{currentStep === cards.length - 1 ? 'Got It!' : 'Next'}</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
