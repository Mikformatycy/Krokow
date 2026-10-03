import { prepareSimulation } from './plan';
import type { SimulationItem, SimulationPlan } from './plan';

export type SimulationStatus = 'ready' | 'running' | 'paused' | 'completed' | 'invalidated';
export type PauseReason = 'user' | 'background' | 'clock_invalid' | null;
export type InvalidationReason = 'route_changed' | 'data_changed' | 'unmounted';
export interface PlaybackToken { readonly generation: number }
export interface SimulationState {
  readonly mode: 'simulation';
  readonly navigationEligibility: 'preview_only';
  readonly routeId: string;
  readonly status: SimulationStatus;
  readonly positionM: number;
  readonly distanceM: number;
  readonly active: boolean;
  readonly pauseReason: PauseReason;
  readonly invalidationReason: InvalidationReason | null;
  readonly lastItem: SimulationItem | null;
}
export interface SimulationTransition {
  readonly state: SimulationState;
  readonly token: PlaybackToken;
  readonly cancelSpeech: boolean;
  readonly emissions: readonly { readonly item: SimulationItem; readonly reason: 'progress' | 'repeat' }[];
}

/** Foreground replay only. Caller supplies monotonic ticks; this class owns no I/O or timers. */
export class SimulationController {
  readonly plan: SimulationPlan;
  private status: SimulationStatus = 'ready';
  private active = true;
  private positionM = 0;
  private pauseReason: PauseReason = null;
  private invalidationReason: InvalidationReason | null = null;
  private lastItem: SimulationItem | null = null;
  private nextIndex = 0;
  private anchorMs: number | null = null;
  private anchorPositionM = 0;
  private lastClockMs: number | null = null;
  private pausedRepeat = false;
  private token: PlaybackToken = Object.freeze({ generation: 0 });

  constructor(source: unknown, routeId: string, private readonly now: () => number, private readonly playbackRate = 1) {
    if (!Number.isFinite(playbackRate) || playbackRate < 1 || playbackRate > 16) throw new RangeError('Playback rate must be between 1 and 16.');
    this.plan = prepareSimulation(source, routeId);
  }

  get state(): SimulationState {
    return Object.freeze({ mode: 'simulation', navigationEligibility: 'preview_only', routeId: this.plan.routeId,
      status: this.status, positionM: this.positionM, distanceM: this.plan.distanceM, active: this.active,
      pauseReason: this.pauseReason, invalidationReason: this.invalidationReason, lastItem: this.lastItem });
  }

  isCurrent(token: PlaybackToken): boolean {
    return token === this.token && this.active && (this.status === 'running' || this.status === 'completed' || (this.status === 'paused' && this.pausedRepeat));
  }

  private revise(pausedRepeat = false): void {
    this.pausedRepeat = pausedRepeat;
    this.token = Object.freeze({ generation: this.token.generation + 1 });
  }
  private result(cancelSpeech = false, items: readonly SimulationItem[] = [], reason: 'progress' | 'repeat' = 'progress'): SimulationTransition {
    return Object.freeze({ state: this.state, token: this.token, cancelSpeech,
      emissions: Object.freeze(items.map((item) => Object.freeze({ item, reason }))) });
  }
  private readClock(): number | null {
    let time: number;
    try { time = this.now(); } catch { return null; }
    if (!Number.isFinite(time) || time < 0 || (this.lastClockMs !== null && time < this.lastClockMs)) return null;
    this.lastClockMs = time;
    return time;
  }
  private clockFailure(): SimulationTransition {
    this.status = 'paused'; this.pauseReason = 'clock_invalid'; this.anchorMs = null; this.revise();
    return this.result(true);
  }
  private due(): SimulationItem[] {
    const emitted: SimulationItem[] = [];
    for (;;) {
      const item = this.plan.items[this.nextIndex];
      if (!item || item.offsetM > this.positionM) break;
      emitted.push(item); this.lastItem = item; this.nextIndex++;
    }
    return emitted;
  }

  start(): SimulationTransition {
    if (!this.active || this.status !== 'ready') return this.result();
    const time = this.readClock();
    if (time === null) return this.clockFailure();
    this.status = 'running'; this.anchorMs = time; this.anchorPositionM = this.positionM; this.revise();
    return this.result(true, this.due());
  }

  tick(): SimulationTransition {
    if (!this.active || this.status !== 'running') return this.result();
    const time = this.readClock();
    if (time === null || this.anchorMs === null) return this.clockFailure();
    // Use one anchor per active interval to avoid accumulation errors from tick frequency.
    this.positionM = Math.min(this.plan.distanceM,
      this.anchorPositionM + (time - this.anchorMs) / 1000 * this.plan.speedMps * this.playbackRate);
    const items = this.due();
    if (this.positionM >= this.plan.distanceM) { this.status = 'completed'; this.anchorMs = null; }
    return this.result(false, items);
  }

  pause(): SimulationTransition {
    if (this.status === 'completed' || (this.status === 'paused' && this.pausedRepeat)) {
      this.revise(); return this.result(true);
    }
    if (this.status !== 'running') return this.result();
    this.status = 'paused'; this.pauseReason = 'user'; this.anchorMs = null; this.revise();
    return this.result(true);
  }

  resume(): SimulationTransition {
    if (!this.active || this.status !== 'paused') return this.result();
    const time = this.readClock();
    if (time === null) return this.clockFailure();
    this.status = 'running'; this.pauseReason = null; this.anchorMs = time; this.anchorPositionM = this.positionM; this.revise();
    return this.result(true, this.due());
  }

  setActive(active: boolean): SimulationTransition {
    if (this.status === 'invalidated' || this.active === active) return this.result();
    this.active = active;
    if (active) return this.result();
    if (this.status === 'running') { this.status = 'paused'; this.pauseReason = 'background'; }
    this.anchorMs = null; this.revise();
    return this.result(true);
  }

  repeat(): SimulationTransition {
    if (!this.active || !this.lastItem || !['running', 'paused', 'completed'].includes(this.status)) return this.result();
    // Paused replay stays paused, but the explicit repeat may be spoken with its new token.
    this.revise(this.status === 'paused');
    return this.result(true, [this.lastItem], 'repeat');
  }

  reset(): SimulationTransition {
    if (this.status === 'invalidated') return this.result();
    this.status = 'ready'; this.positionM = 0; this.anchorPositionM = 0; this.anchorMs = null;
    this.nextIndex = 0; this.lastItem = null; this.pauseReason = null; this.revise();
    return this.result(true);
  }

  invalidate(reason: InvalidationReason): SimulationTransition {
    if (this.status === 'invalidated') return this.result();
    this.status = 'invalidated'; this.invalidationReason = reason; this.anchorMs = null; this.revise();
    return this.result(true);
  }
}
