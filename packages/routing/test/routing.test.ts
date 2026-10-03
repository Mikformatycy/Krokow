import { describe, expect, it } from 'vitest';
import { RouteResponseSchema } from '@krok/contracts';
import type { RouteRequest, RouteResponse } from '@krok/contracts';
import { routeRequest } from '@krok/contracts/fixtures';
import { createPlanner, edgeCost, searchRoutes, SYNTHETIC_POLICY, validateSnapshot } from '../src';
import type { Policy, Snapshot } from '../src';
import { createSyntheticSnapshot, SYNTHETIC_FETCHED_AT } from '../src/synthetic';
import { adjacency } from '../src/graph';
import { dijkstra, SearchBudget } from '../src/search';

const context = { requestId: 'routing-test', asOf: SYNTHETIC_FETCHED_AT };
const request = (preferences: Partial<RouteRequest['preferences']> = {}, extra: Partial<RouteRequest> = {}): RouteRequest =>
  ({ ...structuredClone(routeRequest), ...extra, preferences: { ...routeRequest.preferences, ...preferences } });
const plan = (req = request(), snapshot = createSyntheticSnapshot(), policy: Policy = SYNTHETIC_POLICY) => createPlanner(snapshot, policy, () => 0).plan(req, context);
const recommended = (response: RouteResponse) => response.routes.find((r) => r.id === response.recommendation.routeId)!;

