'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api, apiClient } from '@/lib/api-client';
import { clearSession, homeForRole } from '@/lib/session';
import { disableBackgroundPush, syncBackgroundPush } from '@/lib/push-notifications';
export interface User { id: string; email: string; firstName: string; lastName: string; role: string; tenantId: string }
interface AuthState { user: User | null; isLoading: boolean; isAuthenticated: boolean; login: (email: string, password: string) => Promise<string | null>; verifyMfa: (session: string, code: string) => Promise<void>; logout: () => Promise<void>; refreshUser: () => Promise<void> }
const AuthContext = createContext<AuthState | undefined>(undefined);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setLoading] = useState(true);
  const router = useRouter();
  const refreshUser = async () => {
    if (!localStorage.getItem('accessToken') && !localStorage.getItem('user')) { setUser(null); return; }
    const { data } = await apiClient.get<User>('/auth/me');
    setUser(data); localStorage.setItem('user', JSON.stringify(data));
  };
  useEffect(() => {
    if ('serviceWorker' in navigator) void navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    refreshUser().catch(() => { clearSession(); setUser(null); }).finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (!user) return;
    const sync = () => { void syncBackgroundPush().catch(() => undefined); };
    sync();
    const changed = (event: MessageEvent) => { if (event.data?.type === 'PUSH_SUBSCRIPTION_CHANGED') sync(); };
    navigator.serviceWorker?.addEventListener('message', changed);
    return () => navigator.serviceWorker?.removeEventListener('message', changed);
  }, [user?.id, user?.tenantId]);
  const finishLogin = (response: { accessToken?: string; refreshToken?: string; user: User }) => {
    if (!response.user?.role) throw new Error('Invalid sign-in response. Please try again.');
    const useCookieAuth = process.env.NEXT_PUBLIC_AUTH_STORAGE === 'cookie' || (process.env.NEXT_PUBLIC_AUTH_STORAGE !== 'localStorage' && process.env.NODE_ENV === 'production');
    if (useCookieAuth) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } else {
      if (response.accessToken) localStorage.setItem('accessToken', response.accessToken);
      if (response.refreshToken) localStorage.setItem('refreshToken', response.refreshToken);
    }
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user); router.replace(homeForRole(response.user.role));
  };
  const login = async (email: string, password: string) => {
    const response = await api.login(email.trim(), password);
    if (response.requiresMfa) return response.mfaSessionToken as string;
    finishLogin(response);
    return null;
  };
  const verifyMfa = async (mfaSessionToken: string, code: string) => {
    finishLogin((await apiClient.post('/auth/mfa/verify-login', { mfaSessionToken, code: code.trim() })).data);
  };
  const logout = async () => {
    await disableBackgroundPush().catch(() => undefined);
    try { await api.logout(); } finally { clearSession(); setUser(null); router.replace('/login'); }
  };
  return <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, verifyMfa, logout, refreshUser }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider is required');
  return value;
}
