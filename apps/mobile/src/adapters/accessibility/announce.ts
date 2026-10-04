import { AccessibilityInfo, Platform } from 'react-native';

export interface AnnounceOptions { interrupt?: boolean }

/** The only path for app messages sent through VoiceOver/TalkBack. A no-op when no reader is running. */
export function announce(text: string, { interrupt = false }: AnnounceOptions = {}): void {
  if (!text) return;
  // The queue option exists only on iOS; queued messages do not cut off the element being read.
  if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibilityWithOptions(text, { queue: !interrupt });
  else AccessibilityInfo.announceForAccessibility(text);
}
