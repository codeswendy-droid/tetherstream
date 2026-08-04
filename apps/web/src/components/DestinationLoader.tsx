import type React from 'react';
import { motion } from 'framer-motion';
import { Cpu, ShieldCheck, Users, Gift, User } from 'lucide-react';

interface DestinationLoaderProps {
  destination: 'wallet' | 'hub' | 'grow' | 'rewards' | 'profile';
}

const CONFIG = {
  wallet: {
    title: 'Loading your wallet...',
    subtitle: 'Getting your balance and money history',
    icon: ShieldCheck,
    color: 'from-usdt-green to-emerald-600',
    shadow: 'shadow-usdt-green/30',
    text: 'text-usdt-green',
  },
  hub: {
    title: 'Starting up...',
    subtitle: 'Connecting to your machines',
    icon: Cpu,
    color: 'from-usdt-green to-emerald-600',
    shadow: 'shadow-usdt-green/30',
    text: 'text-usdt-green',
  },
  grow: {
    title: 'Loading...',
    subtitle: 'Getting your friends and growth info',
    icon: Users,
    color: 'from-cyan-500 to-teal-400',
    shadow: 'shadow-cyan-500/30',
    text: 'text-cyan-400',
  },
  rewards: {
    title: 'Loading rewards...',
    subtitle: 'Checking your achievements and badges',
    icon: Gift,
    color: 'from-gold to-gold-bright',
    shadow: 'shadow-gold/30',
    text: 'text-gold',
  },
  profile: {
    title: 'Loading profile...',
    subtitle: 'Getting your profile and certificates',
    icon: User,
    color: 'from-gold to-amber-600',
    shadow: 'shadow-gold/30',
    text: 'text-gold',
  },
};

export const DestinationLoader: React.FC<DestinationLoaderProps> = ({ destination }) => {
  const cfg = CONFIG[destination];
  const Icon = cfg.icon;

  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] gap-5 p-4 select-none">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${cfg.color} border border-white/20 flex items-center justify-center shadow-2xl ${cfg.shadow} animate-pulse`}
      >
        <Icon size={40} className="text-app-bg" />
      </motion.div>

      <div className="text-center space-y-1">
        <h2 className="text-base font-black text-text-primary tracking-wide font-mono animate-pulse">
          {cfg.title}
        </h2>
        <p className="text-xs text-text-tertiary">
          {cfg.subtitle}
        </p>
      </div>
    </div>
  );
};
