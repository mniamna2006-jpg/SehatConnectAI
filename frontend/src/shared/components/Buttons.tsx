import type { ReactNode } from 'react';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';
import { AppIcon, type AppIconName } from './AppIcon';

interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  icon?: AppIconName;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
  style?: StyleProp<ViewStyle>;
}

export function AppButton({ label, icon, loading, variant = 'primary', disabled, style, ...props }: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ busy: Boolean(loading), disabled: isDisabled }}
      disabled={isDisabled}
      android_ripple={{ color: variant === 'primary' ? '#FFFFFF22' : `${colors.primary}14` }}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.surface : colors.primary} />
      ) : (
        <View style={styles.content}>
          {icon ? <AppIcon name={icon} size={19} color={variant === 'primary' ? colors.surface : variant === 'danger' ? colors.danger : colors.primary} /> : null}
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85} style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
}: {
  icon: AppIconName;
  label: string;
  onPress(): void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      android_ripple={{ color: colors.primarySoft, borderless: true }}
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
    >
      <AppIcon name={icon} color={colors.ink} size={21} />
    </Pressable>
  );
}

export function PressableSurface({
  children,
  style,
  ...props
}: Omit<PressableProps, 'style'> & { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      android_ripple={{ color: colors.primarySoft }}
      style={({ pressed }) => [styles.surface, pressed && styles.surfacePressed, style]}
      {...props}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.primarySoft },
  quiet: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.dangerSoft },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  label: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  primaryLabel: { color: colors.surface },
  secondaryLabel: { color: colors.primaryPressed },
  quietLabel: { color: colors.primaryPressed },
  dangerLabel: { color: colors.danger },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.48 },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  surface: { overflow: 'hidden' },
  surfacePressed: { opacity: 0.82 },
});
