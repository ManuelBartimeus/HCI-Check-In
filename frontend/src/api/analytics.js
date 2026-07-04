import api from './index';

export const getDashboardStats = () => api.get('/analytics/dashboard');

export const getAttendanceTrends = (days = 30) =>
  api.get('/analytics/trends', { params: { days } });

export const getMeetingAnalytics = () => api.get('/analytics/meetings');

export const getMemberAnalytics = (limit = 20) =>
  api.get('/analytics/members', { params: { limit } });

export const getHeatmap = () => api.get('/analytics/heatmap');
