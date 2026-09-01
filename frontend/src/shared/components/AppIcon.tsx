import type { ComponentProps } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';

export type AppIconName = ComponentProps<typeof Ionicons>['name'];

export function AppIcon({
  name,
  size = 22,
  color,
}: {
  name: AppIconName;
  size?: number;
  color: string;
}) {
  return <Ionicons accessibilityElementsHidden importantForAccessibility="no" name={name} size={size} color={color} />;
}
