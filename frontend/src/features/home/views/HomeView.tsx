import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Screen } from '../../../shared/components/Screen';
import { useHomeViewModel } from '../viewmodels/useHomeViewModel';

export function HomeView() {
  const { user, onLogout } = useHomeViewModel();

  return (
    <Screen>
      <Text accessibilityRole="header">Welcome, {user?.full_name}</Text>
      <Link href="/profile">
        <Text>Profile</Text>
      </Link>
      <Link href="/find-hospital">
        <Text>Find Hospital</Text>
      </Link>
      <Link href="/find-doctor">
        <Text>Find Doctor</Text>
      </Link>
      <Link href="/find-department">
        <Text>Find Department</Text>
      </Link>
      <Link href="/appointments">
        <Text>Appointments</Text>
      </Link>
      <Pressable testID="home-logout" onPress={onLogout}>
        <Text>Logout</Text>
      </Pressable>
    </Screen>
  );
}
