import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '../../../shared/components/AppIcon';
import { useTranslations } from '../../../providers/LocaleProvider';
import { colors, radius, typography } from '../../../shared/theme';
import { AuthScaffold } from './AuthScaffold';

export function ForgotPasswordView() {
  const t = useTranslations();

  return (
    <AuthScaffold
      title={t('auth.forgot.title')}
      subtitle={t('auth.forgot.message')}
      footer={<Link href="/login" style={styles.backLink}>{t('auth.forgot.action')}</Link>}
    >
      <View style={styles.supportIcon}>
        <AppIcon name="alert-circle-outline" color={colors.primary} size={30} />
      </View>
      <Text testID="forgot-password-message" style={styles.message}>{t('auth.forgot.message')}</Text>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  supportIcon: { width: 64, height: 64, borderRadius: radius.lg, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  message: { ...typography.body, color: colors.inkSoft, backgroundColor: colors.primarySoft, borderRadius: radius.md, padding: 18 },
  backLink: { ...typography.body, color: colors.primaryPressed, fontWeight: '700' },
});
