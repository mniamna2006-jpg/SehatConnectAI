import { FlatList, StyleSheet, Text, View } from 'react-native';
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
import { useDepartmentsViewModel } from '../viewmodels/useDepartmentsViewModel';
import type { Department } from '../model/types';

export function DepartmentsView() {
  const t = useTranslations();
  const vm = useDepartmentsViewModel();

  return (
    <Screen>
      <View style={styles.content}>
        <PageHeader
          title={t('admin.departments.title')}
          subtitle={t('admin.departments.subtitle')}
          right={<IconButton icon="add" label={t('admin.departments.add')} onPress={vm.openCreate} />}
        />

        {vm.formOpen ? (
          <View style={styles.form} testID="department-form">
            <Controller
              control={vm.control}
              name="name"
              render={({ field }) => (
                <FormField
                  testID="department-name"
                  label={t('admin.departments.fields.name')}
                  icon="business-outline"
                  value={field.value ?? ''}
                  onChangeText={field.onChange}
                  error={vm.errors.name?.message}
                />
              )}
            />
            <Controller
              control={vm.control}
              name="description"
              render={({ field }) => (
                <FormField
                  testID="department-description"
                  label={t('admin.departments.fields.description')}
                  multiline
                  value={field.value ?? ''}
                  onChangeText={field.onChange}
                  error={vm.errors.description?.message}
                />
              )}
            />
            {vm.apiError ? <Text accessibilityRole="alert" testID="department-error" style={styles.error}>{vm.apiError}</Text> : null}
            <View style={styles.formActions}>
              <AppButton testID="department-cancel" label={t('common.cancel')} variant="quiet" onPress={vm.closeForm} style={styles.flexButton} />
              <AppButton testID="department-submit" label={vm.editing ? t('admin.departments.save') : t('admin.departments.create')} loading={vm.isSubmitting} onPress={vm.onSubmit} style={styles.flexButton} />
            </View>
          </View>
        ) : null}

        {vm.isLoading ? (
          <LoadingState />
        ) : vm.isError ? (
          <ErrorState onRetry={vm.refetch} />
        ) : vm.departments.length === 0 ? (
          <EmptyState icon="business-outline" message={t('admin.departments.empty')} />
        ) : (
          <FlatList
            data={vm.departments}
            keyExtractor={(item) => item.department_id}
            contentContainerStyle={styles.list}
            renderItem={({ item }: { item: Department }) => (
              <View style={styles.row} testID={`department-row-${item.department_id}`}>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowTitle}>{item.name}</Text>
                  {item.description ? <Text style={styles.rowSubtitle}>{item.description}</Text> : null}
                  {!item.is_active ? <Text style={styles.inactiveTag}>{t('admin.departments.inactive')}</Text> : null}
                </View>
                <View style={styles.rowActions}>
                  <IconButton icon="pencil-outline" label={t('admin.departments.edit')} onPress={() => vm.openEdit(item)} />
                  {item.is_active ? (
                    <IconButton icon="trash-outline" label={t('admin.departments.deactivate')} onPress={() => vm.confirmDeactivate(item)} />
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
  formActions: { flexDirection: 'row', gap: 10 },
  flexButton: { flex: 1 },
  error: { ...typography.metadata, color: colors.danger },
  list: { gap: 10, paddingBottom: 24 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, shadowColor: shadow.color, shadowOpacity: shadow.opacity, shadowRadius: shadow.radius, shadowOffset: shadow.offset, elevation: shadow.elevation },
  rowInfo: { flex: 1, gap: 4 },
  rowTitle: { ...typography.entityTitle, color: colors.ink },
  rowSubtitle: { ...typography.body, color: colors.muted },
  inactiveTag: { ...typography.metadata, color: colors.danger, fontWeight: '700' },
  rowActions: { flexDirection: 'row', gap: 6 },
});
