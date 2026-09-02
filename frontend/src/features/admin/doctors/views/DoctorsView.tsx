import { Controller } from 'react-hook-form';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslations } from '../../../../providers/LocaleProvider';
import { AppButton, IconButton } from '../../../../shared/components/Buttons';
import { EmptyState } from '../../../../shared/components/EmptyState';
import { ErrorState } from '../../../../shared/components/ErrorState';
import { FormField } from '../../../../shared/components/FormField';
import { LoadingState } from '../../../../shared/components/LoadingState';
import { PageHeader } from '../../../../shared/components/PageHeader';
import { Screen } from '../../../../shared/components/Screen';
import { colors, radius, typography } from '../../../../shared/theme';
import type { AdminDoctorRow } from '../model/types';
import { useDoctorsViewModel } from '../viewmodels/useDoctorsViewModel';

export function DoctorsView() {
  const t = useTranslations();
  const viewModel = useDoctorsViewModel();

  if (viewModel.isLoading) {
    return <Screen><LoadingState label={t('admin.doctors.loading')} /></Screen>;
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

  return (
    <Screen>
      <FlatList
        data={viewModel.doctorRows}
        keyExtractor={(doctor) => doctor.doctor_id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <PageHeader
              title={t('admin.doctors.title')}
              subtitle={t('admin.doctors.subtitle')}
              right={
                <AppButton
                  label={t('admin.doctors.add')}
                  icon="add"
                  disabled={viewModel.departments.length === 0}
                  onPress={viewModel.openCreate}
                  style={styles.addButton}
                />
              }
            />

            {viewModel.departments.length === 0 ? (
              <View style={styles.notice}>
                <Text style={styles.noticeText}>{t('admin.doctors.departmentRequired')}</Text>
              </View>
            ) : null}

            {viewModel.successMessage ? (
              <View accessible accessibilityRole="alert" style={styles.successBanner}>
                <Text style={styles.successText}>{viewModel.successMessage}</Text>
              </View>
            ) : null}

            {viewModel.apiError ? (
              <Text accessibilityRole="alert" style={styles.errorBanner}>{viewModel.apiError}</Text>
            ) : null}

            {viewModel.formOpen ? <DoctorForm viewModel={viewModel} /> : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title={t('admin.doctors.emptyTitle')}
            message={t('admin.doctors.empty')}
            icon="medkit-outline"
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => <DoctorRow doctor={item} viewModel={viewModel} />}
      />
    </Screen>
  );
}

function DoctorForm({ viewModel }: { viewModel: ReturnType<typeof useDoctorsViewModel> }) {
  const t = useTranslations();
  const fields = [
    { name: 'name', label: t('admin.doctors.fields.name'), icon: 'person-outline' as const },
    { name: 'specialization', label: t('admin.doctors.fields.specialization'), icon: 'medical-outline' as const },
    { name: 'qualification', label: t('admin.doctors.fields.qualification'), icon: 'school-outline' as const },
    { name: 'license_number', label: t('admin.doctors.fields.licenseNumber'), icon: 'document-text-outline' as const },
    { name: 'consultation_fee', label: t('admin.doctors.fields.consultationFee'), icon: 'cash-outline' as const, keyboardType: 'decimal-pad' as const },
    { name: 'bio', label: t('admin.doctors.fields.bio'), icon: 'reader-outline' as const, multiline: true },
  ] as const;

  return (
    <View style={styles.form}>
      <Text style={styles.fieldLabel}>{t('admin.doctors.fields.department')}</Text>
      <Controller
        control={viewModel.control}
        name="department_id"
        render={({ field: { onChange, value } }) => (
          <View style={styles.departmentOptions}>
            {viewModel.departments.map((department) => {
              const selected = value === department.department_id;
              return (
                <Pressable
                  key={department.department_id}
                  accessibilityRole="radio"
                  accessibilityLabel={department.name}
                  accessibilityState={{ selected }}
                  onPress={() => onChange(department.department_id)}
                  style={[styles.departmentOption, selected && styles.departmentOptionSelected]}
                >
                  <Text style={[styles.departmentOptionText, selected && styles.departmentOptionTextSelected]}>
                    {department.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      />
      {viewModel.errors.department_id ? (
        <Text accessibilityRole="alert" style={styles.fieldError}>
          {viewModel.errors.department_id.message ? t(viewModel.errors.department_id.message) : null}
        </Text>
      ) : null}

      {fields.map(({ name, label, ...props }) => (
        <Controller
          key={name}
          control={viewModel.control}
          name={name}
          render={({ field: { onBlur, onChange, value } }) => (
            <FormField
              {...props}
              accessibilityLabel={label}
              error={viewModel.errors[name]?.message ? t(viewModel.errors[name].message) : undefined}
              label={label}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
      ))}

      <View style={styles.formActions}>
        <AppButton
          label={t('common.cancel')}
          variant="quiet"
          onPress={viewModel.closeForm}
          style={styles.formAction}
        />
        <AppButton
          label={viewModel.editing ? t('admin.doctors.save') : t('admin.doctors.create')}
          loading={viewModel.isSubmitting}
          onPress={() => void viewModel.onSubmit()}
          style={styles.formAction}
        />
      </View>
    </View>
  );
}

function DoctorRow({
  doctor,
  viewModel,
}: {
  doctor: AdminDoctorRow;
  viewModel: ReturnType<typeof useDoctorsViewModel>;
}) {
  const t = useTranslations();
  return (
    <View style={styles.row} testID={`doctor-row-${doctor.doctor_id}`}>
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle}>{doctor.name}</Text>
        <Text style={styles.rowMeta}>{doctor.specialization} · {doctor.department_name}</Text>
        <Text style={styles.rowMeta}>{t('admin.doctors.fields.licenseNumber')}: {doctor.license_number}</Text>
      </View>
      <View style={styles.rowActions}>
        <IconButton
          icon="calendar-outline"
          label={t('admin.doctors.schedules')}
          onPress={() => viewModel.openSchedules(doctor)}
        />
        <IconButton
          icon="pencil-outline"
          label={t('admin.doctors.edit')}
          onPress={() => viewModel.openEdit(doctor)}
        />
        <IconButton
          icon="trash-outline"
          label={t('admin.doctors.deactivate')}
          onPress={() => viewModel.confirmDeactivate(doctor)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 36 },
  headerContent: { gap: 16, marginBottom: 16 },
  addButton: { minHeight: 44, paddingHorizontal: 14 },
  notice: { backgroundColor: colors.warningSoft, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12 },
  noticeText: { ...typography.body, color: colors.warning },
  successBanner: { backgroundColor: colors.successSoft, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12 },
  successText: { ...typography.body, color: colors.success, fontWeight: '700' },
  errorBanner: { ...typography.body, color: colors.danger, backgroundColor: colors.dangerSoft, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12 },
  form: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 16, gap: 14 },
  fieldLabel: { ...typography.metadata, color: colors.inkSoft, fontWeight: '700' },
  departmentOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  departmentOption: { minHeight: 42, justifyContent: 'center', borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 13 },
  departmentOptionSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  departmentOptionText: { ...typography.metadata, color: colors.inkSoft, fontWeight: '700' },
  departmentOptionTextSelected: { color: colors.primary },
  fieldError: { ...typography.metadata, color: colors.danger },
  formActions: { flexDirection: 'row', gap: 10 },
  formAction: { flex: 1 },
  separator: { height: 10 },
  row: { gap: 10, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 14 },
  rowInfo: { flex: 1, gap: 3 },
  rowTitle: { ...typography.entityTitle, color: colors.ink },
  rowMeta: { ...typography.metadata, color: colors.muted },
  rowActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 4 },
});
