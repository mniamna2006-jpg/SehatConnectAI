import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslations } from '../../../providers/LocaleProvider';
import { AppIcon } from '../../../shared/components/AppIcon';
import { colors, radius } from '../../../shared/theme';
import { useUnreadNotificationCountViewModel } from '../viewmodels/useUnreadNotificationCountViewModel';

export function NotificationBell() {
  const t = useTranslations();
  const { count, hasUnread } = useUnreadNotificationCountViewModel();
  const label = hasUnread ? `${t('notifications.title')} (${count})` : t('notifications.title');

  return (
    <Link href="/notifications" asChild>
      <Pressable accessibilityLabel={label} accessibilityRole="button" hitSlop={8} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <AppIcon name="notifications-outline" color={colors.ink} size={21} />
        {hasUnread ? (
          <View testID="notification-badge" style={styles.badge}>
            <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
          </View>
        ) : null}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  button: { width: 46, height: 46, borderRadius: radius.md, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.72 },
  badge: { position: 'absolute', top: 4, right: 4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { fontSize: 10, lineHeight: 12, color: colors.surface, fontWeight: '800' },
});
