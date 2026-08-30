import React, { createContext, useContext, useMemo, useState } from 'react';
import { resolveDeviceDefault, translate } from '../i18n';
import type { PreferredLanguage } from '../shared/types/api';
import { useAuth } from './AuthProvider';

interface LocaleContextValue {
  locale: PreferredLanguage;
  setLocale(locale: PreferredLanguage): void;
  t(key: string): string;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [override, setOverride] = useState<PreferredLanguage | null>(null);
  const locale = override ?? user?.preferred_language ?? resolveDeviceDefault();
  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale: setOverride,
      t: (key: string) => translate(locale, key),
    }),
    [locale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale must be used within LocaleProvider');
  return context;
}
