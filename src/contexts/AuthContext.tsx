import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../lib/api';
import { readJson, readString, removeKey, STORAGE_KEYS, writeJson, writeString } from '../lib/storage';

export interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthPayload = { token: string; user: User };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readJson<User | null>(STORAGE_KEYS.user, null));
  const [token, setToken] = useState<string | null>(() => readString(STORAGE_KEYS.token, null));

  const isAuthenticated = useMemo(() => Boolean(user && token), [user, token]);

  useEffect(() => {
    if (user) writeJson(STORAGE_KEYS.user, user);
    else removeKey(STORAGE_KEYS.user);
  }, [user]);

  useEffect(() => {
    if (token) writeString(STORAGE_KEYS.token, token);
    else removeKey(STORAGE_KEYS.token);
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiRequest<AuthPayload>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setUser(data.user);
    setToken(data.token);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const data = await apiRequest<AuthPayload>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName: name }),
    });

    setUser(data.user);
    setToken(data.token);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
  }, []);

  const value: AuthContextValue = {
    user,
    token,
    isAuthenticated,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
