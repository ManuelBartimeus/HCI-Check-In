import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, CalendarDays, UserCheck, TrendingUp, Award, BarChart2,
  Trophy, Clock, Activity, Zap, Star, ArrowRight,
} from 'lucide-react';
import { getDashboardStats } from '@/api/analytics';
import { getAttendanceTrends } from '@/api/analytics';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCompact, timeAgo, formatDate, formatTime } from '@/utils/formatters';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, LineChart, Line, Tooltip, XAxis,
} from 'recharts';

function StatCard({ label, value, icon: Icon, accent, sub, delay = 0 }) {
  const accentStyles = {
    violet: 'spotlight-violet',
    magenta: 'spotlight-magenta',
    orange: 'spotlight-orange',
    default: 'bg-surface-2',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="card p-5 flex gap-4 items-start"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accentStyles[accent] || accentStyles.default}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[12px] text-ink-muted mb-1 uppercase tracking-[0.05em]">{label}</div>
        <div className="text-[24px] font-bold text-ink leading-none tracking-tight">
          {value ?? <Skeleton className="h-6 w-16" />}
        </div>
        {sub && <div className="text-[12px] text-ink-muted mt-1">{sub}</div>}
      </div>
    </motion.div>
  );
}

function MiniTrendChart({ data }) {
  if (!data || data.length === 0) return null;
  return (
    <div className="h-16">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone" dataKey="count" stroke="#6a4cf5"
            strokeWidth={2} dot={false} activeDot={{ r: 3, fill: '#6a4cf5' }}
          />
          <Tooltip
            contentStyle={{ background: '#1c1c1c', border: '1px solid #262626', borderRadius: 8, fontSize: 12 }}
            labelFormatter={(l) => formatDate(l, 'MMM d')}
            formatter={(v) => [v, 'Check-ins']}
          />
          <XAxis dataKey="date" hide />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDashboardStats(), getAttendanceTrends(14)])
      .then(([s, t]) => {
        setStats(s.data);
        setTrends(t.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const cards = stats ? [
    { label: 'Total Members', value: formatCompact(stats.total_members), icon: Users, accent: 'violet' },
    { label: 'Total Meetings', value: formatCompact(stats.total_meetings), icon: CalendarDays, accent: 'default' },
    { label: 'Today', value: stats.attendance_today, icon: UserCheck, accent: 'default' },
    { label: 'This Week', value: formatCompact(stats.attendance_week), icon: TrendingUp, accent: 'default' },
    { label: 'This Month', value: formatCompact(stats.attendance_month), icon: BarChart2, accent: 'default' },
    { label: 'Avg Attendance %', value: `${stats.avg_attendance_pct}%`, icon: Activity, accent: 'default' },
    { label: 'Total Check-ins', value: formatCompact(stats.total_checkins), icon: Zap, accent: 'magenta', sub: 'all time' },
    { label: 'Points Awarded', value: formatCompact(stats.total_points_awarded), icon: Star, accent: 'orange', sub: 'all time' },
    { label: 'Top Meeting', value: stats.top_attended_meeting, icon: Trophy, accent: 'default', sub: `${stats.top_attended_count} check-ins` },
    { label: 'Lowest Meeting', value: stats.lowest_attended_meeting, icon: Award, accent: 'default', sub: `${stats.lowest_attended_count} check-ins` },
  ] : Array(10).fill(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-display-md text-ink" style={{ fontFamily: "'Mona Sans', sans-serif" }}>
          Dashboard
        </h1>
        <p className="text-[14px] text-ink-muted mt-1">Church attendance overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {cards.map((card, i) =>
          loading ? (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ) : (
            <StatCard key={card.label} {...card} delay={i * 0.04} />
          )
        )}
      </div>

      {/* Trend chart + upcoming + recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-semibold text-ink">Attendance Trend (14 days)</h2>
            <Link to="/admin/analytics" className="text-[12px] text-accent-blue hover:underline flex items-center gap-1">
              Full analytics <ArrowRight size={12} />
            </Link>
          </div>
          {loading ? <Skeleton className="h-16" /> : <MiniTrendChart data={trends} />}
        </div>

        {/* Upcoming meeting */}
        <div className="card p-5">
          <h2 className="text-[14px] font-semibold text-ink mb-4">Upcoming Meeting</h2>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ) : stats?.upcoming_meeting ? (
            <div className="space-y-2">
              <div className="text-[14px] font-medium text-ink">{stats.upcoming_meeting.name}</div>
              <div className="flex items-center gap-2 text-[12px] text-ink-muted">
                <Clock size={12} />
                {formatDate(stats.upcoming_meeting.next_date)} · {formatTime(stats.upcoming_meeting.start_time)}
              </div>
              <div className="badge badge-violet mt-2">+{stats.upcoming_meeting.points} pts</div>
            </div>
          ) : (
            <p className="text-[13px] text-ink-muted">No upcoming meetings</p>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-semibold text-ink">Recent Activity</h2>
          <Link to="/admin/attendance" className="text-[12px] text-accent-blue hover:underline flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        {loading ? (
          <div className="space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex gap-3 items-center">
                <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-2.5 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {(stats?.recent_activity || []).map((a, i) => (
              <div key={a.id} className="flex items-center gap-3 py-2.5 border-b border-hairline-soft last:border-0">
                <div className="w-7 h-7 rounded-full spotlight-violet flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                  {a.member_name?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-ink truncate">{a.member_name}</div>
                  <div className="text-[11px] text-ink-muted truncate">{a.meeting_name}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[12px] text-semantic-success">+{a.points_awarded}pts</div>
                  <div className="text-[11px] text-ink-muted">{timeAgo(a.timestamp)}</div>
                </div>
              </div>
            ))}
            {(!stats?.recent_activity || stats.recent_activity.length === 0) && (
              <p className="text-[13px] text-ink-muted text-center py-4">No activity yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
