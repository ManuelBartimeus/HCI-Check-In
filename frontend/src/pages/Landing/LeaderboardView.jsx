import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Trophy, Star } from 'lucide-react';
import { getMedal } from '@/utils/formatters';

export default function LeaderboardView({ result, onClose }) {
  const { leaderboard, total, checked_in_member_id, checked_in_rank, percentage_ahead } = result.leaderboard;
  const highlightRef = useRef(null);

  // Auto-scroll to checked-in member
  useEffect(() => {
    const timer = setTimeout(() => {
      highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-canvas/95 backdrop-blur-md flex flex-col"
    >
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-[0.08]"
          style={{ background: 'radial-gradient(ellipse, #6a4cf5 0%, transparent 70%)' }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-5 border-b border-hairline">
        <div className="flex items-center gap-3">
          <Trophy size={18} className="text-gradient-violet" style={{ color: '#a78bfa' }} />
          <div>
            <h2 className="text-[16px] font-semibold text-ink tracking-tight">Leaderboard</h2>
            {total > 0 && (
              <p className="text-[12px] text-ink-muted">{total} members</p>
            )}
          </div>
        </div>
        <button onClick={onClose} className="btn-icon" aria-label="Close leaderboard">
          <X size={16} />
        </button>
      </div>

      {/* Percentage ahead banner */}
      {percentage_ahead !== null && percentage_ahead !== undefined && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative z-10 mx-4 sm:mx-6 mt-4"
        >
          <div className="spotlight-card spotlight-violet text-center py-5 rounded-2xl">
            <Star size={20} className="text-white/80 mx-auto mb-2" />
            <p className="text-[22px] font-bold text-white mb-1">
              You are ahead of{' '}
              <span className="text-yellow-300">{percentage_ahead}%</span>{' '}
              of members.
            </p>
            <p className="text-[13px] text-white/70">Keep showing up. 🙏</p>
          </div>
        </motion.div>
      )}

      {/* Leaderboard list */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-6 py-4">
        <div className="max-w-lg mx-auto space-y-1.5">
          {leaderboard?.map((entry, index) => {
            const isHighlighted = entry.id === checked_in_member_id;
            const medal = getMedal(entry.rank);

            return (
              <motion.div
                key={entry.id}
                ref={isHighlighted ? highlightRef : null}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 + index * 0.02, duration: 0.3 }}
                className={`relative flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all duration-300 ${
                  isHighlighted
                    ? 'bg-surface-2 border-gradient-violet/50 shadow-[0_0_20px_rgba(106,76,245,0.2)]'
                    : 'bg-surface-1 border-hairline blur-row'
                }`}
                aria-current={isHighlighted ? 'true' : undefined}
              >
                {/* Rank */}
                <div className={`w-8 text-center font-bold flex-shrink-0 ${
                  medal ? 'text-[18px]' : 'text-[13px] text-ink-muted'
                }`}>
                  {medal || `#${entry.rank}`}
                </div>

                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 ${
                  isHighlighted ? 'spotlight-violet text-white' : 'bg-surface-2 text-ink-muted'
                }`}>
                  {entry.name.charAt(0)}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <div className={`text-[14px] font-medium truncate ${
                    isHighlighted ? 'text-ink' : 'text-ink-muted'
                  }`}>
                    {entry.name}
                  </div>
                  {isHighlighted && (
                    <div className="text-[11px] text-gradient-violet" style={{ color: '#a78bfa' }}>
                      Rank #{entry.rank}
                    </div>
                  )}
                </div>

                {/* Points */}
                <div className={`text-right flex-shrink-0 ${isHighlighted ? 'text-ink' : 'text-ink-muted'}`}>
                  <div className="text-[14px] font-semibold">{entry.points}</div>
                  <div className="text-[11px] opacity-60">pts</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Close button at bottom */}
      <div className="relative z-10 flex justify-center py-5 border-t border-hairline">
        <button onClick={onClose} className="btn-secondary px-8">
          Done
        </button>
      </div>
    </motion.div>
  );
}
