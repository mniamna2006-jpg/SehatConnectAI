import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { I18nManager } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../src/core/query/queryClient';
import { AuthProvider } from '../src/providers/AuthProvider';
import { HospitalAuthProvider } from '../src/providers/HospitalAuthProvider';
import { LocaleProvider } from '../src/providers/LocaleProvider';
import { ErrorBoundary } from '../src/shared/components/ErrorBoundary';

export default function RootLayout() {
  I18nManager.allowRTL(true);
  I18nManager.swapLeftAndRightInRTL(true);
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <HospitalAuthProvider>
            <LocaleProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(app)" />
                <Stack.Screen name="(hospital-auth)" />
                <Stack.Screen name="(hospital)" />
              </Stack>
              <StatusBar style="dark" />
            </LocaleProvider>
          </HospitalAuthProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
