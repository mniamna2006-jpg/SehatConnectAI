import { useState } from 'react';
import type { TextInputProps } from 'react-native';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, typography } from '../theme';
import { AppIcon, type AppIconName } from './AppIcon';

interface PasswordToggleLabels {
  show: string;
  hide: string;
}

interface FormFieldProps extends TextInputProps {
  label: string;
  icon?: AppIconName;
  error?: string;
  passwordToggleLabels?: PasswordToggleLabels;
}

export function FormField({
  label,
  icon,
  error,
  multiline,
  secureTextEntry = false,
  passwordToggleLabels,
  testID,
  onFocus,
  onBlur,
  ...props
}: FormFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const hasPasswordToggle = secureTextEntry && passwordToggleLabels;

  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View testID={testID ? `${testID}-shell` : undefined} style={[styles.inputShell, multiline && styles.multilineShell, isFocused && styles.focusShell, error && styles.errorShell]}>
        {icon ? <AppIcon name={icon} size={20} color={colors.muted} /> : null}
        <TextInput
          accessibilityLabel={props.accessibilityLabel ?? label}
          placeholderTextColor={colors.faint}
          multiline={multiline}
          testID={testID}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          style={[styles.input, multiline && styles.multilineInput]}
          {...props}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
        />
        {hasPasswordToggle ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isPasswordVisible ? passwordToggleLabels.hide : passwordToggleLabels.show}
            accessibilityState={{ expanded: isPasswordVisible }}
            hitSlop={4}
            onPress={() => setIsPasswordVisible((visible) => !visible)}
            style={({ pressed }) => [styles.passwordAction, pressed && styles.passwordActionPressed]}
          >
            <AppIcon
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={21}
              color={colors.inkSoft}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  label: { ...typography.metadata, color: colors.inkSoft, fontWeight: '700' },
  inputShell: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 15,
  },
  input: { flex: 1, minHeight: 50, color: colors.ink, fontSize: 15, textAlignVertical: 'center' },
  passwordAction: {
    minWidth: 48,
    minHeight: 48,
    marginEnd: -11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passwordActionPressed: { opacity: 0.62 },
  multilineShell: { minHeight: 104, alignItems: 'flex-start', paddingTop: 14 },
  multilineInput: { minHeight: 82, textAlignVertical: 'top' },
  focusShell: { borderColor: colors.primary, borderWidth: 2 },
  errorShell: { borderColor: colors.danger },
  error: { ...typography.metadata, color: colors.danger },
});
