export const colors = {
  canvas: '#F7F8FA',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF1F5',
  ink: '#0E1B2A',
  inkSoft: '#11345A',
  muted: '#6E7888',
  faint: '#9AA3B2',
  line: '#E7EAF0',
  primary: '#2F6BFF',
  primaryPressed: '#2554CC',
  primarySoft: '#EDF4FF',
  secondary: '#149F91',
  teal: '#149F91',
  tealSoft: '#EAF8F5',
  danger: '#D85B63',
  dangerSoft: '#FBECED',
  warning: '#B7791F',
  warningSoft: '#FFF7E8',
  success: '#198A68',
  successSoft: '#E7F5EF',
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
  hero: { fontSize: 30, lineHeight: 36, fontWeight: '700' as const },
  screenTitle: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const },
  sectionTitle: { fontSize: 19, lineHeight: 24, fontWeight: '700' as const },
  entityTitle: { fontSize: 16, lineHeight: 21, fontWeight: '600' as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  metadata: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const },
} as const;
