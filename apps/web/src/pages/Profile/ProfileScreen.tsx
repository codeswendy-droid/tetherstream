import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Award,
  User,
  Settings,
  Lock,
  Unlock,
  Bell,
  Link,
  HelpCircle,
  LogOut,
  ChevronRight,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import { useGrowthStore } from '../../store/useGrowthStore';
import { useTreasuryStore } from '../../store/useTreasuryStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useTelegram } from '../../context/TelegramContext';
import { showToast } from '../../components/Toast';

export const ProfileScreen: React.FC = () => {
  const { profile, isLoading, fetchGrowthProfile } = useGrowthStore();
  const { trustScore } = useTreasuryStore();
  const { session, clearSession } = useAuthStore();
  const { hapticFeedback } = useTelegram();
  const [activeTab, setActiveTab] = useState<'trust' | 'settings' | 'support'>('trust');

  useEffect(() => {
    fetchGrowthProfile();
  }, [fetchGrowthProfile]);

  const handleLogout = () => {
    hapticFeedback.impactOccurred('medium');
    clearSession();
    localStorage.removeItem('auth_token');
    showToast('Logged out successfully', 'success');
    window.location.reload();
  };

  const getLevelColor = (level?: string) => {
    switch (level) {
      case 'ELITE':
        return 'from-amber-400 to-yellow-500 text-amber-950 border-amber-300';
      case 'PREMIUM':
        return 'from-purple-500 to-indigo-600 text-white border-purple-400';
      case 'TRUSTED':
        return 'from-usdt-green to-emerald-600 text-app-bg border-usdt-green';
      case 'VERIFIED':
        return 'from-sky-500 to-blue-600 text-white border-sky-400';
      default:
        return 'from-gray-600 to-gray-700 text-gray-200 border-gray-500';
    }
  };

  return (
    <div className="p-4 flex flex-col gap-5 select-none relative pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-text-primary tracking-tight">Profile</h1>
          <p className="text-xs text-text-tertiary">Manage your identity and settings</p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-usdt-green/15 border border-usdt-green/30 text-usdt-green flex items-center justify-center font-bold">
          <User size={22} />
        </div>
      </div>

      {/* Main Tabs */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-control-bg rounded-2xl border border-white/10 text-xs font-bold">
        {[
          { key: 'trust', label: 'Trust', icon: ShieldCheck },
          { key: 'settings', label: 'Settings', icon: Settings },
          { key: 'support', label: 'Support', icon: HelpCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                hapticFeedback.selectionChanged();
                setActiveTab(tab.key as any);
              }}
              className={`press-feedback py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                isActive
                  ? 'bg-usdt-green text-app-bg font-extrabold shadow-md'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: TRUST CENTER */}
      {activeTab === 'trust' && (
        <div className="space-y-4">
          {/* Safety Rating Hero Card */}
          <div className="glass-panel p-5 rounded-3xl border border-white/10 relative overflow-hidden space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-usdt-green" />
                <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-text-tertiary">
                  Security Profile
                </span>
              </div>

              {/* Level Pill */}
              <span
                className={`px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r ${getLevelColor(
                  profile?.level,
                )} shadow-md border`}
              >
                {profile?.levelName || profile?.level || 'NEW'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <div className="text-4xl font-black font-mono text-text-primary tracking-tight">
                  {trustScore}%
                </div>
                <div className="text-xs font-semibold text-usdt-green mt-0.5 flex items-center gap-1">
                  <TrendingUp size={13} />
                  <span>Verified Safety Rating</span>
                </div>
              </div>

              {/* Visual Radial Ring */}
              <div className="w-16 h-16 rounded-full border-4 border-usdt-green/30 border-t-usdt-green flex items-center justify-center font-mono font-bold text-xs text-usdt-green bg-usdt-green/10">
                {trustScore} / 100
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10 text-center text-xs">
              <div className="p-2 rounded-xl bg-white/5">
                <div className="text-text-tertiary text-[10px] uppercase font-bold">Payments</div>
                <div className="font-mono font-extrabold text-text-primary text-sm mt-0.5">
                  {profile?.completedSettlements || 0}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-white/5">
                <div className="text-text-tertiary text-[10px] uppercase font-bold">Account Age</div>
                <div className="font-mono font-extrabold text-text-primary text-sm mt-0.5">
                  {profile?.accountAgeDays || 1}d
                </div>
              </div>
              <div className="p-2 rounded-xl bg-white/5">
                <div className="text-text-tertiary text-[10px] uppercase font-bold">Total Money</div>
                <div className="font-mono font-extrabold text-usdt-green text-sm mt-0.5">
                  ${(profile?.totalVolumeUSDT || 0).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Level Benefits unlocked */}
          <div className="glass-panel p-4 rounded-3xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-text-tertiary uppercase tracking-wider">
                Unlocked Perks ({profile?.levelName})
              </h3>
              <Award size={16} className="text-amber-400" />
            </div>

            <div className="space-y-2">
              {(profile?.benefits || []).map((benefit, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-usdt-green/10 border border-usdt-green/20 flex items-center gap-3 text-xs text-text-primary font-semibold"
                >
                  <CheckCircle size={16} className="text-usdt-green shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress to Next Tier */}
          {profile?.nextLevel && (
            <div className="glass-panel p-4 rounded-3xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-text-primary">Next Level Progress:</span>
                <span className="font-extrabold text-amber-400 font-mono">{profile.nextLevel.name}</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-text-tertiary">
                  <span>Safety Rating Needed:</span>
                  <span className="font-mono text-text-primary">{trustScore} / {profile.nextLevel.minTrustScore}</span>
                </div>
                <div className="w-full bg-control-bg h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-usdt-green h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        (trustScore / (profile.nextLevel.minTrustScore || 100)) * 100,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-3">
          <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
            {/* Notifications */}
            <button className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-usdt-green/10 border border-usdt-green/20 text-usdt-green flex items-center justify-center">
                  <Bell size={18} />
                </div>
                <div className="text-left">
                  <div className="text-xs font-extrabold text-text-primary">Notifications</div>
                  <div className="text-[10px] text-text-tertiary">Manage alerts and updates</div>
                </div>
              </div>
              <ChevronRight size={16} className="text-text-tertiary" />
            </button>

            {/* Connected Accounts */}
            <button className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors border-t border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-ton-blue/10 border border-ton-blue/20 text-ton-blue flex items-center justify-center">
                  <Link size={18} />
                </div>
                <div className="text-left">
                  <div className="text-xs font-extrabold text-text-primary">Connected Accounts</div>
                  <div className="text-[10px] text-text-tertiary">Linked services and wallets</div>
                </div>
              </div>
              <ChevronRight size={16} className="text-text-tertiary" />
            </button>

            {/* Security */}
            <button className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors border-t border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gold/10 border border-gold/20 text-gold flex items-center justify-center">
                  <Lock size={18} />
                </div>
                <div className="text-left">
                  <div className="text-xs font-extrabold text-text-primary">Security</div>
                  <div className="text-[10px] text-text-tertiary">Password and 2FA settings</div>
                </div>
              </div>
              <ChevronRight size={16} className="text-text-tertiary" />
            </button>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full p-4 glass-panel rounded-2xl border border-red-500/20 flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={18} />
            <span className="text-xs font-extrabold">Log Out</span>
          </button>
        </div>
      )}

      {/* TAB 3: SUPPORT */}
      {activeTab === 'support' && (
        <div className="space-y-3">
          <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
            {/* Help Center */}
            <button className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-usdt-green/10 border border-usdt-green/20 text-usdt-green flex items-center justify-center">
                  <HelpCircle size={18} />
                </div>
                <div className="text-left">
                  <div className="text-xs font-extrabold text-text-primary">Help Center</div>
                  <div className="text-[10px] text-text-tertiary">FAQs and guides</div>
                </div>
              </div>
              <ChevronRight size={16} className="text-text-tertiary" />
            </button>

            {/* Contact Support */}
            <button className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors border-t border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-ton-blue/10 border border-ton-blue/20 text-ton-blue flex items-center justify-center">
                  <User size={18} />
                </div>
                <div className="text-left">
                  <div className="text-xs font-extrabold text-text-primary">Contact Support</div>
                  <div className="text-[10px] text-text-tertiary">Get help from our team</div>
                </div>
              </div>
              <ChevronRight size={16} className="text-text-tertiary" />
            </button>
          </div>

          {/* User Info Card */}
          <div className="glass-panel p-4 rounded-2xl border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-usdt-green to-emerald-600 flex items-center justify-center text-white font-bold text-lg">
                {session?.user?.firstName?.[0] || 'U'}
              </div>
              <div>
                <div className="text-sm font-extrabold text-text-primary">
                  {session?.user?.firstName} {session?.user?.lastName}
                </div>
                <div className="text-[10px] text-text-tertiary font-mono">
                  ID: {session?.user?.telegramUserId || 'Unknown'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
