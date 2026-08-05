import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';
import { MetricCard, MetricCardGrid } from '@/components/admin/MetricCard';
import { showToast } from '@/components/Toast';
import {
  BarChart3,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  Search,
  Download,
  AlertTriangle,
  Lock,
  Calendar,
  FileText,
  PieChart,
  Cpu,
  Layers,
  Clock,
  DollarSign,
  UserCheck,
} from 'lucide-react';

export interface AuditExplorerItem {
  id: string;
  telegramUserId: string;
  eventType: string;
  description: string;
  severity: string;
  source: string;
  correlationId: string;
  metadata?: any;
  createdAt: string;
}

export const IntelligencePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'EXECUTIVE' | 'INTELLIGENCE' | 'COMPLIANCE' | 'AUDIT' | 'REPORTS'>('EXECUTIVE');
  const [loading, setLoading] = useState(true);

  // Executive KPIs State
  const [kpis, setKpis] = useState<any>(null);

  // Machine & Asset Intelligence State
  const [intelligenceData, setIntelligenceData] = useState<any>(null);

  // Forecast State
  const [forecastHorizon, setForecastHorizon] = useState<30 | 60 | 90>(30);
  const [forecastData, setForecastData] = useState<any>(null);

  // Compliance State
  const [complianceData, setComplianceData] = useState<any>(null);

  // Audit Explorer State
  const [auditItems, setAuditItems] = useState<AuditExplorerItem[]>([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);

  // Report Generator State
  const [reportType, setReportType] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'>('MONTHLY');
  const [generatingReport, setGeneratingReport] = useState(false);

  // Fetch Executive KPIs
  const fetchKPIs = useCallback(() => {
    setLoading(true);
    api.get('/admin/intelligence/kpis')
      .then((res) => setKpis(res.data?.kpis || null))
      .catch((err) => showToast(err.response?.data?.message || 'Failed to load executive KPIs', 'error'))
      .finally(() => setLoading(false));
  }, []);

  // Fetch Machine & Asset Intelligence
  const fetchIntelligence = useCallback(() => {
    api.get('/admin/intelligence/machine-asset')
      .then((res) => setIntelligenceData(res.data || null))
      .catch(() => setIntelligenceData(null));
  }, []);

  // Fetch Forecast
  const fetchForecast = useCallback((days: number) => {
    api.get(`/admin/intelligence/forecast?days=${days}`)
      .then((res) => setForecastData(res.data || null))
      .catch(() => setForecastData(null));
  }, []);

  // Fetch Compliance
  const fetchCompliance = useCallback(() => {
    api.get('/admin/intelligence/compliance')
      .then((res) => setComplianceData(res.data || null))
      .catch(() => setComplianceData(null));
  }, []);

  // Query Audit Explorer
  const fetchAuditExplorer = useCallback((pageNum: number = 1, searchQuery: string = '') => {
    api.get(`/admin/intelligence/audit-explorer?page=${pageNum}&limit=20&search=${encodeURIComponent(searchQuery)}`)
      .then((res) => {
        setAuditItems(res.data?.items || []);
        setAuditTotalPages(res.data?.pagination?.totalPages || 1);
        setAuditPage(pageNum);
      })
      .catch(() => setAuditItems([]));
  }, []);

  useEffect(() => {
    fetchKPIs();
  }, [fetchKPIs]);

  const handleTabChange = (tab: 'EXECUTIVE' | 'INTELLIGENCE' | 'COMPLIANCE' | 'AUDIT' | 'REPORTS') => {
    setActiveTab(tab);
    if (tab === 'EXECUTIVE') fetchKPIs();
    if (tab === 'INTELLIGENCE') {
      fetchIntelligence();
      fetchForecast(forecastHorizon);
    }
    if (tab === 'COMPLIANCE') fetchCompliance();
    if (tab === 'AUDIT') fetchAuditExplorer(1, auditSearch);
  };

  // Generate Report
  const handleGenerateReport = () => {
    setGeneratingReport(true);
    api.post('/admin/intelligence/reports/generate', { reportType })
      .then((res) => {
        showToast(`${reportType} Business Performance Report generated successfully.`, 'success');
        const jsonStr = JSON.stringify(res.data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `titan-stream-${reportType.toLowerCase()}-report.json`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch((err) => showToast(err.response?.data?.message || 'Report generation failed', 'error'))
      .finally(() => setGeneratingReport(false));
  };

  // Export Audit Logs to CSV
  const handleExportAuditCSV = () => {
    if (auditItems.length === 0) {
      showToast('No audit logs available to export', 'error');
      return;
    }
    const headers = 'ID,User/Admin,Event Type,Description,Severity,Source,CreatedAt\n';
    const rows = auditItems.map((e) =>
      `"${e.id}","${e.telegramUserId}","${e.eventType}","${(e.description || '').replace(/"/g, '""')}","${e.severity}","${e.source}","${e.createdAt}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Audit log CSV exported successfully.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-card-bg border border-white/10 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-usdt-green bg-usdt-green/10 text-usdt-green">
            <BarChart3 size={24} />
          </div>
          <div>
            <span className="text-xs text-text-tertiary font-bold uppercase tracking-wider">Titan Intelligence & Analytics Engine</span>
            <h3 className="text-lg font-extrabold text-text-primary">Executive Observability & Intelligence Layer</h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateReport}
            disabled={generatingReport}
            className="px-4 py-2.5 rounded-xl bg-usdt-green text-app-bg text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md hover:brightness-110"
          >
            <Download size={16} /> {generatingReport ? 'Generating Report...' : 'Export Report'}
          </button>
          <button
            onClick={fetchKPIs}
            disabled={loading}
            className="p-2.5 rounded-xl bg-control-bg border border-white/10 text-text-secondary hover:text-text-primary"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Top Live Executive Metric Cards */}
      {kpis && (
        <MetricCardGrid columns={4}>
          <MetricCard
            label="Net Platform Revenue"
            value={`$${kpis.platformNetRevenue?.toLocaleString() || '0'}`}
            change={0}
            icon="DollarSign"
            variant="green"
          />
          <MetricCard
            label="Assets Under Management"
            value={`$${kpis.assetsUnderManagement?.toLocaleString() || '0'}`}
            change={0}
            icon="TrendingUp"
            variant="gold"
          />
          <MetricCard
            label="Settlement Success Rate"
            value={`${kpis.settlementSuccessRatePct || '100'}%`}
            change={0}
            icon="ShieldCheck"
            variant="default"
          />
          <MetricCard
            label="Reserve Ratio"
            value={`${kpis.platformReserveRatioPct || '100'}%`}
            change={0}
            icon="Layers"
            variant="green"
          />
        </MetricCardGrid>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-white/10 gap-6 text-xs font-bold">
        <button
          onClick={() => handleTabChange('EXECUTIVE')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'EXECUTIVE' ? 'border-usdt-green text-usdt-green' : 'border-transparent text-text-tertiary'}`}
        >
          <BarChart3 size={14} /> Executive Observability
        </button>
        <button
          onClick={() => handleTabChange('INTELLIGENCE')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'INTELLIGENCE' ? 'border-usdt-green text-usdt-green' : 'border-transparent text-text-tertiary'}`}
        >
          <PieChart size={14} /> Machine & Asset Intelligence
        </button>
        <button
          onClick={() => handleTabChange('COMPLIANCE')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'COMPLIANCE' ? 'border-usdt-green text-usdt-green' : 'border-transparent text-text-tertiary'}`}
        >
          <Lock size={14} /> Compliance & AML Review
        </button>
        <button
          onClick={() => handleTabChange('AUDIT')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'AUDIT' ? 'border-usdt-green text-usdt-green' : 'border-transparent text-text-tertiary'}`}
        >
          <Search size={14} /> Read-Only Audit Explorer
        </button>
        <button
          onClick={() => handleTabChange('REPORTS')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'REPORTS' ? 'border-usdt-green text-usdt-green' : 'border-transparent text-text-tertiary'}`}
        >
          <FileText size={14} /> Report Generator
        </button>
      </div>

      {/* TAB 1: EXECUTIVE DASHBOARD */}
      {activeTab === 'EXECUTIVE' && kpis && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-card-bg border border-white/10 space-y-3 shadow-lg">
            <h4 className="font-extrabold text-text-primary text-sm uppercase tracking-wider text-usdt-green">Deposit & Payout Volumes</h4>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between p-2 rounded bg-control-bg"><span>Total Deposits:</span> <strong className="text-usdt-green">${kpis.totalDepositsVolume}</strong></div>
              <div className="flex justify-between p-2 rounded bg-control-bg"><span>Total Payouts:</span> <strong className="text-red-400">${kpis.totalPayoutsVolume}</strong></div>
              <div className="flex justify-between p-2 rounded bg-control-bg"><span>Net Solvency Delta:</span> <strong>${kpis.platformNetRevenue}</strong></div>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-card-bg border border-white/10 space-y-3 shadow-lg">
            <h4 className="font-extrabold text-text-primary text-sm uppercase tracking-wider text-usdt-green">User & Fleet Performance</h4>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between p-2 rounded bg-control-bg"><span>Registered Users:</span> <strong>{kpis.registeredUsersCount}</strong></div>
              <div className="flex justify-between p-2 rounded bg-control-bg"><span>Active Machine Fleet:</span> <strong>{kpis.activeMachineFleetCount}</strong></div>
              <div className="flex justify-between p-2 rounded bg-control-bg"><span>Average Rev / User:</span> <strong>${kpis.averageRevenuePerUser}</strong></div>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-card-bg border border-white/10 space-y-3 shadow-lg">
            <h4 className="font-extrabold text-text-primary text-sm uppercase tracking-wider text-usdt-green">Operational Health</h4>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between p-2 rounded bg-control-bg"><span>Provider Availability:</span> <strong className="text-emerald-400">{kpis.providerAvailabilityPct}%</strong></div>
              <div className="flex justify-between p-2 rounded bg-control-bg"><span>Active Risk Incidents:</span> <strong className="text-amber-400">{kpis.activeRiskIncidents}</strong></div>
              <div className="flex justify-between p-2 rounded bg-control-bg"><span>Open Support Cases:</span> <strong>{kpis.activeSupportCases}</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MACHINE & ASSET INTELLIGENCE + FORECAST */}
      {activeTab === 'INTELLIGENCE' && (
        <div className="space-y-6">
          {/* Forecast Engine Card */}
          <div className="bg-card-bg border border-white/10 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-text-primary flex items-center gap-2">
                <TrendingUp size={16} className="text-usdt-green" /> Production Historical Forecast Engine
              </h4>
              <div className="flex gap-2">
                {[30, 60, 90].map((d) => (
                  <button
                    key={d}
                    onClick={() => { setForecastHorizon(d as any); fetchForecast(d); }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${forecastHorizon === d ? 'bg-usdt-green text-app-bg' : 'bg-control-bg text-text-tertiary'}`}
                  >
                    {d} Days
                  </button>
                ))}
              </div>
            </div>

            {forecastData && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
                <div className="p-3 rounded-xl bg-control-bg border border-white/5 space-y-1">
                  <span className="text-text-tertiary text-[10px]">Projected Revenue</span>
                  <div className="text-sm font-extrabold text-usdt-green">${forecastData.projections?.projectedRevenue}</div>
                </div>
                <div className="p-3 rounded-xl bg-control-bg border border-white/5 space-y-1">
                  <span className="text-text-tertiary text-[10px]">Projected Payouts</span>
                  <div className="text-sm font-extrabold text-red-400">${forecastData.projections?.projectedPayouts}</div>
                </div>
                <div className="p-3 rounded-xl bg-control-bg border border-white/5 space-y-1">
                  <span className="text-text-tertiary text-[10px]">Reserve Requirement (15%)</span>
                  <div className="text-sm font-extrabold text-amber-400">${forecastData.projections?.projectedReserveRequirement}</div>
                </div>
                <div className="p-3 rounded-xl bg-control-bg border border-white/5 space-y-1">
                  <span className="text-text-tertiary text-[10px]">Projected Fleet Units</span>
                  <div className="text-sm font-extrabold text-text-primary">{forecastData.projections?.projectedFleetGrowth} Units</div>
                </div>
              </div>
            )}
          </div>

          {/* Machine ROI Rankings Table */}
          {intelligenceData?.machineTierAnalytics && (
            <div className="bg-card-bg border border-white/10 rounded-2xl p-5 shadow-lg space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-text-primary">Machine Catalog ROI & Earnings Performance</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-control-bg text-text-tertiary uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Tier Code</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Price</th>
                      <th className="p-3">Daily Yield</th>
                      <th className="p-3">Owned Fleet</th>
                      <th className="p-3">Total Generated</th>
                      <th className="p-3">Est. ROI (Days)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {intelligenceData.machineTierAnalytics.map((m: any) => (
                      <tr key={m.id}>
                        <td className="p-3 font-bold text-usdt-green">{m.tierCode}</td>
                        <td className="p-3 text-text-primary">{m.name}</td>
                        <td className="p-3">${m.priceUsdt}</td>
                        <td className="p-3">${m.dailyYieldEstimate}</td>
                        <td className="p-3">{m.totalFleetOwned}</td>
                        <td className="p-3">${m.totalEarningsGenerated}</td>
                        <td className="p-3 text-amber-400 font-bold">{m.estimatedRoiDays} days</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COMPLIANCE & AML REVIEW */}
      {activeTab === 'COMPLIANCE' && complianceData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Financial Holds Summary */}
          <div className="p-5 rounded-xl bg-card-bg border border-white/10 space-y-3 shadow-lg">
            <h4 className="font-extrabold text-text-primary text-sm uppercase tracking-wider text-usdt-green flex items-center gap-2">
              <Lock size={16} /> Restricted / Suspended User Accounts ({complianceData.restrictedUsers?.length || 0})
            </h4>
            <div className="space-y-2">
              {complianceData.restrictedUsers?.map((u: any) => (
                <div key={u.telegramUserId} className="p-3 rounded-lg bg-control-bg flex justify-between items-center text-xs font-mono">
                  <div>
                    <strong className="text-text-primary">{u.name}</strong>
                    <div className="text-[10px] text-text-tertiary">ID: {u.telegramUserId}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                    {u.state}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Critical Risk Alerts */}
          <div className="p-5 rounded-xl bg-card-bg border border-white/10 space-y-3 shadow-lg">
            <h4 className="font-extrabold text-text-primary text-sm uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <AlertTriangle size={16} /> Critical Compliance & AML Alerts ({complianceData.criticalRiskAlerts?.length || 0})
            </h4>
            <div className="space-y-2">
              {complianceData.criticalRiskAlerts?.map((r: any) => (
                <div key={r.id} className="p-3 rounded-lg bg-control-bg space-y-1 text-xs font-mono border border-amber-500/20">
                  <div className="flex justify-between font-bold">
                    <span className="text-amber-400">{r.ruleTriggered}</span>
                    <span className="text-text-tertiary">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-[11px] text-text-secondary">{r.notes || 'No description provided'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT EXPLORER */}
      {activeTab === 'AUDIT' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-card-bg border border-white/10 rounded-2xl p-4 shadow-lg">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-3 text-text-tertiary" size={16} />
              <input
                type="text"
                placeholder="Search by event, description, source..."
                value={auditSearch}
                onChange={(e) => { setAuditSearch(e.target.value); fetchAuditExplorer(1, e.target.value); }}
                className="w-full pl-10 pr-4 py-2.5 bg-control-bg text-text-primary text-xs rounded-xl border border-white/10"
              />
            </div>

            <button
              onClick={handleExportAuditCSV}
              className="px-4 py-2.5 rounded-xl bg-control-bg border border-usdt-green/40 text-usdt-green text-xs font-black uppercase tracking-wider flex items-center gap-2"
            >
              <Download size={14} /> Export Audit Log CSV
            </button>
          </div>

          <div className="bg-card-bg border border-white/10 rounded-2xl p-5 shadow-lg overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-control-bg text-text-tertiary uppercase text-[10px]">
                <tr>
                  <th className="p-3">Event ID</th>
                  <th className="p-3">User / Admin</th>
                  <th className="p-3">Event Type</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {auditItems.map((item) => (
                  <tr key={item.id}>
                    <td className="p-3 font-bold text-usdt-green">{item.id.substring(0, 8)}...</td>
                    <td className="p-3 text-text-primary">{item.telegramUserId}</td>
                    <td className="p-3 text-text-secondary">{item.eventType}</td>
                    <td className="p-3 text-text-tertiary max-w-xs truncate">{item.description}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {item.severity || 'INFO'}
                      </span>
                    </td>
                    <td className="p-3 text-text-tertiary">{new Date(item.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center pt-4 border-t border-white/5 text-xs text-text-tertiary">
              <span>Page {auditPage} of {auditTotalPages}</span>
              <div className="flex gap-2">
                <button
                  disabled={auditPage <= 1}
                  onClick={() => fetchAuditExplorer(auditPage - 1, auditSearch)}
                  className="px-3 py-1 rounded bg-control-bg border border-white/10 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={auditPage >= auditTotalPages}
                  onClick={() => fetchAuditExplorer(auditPage + 1, auditSearch)}
                  className="px-3 py-1 rounded bg-control-bg border border-white/10 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: REPORT GENERATOR */}
      {activeTab === 'REPORTS' && (
        <div className="bg-card-bg border border-white/10 rounded-2xl p-6 shadow-lg space-y-4 max-w-lg">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-text-primary flex items-center gap-2">
            <FileText size={16} className="text-usdt-green" /> Generate Business Performance Report
          </h4>
          <p className="text-xs text-text-tertiary">
            Exports a comprehensive performance report aggregated strictly from production database tables.
          </p>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[10px] font-bold uppercase text-text-tertiary block mb-1">Report Horizon</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="w-full bg-control-bg text-text-primary text-xs rounded-xl p-3 border border-white/10"
              >
                <option value="DAILY">Daily Performance Report</option>
                <option value="WEEKLY">Weekly Performance Report</option>
                <option value="MONTHLY">Monthly Executive Report</option>
                <option value="QUARTERLY">Quarterly Strategic Report</option>
                <option value="ANNUAL">Annual Financial & Fleet Report</option>
              </select>
            </div>

            <button
              onClick={handleGenerateReport}
              disabled={generatingReport}
              className="w-full py-3 rounded-xl bg-usdt-green text-app-bg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <Download size={16} /> {generatingReport ? 'Generating & Auditing Report...' : 'Download Performance Report'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
