import { Text } from 'react-native';
import { colors, type } from './theme';

export function SectionHeading({ children }: { children: string }) {
  return <Text accessibilityRole="header" style={{ ...type.title, fontSize: 22, lineHeight: 28, color: colors.ink }}>{children}</Text>;
}
