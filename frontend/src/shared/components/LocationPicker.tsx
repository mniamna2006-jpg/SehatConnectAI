import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocationSelector } from '../../core/location/useLocationSelector';
import { useTranslations } from '../../providers/LocaleProvider';
import { colors, radius, shadow, typography } from '../theme';
import { AppIcon } from './AppIcon';

export function LocationPicker({ selector }: { selector: ReturnType<typeof useLocationSelector> }) {
  const t = useTranslations();
  const { mode, permissionDenied, locationUnavailable, isRequestingGps, manualCity, requestGpsLocation, setManualCity } =
    selector;

  return (
    <View style={styles.card}>
      <View style={styles.headingRow}>
        <View style={styles.iconBox}>
          <AppIcon name="location" color={colors.primary} size={21} />
        </View>
        <View style={styles.headingCopy}>
          <Text style={styles.title}>{t('location.title')}</Text>
          <Text style={styles.subtitle}>{t('location.subtitle')}</Text>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isRequestingGps }}
        testID="use-current-location"
        onPress={requestGpsLocation}
        disabled={isRequestingGps}
        android_ripple={{ color: colors.primarySoft }}
        style={({ pressed }) => [styles.currentButton, pressed && styles.pressed]}
      >
        {isRequestingGps ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <>
            <AppIcon name="navigate-circle-outline" color={colors.primary} size={21} />
            <Text style={styles.currentLabel}>{t('common.useCurrentLocation')}</Text>
          </>
        )}
      </Pressable>
      {(permissionDenied || locationUnavailable) && (
        <Text testID="location-notice" style={styles.notice}>
          {t('common.locationDenied')}
        </Text>
      )}
      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <Text style={styles.dividerLabel}>{t('location.divider')}</Text>
        <View style={styles.divider} />
      </View>
      <View style={styles.inputShell}>
        <AppIcon name="search" color={colors.muted} size={19} />
        <TextInput
          accessibilityLabel={t('location.cityLabel')}
          testID="manual-city-input"
          placeholder={t('location.placeholder')}
          placeholderTextColor={colors.faint}
          value={manualCity}
          onChangeText={setManualCity}
          style={styles.input}
        />
      </View>
      <Text testID="location-mode" style={styles.hiddenMode}>{mode}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 18,
    gap: 14,
    shadowColor: shadow.color,
    shadowOpacity: shadow.opacity,
    shadowRadius: shadow.radius,
    shadowOffset: shadow.offset,
    elevation: shadow.elevation,
  },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  headingCopy: { flex: 1 },
  title: { ...typography.entityTitle, color: colors.ink },
  subtitle: { ...typography.metadata, color: colors.muted, marginTop: 1 },
  currentButton: {
    minHeight: 50,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  currentLabel: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.8 },
  notice: { ...typography.metadata, color: colors.danger, textAlign: 'center' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  divider: { flex: 1, height: 1, backgroundColor: colors.line },
  dividerLabel: { ...typography.metadata, color: colors.faint },
  inputShell: { minHeight: 50, borderRadius: radius.md, backgroundColor: colors.surfaceMuted, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 },
  input: { flex: 1, minHeight: 50, fontSize: 15, color: colors.ink },
  hiddenMode: { position: 'absolute', width: 1, height: 1, opacity: 0 },
});
