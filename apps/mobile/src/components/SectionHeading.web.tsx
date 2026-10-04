import { colors } from './theme';

export function SectionHeading({ children }: { children: string }) {
  return <h2 style={{ margin: 0, color: colors.ink, fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: 22, lineHeight: '28px', fontWeight: 700 }}>{children}</h2>;
}
