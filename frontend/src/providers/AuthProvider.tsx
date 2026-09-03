import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError, registerUnauthorizedHandler } from '../core/api/client';
import { getToken, setToken, clearToken } from '../core/storage/secureStore';
import { login as apiLogin, registerPatient as apiRegister, getMe } from '../features/auth/model/api';
import type { CurrentUser, LoginInput, RegisterInput } from '../features/auth/model/types';

interface AuthContextValue {
  user: CurrentUser | null;
  isLoading: boolean;
  sessionError: 'network' | null;
  login(input: LoginInput): Promise<void>;
  register(input: RegisterInput): Promise<void>;
  logout(): Promise<void>;
  retrySession(): Promise<void>;
}

/** 401/403 mean the session itself is invalid; anything else (offline, timeout, 5xx) is transient. */
function isInvalidSession(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState<'network' | null>(null);
  const queryClient = useQueryClient();

  useEffect(
    () =>
      registerUnauthorizedHandler(() => {
        void clearToken();
        queryClient.clear();
        setUser(null);
        setSessionError(null);
      }),
    [queryClient]
  );

  const loadSession = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    try {
      setUser(await getMe());
      setSessionError(null);
    } catch (error) {
      if (isInvalidSession(error)) {
        await clearToken();
      } else {
        setSessionError('network');
      }
    }
  }, []);

  useEffect(() => {
    (async () => {
      await loadSession();
      setIsLoading(false);
    })();
  }, [loadSession]);

  const retrySession = useCallback(async () => {
    await loadSession();
  }, [loadSession]);

  const login = useCallback(async (input: LoginInput) => {
    const result = await apiLogin(input);
    await setToken(result.token);
    setUser(result.user);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const result = await apiRegister(input);
    await setToken(result.token);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    await clearToken();
    queryClient.clear();
    setUser(null);
  }, [queryClient]);

  return (
    <AuthContext.Provider value={{ user, isLoading, sessionError, login, register, logout, retrySession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
