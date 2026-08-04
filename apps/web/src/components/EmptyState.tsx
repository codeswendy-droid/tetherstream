import type React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  accentColor?: 'green' | 'blue' | 'gold' | 'purple' | 'cyan';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  accentColor = 'green',
}) => {
  const getColorClasses = () => {
    switch (accentColor) {
      case 'blue':
        return {
          bg: 'bg-ton-blue/10 border-ton-blue/30 text-ton-blue',
          button: 'bg-ton-blue text-app-bg shadow-ton-blue/20',
        };
      case 'gold':
        return {
          bg: 'bg-gold/10 border-gold/30 text-gold',
          button: 'bg-gradient-to-r from-gold to-gold-bright text-app-bg shadow-gold/20',
        };
      case 'purple':
        return {
          bg: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
          button: 'bg-purple-500 text-white shadow-purple-500/20',
        };
      case 'cyan':
        return {
          bg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
          button: 'bg-cyan-500 text-app-bg shadow-cyan-500/20',
        };
      case 'green':
      default:
        return {
          bg: 'bg-usdt-green/10 border-usdt-green/30 text-usdt-green',
          button: 'bg-usdt-green text-app-bg shadow-usdt-green/20',
        };
    }
  };

  const colors = getColorClasses();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="web3-card rounded-2xl p-5 border border-white/10 flex flex-col items-center text-center relative overflow-hidden"
    >
      <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-3 shadow-lg ${colors.bg}`}>
        {icon || <Sparkles size={22} />}
      </div>

      <h3 className="text-sm font-black text-text-primary mb-1 tracking-tight">
        {title}
      </h3>
      <p className="text-xs text-text-secondary leading-relaxed max-w-[320px] mb-4">
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className={`py-2 px-4 rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-md press-feedback ${colors.button}`}
        >
          <span>{actionLabel}</span>
          <ArrowRight size={14} />
        </button>
      )}
    </motion.div>
  );
};
