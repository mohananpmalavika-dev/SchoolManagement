'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api, apiClient } from '@/lib/api-client';
import { clearSession, homeForRole } from '@/lib/session';
export interface User { id: string; email: string; firstName: string; lastName: string; role: string; tenantId: string }
interface AuthState { user: User | null; isLoading: boolean; isAuthenticated: boolean; login: (email: string, password: string) => Promise<void>; logout: () => Promise<void>; refreshUser: () => Promise<void> }
const AuthContext = createContext<AuthState | undefined>(undefined);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setLoading] = useState(true);
  const router = useRouter();
  const refreshUser = async () => {
    if (!localStorage.getItem('accessToken')) { setUser(null); return; }
    const { data } = await apiClient.get<User>('/auth/me');
    setUser(data); localStorage.setItem('user', JSON.stringify(data));
  };
  useEffect(() => {
    if ('serviceWorker' in navigator) void navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    refreshUser().catch(() => { clearSession(); setUser(null); }).finally(() => setLoading(false));
  }, []);
  const login = async (email: string, password: string) => {
    const response = await api.login(email.trim(), password);
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user); router.replace(homeForRole(response.user.role));
  };
  const logout = async () => {
    try { await api.logout(); } finally { clearSession(); setUser(null); router.replace('/login'); }
  };
  return <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout, refreshUser }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider is required');
  return value;
}