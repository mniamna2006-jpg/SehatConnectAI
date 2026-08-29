import React from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { LocationPicker } from '../../../shared/components/LocationPicker';
import { Screen } from '../../../shared/components/Screen';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';
import type { Department } from '../model/types';
import { useFindDepartmentViewModel } from '../viewmodels/useFindDepartmentViewModel';

export function FindDepartmentView() {
  const { departments, isLoading, isError, refetch, query, setQuery, selector } =
    useFindDepartmentViewModel();
  const hasQuery = query.trim().length > 0;

  return (
    <Screen>
      <Text accessibilityRole="header">Find Department</Text>
      <LocationPicker selector={selector} />
      <TextInput
        accessibilityLabel="Search departments"
        placeholder="Department name"
        value={query}
        onChangeText={setQuery}
      />

      {isLoading ? <LoadingState /> : null}
      {!isLoading && isError ? <ErrorState onRetry={() => void refetch()} /> : null}
      {!isLoading && !isError && hasQuery && departments.length === 0 ? (
        <EmptyState message="No departments found." />
      ) : null}
      {!isLoading && !isError && departments.length > 0 ? (
        <FlatList
          testID="find-department-list"
          data={departments}
          keyExtractor={(department: Department) => department.department_id}
          renderItem={({ item }: { item: Department }) => (
            <View testID={`department-row-${item.department_id}`}>
              <Text>{item.name}</Text>
              {item.description ? <Text>{item.description}</Text> : null}
              <Link href={`/department/${item.department_id}/doctors`} asChild>
                <Pressable accessibilityRole="button">
                  <Text>View Doctors</Text>
                </Pressable>
              </Link>
            </View>
          )}
        />
      ) : null}
    </Screen>
  );
}
