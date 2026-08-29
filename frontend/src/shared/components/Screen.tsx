import React from 'react';
import { SafeAreaView, StyleSheet, ViewStyle } from 'react-native';

export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <SafeAreaView style={[styles.root, style]}>{children}</SafeAreaView>;
}

const styles = StyleSheet.create({ root: { flex: 1, padding: 16 } });
