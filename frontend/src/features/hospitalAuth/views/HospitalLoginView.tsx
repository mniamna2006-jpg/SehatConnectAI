import { Link } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { Controller } from 'react-hook-form';
import { AppButton } from '../../../shared/components/Buttons';
import { FormField } from '../../../shared/components/FormField';
import { useTranslations } from '../../../providers/LocaleProvider';
import { colors, typography } from '../../../shared/theme';
import { useHospitalLoginViewModel } from '../viewmodels/useHospitalLoginViewModel';
import { AuthScaffold } from '../../auth/views/AuthScaffold';

export function HospitalLoginView() {
  const t = useTranslations();
  const { control, errors, onSubmit, isSubmitting, apiError } = useHospitalLoginViewModel();

  return (
    <AuthScaffold
      title={t('hospitalAuth.login.title')}
      subtitle={t('hospitalAuth.login.subtitle')}
      footer={<Link href="/login" style={styles.patientLink}>{t('hospitalAuth.login.patientAction')}</Link>}
    >
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <FormField
            testID="hospital-login-email"
            label={t('hospitalAuth.login.fields.email')}
            icon="mail-outline"
            placeholder="you@hospital.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={field.value ?? ''}
            onChangeText={field.onChange}
            error={errors.email?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <FormField
            testID="hospital-login-password"
            label={t('hospitalAuth.login.fields.password')}
            icon="lock-closed-outline"
            placeholder={t('hospitalAuth.login.placeholders.password')}
            autoComplete="current-password"
            secureTextEntry
            passwordToggleLabels={{
              show: t('auth.password.show'),
              hide: t('auth.password.hide'),
            }}
            value={field.value ?? ''}
            onChangeText={field.onChange}
            error={errors.password?.message}
          />
        )}
      />
      {apiError ? <Text accessibilityRole="alert" testID="hospital-login-error" style={styles.error}>{apiError}</Text> : null}
      <AppButton testID="hospital-login-submit" label={t('hospitalAuth.login.submit')} loading={isSubmitting} onPress={onSubmit} />
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  error: { ...typography.metadata, color: colors.danger, textAlign: 'center' },
  patientLink: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700',
    minHeight: 48,
    paddingVertical: 13,
    textAlign: 'center',
  },
});
