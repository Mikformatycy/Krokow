import { speechChunks } from './chunks';

export interface SpeechVoice { id: string; language: string }
export interface SpeechPort {
  voices(): Promise<SpeechVoice[]>;
  stop(): Promise<void>;
  speak(text: string, voice: SpeechVoice, callbacks: { done(this: void): void; error(this: void): void }): void;
}
export type SpeechStatus = 'idle' | 'loading' | 'speaking' | 'stopped' | 'done' | 'unavailable' | 'error' | 'reader';

/** One owner for all route utterances. Tokens invalidate late platform callbacks. */
export class SpeechCoordinator {
  private revision = 0;
  private blocked = false;
  private disposed = false;
  private pendingParts: string[] | null = null;
  private stopQueue: Promise<boolean> = Promise.resolve(true);
  constructor(private readonly port: SpeechPort, private readonly notify: (status: SpeechStatus) => void) {}
  private halt(): Promise<boolean> {
    this.stopQueue = this.stopQueue.then(() => this.port.stop()).then(() => true, () => false);
    return this.stopQueue;
  }
  setBlocked(blocked: boolean): void {
    if (blocked === this.blocked) return;
    this.blocked = blocked;
    if (blocked) this.stop(); else if (!this.disposed) this.notify('idle');
  }
  stop(): void {
    this.pendingParts = null;
    const revision = ++this.revision;
    if (!this.disposed) this.notify(this.blocked ? 'reader' : 'stopped');
    void this.halt().then((ok) => { if (!ok && !this.disposed && revision === this.revision) this.notify('error'); });
  }
  dispose(): void { this.disposed = true; this.stop(); }
  enqueue(parts: readonly string[]): Promise<void> {
    if (this.disposed) return Promise.resolve();
    if (this.blocked) { this.notify('reader'); return Promise.resolve(); }
    if (this.pendingParts !== null) {
      this.pendingParts.push(...speechChunks(parts));
      return Promise.resolve();
    }
    return this.play(parts);
  }
  async play(parts: readonly string[]): Promise<void> {
    if (this.disposed) return;
    if (this.blocked) { this.notify('reader'); return; }
    const revision = ++this.revision;
    const current = () => !this.disposed && !this.blocked && revision === this.revision;
    const queue = speechChunks(parts);
    this.pendingParts = queue;
    this.notify('loading');
    if (!await this.halt()) { if (current()) { this.pendingParts = null; this.notify('error'); } return; }
    if (!current()) return;
    try {
      let timer: ReturnType<typeof setTimeout> | undefined;
      let voices: SpeechVoice[];
      try {
        voices = await Promise.race([this.port.voices(), new Promise<SpeechVoice[]>((resolve) => { timer = setTimeout(() => resolve([]), 3000); })]);
      } finally { clearTimeout(timer); }
      if (!current()) return;
      const voice = voices.find((v) => /^pl(?:[-_]|$)/i.test(v.language));
      if (!voice) { this.pendingParts = null; this.notify('unavailable'); return; }
      let index = 0;
      const next = () => {
        if (!current()) return;
        const text = queue[index];
        if (text === undefined) { this.pendingParts = null; this.notify('done'); return; }
        const utterance = index;
        this.notify('speaking');
        const failed = () => {
          if (!current() || index !== utterance) return;
          this.revision++; this.pendingParts = null; this.notify('error'); void this.halt();
        };
        try {
          this.port.speak(text, voice, {
            done: () => { if (current() && index === utterance) { index++; next(); } }, error: failed,
          });
        } catch { failed(); }
      };
      next();
    } catch { if (current()) { this.revision++; this.pendingParts = null; this.notify('error'); void this.halt(); } }
  }
}
