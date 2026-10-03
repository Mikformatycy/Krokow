import { colors } from './theme';

export function SectionHeading({ children }: { children: string }) {
  return <h2 style={{ margin: 0, color: colors.ink, fontFamily: 'system-ui, sans-serif', fontSize: 22, lineHeight: '31px', fontWeight: 700 }}>{children}</h2>;
}
