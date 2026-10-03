import { useCallback, useRef } from 'react';
import { AccessibilityInfo, findNodeHandle, Text } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { colors } from '../../components/theme';

export function ScreenHeading({ children }: { children: string }) {
  const heading = useRef<Text>(null);

  useFocusEffect(useCallback(() => {
    let active = true;
    const frame = requestAnimationFrame(() => {
      void AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
        if (!active || !enabled || heading.current === null) return;
        const handle = findNodeHandle(heading.current);
        if (handle !== null) AccessibilityInfo.setAccessibilityFocus(handle);
      }).catch(() => { /* Reading the heading manually remains available. */ });
    });
    return () => { active = false; cancelAnimationFrame(frame); };
  }, []));

  return (
    <Text ref={heading} accessibilityRole="header" style={{
      fontSize: 38, lineHeight: 46, fontWeight: '700', color: colors.ink,
    }}>{children}</Text>
  );
}
