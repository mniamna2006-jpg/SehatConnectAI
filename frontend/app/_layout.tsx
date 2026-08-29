import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../src/core/query/queryClient';
import { AuthProvider } from '../src/providers/AuthProvider';
import { LocaleProvider } from '../src/providers/LocaleProvider';

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LocaleProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(app)" />
          </Stack>
        </LocaleProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
