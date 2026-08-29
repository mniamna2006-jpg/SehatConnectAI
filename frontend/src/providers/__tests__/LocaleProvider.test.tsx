import React from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { useAuth } from '../AuthProvider';
import { LocaleProvider, useLocale } from '../LocaleProvider';

jest.mock('../AuthProvider');

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <LocaleProvider>{children}</LocaleProvider>
);

test('defaults to the authenticated user preferred language', async () => {
  (useAuth as jest.Mock).mockReturnValue({ user: { preferred_language: 'URDU' } });
  const { result } = await renderHook(() => useLocale(), { wrapper });

  expect(result.current.locale).toBe('URDU');
  expect(result.current.t('common.retry')).toBe('دوبارہ کوشش کریں');
});

test('setLocale overrides the default and re-translates', async () => {
  (useAuth as jest.Mock).mockReturnValue({ user: { preferred_language: 'ENGLISH' } });
  const { result } = await renderHook(() => useLocale(), { wrapper });

  await act(() => result.current.setLocale('ROMAN_URDU'));
  expect(result.current.locale).toBe('ROMAN_URDU');
  expect(result.current.t('common.retry')).toBe('Dobara koshish karein');
});
