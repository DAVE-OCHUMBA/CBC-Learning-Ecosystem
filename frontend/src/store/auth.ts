/**
 * Auth store — CBC Learning Ecosystem
 * Manages JWT tokens, user session, and login/logout state via Zustand.
 *
 * Security note (BUG-10 fix preserved): stores tokens in sessionStorage, NOT
 * localStorage, so they don't persist across browser sessions on shared lab PCs.
 */

import { create } from 'zustand';
import axios from 'axios';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export type UserRole = 'super_admin' | 'school_admin' | 'teacher' | 'parent' | 'student';

export interface AuthUser {
  id: number;
  schoolId: number;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  fullName: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login:  (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

// Restore session from sessionStorage on page reload
function loadSession(): { user: AuthUser | null; token: string | null } {
  try {
    const token = sessionStorage.getItem('cbc_token');
    const user  = sessionStorage.getItem('cbc_user');
    if (token && user) return { token, user: JSON.parse(user) };
  } catch { /* ignore */ }
  return { user: null, token: null };
}

const { user: initialUser, token: initialToken } = loadSession();

export const useAuthStore = create<AuthState>((set) => ({
  user:            initialUser,
  token:           initialToken,
  isAuthenticated: !!initialToken,
  isLoading:       false,
  error:           null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await axios.post(`${API}/api/v1/auth/login`, { email, password });
      const { token, user } = data;

      // sessionStorage: cleared when the browser tab closes (safe for shared PCs)
      sessionStorage.setItem('cbc_token',  token);
      sessionStorage.setItem('cbc_user',   JSON.stringify(user));

      // Attach token to all future Axios requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      set({ user, token, isAuthenticated: true, isLoading: false, error: null });
    } catch (err: any) {
      const message = err.response?.data?.message || 'Login failed. Check your credentials.';
      set({ isLoading: false, error: message });
    }
  },

  logout: () => {
    sessionStorage.removeItem('cbc_token');
    sessionStorage.removeItem('cbc_user');
    delete axios.defaults.headers.common['Authorization'];
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  clearError: () => set({ error: null }),
}));
