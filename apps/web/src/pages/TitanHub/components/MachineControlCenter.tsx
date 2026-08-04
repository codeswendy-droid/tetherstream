import type React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCw, Edit3, BookOpen, Award, Activity, Check, X, ShieldCheck } from 'lucide-react';
import { useMachineOwnershipStore } from '../../../store/useMachineOwnershipStore';
import { MACHINE_CATALOG } from '../../../data/machines';

interface MachineControlCenterProps {
  activeTierCode: string;
  onOpenShop?: () => void;
}

export const MachineControlCenter: React.FC<MachineControlCenterProps> = ({ activeTierCode }) => {
  const {
    getRecordByTier,
    setMachineStatus,
    setMachineNickname,
    openOwnersManual,
    openCertificate,
    addTimelineEvent,
  } = useMachineOwnershipStore();

  const record = getRecordByTier(activeTierCode);
  const catalogItem = MACHINE_CATALOG.find((m) => m.tierCode.toUpperCase() === activeTierCode.toUpperCase()) || MACHINE_CATALOG[0];

  const [isEditingName, setIsEditingName] = useState(false);
  const [nicknameInput, setNicknameInput] = useState(record?.nickname || catalogItem.name);
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<string | null>(null);

  if (!record) return null;

  const handleToggleState = (targetStatus: 'RUNNING' | 'PAUSED') => {
    setMachineStatus(activeTierCode, targetStatus);
  };

  const handleRestart = () => {
    handleToggleState('PAUSED');
    setTimeout(() => {
      handleToggleState('RUNNING');
      addTimelineEvent(activeTierCode, 'Restarted', 'Machine restarted successfully.');
    }, 800);
  };

  const handleSaveName = () => {
    if (nicknameInput.trim()) {
      setMachineNickname(activeTierCode, nicknameInput.trim());
    }
    setIsEditingName(false);
  };

  const handleRunDiagnostics = () => {
    setIsDiagnosticRunning(true);
    setDiagnosticResult(null);
    setTimeout(() => {
      setIsDiagnosticRunning(false);
      setDiagnosticResult('All good! Your machine is healthy.');
    }, 1200);
  };

  const isRunning = record.status === 'RUNNING';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="web3-card rounded-2xl p-4 border border-white/10 relative overflow-hidden"
    >
      {/* Subtle mood backlight based on running state */}
      <div
        className={`absolute top-0 right-0 w-36 h-36 rounded-full blur-3xl opacity-15 pointer-events-none ${
          isRunning ? 'bg-usdt-green' : 'bg-amber-500'
        }`}
      />

      <div className="relative flex items-center justify-between mb-3 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            {isEditingName ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={nicknameInput}
                  onChange={(e) => setNicknameInput(e.target.value)}
                  className="bg-black/40 border border-usdt-green/50 text-text-primary font-black text-sm px-2 py-0.5 rounded-md focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="p-1 text-usdt-green hover:bg-usdt-green/10 rounded-md"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => setIsEditingName(false)}
                  className="p-1 text-text-tertiary hover:bg-white/10 rounded-md"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-sm font-black text-text-primary tracking-wide flex items-center gap-1.5">
                  {record.nickname}
                </h3>
                <button
                  onClick={() => {
                    setNicknameInput(record.nickname);
                    setIsEditingName(true);
                  }}
                  className="text-text-tertiary hover:text-usdt-green p-0.5 rounded transition-colors"
                  title="Rename machine"
                >
                  <Edit3 size={13} />
                </button>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-mono text-text-tertiary">{record.serialNumber}</span>
            <span className="text-[9px] font-bold text-ton-blue bg-ton-blue/10 px-1.5 py-0.2 rounded border border-ton-blue/20">
              {catalogItem.tierLabel}
            </span>
          </div>
        </div>

        {/* State Pill */}
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-usdt-green animate-pulse' : 'bg-amber-400'}`} />
          <span className={`text-[10px] font-black uppercase font-mono px-2 py-0.5 rounded-md border ${
            isRunning
              ? 'text-usdt-green bg-usdt-green/10 border-usdt-green/20'
              : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
          }`}>
            {record.status}
          </span>
        </div>
      </div>

      {/* Primary Operational Controls */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {isRunning ? (
          <button
            onClick={() => handleToggleState('PAUSED')}
            className="py-2 px-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 font-extrabold text-xs flex items-center justify-center gap-1.5 hover:bg-amber-500/25 transition-colors press-feedback"
          >
            <Pause size={14} />
            Pause
          </button>
        ) : (
          <button
            onClick={() => handleToggleState('RUNNING')}
            className="py-2 px-3 rounded-xl bg-usdt-green/15 border border-usdt-green/30 text-usdt-green font-extrabold text-xs flex items-center justify-center gap-1.5 hover:bg-usdt-green/25 transition-colors press-feedback"
          >
            <Play size={14} />
            Start
          </button>
        )}

        <button
          onClick={handleRestart}
          className="py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-text-secondary font-extrabold text-xs flex items-center justify-center gap-1.5 hover:border-white/20 transition-colors press-feedback"
        >
          <RotateCw size={14} />
          Restart
        </button>

        <button
          onClick={handleRunDiagnostics}
          disabled={isDiagnosticRunning}
          className="py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-text-secondary font-extrabold text-xs flex items-center justify-center gap-1.5 hover:border-white/20 transition-colors press-feedback"
        >
          <Activity size={14} className={isDiagnosticRunning ? 'animate-spin text-ton-blue' : ''} />
          Health
        </button>
      </div>

      {/* Diagnostics Alert Banner */}
      {diagnosticResult && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-3 p-2 bg-usdt-green/10 border border-usdt-green/30 rounded-xl text-[10px] font-mono text-usdt-green flex items-center gap-2"
        >
          <ShieldCheck size={14} className="shrink-0" />
          <span>{diagnosticResult}</span>
        </motion.div>
      )}

      {/* Documentation & Ownership Artifact Actions */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
        <button
          onClick={() => openOwnersManual(activeTierCode)}
          className="py-2 px-3 rounded-xl bg-ton-blue/10 border border-ton-blue/20 text-ton-blue font-extrabold text-xs flex items-center justify-center gap-1.5 hover:bg-ton-blue/20 transition-colors press-feedback"
        >
          <BookOpen size={14} />
          Owner's Manual
        </button>
        <button
          onClick={() => openCertificate(record.machineId)}
          className="py-2 px-3 rounded-xl bg-gold/10 border border-gold/20 text-gold font-extrabold text-xs flex items-center justify-center gap-1.5 hover:bg-gold/20 transition-colors press-feedback"
        >
          <Award size={14} />
          Certificate
        </button>
      </div>
    </motion.div>
  );
};
