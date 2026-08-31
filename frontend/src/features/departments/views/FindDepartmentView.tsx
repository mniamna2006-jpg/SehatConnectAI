import { Link } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useTranslations } from '../../../providers/LocaleProvider';
import { AppIcon, type AppIconName } from '../../../shared/components/AppIcon';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';
import { LocationPicker } from '../../../shared/components/LocationPicker';
import { PageHeader } from '../../../shared/components/PageHeader';
import { PressableSurface } from '../../../shared/components/Buttons';
import { Screen } from '../../../shared/components/Screen';
import { SearchBar } from '../../../shared/components/SearchBar';
import { SectionHeader } from '../../../shared/components/SectionHeader';
import { colors, radius, typography } from '../../../shared/theme';
import type { Department } from '../model/types';
import { useFindDepartmentViewModel } from '../viewmodels/useFindDepartmentViewModel';

const DEPARTMENT_ICONS: AppIconName[] = ['heart-outline', 'body-outline', 'happy-outline', 'eye-outline', 'fitness-outline', 'medical-outline'];

interface FindDepartmentViewProps { hospitalId?: string; departmentId?: string }

export function FindDepartmentView({ hospitalId, departmentId }: FindDepartmentViewProps = {}) {
  const t = useTranslations();
  const vm = useFindDepartmentViewModel({ hospitalId, departmentId });
  const hasQuery = vm.isHospitalScoped || vm.query.trim().length > 0;

  return (
    <Screen>
      <FlatList
        testID="find-department-list"
        data={vm.departments}
        numColumns={2}
        keyExtractor={(department: Department) => department.department_id}
        columnWrapperStyle={styles.columns}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <PageHeader title={t('departments.findTitle')} subtitle={vm.isHospitalScoped ? 'Explore departments at this hospital' : 'Browse care by medical specialty'} />
            {!vm.isHospitalScoped ? (
              <>
                <LocationPicker selector={vm.selector} />
                <SearchBar accessibilityLabel={t('departments.searchLabel')} placeholder={t('departments.searchPlaceholder')} value={vm.query} onChangeText={vm.setQuery} />
              </>
            ) : (
              <View style={styles.scopedBanner}>
                <View style={styles.scopedIcon}><AppIcon name="business-outline" color={colors.teal} size={22} /></View>
                <View style={styles.scopedCopy}><Text style={styles.scopedTitle}>Hospital directory</Text><Text style={styles.scopedText}>Choose a department to view its doctors</Text></View>
              </View>
            )}
            {vm.departments.length > 0 ? <SectionHeader title="Browse Departments" detail={`${vm.departments.length} available`} /> : null}
          </View>
        }
        renderItem={({ item, index }: { item: Department; index: number }) => {
          const selected = item.department_id === vm.highlightedDepartmentId;
          return (
            <Link href={`/department/${item.department_id}/doctors`} asChild>
              <PressableSurface
                accessibilityRole="button"
                accessibilityState={{ selected }}
                testID={`department-row-${item.department_id}`}
                style={[styles.tile, selected && styles.tileSelected]}
              >
                <View style={[styles.tileIcon, selected && styles.tileIconSelected]}><AppIcon name={DEPARTMENT_ICONS[index % DEPARTMENT_ICONS.length]} color={selected ? colors.surface : colors.primary} size={25} /></View>
                <Text style={styles.tileTitle}>{item.name}</Text>
                {item.description ? <Text numberOfLines={2} style={styles.tileDescription}>{item.description}</Text> : <Text style={styles.tileDescription}>View available doctors</Text>}
                <View style={styles.tileArrow}><AppIcon name="arrow-forward" color={colors.primary} size={18} /></View>
              </PressableSurface>
            </Link>
          );
        }}
        ListEmptyComponent={vm.isLoading ? <LoadingState label="Loading departments…" /> : vm.isError ? <ErrorState onRetry={() => void vm.refetch()} /> : hasQuery ? <EmptyState title="No departments found" message="Try a broader department name or another location." icon="grid-outline" /> : <EmptyState title="Search the directory" message="Enter a specialty to browse matching departments." icon="search-outline" />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 36 },
  header: { gap: 24, marginBottom: 16 },
  columns: { gap: 12, marginBottom: 12 },
  scopedBanner: { minHeight: 82, borderRadius: radius.lg, backgroundColor: colors.tealSoft, flexDirection: 'row', alignItems: 'center', gap: 13, padding: 16 },
  scopedIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  scopedCopy: { flex: 1 },
  scopedTitle: { ...typography.entityTitle, color: colors.ink },
  scopedText: { ...typography.metadata, color: colors.muted, marginTop: 2 },
  tile: { flex: 1, minHeight: 178, borderRadius: radius.lg, backgroundColor: colors.surface, padding: 16, borderWidth: 1, borderColor: colors.line },
  tileSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  tileIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  tileIconSelected: { backgroundColor: colors.primary },
  tileTitle: { ...typography.entityTitle, color: colors.ink },
  tileDescription: { ...typography.metadata, color: colors.muted, marginTop: 5, paddingRight: 8 },
  tileArrow: { position: 'absolute', right: 14, bottom: 14 },
});
