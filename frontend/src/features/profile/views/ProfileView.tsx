import React from 'react';
import { Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { Controller } from 'react-hook-form';
import { Screen } from '../../../shared/components/Screen';
import { LoadingState } from '../../../shared/components/LoadingState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { useProfileViewModel } from '../viewmodels/useProfileViewModel';

const LANGUAGE_OPTIONS = ['ENGLISH', 'URDU', 'ROMAN_URDU'] as const;

export function ProfileView() {
  const { profile, isLoading, isError, refetch, isEditing, control, errors, onEdit, onCancel, onSave, isSaving, saveError } =
    useProfileViewModel();

  if (isLoading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <ErrorState onRetry={() => void refetch()} />
      </Screen>
    );
  }

  if (!isEditing) {
    return (
      <Screen>
        <Text accessibilityRole="header">Profile</Text>
        <Text testID="profile-full-name">{profile?.full_name}</Text>
        {/* Email is display-only: backend PATCH /api/patients/profile does not accept email mutation. */}
        <Text testID="profile-email">{profile?.email}</Text>
        <Text testID="profile-phone">{profile?.phone}</Text>
        <Text testID="profile-date-of-birth">{profile?.date_of_birth}</Text>
        <Text testID="profile-gender">{profile?.gender}</Text>
        <Text testID="profile-address">{profile?.address}</Text>
        <Text testID="profile-city">{profile?.city}</Text>
        <Text testID="profile-emergency-contact">{profile?.emergency_contact}</Text>
        <Text testID="profile-preferred-language">{profile?.preferred_language}</Text>
        <Pressable testID="profile-edit" onPress={onEdit}>
          <Text>Make Changes</Text>
        </Pressable>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text accessibilityRole="header">Edit Profile</Text>
      <Controller
        control={control}
        name="full_name"
        render={({ field }) => (
          <TextInput
            testID="profile-input-full-name"
            placeholder="Full name"
            value={field.value ?? ''}
            onChangeText={field.onChange}
          />
        )}
      />
      {errors.full_name && <Text>{errors.full_name.message}</Text>}
      <Controller
        control={control}
        name="phone"
        render={({ field }) => (
          <TextInput
            testID="profile-input-phone"
            placeholder="Phone"
            keyboardType="phone-pad"
            value={field.value ?? ''}
            onChangeText={field.onChange}
          />
        )}
      />
      {errors.phone && <Text>{errors.phone.message}</Text>}
      <Controller
        control={control}
        name="date_of_birth"
        render={({ field }) => (
          <TextInput
            testID="profile-input-date-of-birth"
            placeholder="Date of birth"
            value={field.value ?? ''}
            onChangeText={field.onChange}
          />
        )}
      />
      {errors.date_of_birth && <Text>{errors.date_of_birth.message}</Text>}
      <Controller
        control={control}
        name="gender"
        render={({ field }) => (
          <TextInput
            testID="profile-input-gender"
            placeholder="Gender"
            value={field.value ?? ''}
            onChangeText={field.onChange}
          />
        )}
      />
      {errors.gender && <Text>{errors.gender.message}</Text>}
      <Controller
        control={control}
        name="address"
        render={({ field }) => (
          <TextInput
            testID="profile-input-address"
            placeholder="Address"
            value={field.value ?? ''}
            onChangeText={field.onChange}
          />
        )}
      />
      {errors.address && <Text>{errors.address.message}</Text>}
      <Controller
        control={control}
        name="city"
        render={({ field }) => (
          <TextInput
            testID="profile-input-city"
            placeholder="City"
            value={field.value ?? ''}
            onChangeText={field.onChange}
          />
        )}
      />
      {errors.city && <Text>{errors.city.message}</Text>}
      <Controller
        control={control}
        name="emergency_contact"
        render={({ field }) => (
          <TextInput
            testID="profile-input-emergency-contact"
            placeholder="Emergency contact"
            value={field.value ?? ''}
            onChangeText={field.onChange}
          />
        )}
      />
      {errors.emergency_contact && <Text>{errors.emergency_contact.message}</Text>}
      <Controller
        control={control}
        name="preferred_language"
        render={({ field }) => (
          <>
            {LANGUAGE_OPTIONS.map((option) => (
              <Pressable
                key={option}
                testID={`profile-language-${option}`}
                onPress={() => field.onChange(option)}
              >
                <Text>{field.value === option ? '● ' : '○ '}{option}</Text>
              </Pressable>
            ))}
          </>
        )}
      />
      {errors.preferred_language && <Text>{errors.preferred_language.message}</Text>}
      {saveError && <Text testID="profile-save-error">{saveError}</Text>}
      <Pressable testID="profile-save" onPress={onSave} disabled={isSaving}>
        {isSaving ? <ActivityIndicator /> : <Text>Save</Text>}
      </Pressable>
      <Pressable testID="profile-cancel" onPress={onCancel} disabled={isSaving}>
        <Text>Cancel</Text>
      </Pressable>
    </Screen>
  );
}
