import * as Speech from 'expo-speech';
import { AccessibilityInfo, AppState } from 'react-native';
import type { SpeechPort } from './coordinator';

export function createSpeechPort(): SpeechPort {
  return {
    voices: async () => (await Speech.getAvailableVoicesAsync()).map((voice) => ({ id: voice.identifier, language: voice.language })),
    stop: () => Speech.stop(),
    speak: (text, voice, callbacks) => {
      Speech.speak(text, { voice: voice.id, language: 'pl-PL', rate: 1,
        onDone: callbacks.done, onError: callbacks.error, onStopped: callbacks.error });
    },
  };
}
export function watchSpeechEnvironment(onReader: (enabled: boolean | null) => void, onActive: (active: boolean) => void): () => void {
  let active = true; let changed = false;
  const reader = AccessibilityInfo.addEventListener('screenReaderChanged', (enabled) => { changed = true; onReader(enabled); });
  void AccessibilityInfo.isScreenReaderEnabled().then((enabled) => { if (active && !changed) onReader(enabled); }).catch(() => { if (active && !changed) onReader(null); });
  onActive(AppState.currentState === 'active');
  const app = AppState.addEventListener('change', (state) => onActive(state === 'active'));
  return () => { active = false; reader.remove(); app.remove(); };
}
