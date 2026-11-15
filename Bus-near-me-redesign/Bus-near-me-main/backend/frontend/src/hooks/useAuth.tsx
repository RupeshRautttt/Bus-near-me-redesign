import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { getToken, http, setToken, type User } from '../lib/api';

interface Ctx {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (d: { name: string; email: string; phone: string; password: string }) => Promise<void>;
  logout: () => void;
}
const AuthCtx = createContext<Ctx>(null!);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) return setReady(true);
    http.get('/api/auth/me').then((r) => setUser(r.data.user)).catch(() => setToken(null)).finally(() => setReady(true));
  }, []);

  const accept = (d: { token: string; user: User }) => { setToken(d.token); setUser(d.user); };
  const login = useCallback(async (email: string, password: string) => accept((await http.post('/api/auth/login', { email, password })).data), []);
  const register = useCallback(async (body: { name: string; email: string; phone: string; password: string }) => accept((await http.post('/api/auth/register', body)).data), []);
  const logout = useCallback(() => { setToken(null); setUser(null); }, []);

  return <AuthCtx.Provider value={{ user, ready, login, register, logout }}>{children}</AuthCtx.Provider>;
}
