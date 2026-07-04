import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Trash2, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { listAttendance, deleteAttendance } from '@/api/attendance';
import { listMeetings } from '@/api/meetings';
import { Skeleton, SkeletonRow } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import { formatDateTime, timeAgo } from '@/utils/formatters';
import toast from 'react-hot-toast';

export default function Attendance() {
  const [data, setData] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ meeting_id: '', date_from: '', date_to: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const PER_PAGE = 30;

  useEffect(() => {
    listMeetings().then(r => setMeetings(r.data || [])).catch(() => {});
  }, []);

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, per_page: PER_PAGE, ...filters };
      Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
      const { data: res } = await listAttendance(params);
      setData(res);
    } catch { toast.error('Failed to load attendance'); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { fetchAttendance(); }, [page, filters]);

  function applyFilter(key, val) {
    setPage(1);
    setFilters(f => ({ ...f, [key]: val }));
  }

  async function handleDelete(a) {
    try {
      await deleteAttendance(a.id);
      toast.success('Attendance record removed and points reversed');
      fetchAttendance();
    } catch { toast.error('Delete failed'); }
    setDeleteConfirm(null);
  }

  function exportCSV() {
    const params = new URLSearchParams({ ...filters });
    window.open(`/api/export/attendance/csv?${params}&token=${localStorage.getItem('access_token')}`, '_blank');
  }
  function exportExcel() {
    const params = new URLSearchParams({ ...filters });
    window.open(`/api/export/attendance/excel?${params}&token=${localStorage.getItem('access_token')}`, '_blank');
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-display-md text-ink" style={{ fontFamily: "'Mona Sans', sans-serif" }}>Attendance</h1>
          <p className="text-[13px] text-ink-muted mt-0.5">{data?.total || 0} total records</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-secondary text-[13px]">
            <Download size={13} /> CSV
          </button>
          <button onClick={exportExcel} className="btn-secondary text-[13px]">
            <Download size={13} /> Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={filters.meeting_id}
          onChange={e => applyFilter('meeting_id', e.target.value)}
          className="input w-auto text-[13px] flex-1 min-w-[160px]"
          aria-label="Filter by meeting"
        >
          <option value="">All Meetings</option>
          {meetings.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <input
          type="date"
          value={filters.date_from}
          onChange={e => applyFilter('date_from', e.target.value)}
          className="input w-auto text-[13px]"
          aria-label="From date"
        />
        <input
          type="date"
          value={filters.date_to}
          onChange={e => applyFilter('date_to', e.target.value)}
          className="input w-auto text-[13px]"
          aria-label="To date"
        />
        {Object.values(filters).some(Boolean) && (
          <button
            onClick={() => { setFilters({ meeting_id: '', date_from: '', date_to: '' }); setPage(1); }}
            className="btn-ghost text-[13px]"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Meeting</th>
                <th>Date & Time</th>
                <th>Points</th>
                <th>Status</th>
                <th>Source</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(8).fill(0).map((_, i) => <SkeletonRow key={i} cols={7} />)
              ) : data?.items?.length === 0 ? (
                <tr><td colSpan={7}>
                  <EmptyState icon={ClipboardList} title="No records found" description="No attendance records match your filters." />
                </td></tr>
              ) : (
                data?.items?.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full spotlight-violet flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                          {a.member_name?.charAt(0)}
                        </div>
                        <span className="text-[13px] font-medium text-ink">{a.member_name}</span>
                      </div>
                    </td>
                    <td className="text-[13px] text-ink">{a.meeting_name}</td>
                    <td>
                      <div className="text-[13px] text-ink">{formatDateTime(a.timestamp)}</div>
                      <div className="text-[11px] text-ink-muted">{timeAgo(a.timestamp)}</div>
                    </td>
                    <td><span className="text-semantic-success font-medium text-[13px]">+{a.points_awarded}</span></td>
                    <td><span className={`badge ${a.status === 'present' ? 'badge-success' : 'badge-neutral'}`}>{a.status}</span></td>
                    <td><span className="badge badge-neutral text-[11px]">{a.source}</span></td>
                    <td>
                      <div className="flex justify-end">
                        <button
                          onClick={() => setDeleteConfirm(a)}
                          className="btn-icon !w-7 !h-7 hover:!bg-red-500/10 hover:!text-red-400"
                          aria-label="Remove attendance"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-hairline">
            <span className="text-[12px] text-ink-muted">Page {data.page} of {data.pages} · {data.total} records</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-icon !w-7 !h-7 disabled:opacity-30" aria-label="Previous">
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages} className="btn-icon !w-7 !h-7 disabled:opacity-30" aria-label="Next">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Remove Attendance" size="sm">
        <p className="text-[14px] text-ink-muted mb-6">
          Remove this check-in for <strong className="text-ink">{deleteConfirm?.member_name}</strong>?
          Their points will be reversed.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">Cancel</button>
          <button onClick={() => handleDelete(deleteConfirm)} className="btn-danger">Remove</button>
        </div>
      </Modal>
    </div>
  );
}
