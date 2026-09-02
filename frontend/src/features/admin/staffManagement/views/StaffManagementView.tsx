import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Controller } from 'react-hook-form';
import { AppButton, IconButton } from '../../../../shared/components/Buttons';
import { EmptyState } from '../../../../shared/components/EmptyState';
import { ErrorState } from '../../../../shared/components/ErrorState';
import { FormField } from '../../../../shared/components/FormField';
import { LoadingState } from '../../../../shared/components/LoadingState';
import { PageHeader } from '../../../../shared/components/PageHeader';
import { Screen } from '../../../../shared/components/Screen';
import { useTranslations } from '../../../../providers/LocaleProvider';
import { colors, radius, shadow, typography } from '../../../../shared/theme';
import { useStaffManagementViewModel } from '../viewmodels/useStaffManagementViewModel';
import type { StaffMember } from '../model/types';

export function StaffManagementView() {
  const t = useTranslations();
  const vm = useStaffManagementViewModel();

  return (
    <Screen>
      <View style={styles.content}>
        <PageHeader
          title={t('admin.staffManagement.title')}
          subtitle={t('admin.staffManagement.subtitle')}
          right={<IconButton icon="add" label={t('admin.staffManagement.add')} onPress={vm.openCreate} />}
        />

        {vm.successMessage ? (
          <View accessible accessibilityRole="alert" style={styles.successBanner}>
            <Text style={styles.successText}>{vm.successMessage}</Text>
          </View>
        ) : null}
        {vm.apiError ? <Text accessibilityRole="alert" style={styles.errorBanner}>{vm.apiError}</Text> : null}

        {vm.formOpen ? (
          <View style={styles.form} testID="staff-form">
            <Controller control={vm.control} name="full_name" render={({ field }) => (
              <FormField testID="staff-full-name" label={t('admin.staffManagement.fields.fullName')} icon="person-outline" value={field.value ?? ''} onChangeText={field.onChange} error={vm.errors.full_name?.message} />
            )} />
            <Controller control={vm.control} name="employee_id" render={({ field }) => (
              <FormField testID="staff-employee-id" label={t('admin.staffManagement.fields.employeeId')} icon="card-outline" value={field.value ?? ''} onChangeText={field.onChange} error={vm.errors.employee_id?.message} />
            )} />
            <Controller control={vm.control} name="position" render={({ field }) => (
              <FormField testID="staff-position" label={t('admin.staffManagement.fields.position')} icon="briefcase-outline" value={field.value ?? ''} onChangeText={field.onChange} error={vm.errors.position?.message} />
            )} />
            <Controller control={vm.control} name="email" render={({ field }) => (
              <FormField testID="staff-email" label={t('admin.staffManagement.fields.email')} icon="mail-outline" autoCapitalize="none" keyboardType="email-address" value={field.value ?? ''} onChangeText={field.onChange} error={vm.errors.email?.message} />
            )} />
            <Controller control={vm.control} name="phone" render={({ field }) => (
              <FormField testID="staff-phone" label={t('admin.staffManagement.fields.phone')} icon="call-outline" keyboardType="phone-pad" value={field.value ?? ''} onChangeText={field.onChange} error={vm.errors.phone?.message} />
            )} />
            {!vm.editing ? (
              <Controller control={vm.control} name="password" render={({ field }) => (
                <FormField testID="staff-password" label={t('admin.staffManagement.fields.password')} icon="lock-closed-outline" secureTextEntry value={field.value ?? ''} onChangeText={field.onChange} error={vm.errors.password?.message} />
              )} />
            ) : null}

            <Text style={styles.fieldLabel}>{t('admin.staffManagement.fields.department')}</Text>
            <Controller control={vm.control} name="department_id" render={({ field: { value, onChange } }) => (
              <View style={styles.departmentOptions}>
                <Pressable accessibilityRole="button" accessibilityLabel={t('admin.staffManagement.noDepartment')} onPress={() => onChange('')} style={[styles.departmentOption, !value && styles.departmentOptionSelected]}>
                  <Text style={[styles.departmentOptionText, !value && styles.departmentOptionTextSelected]}>{t('admin.staffManagement.noDepartment')}</Text>
                </Pressable>
                {vm.departments.map((department) => {
                  const selected = value === department.department_id;
                  return (
                    <Pressable key={department.department_id} accessibilityRole="button" accessibilityLabel={department.name} onPress={() => onChange(department.department_id)} style={[styles.departmentOption, selected && styles.departmentOptionSelected]}>
                      <Text style={[styles.departmentOptionText, selected && styles.departmentOptionTextSelected]}>{department.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )} />

            <View style={styles.formActions}>
              <AppButton testID="staff-cancel" label={t('common.cancel')} variant="quiet" onPress={vm.closeForm} style={styles.flexButton} />
              <AppButton testID="staff-submit" label={vm.editing ? t('admin.staffManagement.save') : t('admin.staffManagement.create')} loading={vm.isSubmitting} onPress={vm.onSubmit} style={styles.flexButton} />
            </View>
          </View>
        ) : null}

        {vm.isLoading ? (
          <LoadingState label={t('admin.staffManagement.loading')} />
        ) : vm.isError ? (
          <ErrorState message={vm.error instanceof Error ? vm.error.message : undefined} onRetry={() => void vm.refetch()} />
        ) : vm.staff.length === 0 ? (
          <EmptyState icon="people-outline" title={t('admin.staffManagement.emptyTitle')} message={t('admin.staffManagement.empty')} />
        ) : (
          <FlatList
            data={vm.staff}
            keyExtractor={(item) => item.staff_id}
            contentContainerStyle={styles.list}
            renderItem={({ item }: { item: StaffMember }) => (
              <View style={styles.row} testID={`staff-row-${item.staff_id}`}>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowTitle}>{item.user.full_name}</Text>
                  <Text style={styles.rowSubtitle}>{item.position} · {item.employee_id}{item.department ? ` · ${item.department.name}` : ''}</Text>
                  {!item.is_active ? <Text style={styles.inactiveTag}>{t('admin.staffManagement.inactive')}</Text> : null}
                </View>
                <View style={styles.rowActions}>
                  <IconButton icon="pencil-outline" label={t('admin.staffManagement.edit')} onPress={() => vm.openEdit(item)} />
                  {item.is_active ? (
                    <IconButton icon="trash-outline" label={t('admin.staffManagement.deactivate')} onPress={() => vm.confirmDeactivate(item)} />
                  ) : null}
                </View>
              </View>
            )}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 20, gap: 16 },
  form: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, gap: 14, shadowColor: shadow.color, shadowOpacity: shadow.opacity, shadowRadius: shadow.radius, shadowOffset: shadow.offset, elevation: shadow.elevation },
  fieldLabel: { ...typography.metadata, color: colors.inkSoft, fontWeight: '700' },
  departmentOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  departmentOption: { minHeight: 42, justifyContent: 'center', borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 13 },
  departmentOptionSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  departmentOptionText: { ...typography.metadata, color: colors.inkSoft, fontWeight: '700' },
  departmentOptionTextSelected: { color: colors.primary },
  formActions: { flexDirection: 'row', gap: 10 },
  flexButton: { flex: 1 },
  successBanner: { backgroundColor: colors.successSoft, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12 },
  successText: { ...typography.body, color: colors.success, fontWeight: '700' },
  errorBanner: { ...typography.body, color: colors.danger, backgroundColor: colors.dangerSoft, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12 },
  list: { gap: 10, paddingBottom: 24 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, shadowColor: shadow.color, shadowOpacity: shadow.opacity, shadowRadius: shadow.radius, shadowOffset: shadow.offset, elevation: shadow.elevation },
  rowInfo: { flex: 1, gap: 4 },
  rowTitle: { ...typography.entityTitle, color: colors.ink },
  rowSubtitle: { ...typography.body, color: colors.muted },
  inactiveTag: { ...typography.metadata, color: colors.danger, fontWeight: '700' },
  rowActions: { flexDirection: 'row', gap: 6 },
});
