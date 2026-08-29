import React from 'react';
import { Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { Controller } from 'react-hook-form';
import { Link } from 'expo-router';
import { Screen } from '../../../shared/components/Screen';
import { useRegisterViewModel } from '../viewmodels/useRegisterViewModel';

const LANGUAGE_OPTIONS = ['ENGLISH', 'URDU', 'ROMAN_URDU'] as const;

export function RegisterView() {
  const { control, errors, onSubmit, isSubmitting, apiError } = useRegisterViewModel();

  return (
    <Screen>
      <Text accessibilityRole="header">Create Account</Text>
      <Controller
        control={control}
        name="full_name"
        render={({ field }) => (
          <TextInput
            testID="register-full-name"
            placeholder="Full name"
            value={field.value ?? ''}
            onChangeText={field.onChange}
          />
        )}
      />
      {errors.full_name && <Text>{errors.full_name.message}</Text>}
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <TextInput
            testID="register-email"
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
        name="phone"
        render={({ field }) => (
          <TextInput
            testID="register-phone"
            placeholder="Phone"
            keyboardType="phone-pad"
            value={field.value ?? ''}
            onChangeText={field.onChange}
          />
        )}
      />
      {errors.phone && <Text>{errors.phone.message}</Text>}
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <TextInput
            testID="register-password"
            placeholder="Password"
            secureTextEntry
            value={field.value ?? ''}
            onChangeText={field.onChange}
          />
        )}
      />
      {errors.password && <Text>{errors.password.message}</Text>}
      <Controller
        control={control}
        name="confirmPassword"
        render={({ field }) => (
          <TextInput
            testID="register-confirm-password"
            placeholder="Confirm password"
            secureTextEntry
            value={field.value ?? ''}
            onChangeText={field.onChange}
          />
        )}
      />
      {errors.confirmPassword && <Text>{errors.confirmPassword.message}</Text>}
      <Controller
        control={control}
        name="preferred_language"
        render={({ field }) => (
          <>
            {LANGUAGE_OPTIONS.map((option) => (
              <Pressable
                key={option}
                testID={`register-language-${option}`}
                onPress={() => field.onChange(option)}
              >
                <Text>{field.value === option ? '● ' : '○ '}{option}</Text>
              </Pressable>
            ))}
          </>
        )}
      />
      {errors.preferred_language && <Text>{errors.preferred_language.message}</Text>}
      {apiError && <Text testID="register-error">{apiError}</Text>}
      <Pressable testID="register-submit" onPress={onSubmit} disabled={isSubmitting}>
        {isSubmitting ? <ActivityIndicator /> : <Text>Create Account</Text>}
      </Pressable>
      <Link href="/login">Already have an account? Log in</Link>
    </Screen>
  );
}
