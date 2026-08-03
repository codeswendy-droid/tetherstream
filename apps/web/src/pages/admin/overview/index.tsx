import type React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { 
  ShieldCheck, 
  TrendingUp, 
  Users, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Cpu, 
  AlertTriangle, 
  LifeBuoy, 
  Search, 
  RefreshCw,
  Radio
} from 'lucide-react';

interface LiveEvent {
  id: string;
  timestamp: string;
  category: string;
  severity: string;
  title: string;
  detail: string;
}

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [stats, setStats] = useState<any>(null);

  const fetchLiveStream = async () => {
    setLoadingEvents(true);
    try {
      const [eventsRes, statsRes] = await Promise.all([
        api.get<LiveEvent[]>('/admin/dashboard/live-stream'),
        api.get<any>('/admin/dashboard'),
      ]);
      setLiveEvents(eventsRes.data || []);
      setStats(statsRes.data || null);
    } catch (err) {
      console.warn('Live stream fetch notice:', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    fetchLiveStream();
    const interval = setInterval(fetchLiveStream, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = async (val: string) => {
    setGlobalSearch(val);
    if (!val || val.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await api.get<any[]>(`/admin/dashboard/search?q=${encodeURIComponent(val)}`);
      setSearchResults(res.data || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. MISSION CONTROL HEADER */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-card-bg border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-usdt-green/10 border border-usdt-green/30 flex items-center justify-center text-usdt-green relative">
            <Radio size={28} className="animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] text-text-tertiary font-mono font-extrabold uppercase tracking-widest">Titan Operations Center</span>
            <div className="flex items-center gap-2 mt-1">
              <h2 className="text-xl font-black text-text-primary">Production Mission Control</h2>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-usdt-green text-app-bg uppercase tracking-wide">
                LIVE
              </span>
            </div>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search Telegram ID, wallet, hash, ref code..."
            value={globalSearch}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-control-bg text-text-primary text-xs rounded-xl pl-9 pr-4 py-2.5 border border-white/10 focus:border-usdt-green focus:outline-none"
          />
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />

          {/* Search Dropdown Results */}
          {globalSearch.length >= 2 && (
            <div className="absolute left-0 right-0 top-12 z-50 bg-app-bg-secondary border border-white/15 rounded-xl shadow-2xl p-2 max-h-80 overflow-y-auto space-y-1">
              {searching ? (
                <div className="p-3 text-center text-xs text-text-tertiary">Searching production system...</div>
              ) : searchResults.length === 0 ? (
                <div className="p-3 text-center text-xs text-text-tertiary">No matching entities found</div>
              ) : (
                searchResults.map((item) => (
                  <div
                    key={`${item.entityType}_${item.id}`}
                    onClick={() => {
                      setGlobalSearch('');
                      if (item.linkTab === 'Users & Support') navigate('/admin/users');
                      else if (item.linkTab === 'Treasury & Financials') navigate('/admin/treasury');
                      else navigate('/admin/operations');
                    }}
                    className="p-2.5 rounded-lg bg-control-bg hover:bg-white/10 cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-text-primary">{item.title}</div>
                      <div className="text-[10px] text-text-tertiary">{item.subtitle}</div>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-usdt-green/20 text-usdt-green">
                        {item.badge}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <button 
          onClick={fetchLiveStream} 
          disabled={loadingEvents}
          className="p-2.5 rounded-xl bg-control-bg border border-white/10 hover:bg-white/5 text-text-secondary disabled:opacity-50 min-h-[40px]"
        >
          <RefreshCw size={16} className={loadingEvents ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* 2. LIVE EVENT STREAM FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card-bg border border-white/10 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-usdt-green animate-ping" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-text-primary">Live Production Event Stream</h3>
            </div>
            <span className="text-[10px] font-mono text-text-tertiary">{liveEvents.length} events logged</span>
          </div>

          <div className="space-y-2 max-h-[420px] overflow-y-auto no-scrollbar pr-1">
            {liveEvents.length === 0 ? (
              <div className="p-8 text-center text-xs text-text-tertiary">Waiting for live production events...</div>
            ) : (
              liveEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 rounded-xl bg-control-bg/60 border border-white/5 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wide mt-0.5
                      ${evt.severity === 'CRITICAL' ? 'bg-error-red text-white' :
                        evt.severity === 'WARNING' ? 'bg-amber-500/20 text-amber-300' :
                        evt.severity === 'SUCCESS' ? 'bg-usdt-green/20 text-usdt-green' : 'bg-blue-500/20 text-blue-300'}`}
                    >
                      {evt.category}
                    </span>
                    <div>
                      <div className="font-bold text-text-primary leading-tight">{evt.title}</div>
                      <div className="text-[11px] text-text-secondary mt-0.5">{evt.detail}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-text-tertiary flex-shrink-0">
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Operational Quick Controls */}
        <div className="bg-card-bg border border-white/10 rounded-2xl p-5 shadow-lg space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-text-primary border-b border-white/10 pb-3">Operational Shortcuts</h3>
          
          <div className="space-y-3">
            <button
              onClick={() => navigate('/admin/treasury')}
              className="w-full p-3 rounded-xl bg-control-bg hover:bg-white/5 border border-white/10 text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck size={18} className="text-usdt-green" />
                <div>
                  <div className="text-xs font-bold text-text-primary">Treasury & Ledger</div>
                  <div className="text-[10px] text-text-tertiary">Review reserves & payouts</div>
                </div>
              </div>
              <span className="text-xs text-text-tertiary">→</span>
            </button>

            <button
              onClick={() => navigate('/admin/users')}
              className="w-full p-3 rounded-xl bg-control-bg hover:bg-white/5 border border-white/10 text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Users size={18} className="text-blue-400" />
                <div>
                  <div className="text-xs font-bold text-text-primary">User Intelligence</div>
                  <div className="text-[10px] text-text-tertiary">Inspector & Support queue</div>
                </div>
              </div>
              <span className="text-xs text-text-tertiary">→</span>
            </button>

            <button
              onClick={() => navigate('/admin/operations')}
              className="w-full p-3 rounded-xl bg-control-bg hover:bg-white/5 border border-white/10 text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Cpu size={18} className="text-amber-400" />
                <div>
                  <div className="text-xs font-bold text-text-primary">Emergency Kill Switches</div>
                  <div className="text-[10px] text-text-tertiary">Control system features</div>
                </div>
              </div>
              <span className="text-xs text-text-tertiary">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
