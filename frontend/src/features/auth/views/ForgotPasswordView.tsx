import React from 'react';
import { Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { Screen } from '../../../shared/components/Screen';
import { useForgotPasswordViewModel } from '../viewmodels/useForgotPasswordViewModel';

export function ForgotPasswordView() {
  const { identifier, setIdentifier, onSubmit, isSubmitting, submitted } = useForgotPasswordViewModel();

  return (
    <Screen>
      <Text accessibilityRole="header">Forgot Password</Text>
      {submitted ? (
        <Text testID="forgot-password-message">
          If an account exists for that email or phone, reset instructions have been sent.
        </Text>
      ) : (
        <>
          <TextInput
            testID="forgot-password-identifier"
            placeholder="Email or phone"
            autoCapitalize="none"
            value={identifier}
            onChangeText={setIdentifier}
          />
          <Pressable testID="forgot-password-submit" onPress={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator /> : <Text>Send reset instructions</Text>}
          </Pressable>
        </>
      )}
      <Link href="/login">Back to log in</Link>
    </Screen>
  );
}
