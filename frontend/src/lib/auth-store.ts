import { create } from 'zustand';
import { api, clearAccessToken, getAccessToken, setAccessToken } from './api';

export type UserRole =
  | 'ADMIN'
  | 'ACADEMIC_STAFF'
  | 'MANAGER'
  | 'TEACHER'
  | 'STUDENT';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  studentId: number | null;
  teacherId: number | null;
}

interface LoginResponse {
  accessToken?: string;
  access_token?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<AuthUser>;
  fetchMe: () => Promise<AuthUser>;
  initialize: () => Promise<void>;
  logout: () => Promise<void>;
  clearSession: () => void;
}

const normalizeRole = (role: string): UserRole => {
  if (
    role === 'ADMIN' ||
    role === 'ACADEMIC_STAFF' ||
    role === 'MANAGER' ||
    role === 'TEACHER' ||
    role === 'STUDENT'
  ) {
    return role;
  }

  return 'STUDENT';
};

const normalizeUser = (user: Omit<AuthUser, 'role'> & { role: string }) => ({
  ...user,
  role: normalizeRole(user.role),
});

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: getAccessToken(),
  isAuthenticated: Boolean(getAccessToken()),
  isInitializing: true,
  isLoading: false,

  login: async (username, password) => {
    set({ isLoading: true });

    try {
      const response = await api.post<LoginResponse>('/auth/login', {
        username,
        password,
      });
      const token = response.data.accessToken ?? response.data.access_token;

      if (!token) {
        throw new Error('Phản hồi đăng nhập không có accessToken.');
      }

      setAccessToken(token);
      set({ token, isAuthenticated: true });

      return await get().fetchMe();
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMe: async () => {
    const response = await api.get<AuthUser>('/auth/me');
    const user = normalizeUser(response.data);

    set({
      user,
      token: getAccessToken(),
      isAuthenticated: true,
    });

    return user;
  },

  initialize: async () => {
    const token = getAccessToken();

    if (!token) {
      set({ isInitializing: false, isAuthenticated: false, user: null });
      return;
    }

    try {
      set({ token, isAuthenticated: true });
      await get().fetchMe();
    } catch {
      get().clearSession();
    } finally {
      set({ isInitializing: false });
    }
  },

  logout: async () => {
    try {
      if (getAccessToken()) {
        await api.post('/auth/logout');
      }
    } catch {
      // Luôn xóa phiên phía client dù backend logout tạm thời không khả dụng.
    } finally {
      get().clearSession();
    }
  },

  clearSession: () => {
    clearAccessToken();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },
}));
