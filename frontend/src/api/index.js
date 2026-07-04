/**
 * Axios API client with JWT interceptor and base URL configuration.
 */
import axios from 'axios';

const rawUrl = import.meta.env.VITE_API_URL || '';
const base = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl.replace(/\/$/, '')}/api`;

const api = axios.create({
  baseURL: base,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Request interceptor: attach JWT ────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 ───────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired / invalid — clear auth and redirect
      localStorage.removeItem('access_token');
      localStorage.removeItem('auth_user');
      // Soft redirect (don't use navigate here — outside React tree)
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
