import React from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { Controller } from 'react-hook-form';
import { Link } from 'expo-router';
import { Screen } from '../../../shared/components/Screen';
import { useLoginViewModel } from '../viewmodels/useLoginViewModel';

export function LoginView() {
  const { control, errors, onSubmit, isSubmitting, apiError } = useLoginViewModel();

  return (
    <Screen>
      <Text accessibilityRole="header">Log In</Text>
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <TextInput
            testID="login-email"
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={field.value ?? ''}
            onChangeText={field.onChange}
          />
        )}
      />
      {errors.email && <Text>{errors.email.message}</Text>}
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <TextInput
            testID="login-password"
            placeholder="Password"
            secureTextEntry
            value={field.value ?? ''}
            onChangeText={field.onChange}
          />
        )}
      />
      {errors.password && <Text>{errors.password.message}</Text>}
      {apiError && <Text testID="login-error">{apiError}</Text>}
      <Pressable testID="login-submit" onPress={onSubmit} disabled={isSubmitting}>
        {isSubmitting ? <ActivityIndicator /> : <Text>Log In</Text>}
      </Pressable>
      <Link href="/register">Create an account</Link>
      <Link href="/forgot-password">Forgot password?</Link>
    </Screen>
  );
}
