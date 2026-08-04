import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Gamepad2, CalendarDays, Trophy, ScrollText, Plus, Trash2, RefreshCw, Save } from 'lucide-react';
import { showToast } from '../../../components/Toast';
import {
  gameAdminService,
  type AdminGameView,
  type AdminChallengeView,
  type AdminGrantView,
  type AdminSessionView,
  type AdminChallengeCompletionView,
} from '../../../services/gameAdminService';

type Tab = 'catalog' | 'challenges' | 'audit';

const grantTypeColor: Record<string, string> = {
  XP: '#ffb300',
  EVENT_POINTS: '#00e5ff',
  MYSTERY_BOX: '#b388ff',
  MACHINE_BOOST: '#ff9100',
  ACHIEVEMENT_PROGRESS: '#ff007f',
};

export const GamesAdminPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('catalog');
  const [loading, setLoading] = useState(true);

  const [games, setGames] = useState<AdminGameView[]>([]);
  const [challenges, setChallenges] = useState<AdminChallengeView[]>([]);
  const [grants, setGrants] = useState<AdminGrantView[]>([]);
  const [sessions, setSessions] = useState<AdminSessionView[]>([]);
  const [completions, setCompletions] = useState<AdminChallengeCompletionView[]>([]);

  const [editingGame, setEditingGame] = useState<AdminGameView | null>(null);
  const [editingChallenge, setEditingChallenge] = useState<AdminChallengeView | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async (target?: Tab) => {
    setLoading(true);
    try {
      const t = target ?? tab;
      if (t === 'catalog') setGames(await gameAdminService.getCatalog());
      if (t === 'challenges') setChallenges(await gameAdminService.getChallenges());
      if (t === 'audit') {
        const [g, s, c] = await Promise.all([
          gameAdminService.getGrants(100),
          gameAdminService.getSessions({ limit: 100 }),
          gameAdminService.getChallengeCompletions(50),
        ]);
        setGrants(g);
        setSessions(s);
        setCompletions(c);
      }
    } catch (err: any) {
      showToast(err?.response?.data?.error?.message ?? 'Failed to load games admin data.', 'error');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const saveGame = async () => {
    if (!editingGame?.gameId) return;
    setSaving(true);
    try {
      await gameAdminService.patchGame(editingGame.gameId, {
        name: editingGame.name,
        description: editingGame.description,
        icon: editingGame.icon,
        accentColor: editingGame.accentColor,
        crystalCost: editingGame.crystalCost,
        dailyLimit: editingGame.dailyLimit,
        estimatedDurationSec: editingGame.estimatedDurationSec,
        difficulty: editingGame.difficulty,
        enabled: editingGame.enabled,
      });
      showToast(`${editingGame.name} updated in the live catalog.`, 'success');
      setEditingGame(null);
      await refresh('catalog');
    } catch (err: any) {
      showToast(err?.response?.data?.error?.message ?? 'Failed to update game.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveChallenge = async () => {
    if (!editingChallenge?.code || !editingChallenge.gameId) return;
    setSaving(true);
    try {
      await gameAdminService.upsertChallenge({
        code: editingChallenge.code,
        gameId: editingChallenge.gameId,
        title: editingChallenge.title,
        description: editingChallenge.description,
        objectiveType: editingChallenge.objectiveType,
        target: editingChallenge.target,
        rewardCrystals: editingChallenge.rewardCrystals,
        rewardXp: editingChallenge.rewardXp,
        enabled: editingChallenge.enabled,
      });
      showToast('Challenge saved to the rotation pool.', 'success');
      setEditingChallenge(null);
      await refresh('challenges');
    } catch (err: any) {
      showToast(err?.response?.data?.error?.message ?? 'Failed to save challenge.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteChallenge = async (id: string) => {
    if (!window.confirm('Delete this challenge definition?')) return;
    try {
      await gameAdminService.deleteChallenge(id);
      showToast('Challenge deleted.', 'success');
      await refresh('challenges');
    } catch (err: any) {
      showToast(err?.response?.data?.error?.message ?? 'Failed to delete challenge.', 'error');
    }
  };

  const tabs: Array<{ key: Tab; label: string; icon: React.ReactNode }> = [
    { key: 'catalog', label: 'Catalog', icon: <Gamepad2 size={15} /> },
    { key: 'challenges', label: 'Daily Challenges', icon: <CalendarDays size={15} /> },
    { key: 'audit', label: 'Audit Trail', icon: <ScrollText size={15} /> },
  ];

  const inputCls =
    'w-full bg-control-bg/60 text-text-primary rounded-lg px-3 py-2 text-sm border border-white/5 focus:border-usdt-green focus:outline-none';

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-usdt-green/15 border border-usdt-green/30 flex items-center justify-center text-usdt-green">
            <Gamepad2 size={18} />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-text-primary">Games Command</h2>
            <p className="text-[11px] text-text-tertiary">Catalog · daily challenges · reward audit</p>
          </div>
        </div>
        <button
          onClick={() => void refresh()}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-control-bg/50 border border-white/10 text-text-secondary hover:text-text-primary"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border transition-colors ${
              tab === t.key ? 'bg-usdt-green/15 text-usdt-green border-usdt-green/40' : 'bg-white/[0.03] text-text-secondary border-white/10'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-8 text-center bg-card-bg rounded-xl border border-white/5 text-xs text-text-tertiary">Loading games data...</div>
      ) : (
        <>
          {/* ── Catalog ─────────────────────────────────────────────────── */}
          {tab === 'catalog' && (
            <div className="flex flex-col gap-3">
              {games.map((g) => (
                <div key={g.gameId} className="bg-card-bg rounded-xl border border-white/5 p-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{g.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-text-primary">{g.name}</span>
                          <span
                            className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                              g.enabled ? 'bg-usdt-green/15 text-usdt-green' : 'bg-error-red/15 text-error-red'
                            }`}
                          >
                            {g.enabled ? 'Live' : 'Disabled'}
                          </span>
                        </div>
                        <p className="text-[11px] text-text-tertiary font-mono">{g.gameId} · {g.category} · {g.difficulty}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] font-mono text-text-secondary">
                      <span className="text-gold">💎{g.crystalCost}</span>
                      <span>{g.dailyLimit}/day</span>
                      <span>{g.estimatedDurationSec}s</span>
                      <button
                        onClick={() => setEditingGame(g)}
                        className="text-usdt-green text-xs font-bold hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {editingGame && (
                <div className="bg-card-bg rounded-xl border border-usdt-green/25 p-4 space-y-3">
                  <p className="text-xs font-black uppercase tracking-widest text-usdt-green">Edit {editingGame.name}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-[10px] font-bold text-text-tertiary uppercase">
                      Name
                      <input className={inputCls} value={editingGame.name} onChange={(e) => setEditingGame({ ...editingGame, name: e.target.value })} />
                    </label>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase">
                      Icon (emoji)
                      <input className={inputCls} value={editingGame.icon} onChange={(e) => setEditingGame({ ...editingGame, icon: e.target.value })} />
                    </label>
                    <label className="col-span-2 text-[10px] font-bold text-text-tertiary uppercase">
                      Description
                      <input className={inputCls} value={editingGame.description} onChange={(e) => setEditingGame({ ...editingGame, description: e.target.value })} />
                    </label>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase">
                      Entry cost (💎)
                      <input
                        className={inputCls}
                        type="number"
                        value={editingGame.crystalCost}
                        onChange={(e) => setEditingGame({ ...editingGame, crystalCost: Number(e.target.value) })}
                      />
                    </label>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase">
                      Daily limit
                      <input
                        className={inputCls}
                        type="number"
                        value={editingGame.dailyLimit}
                        onChange={(e) => setEditingGame({ ...editingGame, dailyLimit: Number(e.target.value) })}
                      />
                    </label>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase">
                      Duration (sec)
                      <input
                        className={inputCls}
                        type="number"
                        value={editingGame.estimatedDurationSec}
                        onChange={(e) => setEditingGame({ ...editingGame, estimatedDurationSec: Number(e.target.value) })}
                      />
                    </label>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase">
                      Difficulty
                      <select
                        className={inputCls}
                        value={editingGame.difficulty}
                        onChange={(e) => setEditingGame({ ...editingGame, difficulty: e.target.value })}
                      >
                        {['EASY', 'MEDIUM', 'HARD', 'EXPERT'].map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </label>
                    <label className="col-span-2 flex items-center gap-2 text-xs font-bold text-text-secondary">
                      <input
                        type="checkbox"
                        checked={editingGame.enabled}
                        onChange={(e) => setEditingGame({ ...editingGame, enabled: e.target.checked })}
                      />
                      Game enabled in the hub
                    </label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingGame(null)} className="text-xs font-bold px-4 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-text-secondary">
                      Cancel
                    </button>
                    <button
                      onClick={() => void saveGame()}
                      disabled={saving}
                      className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg bg-usdt-green/15 border border-usdt-green/40 text-usdt-green disabled:opacity-40"
                    >
                      <Save size={13} /> {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Daily Challenges ─────────────────────────────────────────── */}
          {tab === 'challenges' && (
            <div className="flex flex-col gap-3">
              <button
                onClick={() =>
                  setEditingChallenge({
                    id: '',
                    code: '',
                    gameId: 'titan-core-reactor',
                    title: '',
                    description: '',
                    objectiveType: 'SCORE',
                    target: 100,
                    rewardCrystals: 20,
                    rewardXp: 25,
                    enabled: true,
                  })
                }
                className="flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-lg bg-usdt-green/15 border border-usdt-green/40 text-usdt-green"
              >
                <Plus size={13} /> New challenge
              </button>

              {editingChallenge && (
                <div className="bg-card-bg rounded-xl border border-usdt-green/25 p-4 space-y-3">
                  <p className="text-xs font-black uppercase tracking-widest text-usdt-green">
                    {editingChallenge.id ? 'Edit challenge' : 'New challenge'}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-[10px] font-bold text-text-tertiary uppercase">
                      Code
                      <input className={inputCls} value={editingChallenge.code} onChange={(e) => setEditingChallenge({ ...editingChallenge, code: e.target.value })} />
                    </label>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase">
                      Game
                      <select
                        className={inputCls}
                        value={editingChallenge.gameId}
                        onChange={(e) => setEditingChallenge({ ...editingChallenge, gameId: e.target.value })}
                      >
                        {games.map((g) => (
                          <option key={g.gameId} value={g.gameId}>{g.name}</option>
                        ))}
                      </select>
                    </label>
                    <label className="col-span-2 text-[10px] font-bold text-text-tertiary uppercase">
                      Title
                      <input className={inputCls} value={editingChallenge.title} onChange={(e) => setEditingChallenge({ ...editingChallenge, title: e.target.value })} />
                    </label>
                    <label className="col-span-2 text-[10px] font-bold text-text-tertiary uppercase">
                      Description
                      <input className={inputCls} value={editingChallenge.description} onChange={(e) => setEditingChallenge({ ...editingChallenge, description: e.target.value })} />
                    </label>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase">
                      Objective
                      <select
                        className={inputCls}
                        value={editingChallenge.objectiveType}
                        onChange={(e) => setEditingChallenge({ ...editingChallenge, objectiveType: e.target.value })}
                      >
                        {['SCORE', 'CRYSTALS', 'USDT', 'WINS', 'PERFECT', 'LEVELS'].map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    </label>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase">
                      Target
                      <input
                        className={inputCls}
                        type="number"
                        value={editingChallenge.target}
                        onChange={(e) => setEditingChallenge({ ...editingChallenge, target: Number(e.target.value) })}
                      />
                    </label>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase">
                      Reward 💎
                      <input
                        className={inputCls}
                        type="number"
                        value={editingChallenge.rewardCrystals}
                        onChange={(e) => setEditingChallenge({ ...editingChallenge, rewardCrystals: Number(e.target.value) })}
                      />
                    </label>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase">
                      Reward XP
                      <input
                        className={inputCls}
                        type="number"
                        value={editingChallenge.rewardXp}
                        onChange={(e) => setEditingChallenge({ ...editingChallenge, rewardXp: Number(e.target.value) })}
                      />
                    </label>
                    <label className="col-span-2 flex items-center gap-2 text-xs font-bold text-text-secondary">
                      <input
                        type="checkbox"
                        checked={editingChallenge.enabled}
                        onChange={(e) => setEditingChallenge({ ...editingChallenge, enabled: e.target.checked })}
                      />
                      In rotation pool
                    </label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingChallenge(null)} className="text-xs font-bold px-4 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-text-secondary">
                      Cancel
                    </button>
                    <button
                      onClick={() => void saveChallenge()}
                      disabled={saving}
                      className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg bg-usdt-green/15 border border-usdt-green/40 text-usdt-green disabled:opacity-40"
                    >
                      <Save size={13} /> {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {challenges.map((c) => (
                  <div key={c.id} className="bg-card-bg rounded-xl border border-white/5 p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <CalendarDays size={15} className="text-gold shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-text-primary truncate">{c.title}</span>
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${c.enabled ? 'bg-usdt-green/15 text-usdt-green' : 'bg-white/5 text-text-tertiary'}`}>
                            {c.enabled ? 'Active' : 'Draft'}
                          </span>
                        </div>
                        <p className="text-[10px] font-mono text-text-tertiary truncate">
                          {c.code} · {c.gameId} · {c.objectiveType} ≥ {c.target} · +{c.rewardCrystals}💎 +{c.rewardXp}⚡
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => setEditingChallenge(c)} className="text-usdt-green text-xs font-bold hover:underline">Edit</button>
                      <button onClick={() => void deleteChallenge(c.id)} className="text-error-red hover:underline">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Audit Trail ──────────────────────────────────────────────── */}
          {tab === 'audit' && (
            <div className="flex flex-col gap-5">
              {/* Grants */}
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-widest text-text-tertiary mb-2 flex items-center gap-1.5">
                  <Trophy size={13} className="text-gold" /> Reward grants ({grants.length})
                </h4>
                <div className="flex flex-col gap-1.5">
                  {grants.length === 0 && <p className="text-[11px] text-text-tertiary">No grants recorded yet.</p>}
                  {grants.map((g) => (
                    <div key={g.id} className="bg-card-bg rounded-lg border border-white/5 px-3 py-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded shrink-0"
                          style={{ background: `${grantTypeColor[g.type] ?? '#00e5ff'}1a`, color: grantTypeColor[g.type] ?? '#00e5ff' }}
                        >
                          {g.type}
                        </span>
                        <span className="text-[11px] font-mono text-text-secondary truncate">@{g.telegramUserId} · {g.gameId}</span>
                      </div>
                      <span className="text-[11px] font-mono text-text-tertiary shrink-0">
                        +{g.amount} · {new Date(g.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Challenge completions */}
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-widest text-text-tertiary mb-2">
                  Daily challenge completions ({completions.length})
                </h4>
                <div className="flex flex-col gap-1.5">
                  {completions.length === 0 && <p className="text-[11px] text-text-tertiary">No completions yet.</p>}
                  {completions.map((c) => (
                    <div key={c.id} className="bg-card-bg rounded-lg border border-white/5 px-3 py-2 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono text-text-secondary truncate">@{c.telegramUserId} · day {c.challengeDay}</span>
                      <span className="text-[11px] font-mono text-text-tertiary shrink-0">
                        +{c.rewardCrystals}💎 +{c.rewardXp}⚡ · {new Date(c.completedAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sessions */}
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-widest text-text-tertiary mb-2">
                  Recent sessions ({sessions.length})
                </h4>
                <div className="flex flex-col gap-1.5">
                  {sessions.length === 0 && <p className="text-[11px] text-text-tertiary">No sessions yet.</p>}
                  {sessions.map((s) => (
                    <div key={s.id} className="bg-card-bg rounded-lg border border-white/5 px-3 py-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded shrink-0 ${
                            s.status === 'COMPLETED'
                              ? 'bg-usdt-green/15 text-usdt-green'
                              : s.status === 'VOIDED'
                                ? 'bg-error-red/15 text-error-red'
                                : 'bg-gold/15 text-gold'
                          }`}
                        >
                          {s.status}
                        </span>
                        <span className="text-[11px] font-mono text-text-secondary truncate">@{s.telegramUserId} · {s.gameId}</span>
                      </div>
                      <span className="text-[11px] font-mono text-text-tertiary shrink-0">
                        {s.score} pts · 💎{s.crystalsEarned}{s.usdtEarned ? ` · ₮${s.usdtEarned}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
