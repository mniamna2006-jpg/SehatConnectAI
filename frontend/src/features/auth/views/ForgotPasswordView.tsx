import React from 'react';
import { Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { Screen } from '../../../shared/components/Screen';
import { useForgotPasswordViewModel } from '../viewmodels/useForgotPasswordViewModel';

export function ForgotPasswordView() {
  const { email, setEmail, onSubmit, isSubmitting, submitted } = useForgotPasswordViewModel();

  return (
    <Screen>
      <Text accessibilityRole="header">Forgot Password?</Text>
      {submitted ? (
        <Text testID="forgot-password-message">
          If an account exists, reset instructions will be sent.
        </Text>
      ) : (
        <>
          <Text>Enter your email address and we&apos;ll help you reset your password.</Text>
          <TextInput
            testID="forgot-password-email"
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Pressable testID="forgot-password-submit" onPress={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator /> : <Text>Send Reset Link</Text>}
          </Pressable>
        </>
      )}
      <Link href="/login">Back to log in</Link>
    </Screen>
  );
}
