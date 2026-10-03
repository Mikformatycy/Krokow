import type { SpeechPort } from './coordinator';

export function createSpeechPort(): SpeechPort {
  return {
    voices: async () => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
      const synthesis = window.speechSynthesis;
      const local = () => synthesis.getVoices().filter((voice) => voice.localService).map((voice) => ({ id: voice.voiceURI, language: voice.lang }));
      if (local().some((voice) => /^pl(?:[-_]|$)/i.test(voice.language))) return local();
      return new Promise((resolve) => {
        const finish = () => { clearTimeout(timer); synthesis.removeEventListener('voiceschanged', changed); resolve(local()); };
        const changed = () => { if (local().some((voice) => /^pl(?:[-_]|$)/i.test(voice.language))) finish(); };
        const timer = setTimeout(finish, 1500);
        synthesis.addEventListener('voiceschanged', changed);
      });
    },
    stop: () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
      return Promise.resolve();
    },
    speak: (text, voice, callbacks) => {
      const utterance = new SpeechSynthesisUtterance(text);
      const selected = window.speechSynthesis.getVoices().find((v) => v.voiceURI === voice.id && v.localService);
      if (!selected) { callbacks.error(); return; }
      utterance.voice = selected; utterance.lang = 'pl-PL'; utterance.rate = 1;
      utterance.onend = callbacks.done; utterance.onerror = callbacks.error;
      window.speechSynthesis.speak(utterance);
    },
  };
}
export function watchSpeechEnvironment(onReader: (enabled: boolean | null) => void, onInactive: () => void): () => void {
  // Browsers have no reliable screen-reader detection. The UI provides an explicit switch.
  onReader(false);
  const hidden = () => { if (document.visibilityState !== 'visible') onInactive(); };
  document.addEventListener('visibilitychange', hidden); window.addEventListener('pagehide', onInactive);
  return () => { document.removeEventListener('visibilitychange', hidden); window.removeEventListener('pagehide', onInactive); };
}
