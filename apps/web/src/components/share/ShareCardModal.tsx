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
      showToast(`Message copied! Paste in your ${platform} story or caption.`, 'info');
      return;
    }
    if (url) window.open(url, '_blank');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-sm bg-gradient-to-b from-card-bg via-app-bg to-control-bg border border-usdt-green/40 rounded-3xl p-6 shadow-2xl space-y-5 text-text-primary"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="text-usdt-green" size={20} />
              <h3 className="text-sm font-black uppercase tracking-wider">Share Proof of Progress</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10"
            >
              <X size={16} />
            </button>
          </div>

          {/* Branded Share Card Preview */}
          <div className="relative overflow-hidden rounded-2xl p-5 border border-usdt-green/40 bg-gradient-to-br from-usdt-green/20 via-black to-control-bg shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-usdt-green animate-ping" />
                <span className="text-[10px] font-black uppercase tracking-widest text-usdt-green">TITAN STREAM ECONOMY</span>
              </div>
              <span className="text-[9px] font-mono text-text-tertiary">Verified On-Chain</span>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-text-tertiary font-bold uppercase">{username}'s Node</div>
              <div className="text-lg font-black text-text-primary flex items-center gap-1.5">
                <Trophy size={18} className="text-amber-400" />
                <span>{userRank}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[9px] text-text-tertiary font-bold uppercase block">Active Power</span>
                <span className="font-mono font-extrabold text-usdt-green flex items-center gap-1 mt-0.5">
                  <Zap size={12} /> {totalPowerGhs} GH/s
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[9px] text-text-tertiary font-bold uppercase block">Active Machines</span>
                <span className="font-mono font-extrabold text-text-primary flex items-center gap-1 mt-0.5">
                  <Cpu size={12} className="text-sky-400" /> {activeMachines} Nodes
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
