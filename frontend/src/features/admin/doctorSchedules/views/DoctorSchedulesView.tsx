import { Controller } from 'react-hook-form';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslations } from '../../../../providers/LocaleProvider';
import { AppButton } from '../../../../shared/components/Buttons';
import { EmptyState } from '../../../../shared/components/EmptyState';
import { ErrorState } from '../../../../shared/components/ErrorState';
import { FormField } from '../../../../shared/components/FormField';
import { LoadingState } from '../../../../shared/components/LoadingState';
import { PageHeader } from '../../../../shared/components/PageHeader';
import { Screen } from '../../../../shared/components/Screen';
import { SectionHeader } from '../../../../shared/components/SectionHeader';
import { colors, radius, typography } from '../../../../shared/theme';
import { displayTime12h } from '../../../../shared/utils/time';
import type { DayOfWeek } from '../../../../shared/types/api';
import { useDoctorSchedulesViewModel } from '../viewmodels/useDoctorSchedulesViewModel';

const DAYS: DayOfWeek[] = [
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY',
];

export function DoctorSchedulesView() {
  const t = useTranslations();
  const viewModel = useDoctorSchedulesViewModel();

  if (viewModel.isLoading) {
    return <Screen><LoadingState label={t('admin.schedules.loading')} /></Screen>;
  }

  if (viewModel.isError) {
    return (
      <Screen>
        <ErrorState
          message={viewModel.error instanceof Error ? viewModel.error.message : undefined}
          onRetry={() => void viewModel.refetch()}
        />
      </Screen>
    );
  }

  if (viewModel.doctorMissing || !viewModel.doctor) {
    return (
      <Screen>
        <EmptyState
          title={t('admin.schedules.doctorMissingTitle')}
          message={t('admin.schedules.doctorMissing')}
          icon="medkit-outline"
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PageHeader
          title={viewModel.doctor.name}
          subtitle={t('admin.schedules.subtitle')}
          right={
            <AppButton
              label={t('admin.schedules.add')}
              icon="add"
              onPress={viewModel.openScheduleForm}
              style={styles.addButton}
            />
          }
        />

        {viewModel.scheduleSuccess ? <SuccessBanner message={viewModel.scheduleSuccess} /> : null}
        {viewModel.scheduleError ? <ErrorBanner message={viewModel.scheduleError} /> : null}

        {viewModel.scheduleFormOpen ? <ScheduleForm viewModel={viewModel} /> : null}

        <View style={styles.section}>
          <SectionHeader title={t('admin.schedules.weekly')} detail={String(viewModel.schedules.length)} />
          {viewModel.schedules.length === 0 ? (
            <EmptyState
              title={t('admin.schedules.emptyTitle')}
              message={t('admin.schedules.empty')}
              icon="calendar-outline"
            />
          ) : (
            <View style={styles.scheduleList}>
              {viewModel.schedules.map((schedule) => (
                <View key={schedule.schedule_id} style={styles.scheduleRow}>
                  <Text style={styles.scheduleDay}>{t(`admin.schedules.days.${schedule.day_of_week}`)}</Text>
                  <View style={styles.scheduleDetails}>
                    <Text style={styles.scheduleTime}>
                      {displayTime12h(schedule.start_time_12h, schedule.start_time)} – {displayTime12h(schedule.end_time_12h, schedule.end_time)}
                    </Text>
                    <Text style={styles.scheduleDuration}>
                      {schedule.appointment_duration} {t('admin.schedules.minutesPerAppointment')}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title={t('admin.schedules.generation.title')} />
          <Text style={styles.sectionDescription}>{t('admin.schedules.generation.subtitle')}</Text>
          <Controller
            control={viewModel.generationControl}
            name="date"
            render={({ field: { onBlur, onChange, value } }) => (
              <FormField
                accessibilityLabel={t('admin.schedules.generation.date')}
                label={t('admin.schedules.generation.date')}
                icon="calendar-outline"
                placeholder="YYYY-MM-DD"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={viewModel.generationErrors.date?.message
                  ? t(viewModel.generationErrors.date.message)
                  : undefined}
              />
            )}
          />
          <AppButton
            label={t('admin.schedules.generation.submit')}
            loading={viewModel.isGenerating}
            onPress={() => void viewModel.onGenerateSlots()}
          />
          {viewModel.generationSuccess ? <SuccessBanner message={viewModel.generationSuccess} /> : null}
          {viewModel.generationError ? <ErrorBanner message={viewModel.generationError} /> : null}
          {viewModel.generatedSlots.length > 0 ? (
            <View style={styles.generatedList}>
              {viewModel.generatedSlots.map((slot) => (
                <View key={slot.slot_id} style={styles.generatedRow}>
                  <Text style={styles.generatedTime}>
                    {displayTime12h(slot.start_time_12h, slot.start_time)} – {displayTime12h(slot.end_time_12h, slot.end_time)}
                  </Text>
                  <Text style={styles.generatedStatus}>{t(`admin.schedules.statuses.${slot.status}`)}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

function ScheduleForm({ viewModel }: { viewModel: ReturnType<typeof useDoctorSchedulesViewModel> }) {
  const t = useTranslations();
  return (
    <View style={styles.form}>
      <Text style={styles.fieldLabel}>{t('admin.schedules.fields.day')}</Text>
      <Controller
        control={viewModel.scheduleControl}
        name="day_of_week"
        render={({ field: { onChange, value } }) => (
          <View style={styles.dayOptions}>
            {DAYS.map((day) => {
              const selected = value === day;
              return (
                <Pressable
                  key={day}
                  accessibilityRole="radio"
                  accessibilityLabel={t(`admin.schedules.days.${day}`)}
                  accessibilityState={{ selected }}
                  onPress={() => onChange(day)}
                  style={[styles.dayOption, selected && styles.dayOptionSelected]}
                >
                  <Text style={[styles.dayOptionText, selected && styles.dayOptionTextSelected]}>
                    {t(`admin.schedules.days.${day}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      />
      <View style={styles.timeFields}>
        <View style={styles.timeField}>
          <Controller
            control={viewModel.scheduleControl}
            name="start_time"
            render={({ field: { onBlur, onChange, value } }) => (
              <FormField
                label={t('admin.schedules.fields.startTime')}
                placeholder="09:00"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={viewModel.scheduleErrors.start_time?.message
                  ? t(viewModel.scheduleErrors.start_time.message)
                  : undefined}
              />
            )}
          />
        </View>
        <View style={styles.timeField}>
          <Controller
            control={viewModel.scheduleControl}
            name="end_time"
            render={({ field: { onBlur, onChange, value } }) => (
              <FormField
                label={t('admin.schedules.fields.endTime')}
                placeholder="17:00"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={viewModel.scheduleErrors.end_time?.message
                  ? t(viewModel.scheduleErrors.end_time.message)
                  : undefined}
              />
            )}
          />
        </View>
      </View>
      <Controller
        control={viewModel.scheduleControl}
        name="appointment_duration"
        render={({ field: { onBlur, onChange, value } }) => (
          <FormField
            accessibilityLabel={t('admin.schedules.fields.duration')}
            label={t('admin.schedules.fields.duration')}
            keyboardType="number-pad"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={viewModel.scheduleErrors.appointment_duration?.message
              ? t(viewModel.scheduleErrors.appointment_duration.message)
              : undefined}
          />
        )}
      />
      <View style={styles.formActions}>
        <AppButton label={t('common.cancel')} variant="quiet" onPress={viewModel.closeScheduleForm} style={styles.formAction} />
        <AppButton label={t('admin.schedules.create')} loading={viewModel.isCreatingSchedule} onPress={() => void viewModel.onCreateSchedule()} style={styles.formAction} />
      </View>
    </View>
  );
}

function SuccessBanner({ message }: { message: string }) {
  return (
    <View accessible accessibilityRole="alert" style={styles.successBanner}>
      <Text style={styles.successText}>{message}</Text>
    </View>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return <Text accessibilityRole="alert" style={styles.errorBanner}>{message}</Text>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 42, gap: 20 },
  addButton: { minHeight: 44, paddingHorizontal: 14 },
  section: { gap: 12 },
  sectionDescription: { ...typography.body, color: colors.muted },
  successBanner: { backgroundColor: colors.successSoft, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12 },
  successText: { ...typography.body, color: colors.success, fontWeight: '700' },
  errorBanner: { ...typography.body, color: colors.danger, backgroundColor: colors.dangerSoft, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12 },
  form: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 16, gap: 14 },
  fieldLabel: { ...typography.metadata, color: colors.inkSoft, fontWeight: '700' },
  dayOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayOption: { minHeight: 40, justifyContent: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, paddingHorizontal: 12 },
  dayOptionSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  dayOptionText: { ...typography.metadata, color: colors.inkSoft, fontWeight: '700' },
  dayOptionTextSelected: { color: colors.primary },
  timeFields: { flexDirection: 'row', gap: 10 },
  timeField: { flex: 1 },
  formActions: { flexDirection: 'row', gap: 10 },
  formAction: { flex: 1 },
  scheduleList: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, overflow: 'hidden' },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  scheduleDay: { ...typography.metadata, color: colors.primary, fontWeight: '800', width: 82 },
  scheduleDetails: { flex: 1, gap: 2 },
  scheduleTime: { ...typography.body, color: colors.ink, fontWeight: '600' },
  scheduleDuration: { ...typography.metadata, color: colors.muted },
  generatedList: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, overflow: 'hidden' },
  generatedRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  generatedTime: { ...typography.body, color: colors.ink, fontWeight: '600' },
  generatedStatus: { ...typography.metadata, color: colors.success, fontWeight: '700' },
});
