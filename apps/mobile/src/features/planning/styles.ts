import { StyleSheet } from 'react-native';
import { colors, radius, space, type } from '../../components/theme';

export const formStyles = StyleSheet.create({
  card: { padding: space.m + 4, gap: space.s, borderRadius: radius.card, borderWidth: 1, borderColor: colors.separator, backgroundColor: colors.surface },
  recommended: { borderColor: colors.accent, borderWidth: 3 },
  strong: { ...type.body, fontWeight: '600', color: colors.ink },
  fact: { gap: 6 },
  event: { gap: space.s, paddingTop: space.s, borderTopWidth: 1, borderTopColor: colors.separator },
  section: { gap: space.s },
  body: { ...type.body, color: colors.muted },
  caption: { ...type.callout, fontWeight: '600', color: colors.muted },
  notice: { padding: space.m, gap: space.xs, borderRadius: radius.control, backgroundColor: colors.notice },
  noticeText: { ...type.body, color: colors.noticeInk },
  input: { minHeight: 60, ...type.body, fontSize: 20, color: colors.ink, backgroundColor: colors.surface, paddingHorizontal: space.m, paddingVertical: space.s,
    borderWidth: 2, borderColor: colors.border, borderRadius: radius.control },
  inputFocused: { borderColor: colors.focus, borderWidth: 3 },
  error: { ...type.body, fontWeight: '600', color: colors.noticeInk, backgroundColor: colors.notice, padding: space.s + 2, borderRadius: radius.control, overflow: 'hidden' },
  result: { padding: space.m + 4, gap: space.s, backgroundColor: colors.accentLight, borderRadius: radius.card },
  bigNumber: { fontSize: 44, lineHeight: 50, fontWeight: '700', color: colors.ink },
  summaryMetrics: { fontSize: 32, lineHeight: 40, fontWeight: '700', color: colors.ink },
  summaryTime: { fontSize: 20, fontWeight: '600' },
});
