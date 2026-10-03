import type { SpeechCoordinator } from '../../adapters/speech/coordinator';
import { SimulationController } from './controller';
import type { InvalidationReason, SimulationTransition } from './controller';
import { simulationItemText } from './text';

/** An exclusive session using the screen's single speech coordinator; no native I/O here. */
export class SimulationSession {
  private readonly controller: SimulationController;
  private voiceEnabled = false;
  private reader: boolean | null = null;
  private closed = false;
  private lastText: string | null = null;

  constructor(source: unknown, routeId: string, now: () => number, private readonly speech: SpeechCoordinator, rate = 1) {
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
    if (parts.length && this.voiceEnabled && this.reader === false && this.controller.isCurrent(transition.token)) {
      void this.speech.enqueue(parts);
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
