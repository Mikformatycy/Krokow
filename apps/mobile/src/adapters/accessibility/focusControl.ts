import type { RefObject } from 'react';
import { AccessibilityInfo, findNodeHandle, Platform } from 'react-native';
import type { View } from 'react-native';

/** Return focus after the triggering control disappears, without interrupting on every tick. */
export function focusControl(ref: RefObject<View | null>): void {
  requestAnimationFrame(() => {
    const target = ref.current;
    if (!target) return;
    if (Platform.OS === 'web') { target.focus(); return; }
    void AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
      if (!enabled || ref.current !== target) return;
      const handle = findNodeHandle(target);
      if (handle !== null) AccessibilityInfo.setAccessibilityFocus(handle);
    }).catch(() => {});
  });
}
