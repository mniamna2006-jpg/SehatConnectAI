import { useState } from 'react';
import { Link } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useTranslations } from '../../../providers/LocaleProvider';
import { AppIcon } from '../../../shared/components/AppIcon';
import { DoctorCard } from '../../../shared/components/DoctorCard';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';
import { PageHeader } from '../../../shared/components/PageHeader';
import { PressableSurface } from '../../../shared/components/Buttons';
import { Screen } from '../../../shared/components/Screen';
import { SectionHeader } from '../../../shared/components/SectionHeader';
import { colors, radius, typography } from '../../../shared/theme';
import { displayTime12h, todayDayOfWeek } from '../../../shared/utils/time';
import { ltr } from '../../../shared/utils/formatters';
import { openHospitalNavigation } from '../../../core/navigation/openHospitalNavigation';
import { useHospitalDetailsViewModel } from '../viewmodels/useHospitalDetailsViewModel';
import { DoctorAvailabilityAlert } from '../../doctors/views/DoctorAvailabilityAlert';

interface HospitalDetailsViewProps { hospitalId: string }

export function HospitalDetailsView({ hospitalId }: HospitalDetailsViewProps) {
  const t = useTranslations();
  const { hospital, isLoading, isError, refetch } = useHospitalDetailsViewModel(hospitalId);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showWeeklyHours, setShowWeeklyHours] = useState(false);
  if (isLoading) return <Screen><LoadingState label={t('hospitals.loadingProfile')} /></Screen>;
  if (isError) return <Screen><ErrorState onRetry={() => void refetch()} /></Screen>;
  if (!hospital) return <Screen><EmptyState title={t('hospitals.unavailableTitle')} message={t('hospitals.unavailableMessage')} icon="business-outline" /></Screen>;

  const todayHours = hospital.working_hours.find((item) => item.day_of_week === todayDayOfWeek());

  async function handleGetDirections() {
    if (!hospital) return;
    setIsNavigating(true);
    try {
      await openHospitalNavigation({
        latitude: hospital.latitude,
        longitude: hospital.longitude,
        address: hospital.address,
        city: hospital.city,
        hospitalName: hospital.name,
      });
    } finally {
      setIsNavigating(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PageHeader title={t('hospitals.profileTitle')} />
        <View style={styles.hero}>
          {hospital.cover_image_url ? <Image source={{ uri: hospital.cover_image_url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={180} accessibilityLabel={`${hospital.name} ${t('hospitals.building')}`} /> : null}
          <View style={styles.scrim} />
          <View style={styles.heroTop}>
            {hospital.logo_url ? <Image source={{ uri: hospital.logo_url }} style={styles.logo} contentFit="cover" accessibilityLabel={`${hospital.name} ${t('hospitals.logo')}`} /> : <View style={styles.logoFallback}><AppIcon name="business" color={colors.primary} size={29} /></View>}
            {hospital.working_hours.some((item) => item.is_open) ? <View style={styles.hoursBadge}><AppIcon name="time-outline" color={colors.teal} size={16} /><Text style={styles.hoursBadgeText} numberOfLines={1}>{t('hospitals.hoursAvailable')}</Text></View> : null}
          </View>
          <View>
            <Text accessibilityRole="header" testID="hospital-name" style={styles.heroName}>{hospital.name}</Text>
            {hospital.address || hospital.city ? <View style={styles.heroMeta}><AppIcon name="location-outline" color="#DCE8FF" size={18} /><Text testID="hospital-address" style={styles.heroMetaText}>{[hospital.address, hospital.city].filter(Boolean).join(', ')}</Text></View> : null}
            <PressableSurface
              onPress={handleGetDirections}
              disabled={isNavigating}
              testID="get-directions-button"
              accessibilityRole="button"
              accessibilityLabel={t('hospitals.getDirections')}
              style={styles.directionsButton}
            >
              {isNavigating ? (
                <ActivityIndicator testID="get-directions-loading" color={colors.primary} size="small" />
              ) : (
                <>
                  <AppIcon name="navigate-outline" color={colors.primary} size={16} />
                  <Text testID="get-directions-text" style={styles.directionsButtonText}>{t('hospitals.getDirections')}</Text>
                </>
              )}
            </PressableSurface>
          </View>
        </View>

        {hospital.description ? <View style={styles.about}><SectionHeader title={t('hospitals.about')} /><Text style={styles.aboutText}>{hospital.description}</Text></View> : null}

        {(hospital.phone || hospital.email) ? (
          <View style={styles.section}>
            <SectionHeader title={t('hospitals.contactInformation')} />
            <View style={styles.contactPanel}>
              {hospital.phone ? <View style={styles.contactRow}><View style={styles.contactIcon}><AppIcon name="call-outline" color={colors.primary} size={20} /></View><View><Text style={styles.contactLabel}>{t('hospitals.phone')}</Text><Text style={styles.contactValue}>{ltr(hospital.phone)}</Text></View></View> : null}
              {hospital.email ? <View style={styles.contactRow}><View style={styles.contactIcon}><AppIcon name="mail-outline" color={colors.primary} size={20} /></View><View><Text style={styles.contactLabel}>{t('hospitals.email')}</Text><Text style={styles.contactValue}>{hospital.email}</Text></View></View> : null}
            </View>
          </View>
        ) : null}

        {hospital.working_hours.length > 0 ? (
          <View testID="hospital-working-hours-section" style={styles.section}>
            <SectionHeader title={t('hospitals.workingHours')} />
            <View style={styles.hoursPanel}>
              {todayHours ? (
                <View testID="hospital-today-hours" style={styles.todayRow}>
                  <View style={styles.todayIcon}><AppIcon name="time-outline" color={colors.primary} size={19} /></View>
                  <View style={styles.todayCopy}>
                    <Text style={styles.todayLabel}>{t('hospitals.today')}</Text>
                    {todayHours.is_open ? (
                      <View style={styles.todayValueRow}>
                        <Text style={styles.todayValue}>{ltr(displayTime12h(todayHours.opening_time_12h, todayHours.opening_time))}</Text>
                        <Text style={styles.todayValueMuted}>{t('common.to')} {ltr(displayTime12h(todayHours.closing_time_12h, todayHours.closing_time))}</Text>
                      </View>
                    ) : <Text style={styles.todayValue}>{t('common.closed')}</Text>}
                  </View>
                </View>
              ) : null}
              <Pressable
                testID="toggle-weekly-hours"
                accessibilityRole="button"
                accessibilityState={{ expanded: showWeeklyHours }}
                onPress={() => setShowWeeklyHours((prev) => !prev)}
                style={({ pressed }) => [styles.hoursToggle, todayHours && styles.hoursToggleDivider, pressed && styles.pressed]}
              >
                <Text style={styles.hoursToggleText}>{t(showWeeklyHours ? 'hospitals.hideWeeklyHours' : 'hospitals.viewWeeklyHours')}</Text>
                <AppIcon name={showWeeklyHours ? 'chevron-up' : 'chevron-down'} color={colors.primary} size={18} />
              </Pressable>
              {showWeeklyHours ? (
                <View testID="hospital-working-hours-list" style={styles.weeklyList}>
                  {hospital.working_hours.map((item, index) => (
                    <View key={`${item.day_of_week}-${index}`} testID={`working-hours-${item.day_of_week}`} style={[styles.weeklyRow, index > 0 && styles.weeklyRowDivider]}>
                      <Text style={styles.weeklyDay}>{t(`common.days.${item.day_of_week}`)}</Text>
                      {item.is_open ? (
                        <Text style={styles.weeklyTime}>{ltr(displayTime12h(item.opening_time_12h, item.opening_time))} {t('common.to')} {ltr(displayTime12h(item.closing_time_12h, item.closing_time))}</Text>
                      ) : <Text style={styles.weeklyTime}>{t('common.closed')}</Text>}
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {hospital.departments.length > 0 ? (
          <View testID="hospital-departments-section" style={styles.section}>
            <SectionHeader title={t('hospitals.departmentsTitle')} detail={`${hospital.departments.length} ${t('common.available')}`} />
            <View testID="hospital-departments-list" style={styles.departmentGrid}>
              {hospital.departments.map((item) => (
                <Link key={item.department_id} href={`/find-department?hospitalId=${hospitalId}&departmentId=${item.department_id}`} asChild>
                  <PressableSurface testID={`department-link-${item.department_id}`} accessibilityRole="button" style={styles.departmentTile}>
                    <View style={styles.departmentIcon}><AppIcon name="medical-outline" color={colors.teal} size={20} /></View>
                    <Text testID={`department-name-${item.department_id}`} style={styles.departmentName} numberOfLines={2}>{item.name}</Text>
                    <AppIcon name="chevron-forward" color={colors.faint} size={18} />
                  </PressableSurface>
                </Link>
              ))}
            </View>
          </View>
        ) : null}

        {hospital.doctors.length > 0 ? (
          <View testID="hospital-doctors-section" style={styles.section}>
            <SectionHeader title={t('hospitals.doctorsTitle')} detail={`${hospital.doctors.length} ${t('common.available')}`} />
            <View testID="hospital-doctors-list" style={styles.doctorList}>
              {hospital.doctors.map((item) => (
                <DoctorCard
                  key={item.doctor_id}
                  id={item.doctor_id}
                  name={item.name}
                  specialization={item.specialization}
                  hospital={hospital.name}
                  isAvailable={item.is_available}
                  availabilityAction={<DoctorAvailabilityAlert doctorId={item.doctor_id} isAvailable={item.is_available} />}
                  bookingHref={`/appointments?doctorId=${item.doctor_id}`}
                  testID={`doctor-link-${item.doctor_id}`}
                />
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 42, gap: 28 },
  hero: { minHeight: 250, borderRadius: radius.lg, backgroundColor: colors.primary, padding: 20, justifyContent: 'space-between', overflow: 'hidden' },
  scrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: '#102C5BCC' },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  logo: { width: 66, height: 66, borderRadius: 20, backgroundColor: colors.surface },
  logoFallback: { width: 66, height: 66, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  hoursBadge: { minHeight: 36, borderRadius: radius.pill, backgroundColor: '#FFFFFFE8', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, flexShrink: 1 },
  hoursBadgeText: { ...typography.metadata, color: colors.inkSoft, fontWeight: '700' },
  heroName: { fontSize: 27, lineHeight: 33, color: colors.surface, fontWeight: '800', letterSpacing: -0.6 },
  heroMeta: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, marginTop: 9 },
  heroMetaText: { ...typography.body, color: '#DCE8FF', flex: 1 },
  directionsButton: { marginTop: 14, alignSelf: 'flex-start', minHeight: 40, borderRadius: radius.pill, backgroundColor: '#FFFFFFE8', flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 16 },
  directionsButtonText: { ...typography.metadata, color: colors.primaryPressed, fontWeight: '700' },
  about: { gap: 10 },
  aboutText: { ...typography.body, color: colors.inkSoft },
  section: { gap: 14 },
  contactPanel: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 17, gap: 16 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  contactIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  contactLabel: { ...typography.metadata, color: colors.muted },
  contactValue: { ...typography.body, color: colors.ink, fontWeight: '600', marginTop: 1 },
  hoursPanel: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  todayRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  todayIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  todayCopy: { flex: 1 },
  todayLabel: { ...typography.metadata, color: colors.muted },
  todayValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 5, marginTop: 1 },
  todayValue: { ...typography.entityTitle, color: colors.ink },
  todayValueMuted: { ...typography.metadata, color: colors.muted },
  hoursToggle: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 16 },
  hoursToggleDivider: { borderTopWidth: 1, borderTopColor: colors.line },
  hoursToggleText: { ...typography.metadata, color: colors.primary, fontWeight: '700' },
  pressed: { opacity: 0.7 },
  weeklyList: { borderTopWidth: 1, borderTopColor: colors.line },
  weeklyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  weeklyRowDivider: { borderTopWidth: 1, borderTopColor: colors.line },
  weeklyDay: { ...typography.body, color: colors.ink, fontWeight: '600' },
  weeklyTime: { ...typography.metadata, color: colors.muted },
  departmentGrid: { gap: 10 },
  departmentTile: { minHeight: 62, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 13, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 11 },
  departmentIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.tealSoft, alignItems: 'center', justifyContent: 'center' },
  departmentName: { ...typography.metadata, color: colors.ink, fontWeight: '700', flex: 1 },
  doctorList: { gap: 14 },
});
