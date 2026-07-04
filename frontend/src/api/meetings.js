import api from './index';

export const listMeetings = (params) =>
  api.get('/meetings', { params });

export const getActiveMeetings = () => api.get('/meetings/active');

export const getMeeting = (id) => api.get(`/meetings/${id}`);

export const createMeeting = (data) => api.post('/meetings', data);

export const updateMeeting = (id, data) => api.put(`/meetings/${id}`, data);

export const deleteMeeting = (id) => api.delete(`/meetings/${id}`);

export const toggleMeeting = (id) => api.patch(`/meetings/${id}/toggle`);

export const archiveMeeting = (id) => api.patch(`/meetings/${id}/archive`);
