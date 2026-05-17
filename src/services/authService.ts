import { api } from './api';
import type { AuthResponse } from '../../shared/types';

export const authService = {
  register: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/register', { email, password }),

  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),

  logout: () => {
    localStorage.removeItem('token');
  },
};
