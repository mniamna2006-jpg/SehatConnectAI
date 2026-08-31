import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <View>
      <ActivityIndicator />
      <Text>{label}</Text>
    </View>
  );
}