describe('synthetic graph routing', () => {
  it('computes A/B/C costs and recommends B using graph edges', () => {
    const snapshot = createSyntheticSnapshot();
    const costs = ['A', 'B', 'C'].map((branch) => snapshot.graph.edges.filter((e) => e.id.startsWith(branch) && !e.id.endsWith('reverse'))
      .reduce((sum, edge) => sum + edgeCost(edge, routeRequest.preferences, SYNTHETIC_POLICY, 'preferences'), 0));
    expect(costs).toEqual([1480, 1100, 1160]);
    const result = plan();
    expect(result.routes.map((r) => r.metrics.distanceM)).toEqual([740, 980, 1120]);
    expect(recommended(result).metrics.audibleSignals).toEqual({ present: 3, absent: 0, unknown: 0, conflicting: 0 });
    expect(recommended(result).metrics.extraDistanceM).toBe(240);
    expect(result.baseline.distanceM).toBe(740);
    expect(result.mode).toBe('synthetic'); expect(result.navigationEligibility).toBe('preview_only');
    expect(result.calculation).toEqual({ status: 'finished', exhaustive: false });
    expect(result.routes.every((r) => r.geometry === null && r.metrics.crossingWaitDurationSec === null)).toBe(true);
    expect(RouteResponseSchema.safeParse(result).success).toBe(true);
  });
  it('changes recommendation when acoustic preference is disabled', () => {
    expect(recommended(plan(request({ preferAudibleSignals: false }))).metrics.distanceM).toBe(740);
  });
  it('does not pad one physical corridor into three alternatives', () => {
    const snapshot = createSyntheticSnapshot(); snapshot.graph.edges = snapshot.graph.edges.filter((e) => e.id.startsWith('B'));
    expect(plan(request(), snapshot).routes).toHaveLength(1);
  });
  it('retains separate shortest baseline with one returned recommendation', () => {
    const result = plan(request({}, { maxAlternatives: 1 }));
    expect(result.routes).toHaveLength(1); expect(result.baseline.distanceM).toBe(740);
    expect(recommended(result).metrics.distanceM).toBe(980);
  });
  it.each([1, 3] as const)('uses a valid shortest representative on equal distance with maxAlternatives=%s', (maxAlternatives) => {
    const snapshot = createSyntheticSnapshot();
    for (const edge of snapshot.graph.edges.filter((e) => e.physical.id === 'A-edge-3')) {
      edge.lengthM = 680;
      edge.physical = edge.id.endsWith('reverse') ? { id: edge.physical.id, startM: 680, endM: 0 } : { id: edge.physical.id, startM: 0, endM: 680 };
    }
    const result = plan(request({}, { maxAlternatives }), snapshot);
    expect(result.baseline.distanceM).toBe(980);
    expect(recommended(result).metrics.audibleSignals.present).toBe(3);
    expect(recommended(result).labels).not.toContain('better_documented');
    expect(result.recommendation.reasons.map((r) => r.code)).toEqual(['SHORTER_DISTANCE']);
  });
  it('applies detour limit relative to shortest under the same hard constraints', () => {
    expect(plan(request({ maxDetourRatio: 1 })).routes.map((r) => r.metrics.distanceM)).toEqual([740]);
    const result = plan(request({ audibleRequirement: 'documented', maxDetourRatio: 1 }));
    expect(result.baseline.distanceM).toBe(980); expect(result.routes.map((r) => r.metrics.distanceM)).toEqual([980]);
  });
  it('never interprets source declaration as field verification', () => {
    expect(() => plan(request({ audibleRequirement: 'field_verified_recent' }))).toThrow('NO_MATCHING_ROUTE');
  });
  it('keeps unknown distinct from absent and warns for both missing feature types', () => {
    const result = plan(); const a = result.routes[0]!;
    expect(a.metrics.audibleSignals).toEqual({ present: 1, absent: 1, unknown: 1, conflicting: 0 });
    expect(result.warnings.some((w) => w.code === 'MISSING_FEATURE_DATA' && w.params.featureKey === 'audible_signal')).toBe(true);
    expect(result.warnings.some((w) => w.code === 'MISSING_FEATURE_DATA' && w.params.featureKey === 'tactile_paving')).toBe(true);
  });
  it.each(['denied', 'unknown'] as const)('excludes access=%s without silently connecting endpoints', (access) => {
    const snapshot = createSyntheticSnapshot(); snapshot.graph.edges.forEach((e) => { e.access = access; });
    expect(() => plan(request(), snapshot)).toThrow('NO_PATH');
  });
  it('distinguishes closed/disconnected topology from blocked preferences', () => {
    const snapshot = createSyntheticSnapshot(); snapshot.graph.edges.forEach((e) => { e.closed = true; });
    expect(() => plan(request({ audibleRequirement: 'documented' }), snapshot)).toThrow('NO_PATH');
    snapshot.graph.edges = []; expect(() => plan(request(), snapshot)).toThrow('NO_PATH');
  });
  it('respects stairs restriction on every edge and the baseline', () => {
    const snapshot = createSyntheticSnapshot(); snapshot.graph.edges.filter((e) => e.id.startsWith('A')).forEach((e) => { e.kind = 'steps'; });
    expect(plan(request({ avoidKnownSteps: true }), snapshot).baseline.distanceM).toBe(980);
    snapshot.graph.edges.forEach((e) => { e.kind = 'steps'; });
    expect(() => plan(request({ avoidKnownSteps: true }), snapshot)).toThrow('NO_MATCHING_ROUTE');
  });
  it('follows explicitly authored reverse edges', () => {
    const result = plan(request({}, { origin: routeRequest.destination, destination: routeRequest.origin }));
    expect(recommended(result).metrics.distanceM).toBe(980);
    expect(result.routes.every((r) => r.edgeIds.every((id) => id.endsWith('reverse')))).toBe(true);
  });
  it('is deterministic when input graph ordering changes', () => {
    const snapshot = createSyntheticSnapshot(); snapshot.graph.edges.reverse(); snapshot.graph.nodes.reverse();
    expect(plan(request(), snapshot)).toEqual(plan());
  });
  it('owns a snapshot and policy copy, independent of later caller mutations', () => {
    const snapshot = createSyntheticSnapshot(); const policy = structuredClone(SYNTHETIC_POLICY);
    const engine = createPlanner(snapshot, policy, () => 0); const first = engine.plan(request(), context);
    snapshot.graph.edges.length = 0; policy.audible.present = 10000;
    expect(engine.plan(request(), context)).toEqual(first);
  });
  it('checks endpoint binding and expected versions', () => {
    expect(() => plan(request({}, { destination: { kind: 'place', placeId: 'missing' } }))).toThrow('UNRESOLVED_ENDPOINT');
    expect(() => plan(request({}, { destination: routeRequest.origin }))).toThrow('SAME_ENDPOINT');
    expect(() => plan(request({}, { expectedVersions: { graphVersion: 'old', evidenceVersion: 'old', policyVersion: 'old' } }))).toThrow('DATA_VERSION_CHANGED');
  });
});

