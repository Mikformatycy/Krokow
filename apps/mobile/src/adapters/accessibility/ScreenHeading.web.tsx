import { useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { colors } from '../../components/theme';

export function ScreenHeading({ children }: { children: string }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useFocusEffect(useCallback(() => {
    const frame = requestAnimationFrame(() => heading.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, []));

  return (
    <h1 ref={heading} tabIndex={-1} style={{
      margin: 0, fontFamily: 'system-ui, sans-serif', fontSize: 'clamp(2rem, 5vw, 3.5rem)',
      lineHeight: 1.15, fontWeight: 700, color: colors.ink,
    }}>{children}</h1>
  );
}
