// Contrast on `background`/`surface`: text ≥ 6.4:1 (ink ≥ 13:1), control outlines ≥ 3.5:1.
export const colors = {
  background: '#F3F1EA',
  surface: '#FFFFFF',
  ink: '#0E2B25',
  muted: '#45574F',
  accent: '#0D5A45',
  accentLight: '#E1EDE6',
  border: '#6F847B',
  separator: '#D5DDD8',
  notice: '#FBEDC4',
  noticeInk: '#4A3608',
  focus: '#0A58CA',
} as const;

export const space = { xs: 8, s: 12, m: 16, l: 24, xl: 32 } as const;
export const radius = { control: 16, card: 20, pill: 999 } as const;

export const type = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '700' },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '700' },
  headline: { fontSize: 20, lineHeight: 26, fontWeight: '600' },
  body: { fontSize: 18, lineHeight: 26 },
  callout: { fontSize: 16, lineHeight: 22 },
} as const;
