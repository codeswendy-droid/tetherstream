import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Share2, Sparkles, Trophy, Cpu, Zap } from 'lucide-react';
import { showToast } from '../Toast';

export interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRank?: string;
  totalPowerGhs?: number;
  activeMachines?: number;
  lifetimeEarnings?: number;
  username?: string;
}

export const ShareCardModal: React.FC<ShareCardModalProps> = ({
  isOpen,
  onClose,
  userRank = 'Level 5 Titan Builder',
  totalPowerGhs = 450,
  activeMachines = 3,
  lifetimeEarnings = 124.50,
  username = 'Operator',
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'tiktok' | 'whatsapp' | 'telegram' | 'x' | 'instagram'>('tiktok');

  if (!isOpen) return null;

  const shareText = `🚀 Titan Stream Machine Economy! My ${userRank} computing node is generating ${totalPowerGhs} GH/s. Join me & start building: https://t.me/tetherstream_bot?start=ref_${username}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    showToast('Share link and progress message copied!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const openSocialShare = (platform: string) => {
    let url = '';
    if (platform === 'whatsapp') {
      url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    } else if (platform === 'telegram') {
      url = `https://t.me/share/url?url=${encodeURIComponent('https://t.me/tetherstream_bot')}&text=${encodeURIComponent(shareText)}`;
    } else if (platform === 'x') {
      url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    } else if (platform === 'tiktok' || platform === 'instagram') {
      copyToClipboard();
      const isTiktok = platform === 'tiktok';
      openAppScheme(
        isTiktok ? ['snssdk1233://', 'tiktok://'] : ['instagram://'],
        isTiktok ? 'https://www.tiktok.com/' : 'https://www.instagram.com/',
      );
      showToast(`Message copied! Open ${isTiktok ? 'TikTok' : 'Instagram'} app to share.`, 'info');
      return;
    }
    if (url) window.open(url, '_blank');
  };

  const openAppScheme = (schemes: string[], webFallback: string) => {
    const started = Date.now();
    let launched = false;
    for (const scheme of schemes) {
      try {
        window.open(scheme, '_blank');
        launched = true;
      } catch {}
    }
    setTimeout(() => {
      if (launched && Date.now() - started > 1500) return;
      window.open(webFallback, '_blank');
    }, 1500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="web3-card max-w-sm w-full rounded-3xl p-5 border border-white/10 flex flex-col gap-4 relative overflow-hidden bg-app-bg select-none"
        >
          <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <h3 className="text-sm font-black text-text-primary uppercase tracking-wide">Flex Progress & Achievements</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-full bg-white/5 border border-white/10 text-text-tertiary hover:text-text-primary"
            >
              <X size={16} />
            </button>
          </div>

          {/* PREVIEW CARD TO FLEX */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0c141d] via-card-bg to-control-bg border border-usdt-green/30 space-y-3 shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-usdt-green font-mono">Titan Verified</span>
                <h4 className="text-sm font-black text-text-primary mt-0.5">@{username}</h4>
              </div>
              <div className="px-2 py-0.5 rounded-full bg-usdt-green/20 border border-usdt-green/30 text-usdt-green font-mono text-[9px] font-extrabold uppercase">
                ACTIVE
              </div>
            </div>

            <div className="pt-2 border-t border-white/5">
              <span className="text-[10px] text-text-tertiary font-bold uppercase block">Current Tier Rank</span>
              <div className="text-lg font-black text-text-primary flex items-center gap-1.5">
                <Trophy size={18} className="text-amber-400" />
                <span>{userRank}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[9px] text-text-tertiary font-bold uppercase block">Active Power</span>
                <span className="font-mono font-extrabold text-usdt-green flex items-center gap-1 mt-0.5">
                  <Zap size={12} /> {(totalPowerGhs * 10).toFixed(0)} Power
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[9px] text-text-tertiary font-bold uppercase block">Active Machines</span>
                <span className="font-mono font-extrabold text-text-primary flex items-center gap-1 mt-0.5">
                  <Cpu size={12} className="text-sky-400" /> {activeMachines} Machines
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-usdt-green/15 border border-usdt-green/30 flex items-center justify-between">
              <span className="text-[10px] font-bold text-text-tertiary uppercase">Lifetime Earned</span>
              <span className="text-sm font-black text-usdt-green font-mono">${lifetimeEarnings.toFixed(2)} USDT</span>
            </div>
          </div>

          {/* Social Selectors */}
          <div className="flex justify-around border-t border-white/10 pt-3">
            {[
              { id: 'tiktok', name: 'TikTok', color: 'bg-black text-white border-white/20' },
              { id: 'whatsapp', name: 'WhatsApp', color: 'bg-emerald-600 text-white' },
              { id: 'telegram', name: 'Telegram', color: 'bg-sky-500 text-white' },
              { id: 'x', name: 'X / Twitter', color: 'bg-gray-800 text-white' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => openSocialShare(p.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-transform active:scale-95 ${p.color}`}
              >
                {p.name}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={copyToClipboard}
              className="flex-1 py-3 rounded-2xl bg-control-bg border border-white/10 hover:border-white/20 text-xs font-bold text-text-primary flex items-center justify-center gap-1.5"
            >
              {copied ? <Check size={16} className="text-usdt-green" /> : <Copy size={16} />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
            <button
              onClick={() => openSocialShare('whatsapp')}
              className="flex-1 py-3 rounded-2xl bg-usdt-green text-app-bg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-usdt-green/20"
            >
              <Share2 size={16} />
              <span>Share Now</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
