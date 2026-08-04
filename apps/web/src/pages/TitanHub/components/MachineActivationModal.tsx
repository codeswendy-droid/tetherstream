import type React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, ShieldCheck, Zap, Sparkles, Check, ArrowRight, Play } from 'lucide-react';
import { useMachineOwnershipStore } from '../../../store/useMachineOwnershipStore';
import { MACHINE_CATALOG } from '../../../data/machines';

export const MachineActivationModal: React.FC = () => {
  const { activeCeremonyTier, closeActivationCeremony, completeActivation } = useMachineOwnershipStore();

  const [stepIndex, setStepIndex] = useState(0);
  const [isDone, setIsDone] = useState(false);

  if (!activeCeremonyTier) return null;

  const catalogItem = MACHINE_CATALOG.find((m) => m.tierCode.toUpperCase() === activeCeremonyTier.toUpperCase()) || MACHINE_CATALOG[0];

  // Specific ceremony sequence definitions per machine tier
  const getCeremonySteps = () => {
    switch (activeCeremonyTier.toUpperCase()) {
      case 'TS_TRIAL':
        return [
          { title: 'Receiving Titan Core', subtitle: 'Provisioning initial baseline hash rate node...' },
          { title: 'Connecting Core Motors', subtitle: 'Calibrating standard queue throughput...' },
          { title: 'Ready to Launch', subtitle: 'Press Start to bring your first Titan online.' },
        ];
      case 'TS_C10':
        return [
          { title: 'Uncrating Ripple X14', subtitle: 'Inspecting intake cooling manifolds...' },
          { title: 'Aligning Hash Processors', subtitle: 'Calibrating Starter Queue Class 1 compute...' },
          { title: 'System Handshake Complete', subtitle: 'Ready for official commissioning.' },
        ];
      case 'TS_A50':
        return [
          { title: 'Transport Arrival', subtitle: 'Unboxing heavy crate and positioning Surge R28...' },
          { title: 'Dual Turbines Engaging', subtitle: 'Cooling systems powering up to 250W capacity...' },
          { title: 'Rotor Speed Calibrated', subtitle: 'Surge R28 ready for full hash generation.' },
        ];
      case 'TS_P250':
        return [
          { title: 'Industrial Deployment', subtitle: 'Securing Torrent V63 onto marine-grade chassis...' },
          { title: 'Water Cooling Primed', subtitle: 'Hydraulic impellers pressurized for peak yield...' },
          { title: 'High-Volume Ledger Sync', subtitle: 'Commissioning sequence complete. Launch machine!' },
        ];
      case 'TS_X1000':
        return [
          { title: 'Heavy Fleet Transport Arrival', subtitle: 'Hydraulic lock-in engaged for Cascade M91...' },
          { title: 'Magnetic Levitation Calibrated', subtitle: 'Gyroscopic bearings stabilized at 550 GH/s...' },
          { title: 'Owner Verification Seal', subtitle: 'Cascade M91 ready for operational command.' },
        ];
      case 'TS_Q2500':
        return [
          { title: 'FLAGSHIP SHIPMENT DELIVERED', subtitle: 'Unsealing quantum containment crate for StreamTitan 2028...' },
          { title: 'Quantum Core Ignition', subtitle: 'Energizing multi-axis array up to 1,500 GH/s...' },
          { title: 'Biometric Seal & Ownership Certificate', subtitle: 'StreamTitan 2028 online. Entrusted to your command.' },
        ];
      default:
        return [
          { title: 'Machine Delivered', subtitle: 'Preparing hardware node...' },
          { title: 'Synchronizing Core', subtitle: 'Establishing ledger connection...' },
          { title: 'Ready for Activation', subtitle: 'Commissioning complete.' },
        ];
    }
  };

  const steps = getCeremonySteps();

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((prev) => prev + 1);
    } else {
      setIsDone(true);
      completeActivation(activeCeremonyTier);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="web3-card max-w-[440px] w-full rounded-3xl p-6 border border-usdt-green/40 flex flex-col items-center text-center relative overflow-hidden shadow-2xl bg-[#090c12]"
        >
          {/* Animated Background Pulse */}
          <div className="absolute inset-0 bg-gradient-to-b from-usdt-green/10 via-transparent to-usdt-green/5 pointer-events-none" />
          <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-usdt-green to-transparent animate-pulse" />

          {/* Machine Icon Badge */}
          <motion.div
            key={stepIndex}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-usdt-green/20 to-emerald-600/30 border border-usdt-green/40 flex items-center justify-center text-usdt-green shadow-xl shadow-usdt-green/20 mb-4"
          >
            <Cpu size={42} className="animate-pulse" />
          </motion.div>

          <span className="text-[10px] font-black uppercase tracking-widest text-usdt-green font-mono mb-1">
            Commissioning Ceremony • Step {stepIndex + 1} of {steps.length}
          </span>

          <h2 className="text-xl font-black text-text-primary tracking-tight mb-1">
            {catalogItem.name}
          </h2>
          <p className="text-xs text-text-secondary font-mono mb-4">
            {catalogItem.tierLabel} • {catalogItem.capacityGhs} GH/s Power Rating
          </p>

          {/* Current Step Description Card */}
          <motion.div
            key={`desc-${stepIndex}`}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 mb-6 text-left"
          >
            <h3 className="text-sm font-black text-text-primary mb-1 flex items-center gap-2">
              <Zap size={16} className="text-usdt-green" />
              {steps[stepIndex].title}
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              {steps[stepIndex].subtitle}
            </p>
          </motion.div>

          {/* Step Indicators */}
          <div className="flex gap-1.5 justify-center mb-6">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i <= stepIndex ? 'w-6 bg-usdt-green' : 'w-2 bg-white/20'
                }`}
              />
            ))}
          </div>

          {/* Action Trigger Button */}
          <button
            onClick={handleNext}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-usdt-green to-emerald-500 text-app-bg font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-usdt-green/25 press-feedback"
          >
            {stepIndex < steps.length - 1 ? (
              <>
                <span>Continue Sequence</span>
                <ArrowRight size={16} />
              </>
            ) : (
              <>
                <Play size={16} />
                <span>COMMISSION & START TITAN</span>
              </>
            )}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
