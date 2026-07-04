import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts';
import { Skeleton } from '@/components/ui/Skeleton';
import { getDashboardStats, getAttendanceTrends, getMeetingAnalytics, getMemberAnalytics } from '@/api/analytics';
import { formatDate } from '@/utils/formatters';

const COLORS = ['#6a4cf5', '#d44df0', '#ff7a3d', '#ff5577', '#22c55e', '#0099ff'];

function ChartCard({ title, children, span = 1 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card p-5 ${span === 2 ? 'lg:col-span-2' : ''}`}
    >
      <h3 className="text-[14px] font-semibold text-ink mb-4">{title}</h3>
      {children}
    </motion.div>
  );
}

const tooltipStyle = {
  contentStyle: { background: '#1c1c1c', border: '1px solid #262626', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#999' },
};

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [trends30, setTrends30] = useState([]);
  const [meetingData, setMeetingData] = useState([]);
  const [memberData, setMemberData] = useState({ top_members: [], inactive_members: [] });
  const [stats, setStats] = useState(null);

  useEffect(() => {
    Promise.all([
      getAttendanceTrends(30),
      getMeetingAnalytics(),
      getMemberAnalytics(10),
      getDashboardStats(),
    ]).then(([t, m, mb, s]) => {
      setTrends30(t.data || []);
      setMeetingData(m.data || []);
      setMemberData(mb.data || {});
      setStats(s.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
        </div>
      </div>
    );
  }

  // Points distribution from top members
  const pointsData = (memberData.top_members || []).map(m => ({
    name: m.name.split(' ')[0],
    points: m.points,
  }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-display-md text-ink" style={{ fontFamily: "'Mona Sans', sans-serif" }}>Analytics</h1>
        <p className="text-[13px] text-ink-muted mt-0.5">Attendance insights and trends</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Attendance trend - 30 days */}
        <ChartCard title="30-Day Attendance Trend" span={2}>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends30}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6a4cf5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6a4cf5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis dataKey="date" tickFormatter={(d) => formatDate(d, 'MMM d')} tick={{ fill: '#999', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#999', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip {...tooltipStyle} labelFormatter={(l) => formatDate(l, 'MMM d, yyyy')} formatter={(v) => [v, 'Check-ins']} />
                <Area type="monotone" dataKey="count" stroke="#6a4cf5" fill="url(#trendGrad)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Meeting popularity */}
        <ChartCard title="Meeting Popularity">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={meetingData.slice(0, 6)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#999', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#fff', fontSize: 11 }} tickLine={false} axisLine={false} width={100} />
                <Tooltip {...tooltipStyle} formatter={(v) => [v, 'Check-ins']} />
                <Bar dataKey="total_checkins" radius={[0, 4, 4, 0]}>
                  {meetingData.slice(0, 6).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Top 10 members */}
        <ChartCard title="Top Members by Points">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pointsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis dataKey="name" tick={{ fill: '#999', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#999', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip {...tooltipStyle} formatter={(v) => [v, 'Points']} />
                <Bar dataKey="points" radius={[4, 4, 0, 0]}>
                  {pointsData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#6a4cf5'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Meeting points distribution pie */}
        <ChartCard title="Points Per Meeting">
          <div className="h-52 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={meetingData}
                  dataKey="total_checkins"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#444' }}
                >
                  {meetingData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} formatter={(v, n) => [v, 'Check-ins']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Inactive members */}
        <ChartCard title="Inactive Members (30 days)" span={2}>
          {memberData.inactive_members?.length === 0 ? (
            <p className="text-[13px] text-ink-muted text-center py-4">🎉 All members have been active in the last 30 days!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Points</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {memberData.inactive_members?.slice(0, 10).map(m => (
                    <tr key={m.id}>
                      <td className="text-[13px] font-medium text-ink">{m.name}</td>
                      <td className="text-[13px] text-ink-muted">{m.points}</td>
                      <td className="text-[13px] text-ink-muted">{formatDate(m.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
