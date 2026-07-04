import api from './index';

export const checkin = (memberId) =>
  api.post('/attendance/checkin', { member_id: memberId });

export const listAttendance = (params) =>
  api.get('/attendance', { params });

export const getAttendance = (id) => api.get(`/attendance/${id}`);

export const updateAttendance = (id, data) => api.patch(`/attendance/${id}`, data);

export const deleteAttendance = (id) => api.delete(`/attendance/${id}`);

export const manualCheckin = (data) => api.post('/attendance/manual', data);
