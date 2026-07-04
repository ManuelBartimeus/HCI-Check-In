import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, RotateCcw, Download, RefreshCw, AlertTriangle } from 'lucide-react';
import { getLeaderboard, resetLeaderboard, recalculateLeaderboard } from '@/api/leaderboard';
import { Skeleton } from '@/components/ui/Skeleton';
import Modal from '@/components/ui/Modal';
import { getMedal, formatCompact } from '@/utils/formatters';
import toast from 'react-hot-toast';

export default function AdminLeaderboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  async function fetchLeaderboard() {
    setLoading(true);
    try {
      const { data: res } = await getLeaderboard();
      setData(res);
    } catch { toast.error('Failed to load leaderboard'); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchLeaderboard(); }, []);

  async function handleReset() {
    setResetting(true);
    try {
      await resetLeaderboard();
      toast.success('Leaderboard reset — all points cleared');
      fetchLeaderboard();
    } catch { toast.error('Reset failed'); }
    finally { setResetting(false); setShowResetConfirm(false); }
  }

  async function handleRecalculate() {
    setRecalculating(true);
    try {
      const { data: res } = await recalculateLeaderboard();
      toast.success(res.message || 'Rankings recalculated');
      fetchLeaderboard();
    } catch { toast.error('Recalculate failed'); }
    finally { setRecalculating(false); }
  }

  function exportCSV() {
    window.open('/api/export/leaderboard/csv', '_blank');
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-display-md text-ink" style={{ fontFamily: "'Mona Sans', sans-serif" }}>Leaderboard</h1>
          <p className="text-[13px] text-ink-muted mt-0.5">{data?.total || 0} members ranked</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleRecalculate} disabled={recalculating} className="btn-secondary text-[13px]">
            <RefreshCw size={13} className={recalculating ? 'animate-spin' : ''} />
            Recalculate
          </button>
          <button onClick={exportCSV} className="btn-secondary text-[13px]">
            <Download size={13} /> Export
          </button>
          <button onClick={() => setShowResetConfirm(true)} className="btn-danger text-[13px]">
            <RotateCcw size={13} /> Reset
          </button>
        </div>
      </div>

      {/* Spotlight cards for top 3 */}
      {!loading && data?.leaderboard?.length >= 3 && (
        <div className="grid grid-cols-3 gap-3">
          {[1, 0, 2].map((idx) => {
            const entry = data.leaderboard[idx];
            if (!entry) return null;
            const spotlightClass = idx === 0 ? 'spotlight-violet' : idx === 1 ? 'bg-surface-2' : 'bg-surface-2';
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className={`rounded-2xl p-4 text-center ${spotlightClass} ${idx !== 0 ? 'border border-hairline' : ''}`}
              >
                <div className="text-[24px] mb-1">{getMedal(entry.rank)}</div>
                <div className="text-[12px] font-semibold text-white truncate">{entry.name}</div>
                <div className="text-[11px] text-white/70">{formatCompact(entry.points)} pts</div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Full table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Member</th>
                <th>Points</th>
                <th>Medal</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(10).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(4).fill(0).map((_, j) => (
                      <td key={j} className="px-4 py-3 border-b border-hairline-soft">
                        <Skeleton className="h-3" style={{ width: `${50 + j * 15}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                data?.leaderboard?.map((entry) => {
                  const medal = getMedal(entry.rank);
                  return (
                    <motion.tr
                      key={entry.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={entry.rank <= 3 ? 'bg-surface-2/40' : ''}
                    >
                      <td>
                        <span className="text-[14px] font-bold text-ink-muted">#{entry.rank}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 ${
                            entry.rank === 1 ? 'spotlight-violet' : 'bg-surface-2'
                          }`}>
                            {entry.name.charAt(0)}
                          </div>
                          <span className="text-[14px] font-medium text-ink">{entry.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="text-[14px] font-semibold text-ink">{formatCompact(entry.points)}</span>
                      </td>
                      <td>
                        {medal ? <span className="text-[18px]">{medal}</span> : <span className="text-ink-muted text-[13px]">—</span>}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reset confirm */}
      <Modal isOpen={showResetConfirm} onClose={() => setShowResetConfirm(false)} title="Reset Leaderboard" size="sm">
        <div className="flex items-start gap-3 mb-5">
          <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-[14px] text-ink-muted">
            This will <strong className="text-red-400">permanently delete all attendance records</strong> and
            reset every member's points to zero. This action cannot be undone.
          </p>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setShowResetConfirm(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleReset} disabled={resetting} className="btn-danger">
            {resetting ? 'Resetting…' : 'Yes, Reset Everything'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
