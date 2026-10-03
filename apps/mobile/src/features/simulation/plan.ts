import { RouteResponseSchema } from '@krok/contracts';
import type { CrossingEvent, RouteOption, RouteResponse } from '@krok/contracts';

export type Immutable<T> = T extends readonly (infer Item)[] ? readonly Immutable<Item>[]
  : T extends object ? { readonly [Key in keyof T]: Immutable<T[Key]> } : T;

export type SimulationItem = Readonly<{ key: string; offsetM: number }> & (
  | { readonly kind: 'step'; readonly step: Immutable<RouteOption['steps'][number]> }
  | { readonly kind: 'crossing'; readonly crossing: Immutable<CrossingEvent> }
);

export interface SimulationPlan {
  readonly response: Immutable<RouteResponse>;
  readonly routeId: string;
  readonly distanceM: number;
  readonly speedMps: number;
  readonly items: readonly SimulationItem[];
}

export class InvalidSimulationPlan extends Error {
  constructor() { super('Simulation requires a valid synthetic preview and an existing route.'); }
}

function freezeDeep(value: unknown): void {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) return;
  Object.values(value as Record<string, unknown>).forEach(freezeDeep);
  Object.freeze(value);
}

/** Copies and pins validated DTOs. Never derives facts, positions or field instructions. */
export function prepareSimulation(source: unknown, routeId: string): SimulationPlan {
  const parsed = RouteResponseSchema.safeParse(source);
  if (!parsed.success || parsed.data.mode !== 'synthetic' || parsed.data.navigationEligibility !== 'preview_only') throw new InvalidSimulationPlan();
  const response = parsed.data;
  const route = response.routes.find((item) => item.id === routeId);
  if (!route) throw new InvalidSimulationPlan();
  const priority = { 'route.start': 0, 'route.follow_segment': 2, 'route.arrive': 3 } as const;
  const timeline: { item: SimulationItem; priority: number; index: number }[] = [
    ...route.steps.map((step, index) => ({ index, priority: priority[step.instructionKey],
      item: { key: JSON.stringify([route.id, 'step', step.id]), offsetM: step.startM, kind: 'step' as const, step } })),
    ...route.events.map((crossing, index) => ({ index, priority: 1,
      item: { key: JSON.stringify([route.id, 'crossing', crossing.id]), offsetM: crossing.offsetM, kind: 'crossing' as const, crossing } })),
  ];
  timeline.sort((a, b) => a.item.offsetM - b.item.offsetM || a.priority - b.priority || a.index - b.index);
  const plan: SimulationPlan = { response, routeId, distanceM: route.metrics.distanceM,
    speedMps: route.metrics.assumedWalkingSpeedMps, items: timeline.map(({ item }) => item) };
  freezeDeep(plan);
  return plan;
}
