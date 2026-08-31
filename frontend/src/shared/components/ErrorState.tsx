import React from 'react';
import { Pressable, Text, View } from 'react-native';

export function ErrorState({
  message = 'Something went wrong',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <View accessibilityRole="alert">
      <Text>{message}</Text>
      {onRetry ? (
        <Pressable accessibilityRole="button" onPress={onRetry}>
          <Text>Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
