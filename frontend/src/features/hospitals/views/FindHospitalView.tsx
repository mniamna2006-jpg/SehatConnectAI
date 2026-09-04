import { Link } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useTranslations } from '../../../providers/LocaleProvider';
import { AppIcon } from '../../../shared/components/AppIcon';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';
import { LocationPicker } from '../../../shared/components/LocationPicker';
import { PageHeader } from '../../../shared/components/PageHeader';
import { PressableSurface } from '../../../shared/components/Buttons';
import { Screen } from '../../../shared/components/Screen';
import { SectionHeader } from '../../../shared/components/SectionHeader';
import { colors, radius, typography } from '../../../shared/theme';
import { ltr } from '../../../shared/utils/formatters';
import type { Hospital } from '../model/types';
import { useFindHospitalViewModel } from '../viewmodels/useFindHospitalViewModel';

function HospitalLogo({ hospital, t }: { hospital: Hospital; t: (key: string) => string }) {
  const label = `${hospital.name} ${t('hospitals.logo')}`;
  if (hospital.logo_url) return <Image source={{ uri: hospital.logo_url }} style={styles.logo} contentFit="cover" transition={150} accessibilityLabel={label} />;
  return <View accessibilityLabel={label} accessibilityRole="image" style={styles.logoFallback}><AppIcon name="business" color={colors.teal} size={24} /></View>;
}

function formatDistance(distance: Hospital['distance_km'], t: (key: string) => string) {
  if (distance === undefined) return null;
  const value = Number(distance);
  return Number.isFinite(value) ? `${value.toFixed(1)} ${t('hospitals.distanceAway')}` : null;
}

export function FindHospitalView() {
  const t = useTranslations();
  const { hospitals, isLoading, isError, refetch, selector } = useFindHospitalViewModel();
  return (
    <Screen>
      <FlatList
        testID="find-hospital-list"
        data={hospitals}
        keyExtractor={(item: Hospital) => item.hospital_id}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <PageHeader title={t('hospitals.findTitle')} subtitle={t('hospitals.findContext')} />
            <LocationPicker selector={selector} />
            {hospitals.length > 0 ? <SectionHeader title={t('hospitals.resultsTitle')} detail={`${hospitals.length} ${t('common.found')}`} /> : null}
          </View>
        }
        renderItem={({ item }: { item: Hospital }) => {
          const distance = formatDistance(item.distance_km, t);
          return <Link href={`/hospital/${item.hospital_id}`} asChild>
            <PressableSurface accessibilityRole="button" testID={`hospital-row-${item.hospital_id}`} style={styles.row}>
              <HospitalLogo hospital={item} t={t} />
              <View style={styles.copy}>
                <Text testID={`hospital-name-${item.hospital_id}`} style={styles.name}>{item.name}</Text>
                <View style={styles.metaRow}><AppIcon name="location-outline" color={colors.muted} size={15} /><Text testID={`hospital-city-${item.hospital_id}`} style={styles.meta}>{item.address || item.city || t('hospitals.fallbackLocation')}</Text></View>
                {item.phone ? <View style={styles.metaRow}><AppIcon name="call-outline" color={colors.muted} size={15} /><Text style={styles.meta}>{ltr(item.phone)}</Text></View> : null}
                {distance ? <Text testID={`hospital-distance-${item.hospital_id}`} style={styles.distance}>{distance}</Text> : null}
              </View>
              <AppIcon name="chevron-forward" color={colors.faint} size={20} />
            </PressableSurface>
          </Link>;
        }}
        ListEmptyComponent={isLoading ? <LoadingState label={t('hospitals.loading')} /> : isError ? <ErrorState onRetry={() => void refetch()} /> : <EmptyState title={t('hospitals.emptyTitle')} message={t('hospitals.emptyMessage')} icon="business-outline" />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 36 },
  header: { gap: 24, marginBottom: 18 },
  separator: { height: 12 },
  row: { minHeight: 112, borderRadius: radius.lg, backgroundColor: colors.surface, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 13, borderWidth: 1, borderColor: colors.line },
  logo: { width: 58, height: 58, borderRadius: 18, backgroundColor: colors.surfaceMuted },
  logoFallback: { width: 58, height: 58, borderRadius: 18, backgroundColor: colors.tealSoft, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 4 },
  name: { ...typography.entityTitle, color: colors.ink },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  meta: { ...typography.metadata, color: colors.muted, flex: 1 },
  distance: { ...typography.metadata, color: colors.tealText, fontWeight: '700' },
});
