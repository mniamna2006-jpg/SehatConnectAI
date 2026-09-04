export const colors = {
  canvas: '#F7F8FA',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF1F5',
  ink: '#0E1B2A',
  inkSoft: '#11345A',
  // Recalculated for WCAG AA (4.5:1 normal text) against surface/canvas/surfaceMuted — was #6E7888 at 3.94:1 on surfaceMuted.
  muted: '#5B6472',
  // Decorative/placeholder only (never body text) — recalculated for 3:1 non-text contrast, was #9AA3B2 at 2.5:1.
  faint: '#7C8797',
  line: '#E7EAF0',
  primary: '#2F6BFF',
  primaryPressed: '#2554CC',
  primarySoft: '#EDF4FF',
  onPrimaryMuted: '#DCE8FF',
  secondary: '#149F91',
  teal: '#149F91',
  // Text-only variant of teal (icons/backgrounds keep the brighter `teal`) — #149F91 as text is 3.28:1, fails AA.
  tealText: '#0B6F65',
  tealSoft: '#EAF8F5',
  // Recalculated for 4.5:1 on surface/canvas/dangerSoft — was #D85B63 at 3.75:1.
  danger: '#BE3A43',
  dangerSoft: '#FBECED',
  // Recalculated for 4.5:1 on surface/canvas/warningSoft — was #B7791F at 3.64:1.
  warning: '#8F5C12',
  warningSoft: '#FFF7E8',
  // Recalculated for 4.5:1 on surface/canvas/successSoft — was #198A68 at 4.31:1.
  success: '#0F7A5A',
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
