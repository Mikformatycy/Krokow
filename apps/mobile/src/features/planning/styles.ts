import { StyleSheet } from 'react-native';
import { colors } from '../../components/theme';

export const formStyles = StyleSheet.create({
  card: { padding: 20, gap: 12, borderRadius: 16, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface },
  recommended: { borderColor: colors.accent, backgroundColor: colors.accentLight },
  strong: { fontSize: 18, lineHeight: 28, fontWeight: '600', color: colors.ink },
  fact: { gap: 6 },
  event: { gap: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border },
  section: { gap: 14 },
  body: { fontSize: 17, lineHeight: 27, color: colors.muted },
  notice: { padding: 20, gap: 12, borderRadius: 16, backgroundColor: colors.notice },
  input: { minHeight: 52, fontSize: 18, color: colors.ink, backgroundColor: colors.surface, padding: 12, borderWidth: 2, borderColor: colors.muted, borderRadius: 10 },
  error: { color: colors.noticeInk, backgroundColor: colors.notice, fontSize: 17, lineHeight: 27, padding: 12 },
  result: { padding: 20, gap: 12, backgroundColor: colors.accentLight, borderRadius: 16 },
});
