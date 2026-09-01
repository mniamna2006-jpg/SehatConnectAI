import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '../../../shared/components/AppIcon';
import { AppButton } from '../../../shared/components/Buttons';
import { FormField } from '../../../shared/components/FormField';
import { useTranslations } from '../../../providers/LocaleProvider';
import { colors, radius, typography } from '../../../shared/theme';
import { useForgotPasswordViewModel } from '../viewmodels/useForgotPasswordViewModel';
import { AuthScaffold } from './AuthScaffold';

export function ForgotPasswordView() {
  const t = useTranslations();
  const { email, setEmail, onSubmit, isSubmitting, submitted } = useForgotPasswordViewModel();

  return (
    <AuthScaffold
      title={submitted ? t('auth.forgot.success.title') : t('auth.forgot.title')}
      subtitle={submitted ? t('auth.forgot.success.message') : t('auth.forgot.body')}
      footer={<Link href="/login" style={styles.backLink}>{t('auth.forgot.success.action')}</Link>}
    >
      <View style={[styles.supportIcon, submitted && styles.successIcon]}>
        <AppIcon name={submitted ? 'checkmark-circle-outline' : 'key-outline'} color={submitted ? colors.teal : colors.primary} size={30} />
      </View>
      {submitted ? (
        <Text testID="forgot-password-message" style={styles.successMessage}>{t('auth.forgot.success.message')}</Text>
      ) : (
        <>
          <FormField
            testID="forgot-password-email"
            label={t('auth.forgot.fields.email')}
            icon="mail-outline"
            placeholder="you@example.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <AppButton testID="forgot-password-submit" label={t('auth.forgot.submit')} loading={isSubmitting} onPress={onSubmit} />
        </>
      )}
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  supportIcon: { width: 64, height: 64, borderRadius: radius.lg, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  successIcon: { backgroundColor: colors.tealSoft },
  successMessage: { ...typography.body, color: colors.inkSoft, backgroundColor: colors.tealSoft, borderRadius: radius.md, padding: 18 },
  backLink: { ...typography.body, color: colors.primary, fontWeight: '700' },
});
