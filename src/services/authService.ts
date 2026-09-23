import { api } from './api';
import type { AuthResponse } from '../../shared/types';

export const authService = {
  register: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/register', { email, password }),

  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),

  logout: () => {
    // Best-effort: revoke the server-side refresh token and clear its HttpOnly
    // cookie. Local state is cleared immediately regardless of network outcome.
    api.post<void>('/auth/logout', {}).catch(() => {});
    localStorage.removeItem('token');
  },
};
