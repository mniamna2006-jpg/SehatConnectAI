import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { registerHospitalUnauthorizedHandler } from '../core/api/client';
import { clearHospitalToken, getHospitalToken, setHospitalToken } from '../core/storage/secureStore';
import { getHospitalMe, loginHospital } from '../features/hospitalAuth/model/api';
import type { HospitalLoginInput, HospitalUser } from '../features/hospitalAuth/model/types';
import { isHospitalQueryKey } from '../shared/constants/queryKeys';

interface HospitalAuthContextValue {
  hospitalUser: HospitalUser | null;
  isLoading: boolean;
  login(input: HospitalLoginInput): Promise<HospitalUser>;
  logout(): Promise<void>;
}

const HospitalAuthContext = createContext<HospitalAuthContextValue | undefined>(undefined);

export function HospitalAuthProvider({ children }: { children: React.ReactNode }) {
  const [hospitalUser, setHospitalUser] = useState<HospitalUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(
    () =>
      registerHospitalUnauthorizedHandler(() => {
        void clearHospitalToken();
        queryClient.removeQueries({ predicate: ({ queryKey }) => isHospitalQueryKey(queryKey) });
        setHospitalUser(null);
      }),
    [queryClient]
  );

  useEffect(() => {
    (async () => {
      const token = await getHospitalToken();
      if (token) {
        try {
          setHospitalUser(await getHospitalMe());
        } catch {
          await clearHospitalToken();
        }
      }
      setIsLoading(false);
    })();
  }, []);

  const login = useCallback(async (input: HospitalLoginInput) => {
    const result = await loginHospital(input);
    await setHospitalToken(result.token);
    setHospitalUser(result.user);
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    await clearHospitalToken();
    queryClient.removeQueries({ predicate: ({ queryKey }) => isHospitalQueryKey(queryKey) });
    setHospitalUser(null);
  }, [queryClient]);

  return (
    <HospitalAuthContext.Provider value={{ hospitalUser, isLoading, login, logout }}>
      {children}
    </HospitalAuthContext.Provider>
  );
}

export function useHospitalAuth(): HospitalAuthContextValue {
  const ctx = useContext(HospitalAuthContext);
  if (!ctx) throw new Error('useHospitalAuth must be used within HospitalAuthProvider');
  return ctx;
}
