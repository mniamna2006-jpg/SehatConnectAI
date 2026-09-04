import type { ReactNode } from 'react';
import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslations } from '../../providers/LocaleProvider';
import { colors, radius, shadow, typography } from '../theme';
import { ltr } from '../utils/formatters';
import { displayTime12h } from '../utils/time';
import { AppIcon } from './AppIcon';
import { Avatar } from './Avatar';
import { AppButton } from './Buttons';

interface ScheduleSummary {
  id: string;
  day: string;
  start: string;
  end: string;
  start12h?: string;
  end12h?: string;
}

export function DoctorCard({
  id,
  name,
  specialization,
  hospital,
  isAvailable,
  schedules = [],
  availabilityAction,
  bookingHref,
  testID,
}: {
  id: string;
  name: string;
  specialization?: string;
  hospital?: string;
  isAvailable?: boolean;
  schedules?: ScheduleSummary[];
  availabilityAction?: ReactNode;
  bookingHref: string;
  testID?: string;
}) {
  const t = useTranslations();
  const firstSchedule = schedules[0];
  return (
    <View testID={testID ?? `doctor-row-${id}`} style={styles.card}>
      <View style={styles.mainRow}>
        <Avatar name={name} size={64} />
        <View style={styles.copy}>
          <Text style={styles.name}>{name}</Text>
          {specialization ? <Text style={styles.specialty}>{specialization}</Text> : null}
          {hospital ? (
            <View style={styles.metaRow}>
              <AppIcon name="business-outline" color={colors.muted} size={15} />
              <Text style={styles.metaText}>{hospital}</Text>
            </View>
          ) : null}
          {typeof isAvailable === 'boolean' ? (
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, isAvailable ? styles.availableDot : styles.unavailableDot]} />
              <Text style={[styles.statusText, isAvailable ? styles.availableText : styles.unavailableText]}>
                {t(isAvailable ? 'doctors.availability.available' : 'doctors.availability.unavailable')}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      {firstSchedule ? (
        <View style={styles.availability}>
          <View style={styles.availabilityItem}>
            <AppIcon name="calendar-outline" color={colors.teal} size={17} />
            <Text style={styles.availabilityText}>{t(`common.days.${firstSchedule.day}`)}</Text>
          </View>
          <View style={styles.availabilityItem}>
            <AppIcon name="time-outline" color={colors.teal} size={17} />
            <Text style={styles.availabilityText}>{ltr(`${displayTime12h(firstSchedule.start12h, firstSchedule.start)} - ${displayTime12h(firstSchedule.end12h, firstSchedule.end)}`)}</Text>
          </View>
        </View>
      ) : null}
      {availabilityAction}
      {isAvailable === false ? null : (
        <View style={styles.footer}>
          {schedules.length > 0 ? <Text style={styles.availableLabel}>{t('doctors.availableTimings')}</Text> : <View style={styles.footerSpacer} />}
          <Link href={bookingHref} asChild>
            <AppButton label={t('common.bookAppointment')} style={styles.bookButton} />
          </Link>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 18, gap: 15, shadowColor: shadow.color, shadowOpacity: 0.07, shadowRadius: 15, shadowOffset: shadow.offset, elevation: 2 },
  mainRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  copy: { flex: 1, gap: 2 },
  name: { ...typography.entityTitle, color: colors.ink },
  specialty: { ...typography.body, color: colors.primaryPressed, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  metaText: { ...typography.metadata, color: colors.muted, flex: 1 },
  statusRow: { minHeight: 24, flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  availableDot: { backgroundColor: colors.success },
  unavailableDot: { backgroundColor: colors.faint },
  statusText: { ...typography.metadata, fontWeight: '700' },
  availableText: { color: colors.success },
  unavailableText: { color: colors.muted },
  availability: { backgroundColor: colors.tealSoft, borderRadius: radius.md, padding: 12, gap: 7 },
  availabilityItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  availabilityText: { ...typography.metadata, color: colors.inkSoft },
  footer: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  availableLabel: { ...typography.metadata, color: colors.muted },
  footerSpacer: { flex: 1 },
  bookButton: { minHeight: 44, minWidth: 142, borderRadius: radius.md },
});
