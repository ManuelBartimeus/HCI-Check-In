import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Trash2, Pencil, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { listMembers, createMember, updateMember, deleteMember } from '@/api/members';
import Modal from '@/components/ui/Modal';
import { Skeleton, SkeletonRow } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDate, formatCompact } from '@/utils/formatters';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

function MemberFormModal({ isOpen, onClose, member, onSaved }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { name: member?.name || '' },
  });

  useEffect(() => {
    reset({ name: member?.name || '' });
  }, [member, reset]);

  async function onSubmit({ name }) {
    try {
      if (member) {
        await updateMember(member.id, { name });
        toast.success('Member updated');
      } else {
        await createMember({ name });
        toast.success('Member added');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error saving member');
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={member ? 'Edit Member' : 'Add Member'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-[13px] text-ink-muted mb-1.5">Full Name</label>
          <input
            {...register('name', { required: 'Name is required', maxLength: { value: 200, message: 'Too long' } })}
            className="input"
            placeholder="e.g. Kwame Asante"
            autoFocus
          />
          {errors.name && <p className="text-[12px] text-red-400 mt-1">{errors.name.message}</p>}
        </div>
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary">{member ? 'Update' : 'Add Member'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Members() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('points');
  const [showModal, setShowModal] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const PER_PAGE = 20;

  const fetchMembers = useCallback(async (q = query, p = page) => {
    setLoading(true);
    try {
      const { data: res } = await listMembers({ page: p, per_page: PER_PAGE, q, sort, order: 'desc' });
      setData(res);
    } catch { toast.error('Failed to load members'); }
    finally { setLoading(false); }
  }, [query, page, sort]);

  useEffect(() => { fetchMembers(); }, [page, sort]);

  const doSearch = useCallback((q) => { setPage(1); fetchMembers(q, 1); }, [fetchMembers]);
  const debouncedSearch = useDebounce(doSearch, 300);

  async function handleDelete(member) {
    try {
      await deleteMember(member.id);
      toast.success(`${member.name} deleted`);
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    } finally { setDeleteConfirm(null); }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-display-md text-ink" style={{ fontFamily: "'Mona Sans', sans-serif" }}>Members</h1>
          <p className="text-[13px] text-ink-muted mt-0.5">{data?.total || 0} total members</p>
        </div>
        <button onClick={() => { setEditMember(null); setShowModal(true); }} className="btn-primary">
          <Plus size={14} /> Add Member
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            className="input pl-9 text-[14px]"
            placeholder="Search members…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); debouncedSearch(e.target.value); }}
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="input w-auto text-[13px]"
          aria-label="Sort by"
        >
          <option value="points">Sort: Points</option>
          <option value="name">Sort: Name</option>
          <option value="created_at">Sort: Date Added</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Points</th>
                <th>Attendance %</th>
                <th>Meetings</th>
                <th>Joined</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(8).fill(0).map((_, i) => <SkeletonRow key={i} cols={6} />)
              ) : data?.items?.length === 0 ? (
                <tr><td colSpan={6}>
                  <EmptyState icon={Users} title="No members found" description="Add your first member or adjust your search." />
                </td></tr>
              ) : (
                data?.items?.map((m) => (
                  <motion.tr key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <td>
                      <Link to={`/admin/members/${m.id}`} className="flex items-center gap-3 group">
                        <div className="w-7 h-7 rounded-full spotlight-violet flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                          {m.name.charAt(0)}
                        </div>
                        <span className="text-ink group-hover:text-accent-blue transition-colors text-[14px] font-medium">
                          {m.name}
                        </span>
                      </Link>
                    </td>
                    <td>
                      <span className="font-semibold text-ink">{formatCompact(m.points)}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 max-w-[80px] h-1.5 bg-surface-2 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-violet rounded-full"
                            style={{ width: `${Math.min(m.attendance_percentage || 0, 100)}%` }}
                          />
                        </div>
                        <span className="text-[12px] text-ink-muted">{m.attendance_percentage || 0}%</span>
                      </div>
                    </td>
                    <td><span className="text-[13px] text-ink-muted">{m.attendance_count || 0}</span></td>
                    <td><span className="text-[13px] text-ink-muted">{formatDate(m.created_at)}</span></td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditMember(m); setShowModal(true); }}
                          className="btn-icon !w-7 !h-7"
                          aria-label={`Edit ${m.name}`}
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(m)}
                          className="btn-icon !w-7 !h-7 hover:!bg-red-500/10 hover:!text-red-400"
                          aria-label={`Delete ${m.name}`}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-hairline">
            <span className="text-[12px] text-ink-muted">
              Page {data.page} of {data.pages} · {data.total} total
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-icon !w-7 !h-7 disabled:opacity-30"
                aria-label="Previous page"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                className="btn-icon !w-7 !h-7 disabled:opacity-30"
                aria-label="Next page"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Member form modal */}
      <MemberFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        member={editMember}
        onSaved={fetchMembers}
      />

      {/* Delete confirm modal */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Member" size="sm">
        <p className="text-[14px] text-ink-muted mb-6">
          Are you sure you want to delete <strong className="text-ink">{deleteConfirm?.name}</strong>?
          All their attendance records will also be removed.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">Cancel</button>
          <button onClick={() => handleDelete(deleteConfirm)} className="btn-danger">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
