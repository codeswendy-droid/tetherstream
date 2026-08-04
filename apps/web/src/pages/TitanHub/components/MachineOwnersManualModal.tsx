import type React from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Cpu, Shield, Wrench, Clock, Zap, CheckCircle2 } from 'lucide-react';
import { useMachineOwnershipStore } from '../../../store/useMachineOwnershipStore';
import { MACHINE_CATALOG, getMachineYieldDetails } from '../../../data/machines';

export const MachineOwnersManualModal: React.FC = () => {
  const { activeManualTier, closeOwnersManual, getRecordByTier } = useMachineOwnershipStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'operating' | 'diagnostics' | 'history'>('overview');

  if (!activeManualTier) return null;

  const catalogItem = MACHINE_CATALOG.find((m) => m.tierCode.toUpperCase() === activeManualTier.toUpperCase()) || MACHINE_CATALOG[0];
  const record = getRecordByTier(activeManualTier);
  const yieldDetails = getMachineYieldDetails(catalogItem);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="web3-card max-w-[500px] w-full max-h-[85vh] rounded-3xl p-5 border border-usdt-green/30 flex flex-col relative overflow-hidden shadow-2xl bg-[#0b0e14]"
        >
          {/* Header Glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-usdt-green/10 rounded-full blur-3xl pointer-events-none" />

          {/* Modal Title & Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-usdt-green/15 border border-usdt-green/30 flex items-center justify-center text-usdt-green">
                <BookOpen size={20} />
              </div>
              <div>
                <div className="text-[10px] font-extrabold text-usdt-green uppercase tracking-widest font-mono">
                  Official Digital Manual
                </div>
                <h2 className="text-base font-black text-text-primary leading-tight">
                  {catalogItem.name}
                </h2>
              </div>
            </div>

            <button
              onClick={closeOwnersManual}
              className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-text-tertiary hover:text-text-primary transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Tab Selection Navigation */}
          <div className="flex gap-1 p-1 my-3 bg-control-bg/60 rounded-xl border border-white/5 shrink-0 overflow-x-auto no-scrollbar">
            {(
              [
                { id: 'overview', label: 'Overview' },
                { id: 'specs', label: 'Specs' },
                { id: 'operating', label: 'Guide' },
                { id: 'diagnostics', label: 'Diag' },
                { id: 'history', label: 'History' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-extrabold uppercase transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-usdt-green text-app-bg shadow-md'
                    : 'text-text-tertiary hover:text-text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-1 text-xs">
            {activeTab === 'overview' && (
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <h3 className="text-[11px] font-extrabold text-usdt-green uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Cpu size={14} />
                    Hardware Class & Philosophy
                  </h3>
                  <p className="text-text-secondary leading-relaxed text-[11px]">
                    {catalogItem.description}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <h3 className="text-[11px] font-extrabold text-gold uppercase tracking-wider flex items-center gap-1.5">
                    <Zap size={14} />
                    Target User & Role
                  </h3>
                  <p className="text-text-secondary leading-relaxed text-[11px]">
                    {catalogItem.targetUser}
                  </p>
                  <p className="text-text-tertiary text-[10px] italic">
                    "{catalogItem.technicalSummary}"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-control-bg border border-white/5">
                    <div className="text-[9px] font-bold text-text-tertiary uppercase">Serial Number</div>
                    <div className="font-mono text-xs font-black text-text-primary mt-0.5">
                      {record?.serialNumber || 'SN-TT-0001'}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-control-bg border border-white/5">
                    <div className="text-[9px] font-bold text-text-tertiary uppercase">Status</div>
                    <div className="font-mono text-xs font-black text-usdt-green mt-0.5 uppercase">
                      {record?.status || 'RUNNING'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <div className="text-[9px] font-bold text-text-tertiary uppercase">Compute Capacity</div>
                    <div className="text-sm font-black text-usdt-green font-mono mt-1">
                      {catalogItem.capacityGhs} GH/s
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <div className="text-[9px] font-bold text-text-tertiary uppercase">Power Rating</div>
                    <div className="text-sm font-black text-text-primary font-mono mt-1">
                      {catalogItem.powerRatingW} W
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <div className="text-[9px] font-bold text-text-tertiary uppercase">Daily Yield</div>
                    <div className="text-sm font-black text-usdt-green font-mono mt-1">
                      {yieldDetails.daily.usdt}
                    </div>
                    <div className="text-[9px] text-text-tertiary mt-0.5">{yieldDetails.daily.local}</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <div className="text-[9px] font-bold text-text-tertiary uppercase">Workload Class</div>
                    <div className="text-xs font-black text-text-primary mt-1">
                      {catalogItem.workloadClass}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                  <div className="text-[10px] font-extrabold text-text-tertiary uppercase tracking-wider">
                    Technical Specifications Matrix
                  </div>
                  <div className="flex justify-between text-[11px] py-1 border-b border-white/5">
                    <span className="text-text-tertiary">Processing Priority</span>
                    <span className="font-mono font-bold text-text-primary">{catalogItem.processingPriority}</span>
                  </div>
                  <div className="flex justify-between text-[11px] py-1 border-b border-white/5">
                    <span className="text-text-tertiary">Fabric Index</span>
                    <span className="font-mono font-bold text-text-primary">{catalogItem.processingIndex}</span>
                  </div>
                  <div className="flex justify-between text-[11px] py-1">
                    <span className="text-text-tertiary">Throughput</span>
                    <span className="font-mono font-bold text-text-primary">{catalogItem.fabricThroughput}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'operating' && (
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <h3 className="text-[11px] font-extrabold text-usdt-green uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 size={14} />
                    Optimal Operating Guidelines
                  </h3>
                  <ul className="space-y-1.5 text-[11px] text-text-secondary list-disc list-inside">
                    <li>Maintain cooler slider setting to prevent internal thermal throttling above 70°C.</li>
                    <li>Synchronize session daily to maintain continuous hash accumulation into the ledger.</li>
                    <li>Ensure regular claim cycles to prevent yield queue stagnation.</li>
                  </ul>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <h3 className="text-[11px] font-extrabold text-ton-blue uppercase tracking-wider flex items-center gap-1.5">
                    <Shield size={14} />
                    Thermal & Power Envelope
                  </h3>
                  <p className="text-[11px] text-text-secondary">
                    Equipped with dynamic intake multipliers. High-performance modes scale up to maximum multiplier without hardware degradation.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'diagnostics' && (
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <h3 className="text-[11px] font-extrabold text-usdt-green uppercase tracking-wider flex items-center gap-1.5">
                    <Wrench size={14} />
                    Self-Diagnostic Checklist
                  </h3>
                  <div className="space-y-1.5 text-[10px] font-mono">
                    <div className="flex justify-between p-2 rounded-lg bg-control-bg border border-white/5">
                      <span>HASH ENGINE INTEGRITY</span>
                      <span className="text-usdt-green font-bold">PASS (100%)</span>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg bg-control-bg border border-white/5">
                      <span>THERMAL SENSOR ARRAY</span>
                      <span className="text-usdt-green font-bold">NOMINAL</span>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg bg-control-bg border border-white/5">
                      <span>LEDGER CONNECTION</span>
                      <span className="text-usdt-green font-bold">SYNCHRONIZED</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-2">
                <h3 className="text-[11px] font-extrabold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Clock size={14} />
                  Machine Memory Timeline
                </h3>
                {record?.memoryTimeline.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-0.5"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-extrabold text-usdt-green">{item.event}</span>
                      <span className="text-text-tertiary font-mono">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[10px] text-text-secondary">{item.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="mt-4 pt-3 border-t border-white/10 flex justify-end shrink-0">
            <button
              onClick={closeOwnersManual}
              className="py-2 px-4 rounded-xl bg-usdt-green text-app-bg font-extrabold text-xs shadow-lg shadow-usdt-green/20 press-feedback"
            >
              Close Manual
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
