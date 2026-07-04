import api from './index';

export const getLeaderboard = (params) =>
  api.get('/leaderboard', { params });

export const resetLeaderboard = () => api.post('/leaderboard/reset');

export const recalculateLeaderboard = () => api.post('/leaderboard/recalculate');
