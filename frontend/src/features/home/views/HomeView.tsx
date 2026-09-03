import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppIcon, type AppIconName } from '../../../shared/components/AppIcon';
import { Avatar } from '../../../shared/components/Avatar';
import { BrandMark } from '../../../shared/components/BrandMark';
import { PressableSurface } from '../../../shared/components/Buttons';
import { NotificationBell } from '../../notifications/views/NotificationBell';
import { useOptionalLocale, useTranslations } from '../../../providers/LocaleProvider';
import { Screen } from '../../../shared/components/Screen';
import { colors, radius, shadow, typography } from '../../../shared/theme';
import { useHomeViewModel } from '../viewmodels/useHomeViewModel';

interface CareAction {
  href: '/find-hospital' | '/find-doctor' | '/find-department' | '/ai-chat';
  title: string;
  description: string;
  icon: AppIconName;
  tone: 'blue' | 'teal';
}

function greetingKeyForNow(): 'home.morning' | 'home.afternoon' | 'home.evening' {
  const hour = new Date().getHours();
  if (hour < 12) return 'home.morning';
  if (hour < 17) return 'home.afternoon';
  return 'home.evening';
}

export function HomeView() {
  const t = useTranslations();
  const locale = useOptionalLocale();
  const { user } = useHomeViewModel();
  const patientName = user?.full_name || t('common.patient');
  const careActions: CareAction[] = [
    { href: '/find-hospital', title: t('home.actions.findHospital.title'), description: t('home.actions.findHospital.description'), icon: 'business-outline', tone: 'teal' },
    { href: '/find-doctor', title: t('home.actions.findDoctor.title'), description: t('home.actions.findDoctor.description'), icon: 'medkit-outline', tone: 'blue' },
    { href: '/find-department', title: t('home.actions.findDepartment.title'), description: t('home.actions.findDepartment.description'), icon: 'grid-outline', tone: 'blue' },
    { href: '/ai-chat', title: t('home.actions.aiAssistant.title'), description: t('home.actions.aiAssistant.description'), icon: 'chatbubbles-outline', tone: 'teal' },
  ];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <BrandMark compact />
          <View style={styles.topActions}>
            <NotificationBell />
            <Link href="/profile" asChild>
              <Pressable accessibilityLabel={t('home.openProfile')} style={({ pressed }) => pressed && styles.pressed}>
                <Avatar name={patientName} size={48} />
              </Pressable>
            </Link>
          </View>
        </View>

        <View style={styles.greeting}>
          <Text style={styles.eyebrow}>{t(greetingKeyForNow())}</Text>
          <Text accessibilityRole="header" style={styles.patientName}>{patientName}</Text>
          <Text style={styles.prompt}>{t('home.prompt')}</Text>
        </View>

        <View style={styles.discoveryHero}>
          <View style={styles.heroCopy}>
            <View style={styles.heroIcon}><AppIcon name="heart-outline" color={colors.surface} size={23} /></View>
            <Text style={styles.heroTitle}>{t('home.heroTitle')}</Text>
            <Text style={styles.heroBody}>{t('home.heroBody')}</Text>
          </View>
          <View style={styles.heroRings} />
        </View>

        <View>
          <Text style={styles.sectionTitle}>{t('home.exploreTitle')}</Text>
          <Text style={styles.sectionSubtitle}>{t('home.exploreSubtitle')}</Text>
        </View>

        <View style={styles.actionGrid}>
          {careActions.map((action, index) => (
            <Link key={action.href} href={action.href} asChild>
              <PressableSurface accessibilityRole="button" style={[styles.actionCard, index === 0 && styles.actionCardWide]}>
                <View style={[styles.actionIcon, action.tone === 'teal' ? styles.tealIcon : styles.blueIcon]}>
                  <AppIcon name={action.icon} color={action.tone === 'teal' ? colors.teal : colors.primary} size={24} />
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionDescription}>{action.description}</Text>
                <View style={styles.actionArrow}><AppIcon name="arrow-forward" color={colors.primary} size={18} /></View>
              </PressableSurface>
            </Link>
          ))}
        </View>

        <Link href="/appointments" asChild>
          <PressableSurface accessibilityRole="button" style={styles.appointmentCard}>
            <View style={styles.appointmentIcon}><AppIcon name="calendar-clear-outline" color={colors.primary} size={25} /></View>
            <View style={styles.appointmentCopy}>
              <Text style={styles.appointmentTitle}>{t('home.appointmentDetails.title')}</Text>
              <Text style={styles.appointmentBody}>{t('home.appointmentDetails.description')}</Text>
            </View>
            <AppIcon name={locale?.isRTL ? 'chevron-back' : 'chevron-forward'} color={colors.muted} size={20} />
          </PressableSurface>
        </Link>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 36, gap: 26 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pressed: { opacity: 0.72 },
  greeting: { gap: 2 },
  eyebrow: { fontSize: 15, lineHeight: 21, color: colors.muted, fontWeight: '600' },
  patientName: { ...typography.hero, color: colors.ink, letterSpacing: -0.8 },
  prompt: { ...typography.body, color: colors.muted, marginTop: 5 },
  discoveryHero: { minHeight: 174, borderRadius: radius.lg, backgroundColor: colors.primary, padding: 21, overflow: 'hidden', justifyContent: 'center' },
  heroCopy: { maxWidth: '78%', gap: 9, zIndex: 1 },
  heroIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#FFFFFF24', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: 20, lineHeight: 25, color: colors.surface, fontWeight: '800', letterSpacing: -0.3 },
  heroBody: { fontSize: 14, lineHeight: 20, color: '#DCE8FF', fontWeight: '500' },
  heroRings: { position: 'absolute', width: 150, height: 150, borderRadius: 75, borderWidth: 28, borderColor: '#FFFFFF12', right: -48, top: 12 },
  sectionTitle: { ...typography.sectionTitle, color: colors.ink },
  sectionSubtitle: { ...typography.metadata, color: colors.muted, marginTop: 4 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: { width: '48%', minHeight: 170, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 17, shadowColor: shadow.color, shadowOpacity: 0.06, shadowRadius: 13, shadowOffset: shadow.offset, elevation: 2 },
  actionCardWide: { width: '100%', minHeight: 150 },
  actionIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  tealIcon: { backgroundColor: colors.tealSoft },
  blueIcon: { backgroundColor: colors.primarySoft },
  actionTitle: { ...typography.entityTitle, color: colors.ink },
  actionDescription: { ...typography.metadata, color: colors.muted, marginTop: 4, paddingRight: 8 },
  actionArrow: { position: 'absolute', right: 16, bottom: 16 },
  appointmentCard: { minHeight: 92, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 17, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: colors.line },
  appointmentIcon: { width: 52, height: 52, borderRadius: 17, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  appointmentCopy: { flex: 1 },
  appointmentTitle: { ...typography.entityTitle, color: colors.ink },
  appointmentBody: { ...typography.metadata, color: colors.muted, marginTop: 3 },
});
