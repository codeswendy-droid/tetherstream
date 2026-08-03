import type React from 'react';
import { useState, useEffect } from 'react';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { DetailDrawer } from '@/components/admin/DetailDrawer';
import { MetricCard, MetricCardGrid } from '@/components/admin/MetricCard';
import { api } from '@/services/api';
import { showToast } from '@/components/Toast';
import { Eye, ShieldAlert, MessageSquare, Plus, ExternalLink } from 'lucide-react';

export interface UserProfile {
  id: string;
  telegramId: string;
  name: string;
  username: string;
  totalVolume: number;
  totalDeposits: number;
  totalWithdrawals: number;
  riskScore: number;
  flags: string[];
  wallets: string[];
}

const riskColor = (score: number) => {
  if (score >= 70) return 'text-error-red';
  if (score >= 40) return 'text-gold';
  return 'text-usdt-green';
};

const columns: Column<UserProfile>[] = [
  { key: 'name', label: 'Name', sortable: true, width: 'w-[150px]',
    render: (u) => <><div className="font-semibold">{u.name}</div><div className="text-xs text-text-tertiary">{u.username}</div></>,
    mobile: (u) => ({ label: 'Name', value: <><span className="font-semibold">{u.name}</span><span className="text-text-tertiary text-xs block">{u.username}</span></> }) },
  { key: 'telegramId', label: 'Telegram ID', sortable: true, width: 'w-[110px]',
    render: (u) => <span className="font-mono text-xs">{u.telegramId}</span> },
  { key: 'totalVolume', label: 'Volume', sortable: true, width: 'w-[120px]',
    render: (u) => <span className="font-semibold">${(Number(u.totalVolume) || 0).toLocaleString()}</span>,
    mobile: (u) => ({ label: 'Volume', value: <span className="font-semibold">${(Number(u.totalVolume) || 0).toLocaleString()}</span> }) },
  { key: 'riskScore', label: 'Risk', sortable: true, width: 'w-[70px]',
    render: (u) => <span className={`font-semibold ${riskColor(u.riskScore)}`}>{u.riskScore}</span>,
    mobile: (u) => ({ label: 'Risk', value: <span className={`font-semibold ${riskColor(u.riskScore)}`}>{u.riskScore}</span> }) },
];

export const UsersPage: React.FC = () => {
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [selected, setSelected] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [impersonating, setImpersonating] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [notesList, setNotesList] = useState<any[]>([]);

  useEffect(() => {
    api.get('/admin/users/list')
      .then((res) => setUsersList(res.data?.data || []))
      .catch(() => setUsersList([]))
      .finally(() => setLoading(false));
  }, []);

  const startReadonlyImpersonation = (user: UserProfile) => {
    setImpersonating(true);
    showToast(`READ-ONLY MIRROR: Viewing app state as ${user.name} (${user.telegramId}). No actions can be modified.`, 'info');
  };

  const saveAdminNote = () => {
    if (!adminNote.trim() || !selected) return;
    setNotesList((prev) => [
      { id: Date.now().toString(), text: adminNote, date: new Date().toLocaleTimeString() },
      ...prev,
    ]);
    setAdminNote('');
    showToast('Internal Admin Note saved.', 'success');
  };

  return (
    <div className="space-y-4">
      {impersonating && (
        <div className="p-4 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <Eye size={18} />
            <span className="font-bold">READ-ONLY IMPERSONATION MODE ACTIVE</span>
          </div>
          <button
            onClick={() => setImpersonating(false)}
            className="px-3 py-1 rounded-lg bg-amber-500 text-app-bg font-extrabold text-[10px] uppercase"
          >
            Exit Mirror
          </button>
        </div>
      )}

      <MetricCardGrid columns={2}>
        <MetricCard label="Total Registered Users" value={usersList.length.toString()} change={0} icon="Users" variant="green" />
        <MetricCard label="Flagged Accounts" value={usersList.filter(u => u.flags?.length > 0).length.toString()} change={0} icon="ShieldAlert" variant="gold" />
      </MetricCardGrid>

      {loading ? (
        <div className="p-8 text-center bg-card-bg rounded-xl border border-white/5 text-xs text-text-tertiary">
          Loading user directory...
        </div>
      ) : usersList.length === 0 ? (
        <div className="p-8 text-center bg-card-bg rounded-xl border border-white/5 space-y-1">
          <p className="text-xs font-bold text-text-primary">No user accounts registered yet</p>
          <p className="text-[11px] text-text-tertiary font-mono">Authenticated Telegram members will appear here automatically.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={usersList}
          keyExtractor={(u) => u.id}
          onRowClick={(u) => setSelected(u)}
          searchable
          searchPlaceholder="Search by name, Telegram ID, username..."
          pageSize={10}
          mobileCard
        />
      )}

      {selected && (
        <DetailDrawer isOpen={!!selected} onClose={() => setSelected(null)} title={selected.name || 'User Inspector'}>
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-text-primary">{selected.name} (@{selected.username})</p>
                <p className="text-xs font-mono text-text-tertiary">Telegram ID: {selected.telegramId}</p>
              </div>
              <button
                onClick={() => startReadonlyImpersonation(selected)}
                className="px-3 py-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold flex items-center gap-1.5"
              >
                <Eye size={14} /> Read-Only Mirror
              </button>
            </div>

            {/* Admin Notes Section */}
            <div className="border-t border-border pt-4 space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-text-primary flex items-center gap-2">
                <MessageSquare size={14} className="text-usdt-green" /> Internal Admin Notes
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add internal note for this user..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="flex-1 bg-control-bg text-text-primary text-xs rounded-xl px-3 py-2 border border-white/10"
                />
                <button
                  onClick={saveAdminNote}
                  className="px-3 py-2 rounded-xl bg-usdt-green text-app-bg text-xs font-bold flex items-center gap-1"
                >
                  <Plus size={14} /> Save
                </button>
              </div>

              <div className="space-y-1 max-h-40 overflow-y-auto">
                {notesList.map((n) => (
                  <div key={n.id} className="p-2 rounded-lg bg-control-bg text-xs text-text-secondary flex justify-between">
                    <span>{n.text}</span>
                    <span className="text-[10px] text-text-tertiary">{n.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DetailDrawer>
      )}
    </div>
  );
};
