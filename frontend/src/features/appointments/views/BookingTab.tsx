import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Controller } from 'react-hook-form';
import { useOptionalLocale, useTranslations } from '../../../providers/LocaleProvider';
import { AppIcon, type AppIconName } from '../../../shared/components/AppIcon';
import { Avatar } from '../../../shared/components/Avatar';
import { AppButton } from '../../../shared/components/Buttons';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { FormField } from '../../../shared/components/FormField';
import { LoadingState } from '../../../shared/components/LoadingState';
import { SectionHeader } from '../../../shared/components/SectionHeader';
import { colors, radius, typography } from '../../../shared/theme';
import { displayTime12h } from '../../../shared/utils/time';
import type { AppointmentPrefill } from '../viewmodels/useAppointmentsViewModel';
import { useAppointmentBookingViewModel } from '../viewmodels/useAppointmentBookingViewModel';

function StageHeader({ icon, title, detail }: { icon: AppIconName; title: string; detail?: string }) {
  return (
    <View style={styles.stageHeader}>
      <View style={styles.stageIcon}><AppIcon name={icon} color={colors.primary} size={19} /></View>
      <View style={styles.stageHeadingCopy}><Text style={styles.stageTitle}>{title}</Text>{detail ? <Text style={styles.stageDetail}>{detail}</Text> : null}</View>
    </View>
  );
}

function nextSevenDays(): Date[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + index);
    return date;
  });
}

function toDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function BookingTab({ prefill }: { prefill: AppointmentPrefill }) {
  const t = useTranslations();
  const locale = useOptionalLocale();
  const vm = useAppointmentBookingViewModel(prefill);
  const days = nextSevenDays();
  const [showCustomDate, setShowCustomDate] = useState(false);
  const isCustomDateSelected = Boolean(vm.selectedDate) && !days.some((date) => toDateValue(date) === vm.selectedDate);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.introCard}>
        <View style={styles.introIcon}><AppIcon name="calendar-clear" color={colors.surface} size={27} /></View>
        <View style={styles.introCopy}><Text accessibilityRole="header" style={styles.introTitle}>{t('appointments.booking.introTitle')}</Text><Text style={styles.introText}>{t('appointments.booking.introMessage')}</Text></View>
      </View>

      <SectionHeader title={t('appointments.booking.phaseCare')} />

      <View style={styles.stage}>
        <StageHeader icon="business-outline" title={t('appointments.booking.chooseHospital')} detail={vm.hospitalId ? t('common.selected') : t('appointments.booking.startHere')} />
        {vm.isLoadingHospitals ? <LoadingState label={t('appointments.booking.loadingHospitals')} /> : vm.isHospitalsError ? <ErrorState onRetry={() => void vm.refetchHospitals()} /> : (
          <View style={styles.entityList}>
            {vm.hospitals.map((hospital) => {
              const selected = vm.hospitalId === hospital.hospital_id;
              return (
                <Pressable key={hospital.hospital_id} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => vm.onSelectHospital(hospital.hospital_id)} style={({ pressed }) => [styles.entityRow, selected && styles.entityRowSelected, pressed && styles.pressed]}>
                  <View style={[styles.entityIcon, selected && styles.entityIconSelected]}><AppIcon name="business" color={selected ? colors.surface : colors.teal} size={20} /></View>
                  <Text style={[styles.entityName, selected && styles.entityNameSelected]}>{hospital.name}</Text>
                  {selected ? <AppIcon name="checkmark-circle" color={colors.primary} size={22} /> : <AppIcon name={locale?.isRTL ? 'chevron-back' : 'chevron-forward'} color={colors.faint} size={19} />}
                </Pressable>
              );
            })}
            {vm.hospitals.length === 0 ? <Text style={styles.inlineEmpty}>{t('appointments.booking.noHospitals')}</Text> : null}
          </View>
        )}
        {vm.errors.hospital_id ? <Text style={styles.error}>{vm.errors.hospital_id.message}</Text> : null}
      </View>

      <View style={styles.stage}>
        <StageHeader icon="grid-outline" title={t('appointments.booking.chooseDepartment')} detail={vm.departmentId ? t('common.selected') : t('appointments.booking.selectHospitalFirst')} />
        {vm.isLoadingDepartments ? <LoadingState label={t('appointments.booking.loadingDepartments')} /> : vm.isDepartmentsError ? <ErrorState onRetry={() => void vm.refetchDepartments()} /> : (
          <View style={styles.departmentGrid}>
            {vm.departments.map((department) => {
              const selected = vm.departmentId === department.department_id;
              return (
                <Pressable key={department.department_id} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => vm.onSelectDepartment(department.department_id)} style={({ pressed }) => [styles.departmentOption, selected && styles.departmentOptionSelected, pressed && styles.pressed]}>
                  <View style={[styles.departmentOptionIcon, selected && styles.departmentOptionIconSelected]}><AppIcon name="medical-outline" color={selected ? colors.surface : colors.primary} size={19} /></View>
                  <Text style={[styles.departmentOptionText, selected && styles.entityNameSelected]} numberOfLines={2}>{department.name}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
        {vm.errors.department_id ? <Text style={styles.error}>{vm.errors.department_id.message}</Text> : null}
      </View>

      <View style={styles.stage}>
        <StageHeader icon="medkit-outline" title={t('appointments.booking.chooseDoctor')} detail={vm.doctorId ? t('common.selected') : undefined} />
        {vm.isLoadingDoctors ? <LoadingState label={t('appointments.booking.loadingDoctors')} /> : vm.isDoctorsError ? <ErrorState onRetry={() => void vm.refetchDoctors()} /> : (
          <View style={styles.doctorList}>
            {vm.doctors.map((doctor) => {
              const selected = vm.doctorId === doctor.doctor_id;
              return (
                <Pressable key={doctor.doctor_id} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => vm.onSelectDoctor(doctor.doctor_id)} style={({ pressed }) => [styles.doctorOption, selected && styles.doctorOptionSelected, pressed && styles.pressed]}>
                  <Avatar name={doctor.name} size={50} />
                  <View style={styles.doctorCopy}><Text style={styles.doctorName}>{doctor.name}</Text>{doctor.specialization ? <Text style={styles.doctorSpecialty}>{doctor.specialization}</Text> : null}</View>
                  {selected ? <AppIcon name="checkmark-circle" color={colors.primary} size={22} /> : <AppIcon name="ellipse-outline" color={colors.faint} size={20} />}
                </Pressable>
              );
            })}
          </View>
        )}
        {vm.errors.doctor_id ? <Text style={styles.error}>{vm.errors.doctor_id.message}</Text> : null}
      </View>

      <SectionHeader title={t('appointments.booking.dateTime')} />

      <View style={styles.stage}>
        <StageHeader icon="calendar-outline" title={t('appointments.booking.chooseDate')} detail={vm.selectedDate || t('appointments.booking.nextSevenDays')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateStrip}>
          {days.map((date, index) => {
            const value = toDateValue(date);
            const selected = vm.selectedDate === value;
            return (
              <Pressable key={value} testID={`date-option-${index}`} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => vm.onSelectDate(value)} style={({ pressed }) => [styles.dateOption, selected && styles.dateOptionSelected, pressed && styles.pressed]}>
                <Text style={[styles.dateDay, selected && styles.dateTextSelected]}>{date.toLocaleDateString(locale?.locale === 'URDU' ? 'ur-PK' : 'en-US', { weekday: 'short' })}</Text>
                <Text style={[styles.dateNumber, selected && styles.dateTextSelected]}>{date.getDate()}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        {showCustomDate || isCustomDateSelected ? (
          <FormField accessibilityLabel={t('appointments.booking.appointmentDate')} label={t('appointments.booking.enterDate')} icon="calendar-outline" placeholder="YYYY-MM-DD" value={vm.selectedDate} onChangeText={vm.onSelectDate} error={vm.isInvalidDate ? t('appointments.booking.invalidDate') : undefined} />
        ) : (
          <Pressable accessibilityRole="button" onPress={() => setShowCustomDate(true)} style={({ pressed }) => [styles.customDateLink, pressed && styles.pressed]}>
            <Text style={styles.customDateLinkText}>{t('appointments.booking.enterDifferentDate')}</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.stage}>
        <StageHeader icon="time-outline" title={t('appointments.booking.availableTime')} detail={vm.timeSlots.length > 0 ? `${vm.timeSlots.length} ${t('appointments.booking.slots')}` : undefined} />
        {vm.isLoadingSlots ? <LoadingState label={t('appointments.booking.loadingSlots')} /> : null}
        {!vm.isLoadingSlots && vm.isSlotsError ? <ErrorState onRetry={() => void vm.refetchSlots()} /> : null}
        {!vm.isLoadingSlots && !vm.isSlotsError && vm.selectedDate && vm.timeSlots.length === 0 ? <EmptyState title={t('appointments.booking.noTimesTitle')} message={t('appointments.booking.noTimesMessage')} icon="time-outline" /> : null}
        <View style={styles.timeGrid}>
          {vm.timeSlots.map((slot) => {
            const selected = vm.selectedSlotId === slot.slot_id;
            return (
              <Pressable key={slot.slot_id} accessibilityRole="radio" accessibilityLabel={`${displayTime12h(slot.start_time_12h, slot.start_time)} ${t('common.to')} ${displayTime12h(slot.end_time_12h, slot.end_time)}`} accessibilityState={{ selected }} onPress={() => vm.onSelectSlot(slot.slot_id)} style={({ pressed }) => [styles.timeOption, selected && styles.timeOptionSelected, pressed && styles.pressed]}>
                <Text style={[styles.timeText, selected && styles.timeTextSelected]}>{displayTime12h(slot.start_time_12h, slot.start_time)}</Text>
              </Pressable>
            );
          })}
        </View>
        {vm.errors.slot_id ? <Text style={styles.error}>{vm.errors.slot_id.message}</Text> : null}
      </View>

      <SectionHeader title={t('appointments.booking.phaseDetails')} />

      <View style={styles.stage}>
        <StageHeader icon="document-text-outline" title={t('appointments.booking.reasonForVisit')} detail={t('common.optional')} />
        <Controller control={vm.control} name="reason" render={({ field }) => <FormField label={t('appointments.booking.reason')} accessibilityLabel={t('appointments.booking.reasonAccessibility')} placeholder={t('appointments.booking.reasonHelpPlaceholder')} value={field.value ?? ''} onBlur={field.onBlur} onChangeText={field.onChange} multiline />} />
      </View>

      {vm.bookingError ? <ErrorState message={vm.bookingError} /> : null}
      {vm.bookingSuccess ? <View style={styles.success}><AppIcon name="checkmark-circle" color={colors.success} size={22} /><Text style={styles.successText}>{vm.bookingSuccess}</Text></View> : null}
      <AppButton
  label={t('appointments.booking.confirmAppointment')}
  icon="checkmark-circle-outline"
  loading={vm.isSubmitting || vm.isPrefilling}
  disabled={vm.isPrefilling}
  onPress={vm.onSubmit}
/>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 22, paddingBottom: 44, gap: 26 },
  introCard: { minHeight: 112, borderRadius: radius.lg, backgroundColor: colors.primary, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 },
  introIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#FFFFFF24', alignItems: 'center', justifyContent: 'center' },
  introCopy: { flex: 1 },
  introTitle: { ...typography.sectionTitle, color: colors.surface },
  introText: { ...typography.body, color: '#DCE8FF', marginTop: 4 },
  stage: { gap: 13 },
  stageHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  stageIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  stageHeadingCopy: { flex: 1 },
  stageTitle: { ...typography.entityTitle, color: colors.ink },
  stageDetail: { ...typography.metadata, color: colors.muted, marginTop: 1 },
  entityList: { gap: 10 },
  entityRow: { minHeight: 64, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  entityRowSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  entityIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.tealSoft, alignItems: 'center', justifyContent: 'center' },
  entityIconSelected: { backgroundColor: colors.primary },
  entityName: { ...typography.body, color: colors.ink, fontWeight: '700', flex: 1 },
  entityNameSelected: { color: colors.primaryPressed },
  inlineEmpty: { ...typography.body, color: colors.muted, paddingVertical: 8 },
  departmentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  departmentOption: { width: '48%', minHeight: 90, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, padding: 13, gap: 10 },
  departmentOptionSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  departmentOptionIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  departmentOptionIconSelected: { backgroundColor: colors.primary },
  departmentOptionText: { ...typography.metadata, color: colors.ink, fontWeight: '700' },
  doctorList: { gap: 10 },
  doctorOption: { minHeight: 74, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 12 },
  doctorOptionSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  doctorCopy: { flex: 1 },
  doctorName: { ...typography.body, color: colors.ink, fontWeight: '700' },
  doctorSpecialty: { ...typography.metadata, color: colors.muted, marginTop: 2 },
  dateStrip: { gap: 10, paddingRight: 22 },
  dateOption: { width: 66, minHeight: 82, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', gap: 4 },
  dateOptionSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  dateDay: { ...typography.metadata, color: colors.muted },
  dateNumber: { fontSize: 22, lineHeight: 27, color: colors.ink, fontWeight: '800' },
  dateTextSelected: { color: colors.surface },
  customDateLink: { alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center' },
  customDateLinkText: { ...typography.metadata, color: colors.primary, fontWeight: '700' },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  timeOption: { minWidth: '30%', minHeight: 48, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  timeOptionSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  timeText: { ...typography.metadata, color: colors.ink, fontWeight: '700' },
  timeTextSelected: { color: colors.surface },
  error: { ...typography.metadata, color: colors.danger },
  success: { minHeight: 58, borderRadius: radius.md, backgroundColor: colors.successSoft, flexDirection: 'row', alignItems: 'center', gap: 9, padding: 14 },
  successText: { ...typography.body, color: colors.success, fontWeight: '600', flex: 1 },
  pressed: { opacity: 0.76 },
});