describe('bounded calculation', () => {
  it('returns a search error when the shortest baseline is not proven', () => {
    expect(() => plan(request(), createSyntheticSnapshot(), { ...SYNTHETIC_POLICY, maxOperations: 1 })).toThrow('SEARCH_LIMIT_REACHED');
  });
  it('returns a valid partial result once the baseline has been proven', () => {
    const snapshot = createSyntheticSnapshot(); const budget = new SearchBudget(50000, 2000, () => 0);
    dijkstra(adjacency(snapshot.graph.edges), 'start', 'end', (e) => e.lengthM, () => true, budget);
    const result = plan(request(), snapshot, { ...SYNTHETIC_POLICY, maxOperations: budget.operations });
    expect(result.calculation).toEqual({ status: 'budget_limited', exhaustive: false });
    expect(result.baseline.distanceM).toBe(740); expect(result.routes).toHaveLength(1);
    expect(result.warnings.some((w) => w.code === 'SEARCH_BUDGET_LIMITED')).toBe(true);
  });
  it('enforces injected elapsed-time budget', () => {
    let clock = 0; const engine = createPlanner(createSyntheticSnapshot(), SYNTHETIC_POLICY, () => (clock += 2001));
    expect(() => engine.plan(request(), context)).toThrow('SEARCH_LIMIT_REACHED');
  });
  it('caps candidates independently from operation budget', () => {
    const result = searchRoutes(createSyntheticSnapshot(), { ...SYNTHETIC_POLICY, maxCandidates: 1 }, request(), context.asOf, () => 0);
    expect(result.selected).toHaveLength(1); expect(result.recommended.distanceM).toBe(740);
  });
});

describe('graph validation', () => {
  it.each([0, -1, NaN, Infinity])('rejects invalid length %s', (length) => {
    const snapshot = createSyntheticSnapshot(); snapshot.graph.edges[0]!.lengthM = length;
    expect(() => validateSnapshot(snapshot)).toThrow();
  });
  it.each([
    (s: Snapshot) => { s.graph.nodes[0]!.level = 1; },
    (s: Snapshot) => { s.graph.edges[0]!.to = 'missing'; },
    (s: Snapshot) => { s.graph.edges.push(structuredClone(s.graph.edges[0]!)); },
    (s: Snapshot) => { s.evidence[0]!.objectId = 'wrong'; },
    (s: Snapshot) => { s.evidence[0]!.sourceId = 'missing'; },
    (s: Snapshot) => { s.graph.edges[0]!.events[0]!.offsetM = 101; },
    (s: Snapshot) => { const edge = structuredClone(s.graph.edges[0]!); edge.id = 'third-owner'; edge.events[0]!.id = 'third-event'; s.graph.edges.push(edge); },
  ])('rejects unproven topology, duplicate IDs and malformed provenance %#', (mutate) => {
    const snapshot = createSyntheticSnapshot(); mutate(snapshot); expect(() => createPlanner(snapshot, SYNTHETIC_POLICY)).toThrow();
  });
  it('rejects negative policy costs before search', () => {
    expect(() => createPlanner(createSyntheticSnapshot(), { ...SYNTHETIC_POLICY, baseCrossing: -1 })).toThrow();
  });
});
