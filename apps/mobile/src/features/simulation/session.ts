import type { SpeechCoordinator } from '../../adapters/speech/coordinator';
import { SimulationController } from './controller';
import type { InvalidationReason, SimulationTransition } from './controller';
import { simulationItemSummary } from './summary';
import { simulationItemText } from './text';

export interface ReaderAnnouncer { announce(text: string, interrupt: boolean): void }

/**
 * An exclusive session using the screen's single speech coordinator; no native I/O here.
 * Exactly one channel per event: own voice only when the reader is confirmed off, otherwise the reader.
 */
export class SimulationSession {
  private readonly controller: SimulationController;
  private voiceEnabled = false;
  private reader: boolean | null = null;
  private closed = false;
  private lastText: string | null = null;

  constructor(source: unknown, routeId: string, now: () => number, private readonly speech: SpeechCoordinator, rate = 1,
    private readonly announcer: ReaderAnnouncer | null = null) {
    this.controller = new SimulationController(source, routeId, now, rate);
    speech.stop(); speech.setBlocked(true);
  }

  get state() { return this.controller.state; }
  get text(): string | null { return this.lastText; }
  get speechEnabled(): boolean { return this.voiceEnabled; }
  get readerState(): boolean | null { return this.reader; }

  private updateBlocking(): void {
    this.speech.setBlocked(this.reader !== false || !this.voiceEnabled || !this.state.active || this.closed);
  }
  setSpeechEnabled(enabled: boolean): void {
    if (this.closed) return;
    this.voiceEnabled = enabled; this.updateBlocking();
    // No replay of past events: repeat() is the explicit action for that.
  }
  setReader(enabled: boolean | null): void {
    if (this.closed) return;
    this.reader = enabled; this.updateBlocking();
  }
  private apply(transition: SimulationTransition): SimulationTransition {
    if (this.closed) return transition;
    if (transition.cancelSpeech) this.speech.stop();
    const parts = transition.emissions.map(({ item }) => simulationItemText(item));
    if (parts.length) this.lastText = parts.at(-1)!;
    if (!parts.length || !this.controller.isCurrent(transition.token)) return transition;
    if (this.reader === false) {
      if (this.voiceEnabled) void this.speech.enqueue(parts);
    } else if (this.announcer) {
      // Progress is queued in short form so it does not cut off what the reader is saying;
      // an explicit repeat interrupts and gives the complete text of the last event.
      const repeat = transition.emissions.some(({ reason }) => reason === 'repeat');
      this.announcer.announce(repeat ? parts.at(-1)! : transition.emissions.map(({ item }) => simulationItemSummary(item)).join(' '), repeat);
    }
    return transition;
  }
  start(): SimulationTransition { return this.apply(this.controller.start()); }
  tick(): SimulationTransition { return this.apply(this.controller.tick()); }
  pause(): SimulationTransition { return this.apply(this.controller.pause()); }
  resume(): SimulationTransition { return this.apply(this.controller.resume()); }
  repeat(): SimulationTransition { return this.apply(this.controller.repeat()); }
  reset(): SimulationTransition {
    const transition = this.apply(this.controller.reset());
    if (!this.closed) this.lastText = null;
    return transition;
  }
  setActive(active: boolean): SimulationTransition {
    const transition = this.apply(this.controller.setActive(active));
    if (!this.closed) this.updateBlocking();
    return transition;
  }
  invalidate(reason: InvalidationReason): SimulationTransition {
    const transition = this.apply(this.controller.invalidate(reason));
    this.closed = true;
    // Stop belongs to the session; final coordinator disposal belongs to the screen.
    return transition;
  }
}
