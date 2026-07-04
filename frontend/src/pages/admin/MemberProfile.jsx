import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Flame, Star, CalendarDays, TrendingUp } from 'lucide-react';
import { getMemberProfile } from '@/api/members';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate, formatDateTime, getMedal, formatCompact } from '@/utils/formatters';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, Tooltip,
} from 'recharts';

export default function MemberProfile() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMemberProfile(id)
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!data) return <div className="text-ink-muted">Member not found.</div>;

  const { member, rank, total_members, attendance_history, points_history,
          current_streak, longest_streak, meetings_attended, meetings_missed } = data;

  const medal = getMedal(rank);

  return (
    <div className="space-y-5">
      {/* Back */}
      <Link to="/admin/members" className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-ink transition-colors">
        <ArrowLeft size={14} /> All Members
      </Link>

      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center"
      >
        {/* Avatar */}
        <div className="w-16 h-16 rounded-2xl spotlight-violet flex items-center justify-center text-white text-[28px] font-bold flex-shrink-0">
          {member.name.charAt(0)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {medal && <span className="text-[20px]">{medal}</span>}
            <h1 className="text-[22px] font-bold text-ink tracking-tight">{member.name}</h1>
          </div>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-[13px] text-ink-muted">
              <Trophy size={13} className="text-gradient-violet" style={{ color: '#a78bfa' }} />
              Rank #{rank || '—'} of {total_members}
            </div>
            <div className="flex items-center gap-1.5 text-[13px] text-ink-muted">
              <Star size={13} />
              {formatCompact(member.points)} points
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-5 flex-shrink-0 flex-wrap">
          {[
            { label: 'Streak', value: `${current_streak}d`, icon: Flame },
            { label: 'Longest', value: `${longest_streak}d`, icon: TrendingUp },
            { label: 'Attended', value: meetings_attended, icon: CalendarDays },
            { label: 'Missed', value: meetings_missed, icon: CalendarDays },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="text-center">
              <div className="text-[20px] font-bold text-ink">{value}</div>
              <div className="text-[11px] text-ink-muted mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Points history chart */}
      {points_history?.length > 0 && (
        <div className="card p-5">
          <h2 className="text-[14px] font-semibold text-ink mb-4">Points Over Time</h2>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={points_history}>
                <defs>
                  <linearGradient id="ptGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6a4cf5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6a4cf5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="points" stroke="#6a4cf5" fill="url(#ptGrad)" strokeWidth={2} dot={false} />
                <XAxis dataKey="date" hide />
                <Tooltip
                  contentStyle={{ background: '#1c1c1c', border: '1px solid #262626', borderRadius: 8, fontSize: 12 }}
                  formatter={(v, n, p) => [`${v} pts`, 'Total Points']}
                  labelFormatter={(l) => formatDate(l, 'MMM d, yyyy')}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Attendance history */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-hairline">
          <h2 className="text-[14px] font-semibold text-ink">Attendance History</h2>
          <p className="text-[12px] text-ink-muted mt-1">{attendance_history?.length || 0} records</p>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Meeting</th>
                <th>Date & Time</th>
                <th>Points</th>
                <th>Status</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {attendance_history?.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-ink-muted text-[13px]">No attendance records yet</td></tr>
              ) : (
                attendance_history?.map(a => (
                  <tr key={a.id}>
                    <td className="text-[13px] font-medium text-ink">{a.meeting_name}</td>
                    <td className="text-[13px] text-ink-muted">{formatDateTime(a.timestamp)}</td>
                    <td><span className="text-semantic-success font-medium text-[13px]">+{a.points_awarded}</span></td>
                    <td><span className={`badge ${a.status === 'present' ? 'badge-success' : 'badge-neutral'}`}>{a.status}</span></td>
                    <td><span className="badge badge-neutral">{a.source}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
