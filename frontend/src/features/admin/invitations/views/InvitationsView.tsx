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
import { useInvitationsViewModel } from '../viewmodels/useInvitationsViewModel';
import type { StaffInvitation } from '../model/types';

export function InvitationsView() {
  const t = useTranslations();
  const vm = useInvitationsViewModel();

  return (
    <Screen>
      <View style={styles.content}>
        <PageHeader
          title={t('admin.invitations.title')}
          subtitle={t('admin.invitations.subtitle')}
          right={<IconButton icon="add" label={t('admin.invitations.add')} onPress={vm.openCreate} />}
        />

        {vm.successMessage ? (
          <View accessible accessibilityRole="alert" style={styles.successBanner}>
            <Text style={styles.successText}>{vm.successMessage}</Text>
          </View>
        ) : null}
        {vm.apiError ? <Text accessibilityRole="alert" style={styles.errorBanner}>{vm.apiError}</Text> : null}

        {vm.formOpen ? (
          <View style={styles.form} testID="invitation-form">
            <Controller control={vm.control} name="email" render={({ field }) => (
              <FormField testID="invitation-email" label={t('admin.invitations.fields.email')} icon="mail-outline" autoCapitalize="none" keyboardType="email-address" value={field.value ?? ''} onChangeText={field.onChange} error={vm.errors.email?.message} />
            )} />
            <Controller control={vm.control} name="employee_id" render={({ field }) => (
              <FormField testID="invitation-employee-id" label={t('admin.invitations.fields.employeeId')} icon="card-outline" value={field.value ?? ''} onChangeText={field.onChange} error={vm.errors.employee_id?.message} />
            )} />
            <Controller control={vm.control} name="position" render={({ field }) => (
              <FormField testID="invitation-position" label={t('admin.invitations.fields.position')} icon="briefcase-outline" value={field.value ?? ''} onChangeText={field.onChange} error={vm.errors.position?.message} />
            )} />

            <Text style={styles.fieldLabel}>{t('admin.invitations.fields.department')}</Text>
            <Controller control={vm.control} name="department_id" render={({ field: { value, onChange } }) => (
              <View style={styles.departmentOptions}>
                <Pressable accessibilityRole="button" accessibilityLabel={t('admin.invitations.noDepartment')} onPress={() => onChange('')} style={[styles.departmentOption, !value && styles.departmentOptionSelected]}>
                  <Text style={[styles.departmentOptionText, !value && styles.departmentOptionTextSelected]}>{t('admin.invitations.noDepartment')}</Text>
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
              <AppButton testID="invitation-cancel" label={t('common.cancel')} variant="quiet" onPress={vm.closeForm} style={styles.flexButton} />
              <AppButton testID="invitation-submit" label={t('admin.invitations.create')} loading={vm.isSubmitting} onPress={vm.onSubmit} style={styles.flexButton} />
            </View>
          </View>
        ) : null}

        {vm.isLoading ? (
          <LoadingState label={t('admin.invitations.loading')} />
        ) : vm.isError ? (
          <ErrorState message={vm.error instanceof Error ? vm.error.message : undefined} onRetry={() => void vm.refetch()} />
        ) : vm.invitations.length === 0 ? (
          <EmptyState icon="mail-outline" title={t('admin.invitations.emptyTitle')} message={t('admin.invitations.empty')} />
        ) : (
          <FlatList
            data={vm.invitations}
            keyExtractor={(item) => item.invitation_id}
            contentContainerStyle={styles.list}
            renderItem={({ item }: { item: StaffInvitation }) => (
              <View style={styles.row} testID={`invitation-row-${item.invitation_id}`}>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowTitle}>{item.email}</Text>
                  <Text style={styles.rowSubtitle}>{item.position} · {item.employee_id}</Text>
                  <Text style={styles.statusTag}>{t(`admin.invitations.status.${item.status}`)}</Text>
                </View>
                {item.status === 'PENDING' ? (
                  <IconButton icon="close-circle-outline" label={t('admin.invitations.revoke')} onPress={() => vm.confirmRevoke(item)} />
                ) : null}
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
  statusTag: { ...typography.metadata, color: colors.primary, fontWeight: '700' },
  rowActions: { flexDirection: 'row', gap: 6 },
});
