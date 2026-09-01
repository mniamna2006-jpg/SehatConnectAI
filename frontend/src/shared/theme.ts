export const colors = {
  canvas: '#F4F7FB',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF3F9',
  ink: '#10213A',
  inkSoft: '#334155',
  muted: '#64748B',
  faint: '#94A3B8',
  line: '#E4EAF2',
  primary: '#2563EB',
  primaryPressed: '#1D4ED8',
  primarySoft: '#EAF1FF',
  secondary: '#14B8A6',
  teal: '#0F9F91',
  tealSoft: '#E6F8F5',
  danger: '#C2414B',
  dangerSoft: '#FFF0F1',
  warning: '#B7791F',
  warningSoft: '#FFF7E8',
  success: '#158266',
  successSoft: '#E8F7F1',
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  pill: 999,
} as const;

export const shadow = {
  color: '#244B7A',
  opacity: 0.09,
  radius: 18,
  offset: { width: 0, height: 8 },
  elevation: 3,
} as const;

export const typography = {
  hero: { fontSize: 30, lineHeight: 36, fontWeight: '800' as const },
  screenTitle: { fontSize: 26, lineHeight: 32, fontWeight: '800' as const },
  sectionTitle: { fontSize: 19, lineHeight: 24, fontWeight: '700' as const },
  entityTitle: { fontSize: 17, lineHeight: 22, fontWeight: '700' as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  metadata: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const },
} as const;
