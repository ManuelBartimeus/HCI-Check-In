/**
 * Zustand auth store — persists JWT token and admin user info.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      token: null,
      user: null,

      login: (token, user) => {
        localStorage.setItem('access_token', token);
        set({ isAuthenticated: true, token, user });
      },

      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('auth_user');
        set({ isAuthenticated: false, token: null, user: null });
      },

      getToken: () => get().token,
    }),
    {
      name: 'church-auth',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        user: state.user,
      }),
    }
  )
);
