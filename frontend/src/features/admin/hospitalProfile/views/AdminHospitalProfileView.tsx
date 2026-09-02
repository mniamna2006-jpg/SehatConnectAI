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
import type { FacilityType } from '../../../../shared/types/api';
import { useAdminHospitalProfileViewModel } from '../viewmodels/useAdminHospitalProfileViewModel';

const FACILITY_TYPES: FacilityType[] = ['HOSPITAL', 'CLINIC', 'MEDICAL_CENTER'];

export function AdminHospitalProfileView() {
  const t = useTranslations();
  const viewModel = useAdminHospitalProfileViewModel();

  if (viewModel.isLoading) {
    return <Screen><LoadingState label={t('admin.profile.loading')} /></Screen>;
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

  if (!viewModel.hospital) {
    return <Screen><EmptyState title={t('admin.profile.emptyTitle')} message={t('admin.profile.empty')} icon="business-outline" /></Screen>;
  }

  const { hospital } = viewModel;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PageHeader title={t('admin.profile.title')} subtitle={t('admin.profile.subtitle')} />

        {viewModel.saveSuccess ? (
          <View accessible accessibilityRole="alert" style={styles.success}>
            <Text style={styles.successText}>{t('admin.profile.success')}</Text>
          </View>
        ) : null}

        {viewModel.noChanges ? (
          <View accessible accessibilityRole="alert" style={styles.notice}>
            <Text style={styles.noticeText}>{t('admin.profile.noChanges')}</Text>
          </View>
        ) : null}

        {viewModel.isEditing ? (
          <ProfileEditForm viewModel={viewModel} />
        ) : (
          <>
            <View style={styles.headingRow}>
              <View style={styles.headingText}>
                <Text style={styles.hospitalName}>{hospital.name}</Text>
                <Text style={styles.hospitalMeta}>{t(`admin.profile.facilityTypes.${hospital.facility_type}`)} · {hospital.city}</Text>
              </View>
              <AppButton label={t('admin.profile.edit')} variant="secondary" onPress={viewModel.onEdit} style={styles.editButton} />
            </View>

            <ProfileSection title={t('admin.profile.sections.details')}>
              <DetailRow label={t('admin.profile.fields.description')} value={hospital.description} />
              <DetailRow label={t('admin.profile.fields.phone')} value={hospital.phone} />
              <DetailRow label={t('admin.profile.fields.email')} value={hospital.email} />
              <DetailRow label={t('admin.profile.fields.address')} value={hospital.address} />
              <DetailRow label={t('admin.profile.fields.location')} value={`${hospital.latitude}, ${hospital.longitude}`} />
            </ProfileSection>

            <ProfileSection title={t('admin.profile.sections.branding')}>
              <DetailRow label={t('admin.profile.fields.logoUrl')} value={hospital.logo_url} />
              <DetailRow label={t('admin.profile.fields.coverUrl')} value={hospital.cover_image_url} />
              <DetailRow label={t('admin.profile.fields.theme')} value={hospital.theme} />
            </ProfileSection>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function ProfileEditForm({ viewModel }: { viewModel: ReturnType<typeof useAdminHospitalProfileViewModel> }) {
  const t = useTranslations();
  const textFields = [
    { name: 'name', label: t('admin.profile.fields.name') },
    { name: 'description', label: t('admin.profile.fields.description'), multiline: true },
    { name: 'phone', label: t('admin.profile.fields.phone'), keyboardType: 'phone-pad' as const },
    { name: 'email', label: t('admin.profile.fields.email'), keyboardType: 'email-address' as const, autoCapitalize: 'none' as const },
    { name: 'address', label: t('admin.profile.fields.address'), multiline: true },
    { name: 'city', label: t('admin.profile.fields.city') },
    { name: 'latitude', label: t('admin.profile.fields.latitude'), keyboardType: 'decimal-pad' as const },
    { name: 'longitude', label: t('admin.profile.fields.longitude'), keyboardType: 'decimal-pad' as const },
    { name: 'logo_url', label: t('admin.profile.fields.logoUrl'), keyboardType: 'url' as const, autoCapitalize: 'none' as const },
    { name: 'cover_image_url', label: t('admin.profile.fields.coverUrl'), keyboardType: 'url' as const, autoCapitalize: 'none' as const },
    { name: 'theme', label: t('admin.profile.fields.theme') },
  ] as const;

  return (
    <View style={styles.form}>
      <View style={styles.facilityGroup}>
        <Text style={styles.facilityLabel}>{t('admin.profile.fields.facilityType')}</Text>
        <Controller
          control={viewModel.control}
          name="facility_type"
          render={({ field: { onChange, value } }) => (
            <View style={styles.facilityOptions}>
              {FACILITY_TYPES.map((type) => {
                const selected = value === type;
                return (
                  <Pressable
                    key={type}
                    accessibilityLabel={t(`admin.profile.facilityTypes.${type}`)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => onChange(type)}
                    style={[styles.facilityOption, selected && styles.facilityOptionSelected]}
                  >
                    <Text style={[styles.facilityOptionText, selected && styles.facilityOptionTextSelected]}>
                      {t(`admin.profile.facilityTypes.${type}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        />
      </View>

      {textFields.map(({ name, label, ...props }) => (
        <Controller
          key={name}
          control={viewModel.control}
          name={name}
          render={({ field: { onBlur, onChange, value } }) => (
            <FormField
              {...props}
              accessibilityLabel={label}
              error={viewModel.errors[name]?.message?.toString()}
              label={label}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value === undefined ? '' : String(value)}
            />
          )}
        />
      ))}

      {viewModel.saveError ? (
        <Text accessibilityRole="alert" style={styles.saveError}>{viewModel.saveError}</Text>
      ) : null}

      <View style={styles.formActions}>
        <AppButton label={t('admin.profile.cancel')} variant="quiet" onPress={viewModel.onCancel} style={styles.formAction} />
        <AppButton label={t('admin.profile.save')} loading={viewModel.isSaving} onPress={() => void viewModel.onSave()} style={styles.formAction} />
      </View>
    </View>
  );
}

function ProfileSection({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <View style={styles.section}>
      <SectionHeader title={title} />
      <View style={styles.detailList}>{children}</View>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  const t = useTranslations();
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text selectable style={styles.detailValue}>{value || t('common.notProvided')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 42, gap: 22 },
  success: { borderRadius: radius.md, backgroundColor: colors.successSoft, paddingHorizontal: 14, paddingVertical: 12 },
  successText: { ...typography.body, color: colors.success, fontWeight: '700' },
  notice: { borderRadius: radius.md, backgroundColor: colors.primarySoft, paddingHorizontal: 14, paddingVertical: 12 },
  noticeText: { ...typography.body, color: colors.primary, fontWeight: '700' },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headingText: { flex: 1, gap: 3 },
  hospitalName: { ...typography.sectionTitle, color: colors.ink },
  hospitalMeta: { ...typography.metadata, color: colors.muted },
  editButton: { minHeight: 44, paddingHorizontal: 14 },
  section: { gap: 10 },
  detailList: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.surface, overflow: 'hidden' },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 18, paddingHorizontal: 15, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  detailLabel: { ...typography.metadata, color: colors.muted, width: 104 },
  detailValue: { ...typography.body, color: colors.ink, flex: 1 },
  form: { gap: 16 },
  facilityGroup: { gap: 8 },
  facilityLabel: { ...typography.metadata, color: colors.inkSoft, fontWeight: '700' },
  facilityOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  facilityOption: { minHeight: 42, justifyContent: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, backgroundColor: colors.surface, paddingHorizontal: 13 },
  facilityOptionSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  facilityOptionText: { ...typography.metadata, color: colors.inkSoft, fontWeight: '700' },
  facilityOptionTextSelected: { color: colors.primary },
  saveError: { ...typography.body, color: colors.danger },
  formActions: { flexDirection: 'row', gap: 10 },
  formAction: { flex: 1 },
});
