import type React from 'react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Award,
  User,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Cpu,
  CheckCircle,
  Sparkles,
  BookOpen,
  Lock,
  Globe,
  Bell,
  Activity,
  FileCheck
} from 'lucide-react';
import { useGrowthStore } from '../../store/useGrowthStore';
import { useTreasuryStore } from '../../store/useTreasuryStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useMachineOwnershipStore } from '../../store/useMachineOwnershipStore';
import { useNavigationStore } from '../../store/useNavigationStore';
import { useTelegram } from '../../context/TelegramContext';
import { FlipPassportCard } from '../../components/FlipPassportCard';
import { DestinationLoader } from '../../components/DestinationLoader';
import { showToast } from '../../components/Toast';

export const ProfileScreen: React.FC = () => {
  const { profile, isLoading, fetchGrowthProfile } = useGrowthStore();
  const { trustScore } = useTreasuryStore();
  const { session, clearSession, user: authUser } = useAuthStore();
  const { ownerships, openCertificate, openOwnersManual } = useMachineOwnershipStore();
  const { setActiveTab } = useNavigationStore();
  const { hapticFeedback, user } = useTelegram();

  const [activeTab, setActiveTabState] = useState<'passport' | 'certificates' | 'settings'>('passport');

  useEffect(() => {
    fetchGrowthProfile();
  }, [fetchGrowthProfile]);

  if (isLoading && !profile) {
    return <DestinationLoader destination="profile" />;
  }

  const handleLogout = () => {
    hapticFeedback.impactOccurred('medium');
    clearSession();
    localStorage.removeItem('auth_token');
    showToast('Logged out successfully', 'success');
    window.location.reload();
  };

  const username = user?.first_name || authUser?.username || 'Titan Operator';
  const handle = user?.username ? `@${user.username}` : 'Operator ID #0482';
  const totalOwnedMachines = Object.keys(ownerships).length;

  return (
    <div className="p-4 flex flex-col gap-5 select-none relative pb-28 bg-[#090b10] min-h-full">
      {/* DESTINATION HEADER — Identity, Prestige & Legacy */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-gold font-mono">
            Identity Registry
          </span>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">Titan Passport</h1>
        </div>

        <div className="w-10 h-10 rounded-2xl bg-gold/15 border border-gold/30 text-gold flex items-center justify-center font-bold">
          <User size={22} />
        </div>
      </div>

      {/* HERO SECTION — 3D FLIP TITAN PASSPORT CARD (Profile WOW Moment) */}
      <FlipPassportCard
        username={username}
        handle={handle}
        trustScore={trustScore}
        totalMachines={totalOwnedMachines}
        level={profile?.level || 'VERIFIED'}
      />

      {/* CROSS-PAGE CONTINUITY BANNER (No Dead Ends) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setActiveTab('hub')}
        className="p-3.5 rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-between cursor-pointer hover:border-gold/50 transition-colors press-feedback"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gold/20 text-gold flex items-center justify-center shrink-0">
            <Activity size={16} />
          </div>
          <div>
            <div className="text-xs font-black text-text-primary">
              Fleet Runtime Milestone Reached
            </div>
            <div className="text-[10px] text-text-secondary">
              Your hardware fleet has surpassed 100 continuous runtime hours. Tap to inspect Titan Hub.
            </div>
          </div>
        </div>
        <ChevronRight size={16} className="text-gold" />
      </motion.div>

      {/* TAB NAVIGATION: Passport vs Certificates vs Settings */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-control-bg rounded-2xl border border-white/10 text-xs font-bold">
        {[
          { key: 'passport', label: 'Passport', icon: FileCheck },
          { key: 'certificates', label: 'Certificates', icon: Award },
          { key: 'settings', label: 'Settings', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                hapticFeedback.selectionChanged();
                setActiveTabState(tab.key as any);
              }}
              className={`press-feedback py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                isActive
                  ? 'bg-gold text-app-bg font-extrabold shadow-md'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: TITAN PASSPORT & FLEET ARCHIVE */}
      {activeTab === 'passport' && (
        <div className="space-y-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-text-tertiary flex items-center gap-2">
            <Cpu size={14} className="text-gold" />
            Active Fleet Credentials
          </h2>

          <div className="web3-card rounded-2xl divide-y divide-white/5 border border-white/10 overflow-hidden">
            {Object.values(ownerships).map((rec) => (
              <div key={rec.machineId} className="p-3.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gold/15 border border-gold/30 text-gold flex items-center justify-center">
                    <Award size={18} />
                  </div>
                  <div>
                    <div className="font-extrabold text-text-primary">{rec.nickname}</div>
                    <div className="text-[10px] text-text-tertiary font-mono">{rec.serialNumber}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openOwnersManual(rec.tierCode)}
                    className="py-1 px-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-text-secondary hover:text-text-primary"
                  >
                    Manual
                  </button>
                  <button
                    onClick={() => openCertificate(rec.machineId)}
                    className="py-1 px-2 rounded-lg bg-gold/15 border border-gold/30 text-[10px] font-bold text-gold hover:bg-gold/25"
                  >
                    Certificate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: OWNERSHIP CERTIFICATES VAULT */}
      {activeTab === 'certificates' && (
        <div className="space-y-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-text-tertiary flex items-center gap-2">
            <Award size={14} className="text-gold" />
            Verified Infrastructure Certificates
          </h2>

          <div className="grid grid-cols-1 gap-2.5">
            {Object.values(ownerships).map((rec) => (
              <div
                key={rec.certificateId}
                onClick={() => openCertificate(rec.machineId)}
                className="web3-card-gold rounded-2xl p-4 border border-gold/30 flex items-center justify-between cursor-pointer hover:border-gold/60 transition-colors press-feedback"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold/20 text-gold flex items-center justify-center">
                    <Award size={22} />
                  </div>
                  <div>
                    <div className="text-xs font-black text-text-primary">{rec.nickname} Certificate</div>
                    <div className="text-[10px] font-mono text-gold">{rec.certificateId}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[10px] font-extrabold text-gold uppercase bg-gold/10 px-2.5 py-1 rounded-full border border-gold/20">
                  <span>View</span>
                  <ChevronRight size={12} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: APP SETTINGS & SECURITY (At the bottom as per OX rule) */}
      {activeTab === 'settings' && (
        <div className="space-y-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-text-tertiary flex items-center gap-2">
            <Settings size={14} className="text-text-tertiary" />
            Account Settings & Preferences
          </h2>

          <div className="web3-card rounded-2xl divide-y divide-white/5 border border-white/10 overflow-hidden text-xs">
            <div className="p-3 flex items-center justify-between">
              <span className="font-extrabold text-text-primary">App Language</span>
              <span className="text-text-tertiary font-mono">English (US)</span>
            </div>
            <div className="p-3 flex items-center justify-between">
              <span className="font-extrabold text-text-primary">Local Currency Display</span>
              <span className="text-usdt-green font-mono">Auto-Detected</span>
            </div>
            <div className="p-3 flex items-center justify-between">
              <span className="font-extrabold text-text-primary">Notifications</span>
              <span className="text-usdt-green font-mono">Enabled</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors press-feedback"
          >
            <LogOut size={16} />
            <span>Sign Out of Account</span>
          </button>
        </div>
      )}
    </div>
  );
};
