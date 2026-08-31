import React from 'react';
import { Text, View } from 'react-native';

export function EmptyState({ message }: { message: string }) {
  return (
    <View>
      <Text>{message}</Text>
    </View>
  );
}
