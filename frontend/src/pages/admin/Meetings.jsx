import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Power, Archive, CalendarDays } from 'lucide-react';
import { listMeetings, createMeeting, updateMeeting, deleteMeeting, toggleMeeting, archiveMeeting } from '@/api/meetings';
import Modal from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { formatDate, formatTime, shortDay } from '@/utils/formatters';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function MeetingForm({ meeting, onSaved, onClose }) {
  const { register, handleSubmit, watch, formState: { errors }, setValue, reset } = useForm({
    defaultValues: {
      name: meeting?.name || '',
      description: meeting?.description || '',
      meeting_type: meeting?.meeting_type || 'recurring',
      points: meeting?.points || 3,
      days: meeting?.days || [],
      start_date: meeting?.start_date || '2026-05-24',
      end_date: meeting?.end_date || '2026-09-19',
      start_time: meeting?.start_time || '18:00',
      end_time: meeting?.end_time || '20:00',
    },
  });

  const meetingType = watch('meeting_type');
  const selectedDays = watch('days') || [];

  function toggleDay(day) {
    const current = watch('days') || [];
    const next = current.includes(day) ? current.filter(d => d !== day) : [...current, day];
    setValue('days', next);
  }

  async function onSubmit(data) {
    try {
      if (meeting) {
        await updateMeeting(meeting.id, data);
        toast.success('Meeting updated');
      } else {
        await createMeeting(data);
        toast.success('Meeting created');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error saving meeting');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-[13px] text-ink-muted mb-1.5">Meeting Name *</label>
          <input {...register('name', { required: 'Required' })} className="input" placeholder="e.g. Sunday Family Service" />
          {errors.name && <p className="text-[12px] text-red-400 mt-1">{errors.name.message}</p>}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[13px] text-ink-muted mb-1.5">Description</label>
          <textarea {...register('description')} className="input resize-none" rows={2} placeholder="Optional description" />
        </div>

        <div>
          <label className="block text-[13px] text-ink-muted mb-1.5">Type *</label>
          <select {...register('meeting_type')} className="input">
            <option value="recurring">Recurring</option>
            <option value="one-time">One-Time</option>
          </select>
        </div>

        <div>
          <label className="block text-[13px] text-ink-muted mb-1.5">Points *</label>
          <input type="number" min="0" {...register('points', { required: 'Required', min: 0 })} className="input" />
        </div>

        <div>
          <label className="block text-[13px] text-ink-muted mb-1.5">Start Time *</label>
          <input type="time" {...register('start_time', { required: 'Required' })} className="input" />
        </div>
        <div>
          <label className="block text-[13px] text-ink-muted mb-1.5">End Time *</label>
          <input type="time" {...register('end_time', { required: 'Required' })} className="input" />
        </div>

        <div>
          <label className="block text-[13px] text-ink-muted mb-1.5">Start Date *</label>
          <input type="date" {...register('start_date', { required: 'Required' })} className="input" />
        </div>
        <div>
          <label className="block text-[13px] text-ink-muted mb-1.5">End Date</label>
          <input type="date" {...register('end_date')} className="input" />
        </div>

        {meetingType === 'recurring' && (
          <div className="sm:col-span-2">
            <label className="block text-[13px] text-ink-muted mb-2">Recurrence Days *</label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map(day => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-1.5 rounded-pill text-[12px] font-medium transition-all ${
                    selectedDays.includes(day)
                      ? 'spotlight-violet text-white'
                      : 'bg-surface-2 text-ink-muted hover:text-ink'
                  }`}
                >
                  {shortDay(day)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary">{meeting ? 'Update' : 'Create Meeting'}</button>
      </div>
    </form>
  );
}

function MeetingCard({ meeting, onEdit, onDelete, onToggle, onArchive }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`card p-5 ${!meeting.is_active ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[14px] font-semibold text-ink">{meeting.name}</h3>
            <span className={`badge ${meeting.is_active ? 'badge-success' : 'badge-neutral'}`}>
              {meeting.is_archived ? 'Archived' : meeting.is_active ? 'Active' : 'Paused'}
            </span>
          </div>
          {meeting.description && (
            <p className="text-[12px] text-ink-muted mt-1 truncate">{meeting.description}</p>
          )}
        </div>
        <div className="badge badge-violet flex-shrink-0">+{meeting.points}pts</div>
      </div>

      {/* Schedule info */}
      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-[12px] text-ink-muted">
          <CalendarDays size={12} />
          {meeting.meeting_type === 'recurring'
            ? meeting.days?.map(d => shortDay(d)).join(', ')
            : 'One-time'}
        </div>
        <div className="text-[12px] text-ink-muted">
          {formatTime(meeting.start_time)} – {formatTime(meeting.end_time)}
        </div>
        <div className="text-[12px] text-ink-muted">
          {formatDate(meeting.start_date)} → {meeting.end_date ? formatDate(meeting.end_date) : '∞'}
        </div>
      </div>

      {/* Stats */}
      <div className="text-[12px] text-ink-muted mb-4">
        {meeting.attendance_count || 0} total check-ins
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => onEdit(meeting)} className="btn-icon !w-8 !h-8" aria-label="Edit">
          <Pencil size={13} />
        </button>
        <button onClick={() => onToggle(meeting)} className="btn-icon !w-8 !h-8" aria-label="Toggle">
          <Power size={13} />
        </button>
        <button onClick={() => onArchive(meeting)} className="btn-icon !w-8 !h-8" aria-label="Archive">
          <Archive size={13} />
        </button>
        <button
          onClick={() => onDelete(meeting)}
          className="btn-icon !w-8 !h-8 hover:!bg-red-500/10 hover:!text-red-400"
          aria-label="Delete"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </motion.div>
  );
}

export default function Meetings() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMeeting, setEditMeeting] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await listMeetings({ archived: false });
      setMeetings(data || []);
    } catch { toast.error('Failed to load meetings'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMeetings(); }, []);

  async function handleToggle(m) {
    try {
      await toggleMeeting(m.id);
      toast.success(`Meeting ${m.is_active ? 'paused' : 'activated'}`);
      fetchMeetings();
    } catch { toast.error('Failed to toggle'); }
  }

  async function handleArchive(m) {
    try {
      await archiveMeeting(m.id);
      toast.success(`Meeting ${m.is_archived ? 'unarchived' : 'archived'}`);
      fetchMeetings();
    } catch { toast.error('Failed to archive'); }
  }

  async function handleDelete(m) {
    try {
      await deleteMeeting(m.id);
      toast.success('Meeting deleted');
      fetchMeetings();
    } catch { toast.error('Delete failed'); }
    setDeleteConfirm(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-display-md text-ink" style={{ fontFamily: "'Mona Sans', sans-serif" }}>Meetings</h1>
          <p className="text-[13px] text-ink-muted mt-0.5">{meetings.length} meetings configured</p>
        </div>
        <button onClick={() => { setEditMeeting(null); setShowModal(true); }} className="btn-primary">
          <Plus size={14} /> New Meeting
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : meetings.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No meetings yet" description="Create your first meeting to start tracking attendance." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {meetings.map(m => (
            <MeetingCard
              key={m.id}
              meeting={m}
              onEdit={(m) => { setEditMeeting(m); setShowModal(true); }}
              onDelete={setDeleteConfirm}
              onToggle={handleToggle}
              onArchive={handleArchive}
            />
          ))}
        </div>
      )}

      {/* Create/edit modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditMeeting(null); }}
        title={editMeeting ? 'Edit Meeting' : 'New Meeting'}
        size="lg"
      >
        <MeetingForm
          meeting={editMeeting}
          onSaved={fetchMeetings}
          onClose={() => { setShowModal(false); setEditMeeting(null); }}
        />
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Meeting" size="sm">
        <p className="text-[14px] text-ink-muted mb-6">
          Delete <strong className="text-ink">{deleteConfirm?.name}</strong>?
          All attendance records for this meeting will also be removed.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">Cancel</button>
          <button onClick={() => handleDelete(deleteConfirm)} className="btn-danger">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
