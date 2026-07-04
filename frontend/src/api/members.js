import api from './index';

export const searchMembers = (q, limit = 10) =>
  api.get('/members/search', { params: { q, limit } });

export const listMembers = (params) =>
  api.get('/members', { params });

export const getMember = (id) => api.get(`/members/${id}`);

export const getMemberProfile = (id) => api.get(`/members/${id}/profile`);

export const createMember = (data) => api.post('/members', data);

export const updateMember = (id, data) => api.put(`/members/${id}`, data);

export const deleteMember = (id) => api.delete(`/members/${id}`);
