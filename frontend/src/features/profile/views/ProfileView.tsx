import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Controller } from 'react-hook-form';
import { useTranslations } from '../../../providers/LocaleProvider';
import { AppIcon, type AppIconName } from '../../../shared/components/AppIcon';
import { Avatar } from '../../../shared/components/Avatar';
import { AppButton } from '../../../shared/components/Buttons';
import { ErrorState } from '../../../shared/components/ErrorState';
import { FormField } from '../../../shared/components/FormField';
import { LoadingState } from '../../../shared/components/LoadingState';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Screen } from '../../../shared/components/Screen';
import { SectionHeader } from '../../../shared/components/SectionHeader';
import { colors, radius, typography } from '../../../shared/theme';
import type { PreferredLanguage } from '../../../shared/types/api';
import { useProfileViewModel } from '../viewmodels/useProfileViewModel';

function InfoRow({ icon, label, value, testID }: { icon: AppIconName; label: string; value?: string; testID: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}><AppIcon name={icon} color={colors.primary} size={19} /></View>
      <View style={styles.infoCopy}><Text style={styles.infoLabel}>{label}</Text><Text testID={testID} style={styles.infoValue}>{value || 'Not provided'}</Text></View>
    </View>
  );
}

export function ProfileView() {
  const t = useTranslations();
  const vm = useProfileViewModel();
  const languageOptions: { id: PreferredLanguage; label: string }[] = [
    { id: 'ENGLISH', label: t('auth.register.languageOptions.english') },
    { id: 'URDU', label: t('auth.register.languageOptions.urdu') },
    { id: 'ROMAN_URDU', label: t('auth.register.languageOptions.romanUrdu') },
  ];
  if (vm.isLoading) return <Screen><LoadingState label="Loading your profile…" /></Screen>;
  if (vm.isError) return <Screen><ErrorState onRetry={() => void vm.refetch()} /></Screen>;

  if (!vm.isEditing) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <PageHeader title={t('profile.title')} subtitle="Your personal and contact information" />
          <View style={styles.profileHero}>
            <Avatar name={vm.profile?.full_name} size={78} tone="teal" />
            <Text testID="profile-full-name" style={styles.profileName}>{vm.profile?.full_name || 'Patient'}</Text>
            <Text testID="profile-email" style={styles.profileEmail}>{vm.profile?.email || 'Email not provided'}</Text>
            <View style={styles.languageBadge}><AppIcon name="language-outline" color={colors.teal} size={16} /><Text testID="profile-preferred-language" style={styles.languageText}>{languageOptions.find((option) => option.id === vm.profile?.preferred_language)?.label ?? vm.profile?.preferred_language}</Text></View>
          </View>

          <View style={styles.section}>
            <SectionHeader title="Personal details" />
            <View style={styles.infoPanel}>
              <InfoRow icon="calendar-outline" label={t('profile.fields.dateOfBirth')} value={vm.profile?.date_of_birth} testID="profile-date-of-birth" />
              <InfoRow icon="person-outline" label={t('profile.fields.gender')} value={vm.profile?.gender} testID="profile-gender" />
            </View>
          </View>
          <View style={styles.section}>
            <SectionHeader title="Contact and address" />
            <View style={styles.infoPanel}>
              <InfoRow icon="call-outline" label={t('profile.fields.phone')} value={vm.profile?.phone} testID="profile-phone" />
              <InfoRow icon="home-outline" label={t('profile.fields.address')} value={vm.profile?.address} testID="profile-address" />
              <InfoRow icon="location-outline" label={t('profile.fields.city')} value={vm.profile?.city} testID="profile-city" />
              <InfoRow icon="shield-outline" label={t('profile.fields.emergencyContact')} value={vm.profile?.emergency_contact} testID="profile-emergency-contact" />
            </View>
          </View>
          <AppButton testID="profile-edit" label={t('profile.makeChanges')} icon="create-outline" onPress={vm.onEdit} />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PageHeader title={t('profile.editTitle')} subtitle="Keep your details accurate and up to date" />
        <View style={styles.formSection}><SectionHeader title="Personal details" />
          <Controller control={vm.control} name="full_name" render={({ field }) => <FormField testID="profile-input-full-name" label="Full name" icon="person-outline" placeholder="Full name" value={field.value ?? ''} onChangeText={field.onChange} error={vm.errors.full_name?.message} />} />
          <Controller control={vm.control} name="date_of_birth" render={({ field }) => <FormField testID="profile-input-date-of-birth" label="Date of birth" icon="calendar-outline" placeholder="YYYY-MM-DD" value={field.value ?? ''} onChangeText={field.onChange} error={vm.errors.date_of_birth?.message} />} />
          <Controller control={vm.control} name="gender" render={({ field }) => <FormField testID="profile-input-gender" label="Gender" icon="person-outline" placeholder="Gender" value={field.value ?? ''} onChangeText={field.onChange} error={vm.errors.gender?.message} />} />
        </View>
        <View style={styles.formSection}><SectionHeader title="Contact and address" />
          <Controller control={vm.control} name="phone" render={({ field }) => <FormField testID="profile-input-phone" label="Phone" icon="call-outline" placeholder="Phone" keyboardType="phone-pad" value={field.value ?? ''} onChangeText={field.onChange} error={vm.errors.phone?.message} />} />
          <Controller control={vm.control} name="address" render={({ field }) => <FormField testID="profile-input-address" label="Address" icon="home-outline" placeholder="Address" value={field.value ?? ''} onChangeText={field.onChange} error={vm.errors.address?.message} />} />
          <Controller control={vm.control} name="city" render={({ field }) => <FormField testID="profile-input-city" label="City" icon="location-outline" placeholder="City" value={field.value ?? ''} onChangeText={field.onChange} error={vm.errors.city?.message} />} />
          <Controller control={vm.control} name="emergency_contact" render={({ field }) => <FormField testID="profile-input-emergency-contact" label="Emergency contact" icon="shield-outline" placeholder="Emergency contact" value={field.value ?? ''} onChangeText={field.onChange} error={vm.errors.emergency_contact?.message} />} />
        </View>
        <View style={styles.formSection}><SectionHeader title="Language" />
          <Controller control={vm.control} name="preferred_language" render={({ field }) => (
            <View accessibilityRole="radiogroup" style={styles.languageOptions}>
              {languageOptions.map((option) => {
                const selected = field.value === option.id;
                return <Pressable key={option.id} testID={`profile-language-${option.id}`} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => field.onChange(option.id)} style={({ pressed }) => [styles.languageOption, selected && styles.languageOptionSelected, pressed && styles.pressed]}><Text style={[styles.languageOptionText, selected && styles.languageOptionTextSelected]}>{option.label}</Text>{selected ? <AppIcon name="checkmark-circle" color={colors.primary} size={19} /> : null}</Pressable>;
              })}
            </View>
          )} />
          {vm.errors.preferred_language ? <Text style={styles.error}>{vm.errors.preferred_language.message}</Text> : null}
        </View>
        {vm.saveError ? <Text testID="profile-save-error" accessibilityRole="alert" style={styles.error}>{vm.saveError}</Text> : null}
        <View style={styles.formActions}>
          <AppButton testID="profile-save" label={t('profile.save')} loading={vm.isSaving} onPress={vm.onSave} style={styles.saveButton} />
          <AppButton testID="profile-cancel" label={t('profile.cancel')} variant="quiet" disabled={vm.isSaving} onPress={vm.onCancel} style={styles.cancelButton} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 42, gap: 28 },
  profileHero: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: colors.line },
  profileName: { ...typography.sectionTitle, color: colors.ink, marginTop: 14 },
  profileEmail: { ...typography.body, color: colors.muted, marginTop: 3 },
  languageBadge: { minHeight: 34, borderRadius: radius.pill, backgroundColor: colors.tealSoft, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, marginTop: 12 },
  languageText: { ...typography.metadata, color: colors.teal, fontWeight: '700' },
  section: { gap: 13 },
  infoPanel: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: 16 },
  infoRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  infoIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  infoCopy: { flex: 1 },
  infoLabel: { ...typography.metadata, color: colors.muted },
  infoValue: { ...typography.body, color: colors.ink, fontWeight: '600', marginTop: 1 },
  formSection: { gap: 16 },
  languageOptions: { gap: 10 },
  languageOption: { minHeight: 50, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  languageOptionSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  languageOptionText: { ...typography.body, color: colors.inkSoft, fontWeight: '600' },
  languageOptionTextSelected: { color: colors.primary, fontWeight: '700' },
  pressed: { opacity: 0.78 },
  error: { ...typography.metadata, color: colors.danger },
  formActions: { gap: 8 },
  saveButton: { width: '100%' },
  cancelButton: { width: '100%' },
});
