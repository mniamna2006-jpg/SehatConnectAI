import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslations } from '../../../providers/LocaleProvider';
import { AppIcon, type AppIconName } from '../../../shared/components/AppIcon';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Screen } from '../../../shared/components/Screen';
import { colors, radius, typography } from '../../../shared/theme';
import { type AppointmentPrefill, type AppointmentTab, useAppointmentsViewModel } from '../viewmodels/useAppointmentsViewModel';
import { BookingTab } from './BookingTab';
import { HistoryTab } from './HistoryTab';
import { QueueTab } from './QueueTab';

const TABS: { id: AppointmentTab; labelKey: string; icon: AppIconName }[] = [
  { id: 'booking', labelKey: 'appointments.mainTabs.booking', icon: 'calendar-outline' },
  { id: 'history', labelKey: 'appointments.mainTabs.history', icon: 'time-outline' },
  { id: 'queue', labelKey: 'appointments.mainTabs.queue', icon: 'people-outline' },
];

export function AppointmentsView(prefill: AppointmentPrefill) {
  const t = useTranslations();
  const { activeTab, setActiveTab } = useAppointmentsViewModel(prefill);
  return (
    <Screen>
      <View style={styles.root}>
        <PageHeader title={t('appointments.title')} subtitle={t('appointments.subtitle')} />
        <View accessibilityRole="tablist" style={styles.tabs}>
          {TABS.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={({ pressed }) => [styles.tab, selected && styles.tabSelected, pressed && styles.pressed]}
              >
                <AppIcon name={tab.icon} color={selected ? colors.primary : colors.muted} size={18} />
                <Text style={[styles.tabText, selected && styles.tabTextSelected]}>{t(tab.labelKey)}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.content}>
          {activeTab === 'booking' ? <BookingTab prefill={prefill} /> : null}
          {activeTab === 'history' ? <HistoryTab /> : null}
          {activeTab === 'queue' ? <QueueTab /> : null}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: 10, gap: 18 },
  tabs: { marginHorizontal: 22, minHeight: 58, borderRadius: radius.lg, backgroundColor: colors.surface, padding: 5, flexDirection: 'row', gap: 4, borderWidth: 1, borderColor: colors.line },
  tab: { flex: 1, minHeight: 46, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  tabSelected: { backgroundColor: colors.primarySoft },
  tabText: { ...typography.metadata, color: colors.muted, fontWeight: '700' },
  tabTextSelected: { color: colors.primary },
  pressed: { opacity: 0.74 },
  content: { flex: 1 },
});
