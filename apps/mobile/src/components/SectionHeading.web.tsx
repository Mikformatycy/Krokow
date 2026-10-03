import { colors } from './theme';

export function SectionHeading({ children }: { children: string }) {
  return <h2 style={{ margin: 0, color: colors.ink, fontFamily: 'system-ui, sans-serif', fontSize: 20, lineHeight: '29px', fontWeight: 700 }}>{children}</h2>;
}
