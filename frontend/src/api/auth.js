import api from './index';

export const login = (username, password) =>
  api.post('/auth/login', { username, password });

export const logout = () => api.post('/auth/logout');

export const getMe = () => api.get('/auth/me');
