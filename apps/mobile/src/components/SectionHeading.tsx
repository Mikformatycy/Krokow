import { Text } from 'react-native';
import { colors } from './theme';

export function SectionHeading({ children }: { children: string }) {
  return <Text accessibilityRole="header" style={{ color: colors.ink, fontSize: 20, lineHeight: 29, fontWeight: '700' }}>{children}</Text>;
}
