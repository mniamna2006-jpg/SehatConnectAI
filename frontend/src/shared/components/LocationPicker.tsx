import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocationSelector } from '../../core/location/useLocationSelector';
import { useTranslations } from '../../providers/LocaleProvider';
import { colors, radius, typography } from '../theme';
import { AppIcon } from './AppIcon';

export function LocationPicker({ selector }: { selector: ReturnType<typeof useLocationSelector> }) {
  const t = useTranslations();
  const { mode, permissionDenied, locationUnavailable, isRequestingGps, manualCity, requestGpsLocation, setManualCity } =
    selector;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t('location.title')}</Text>
      <View style={styles.inputShell}>
        <AppIcon name="search" color={colors.muted} size={18} />
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
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isRequestingGps }}
        testID="use-current-location"
        onPress={requestGpsLocation}
        disabled={isRequestingGps}
        hitSlop={6}
        style={({ pressed }) => [styles.currentRow, pressed && styles.pressed]}
      >
        {isRequestingGps ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : (
          <AppIcon name="navigate-circle-outline" color={colors.primary} size={18} />
        )}
        <Text style={styles.currentLabel}>{t('common.useCurrentLocation')}</Text>
      </Pressable>
      {(permissionDenied || locationUnavailable) && (
        <Text testID="location-notice" style={styles.notice}>
          {t('common.locationDenied')}
        </Text>
      )}
      <Text testID="location-mode" style={styles.hiddenMode}>{mode}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  title: { ...typography.metadata, color: colors.muted, fontWeight: '700' },
  currentRow: { minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' },
  currentLabel: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.7 },
  notice: { ...typography.metadata, color: colors.danger },
  inputShell: { minHeight: 48, borderRadius: radius.md, backgroundColor: colors.surfaceMuted, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 },
  input: { flex: 1, minHeight: 48, fontSize: 15, color: colors.ink },
  hiddenMode: { position: 'absolute', width: 1, height: 1, opacity: 0 },
});
