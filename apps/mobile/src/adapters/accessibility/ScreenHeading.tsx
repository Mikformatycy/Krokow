import { useCallback, useRef } from 'react';
import type { ComponentRef } from 'react';
import { AccessibilityInfo, Text } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { colors } from '../../components/theme';

export function ScreenHeading({ children }: { children: string }) {
  const heading = useRef<ComponentRef<typeof Text>>(null);

  useFocusEffect(useCallback(() => {
    let active = true;
    const frame = requestAnimationFrame(() => {
      void AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
        if (!active || !enabled || heading.current === null) return;
        // setAccessibilityFocus is deprecated in RN 0.86; this path also works with the new renderer.
        AccessibilityInfo.sendAccessibilityEvent(heading.current, 'focus');
      }).catch(() => { /* Reading the heading manually remains available. */ });
    });
    return () => { active = false; cancelAnimationFrame(frame); };
  }, []));

  return (
    <Text ref={heading} accessibilityRole="header" style={{
      fontSize: 34, lineHeight: 41, fontWeight: '700', color: colors.ink,
    }}>{children}</Text>
  );
}
