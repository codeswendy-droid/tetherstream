import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';
import { MetricCard, MetricCardGrid } from '@/components/admin/MetricCard';
import { showToast } from '@/components/Toast';
import {
  Activity,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Cpu,
  Layers,
  Clock,
  Radio,
  Server,
  User,
  CreditCard,
  Key,
  List,
} from 'lucide-react';

export interface GlobalSwitchesState {
  maintenanceMode: boolean;
  readOnlyMode: boolean;
  disableRegistrations: boolean;
  disablePurchases: boolean;
  disableWithdrawals: boolean;
  disableClaims: boolean;
  disableSettlements: boolean;
  disabledAssets: string[];
  disabledMachineCategories: string[];
  version: number;
  lastUpdatedBy: string;
  lastUpdatedAt: string;
}

export interface SupportCaseItem {
  id: string;
  userId?: string;
  settlementId?: string;
  category: string;
  priority: string;
  status: string;
  notes?: string;
  createdAt: string;
}

export interface ProviderHealthItem {
  providerId: string;
  displayName: string;
  status: string;
  healthStatus: string;
  latencyMs: number;
  successRatePct: number;
  errorRatePct: number;
  queueDepth: number;
  checkedAt: string;
}

export const OperationsHqPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'MISSION_CONTROL' | 'RISK_WORKFLOW' | 'SUPPORT_360' | 'QUEUES' | 'PROVIDERS'>('MISSION_CONTROL');
  const [loading, setLoading] = useState(true);

  // Platform Overview State
  const [healthOverview, setHealthOverview] = useState<any>(null);
  const [switches, setSwitches] = useState<GlobalSwitchesState | null>(null);

  // Support Cases State
  const [supportCases, setSupportCases] = useState<SupportCaseItem[]>([]);
  const [selectedCase360, setSelectedCase360] = useState<any>(null);
  const [loading360, setLoading360] = useState(false);

  // Queue State
  const [queueItems, setQueueItems] = useState<any[]>([]);

  // Provider Health State
  const [providerHealth, setProviderHealth] = useState<ProviderHealthItem[]>([]);

  // Switch Toggle Modal State
  const [pendingToggleKey, setPendingToggleKey] = useState<string | null>(null);
  const [pendingToggleVal, setPendingToggleVal] = useState<boolean>(false);
  const [toggleReason, setToggleReason] = useState('');
  const [submittingToggle, setSubmittingToggle] = useState(false);

  // Fetch Health & Global Switches
  const fetchOverview = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get('/admin/operations-hq/health').catch(() => ({ data: null })),
      api.get('/admin/operations-hq/switches').catch(() => ({ data: null })),
    ])
      .then(([hRes, sRes]) => {
        if (hRes.data) setHealthOverview(hRes.data);
        if (sRes.data) setSwitches(sRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  // Fetch Support Cases
  const fetchSupportCases = useCallback(() => {
    api.get('/admin/support/cases')
      .then((res) => setSupportCases(res.data?.items || []))
      .catch(() => setSupportCases([]));
  }, []);

  // Fetch 360 Support View
  const handleLoad360Case = (caseId: string) => {
    setLoading360(true);
    api.get(`/admin/operations-hq/support/360/${caseId}`)
      .then((res) => setSelectedCase360(res.data))
      .catch((err) => showToast(err.response?.data?.message || 'Failed to load 360 case inspection', 'error'))
      .finally(() => setLoading360(false));
  };

  // Fetch Queues
  const fetchQueues = useCallback(() => {
    api.get('/admin/operations-hq/queues')
      .then((res) => setQueueItems(res.data || []))
      .catch(() => setQueueItems([]));
  }, []);

  // Fetch Provider Health
  const fetchProviders = useCallback(() => {
    api.get('/admin/operations-hq/providers/health')
      .then((res) => setProviderHealth(res.data || []))
      .catch(() => setProviderHealth([]));
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const handleTabChange = (tab: 'MISSION_CONTROL' | 'RISK_WORKFLOW' | 'SUPPORT_360' | 'QUEUES' | 'PROVIDERS') => {
    setActiveTab(tab);
    if (tab === 'MISSION_CONTROL') fetchOverview();
    if (tab === 'SUPPORT_360') fetchSupportCases();
    if (tab === 'QUEUES') fetchQueues();
    if (tab === 'PROVIDERS') fetchProviders();
  };

  // Trigger Global Switch Toggle Modal
  const initiateToggle = (key: string, currentVal: boolean) => {
    setPendingToggleKey(key);
    setPendingToggleVal(!currentVal);
    setToggleReason('');
  };

  // Confirm Switch Toggle
  const handleConfirmToggle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingToggleKey || !toggleReason.trim()) {
      showToast('A mandatory administrative reason is required to modify global operational switches', 'error');
      return;
    }

    setSubmittingToggle(true);
    api.post('/admin/operations-hq/switches', {
      [pendingToggleKey]: pendingToggleVal,
      reason: toggleReason.trim(),
    })
      .then((res) => {
        showToast(`Global operational switch '${pendingToggleKey}' updated to ${pendingToggleVal ? 'ON' : 'OFF'}.`, 'success');
        setSwitches(res.data);
        setPendingToggleKey(null);
        fetchOverview();
      })
      .catch((err) => showToast(err.response?.data?.message || 'Failed to update switch', 'error'))
      .finally(() => setSubmittingToggle(false));
  };

  // Queue Action
  const handleQueueAction = (queueItemId: string, action: 'RETRY' | 'DRAIN') => {
    const reason = prompt(`Enter reason to ${action} queue item ${queueItemId}:`);
    if (!reason || !reason.trim()) {
      showToast('A mandatory reason is required for queue management', 'error');
      return;
    }
    api.post('/admin/operations-hq/queues/manage', { queueItemId, action, reason: reason.trim() })
      .then(() => {
        showToast(`Queue item ${action} executed successfully.`, 'success');
        fetchQueues();
      })
      .catch((err) => showToast(err.response?.data?.message || 'Queue action failed', 'error'));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-card-bg border border-white/10 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-usdt-green bg-usdt-green/10 text-usdt-green">
            <Activity size={24} />
          </div>
          <div>
            <span className="text-xs text-text-tertiary font-bold uppercase tracking-wider">Platform Operations Command Center</span>
            <div className="flex items-center gap-2 mt-0.5">
              <h3 className="text-lg font-extrabold text-text-primary">Titan System Health & Control HQ</h3>
              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                healthOverview?.platformHealth?.status === 'HEALTHY' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-amber-500/30 text-amber-400 bg-amber-500/10'
              }`}>
                {healthOverview?.platformHealth?.status || 'HEALTHY'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={fetchOverview}
          disabled={loading}
          className="p-2.5 rounded-xl bg-control-bg border border-white/10 text-text-secondary hover:text-text-primary min-h-[40px]"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Metric Cards Grid */}
      <MetricCardGrid columns={4}>
        <MetricCard
          label="Open Queue Items"
          value={(healthOverview?.queuesSummary?.openQueueCount || 0).toString()}
          change={0}
          icon="Layers"
          variant="default"
        />
        <MetricCard
          label="Open Risk Flags"
          value={(healthOverview?.queuesSummary?.openRiskCount || 0).toString()}
          change={0}
          icon="AlertTriangle"
          variant="gold"
        />
        <MetricCard
          label="Support Cases Open"
          value={(healthOverview?.queuesSummary?.openSupportCount || 0).toString()}
          change={0}
          icon="HelpCircle"
          variant="default"
        />
        <MetricCard
          label="Global Maintenance"
          value={switches?.maintenanceMode ? 'ACTIVE' : 'OFF'}
          change={0}
          icon="Lock"
          variant={switches?.maintenanceMode ? 'red' : 'green'}
        />
      </MetricCardGrid>

      {/* Navigation Tabs */}
      <div className="flex border-b border-white/10 gap-6 text-xs font-bold">
        <button
          onClick={() => handleTabChange('MISSION_CONTROL')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'MISSION_CONTROL' ? 'border-usdt-green text-usdt-green' : 'border-transparent text-text-tertiary'}`}
        >
          <Activity size={14} /> Mission Control & Switches
        </button>
        <button
          onClick={() => handleTabChange('SUPPORT_360')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'SUPPORT_360' ? 'border-usdt-green text-usdt-green' : 'border-transparent text-text-tertiary'}`}
        >
          <HelpCircle size={14} /> 360-Degree Support Command
        </button>
        <button
          onClick={() => handleTabChange('QUEUES')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'QUEUES' ? 'border-usdt-green text-usdt-green' : 'border-transparent text-text-tertiary'}`}
        >
          <Layers size={14} /> Worker Queues
        </button>
        <button
          onClick={() => handleTabChange('PROVIDERS')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'PROVIDERS' ? 'border-usdt-green text-usdt-green' : 'border-transparent text-text-tertiary'}`}
        >
          <Radio size={14} /> Provider Health Observability
        </button>
      </div>

      {/* TAB 1: MISSION CONTROL & GLOBAL SWITCHES */}
      {activeTab === 'MISSION_CONTROL' && switches && (
        <div className="space-y-4">
          <div className="bg-card-bg border border-white/10 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-text-primary flex items-center gap-2">
                <Lock size={16} className="text-usdt-green" /> Global Platform Operational Controls (v{switches.version})
              </h4>
              <span className="text-[10px] font-mono text-text-tertiary">Last Updated By: {switches.lastUpdatedBy}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { key: 'maintenanceMode', label: 'Global Maintenance Mode', desc: 'Halts all user interactions with a maintenance banner.' },
                { key: 'readOnlyMode', label: 'Read-Only State', desc: 'Blocks all database mutations across the entire platform.' },
                { key: 'disableRegistrations', label: 'Disable Registrations', desc: 'Prevents new user accounts from being created.' },
                { key: 'disablePurchases', label: 'Disable Purchases', desc: 'Blocks machine and asset license purchases.' },
                { key: 'disableWithdrawals', label: 'Disable Withdrawals', desc: 'Freezes all payout processing.' },
                { key: 'disableClaims', label: 'Disable Claims', desc: 'Pauses yield claim disbursements.' },
                { key: 'disableSettlements', label: 'Disable Settlements', desc: 'Pauses merchant & provider settlement dispatches.' },
              ].map((sw) => {
                const isEnabled = (switches as any)[sw.key];
                return (
                  <div key={sw.key} className="p-4 rounded-xl bg-control-bg border border-white/10 space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-text-primary">{sw.label}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isEnabled ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                          {isEnabled ? 'ON (RESTRICTED)' : 'OFF (NORMAL)'}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-tertiary mt-1">{sw.desc}</p>
                    </div>

                    <button
                      onClick={() => initiateToggle(sw.key, isEnabled)}
                      className={`w-full py-2 rounded-xl text-xs font-bold uppercase tracking-wider ${
                        isEnabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {isEnabled ? 'Turn OFF' : 'Turn ON'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 360-DEGREE SUPPORT COMMAND CENTER */}
      {activeTab === 'SUPPORT_360' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Support Ticket List */}
          <div className="space-y-3 md:col-span-1">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-text-primary border-b border-white/10 pb-2">
              Support Cases Queue ({supportCases.length})
            </h4>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {supportCases.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleLoad360Case(c.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                    selectedCase360?.caseDetail?.id === c.id ? 'bg-usdt-green/10 border-usdt-green' : 'bg-card-bg border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs font-bold text-text-primary">#{c.id.substring(0, 8)}...</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400">
                      {c.priority}
                    </span>
                  </div>
                  <div className="text-xs text-text-secondary mt-1">
                    Category: {c.category} | User: {c.userId || 'N/A'}
                  </div>
                </div>
              ))}
              {supportCases.length === 0 && (
                <div className="p-6 text-center text-xs text-text-tertiary bg-card-bg rounded-xl border border-white/5">
                  No support cases found.
                </div>
              )}
            </div>
          </div>

          {/* Embedded 360-Degree Workspace */}
          <div className="md:col-span-2 space-y-4">
            {loading360 ? (
              <div className="p-12 text-center bg-card-bg rounded-xl border border-white/5 text-xs text-text-tertiary">
                Aggregating 360-degree user profile, ledger summary, machine fleet & risk history...
              </div>
            ) : selectedCase360 ? (
              <div className="p-5 rounded-2xl bg-card-bg border border-white/10 space-y-4 shadow-lg">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <div>
                    <h4 className="text-sm font-extrabold text-text-primary">360-Degree Case Workspace</h4>
                    <span className="text-xs font-mono text-text-tertiary">Case ID: {selectedCase360.caseDetail.id}</span>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400">
                    {selectedCase360.caseDetail.status}
                  </span>
                </div>

                {/* User Summary Pane */}
                {selectedCase360.user360Profile && (
                  <div className="p-4 rounded-xl bg-control-bg space-y-2 border border-white/5 text-xs">
                    <div className="flex justify-between font-bold">
                      <span className="text-text-primary">{selectedCase360.user360Profile.name} ({selectedCase360.user360Profile.username})</span>
                      <span className="text-usdt-green font-mono">Telegram ID: {selectedCase360.user360Profile.telegramId}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-text-tertiary pt-1 border-t border-white/5">
                      <div>User State: <strong>{selectedCase360.user360Profile.state}</strong></div>
                      <div>Readiness Score: <strong>{selectedCase360.user360Profile.readinessScore}</strong></div>
                    </div>
                  </div>
                )}

                {/* Financial Summary Pane */}
                {selectedCase360.userFinancialProfile && (
                  <div className="p-4 rounded-xl bg-control-bg space-y-2 border border-white/5 text-xs font-mono">
                    <div className="font-bold text-text-primary text-[11px] uppercase tracking-wider text-usdt-green">Financial Ledger Summary</div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>Available USDT: <strong>${selectedCase360.userFinancialProfile.financialAccount?.availableBalance || '0'}</strong></div>
                      <div>Locked USDT: <strong>${selectedCase360.userFinancialProfile.financialAccount?.lockedBalance || '0'}</strong></div>
                    </div>
                  </div>
                )}

                {/* User Machine Fleet & Asset Licenses */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-control-bg border border-white/5 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-text-tertiary block">Owned Fleet ({selectedCase360.userFleet?.length || 0})</span>
                    {selectedCase360.userFleet?.map((f: any) => (
                      <div key={f.id} className="text-[11px] font-mono font-bold text-text-primary">
                        {f.name} ({f.tierCode}) - {f.status}
                      </div>
                    ))}
                  </div>

                  <div className="p-3 rounded-xl bg-control-bg border border-white/5 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-text-tertiary block">Asset Licenses ({selectedCase360.userLicenses?.length || 0})</span>
                    {selectedCase360.userLicenses?.map((l: any) => (
                      <div key={l.id} className="text-[11px] font-mono font-bold text-usdt-green">
                        {l.asset} ({l.status})
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-card-bg rounded-xl border border-white/5 text-xs text-text-tertiary">
                Select a support case from the list on the left to open the 360-degree inspection pane.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: WORKER QUEUES */}
      {activeTab === 'QUEUES' && (
        <div className="space-y-3">
          {queueItems.map((item) => (
            <div key={item.id} className="p-4 rounded-xl bg-card-bg border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-xs text-usdt-green">#{item.id.substring(0, 8)}...</span>
                  <span className="px-2 py-0.5 rounded bg-control-bg text-text-primary font-bold text-[10px]">
                    {item.reason}
                  </span>
                  <span className="text-[10px] text-text-tertiary uppercase">{item.status}</span>
                </div>
                <div className="text-xs text-text-secondary mt-1 font-mono">
                  Created: {new Date(item.createdAt).toLocaleString()}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleQueueAction(item.id, 'RETRY')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold"
                >
                  Retry Worker
                </button>
                <button
                  onClick={() => handleQueueAction(item.id, 'DRAIN')}
                  className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold"
                >
                  Drain Queue
                </button>
              </div>
            </div>
          ))}
          {queueItems.length === 0 && (
            <div className="p-8 text-center bg-card-bg rounded-xl border border-white/5 text-xs text-text-tertiary">
              No worker queue items pending.
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PROVIDER HEALTH */}
      {activeTab === 'PROVIDERS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {providerHealth.map((p) => (
            <div key={p.providerId} className="p-5 rounded-xl bg-card-bg border border-white/10 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-text-primary text-sm">{p.displayName}</h4>
                  <span className="text-[10px] font-mono text-text-tertiary">{p.providerId}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {p.healthStatus}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-control-bg font-mono text-xs space-y-1 border border-white/5">
                <div className="flex justify-between"><span className="text-text-tertiary">Latency Ping:</span> <strong>{p.latencyMs} ms</strong></div>
                <div className="flex justify-between"><span className="text-text-tertiary">Success Rate:</span> <span className="text-usdt-green">{p.successRatePct}%</span></div>
                <div className="flex justify-between"><span className="text-text-tertiary">Error Rate:</span> <span>{p.errorRatePct}%</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* GLOBAL SWITCH TOGGLE MODAL */}
      {pendingToggleKey && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-app-bg-secondary border border-usdt-green/40 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-extrabold text-text-primary uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-400" /> Confirm Operational Switch Update
              </h3>
              <button onClick={() => setPendingToggleKey(null)} className="text-text-tertiary hover:text-text-primary">✕</button>
            </div>

            <form onSubmit={handleConfirmToggle} className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-control-bg border border-amber-500/30 text-amber-300 text-[11px]">
                You are setting <strong>{pendingToggleKey}</strong> to <strong>{pendingToggleVal ? 'ON (RESTRICTED)' : 'OFF (NORMAL)'}</strong>.
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-text-tertiary block mb-1">Mandatory Administrative Reason</label>
                <textarea
                  placeholder="Reason for changing platform operational controls..."
                  value={toggleReason}
                  onChange={(e) => setToggleReason(e.target.value)}
                  className="w-full bg-control-bg text-text-primary text-xs rounded-xl p-3 border border-white/10"
                  rows={3}
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPendingToggleKey(null)}
                  className="flex-1 py-2.5 rounded-xl bg-control-bg border border-white/10 text-xs font-bold text-text-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingToggle}
                  className="flex-1 py-2.5 rounded-xl bg-usdt-green text-app-bg text-xs font-black uppercase tracking-wider"
                >
                  {submittingToggle ? 'Updating...' : 'Confirm Switch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
