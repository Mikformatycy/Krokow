import { describe, expect, it } from 'vitest';
import type { RouteRequest } from '@krok/contracts';
import { routeRequest } from '@krok/contracts/fixtures';
import { allowed, createPlanner, edgeCost, nearDuplicate, PILOT_POLICY, sharedPhysicalLength, SYNTHETIC_POLICY } from '../src';
import type { Edge } from '../src';
import { adjacency } from '../src/graph';
import { comparePaths, dijkstra, pathFrom, SearchBudget, yen } from '../src/search';
import { createSyntheticSnapshot, SYNTHETIC_FETCHED_AT } from '../src/synthetic';

const context = { requestId: 'invariants', asOf: SYNTHETIC_FETCHED_AT };
const req: RouteRequest = { ...routeRequest, preferences: { ...routeRequest.preferences, preferSeparatedFootways: true, preferTactilePaving: true } };

describe('subdivision and physical overlap', () => {
  it('preserves all metrics, costs and crossing offsets when an edge is split', () => {
    const snapshot = createSyntheticSnapshot();
    const before = createPlanner(snapshot, SYNTHETIC_POLICY, () => 0).plan(req, context);
    const original = snapshot.graph.edges.find((e) => e.id === 'A-edge-0')!;
    snapshot.graph.nodes.push({ id: 'split', level: 0 });
    snapshot.graph.edges = snapshot.graph.edges.filter((e) => e.physical.id !== original.physical.id);
    const parts: Edge[] = [
      { ...structuredClone(original), id: 'split-1', to: 'split', lengthM: 60, physical: { id: original.physical.id, startM: 0, endM: 60 } },
      { ...structuredClone(original), id: 'split-2', from: 'split', lengthM: 40, physical: { id: original.physical.id, startM: 60, endM: 100 }, events: [] },
    ];
    snapshot.graph.edges.push(...parts);
    for (const part of parts) snapshot.graph.edges.push({ ...structuredClone(part), id: part.id + '-reverse', from: part.to, to: part.from,
      physical: { id: part.physical.id, startM: part.physical.endM, endM: part.physical.startM },
      events: part.events.map((e) => ({ ...structuredClone(e), id: e.id + '-reverse', offsetM: part.lengthM - e.offsetM })) });
    const after = createPlanner(snapshot, SYNTHETIC_POLICY, () => 0).plan(req, context);
    expect(after.routes.map((r) => r.metrics)).toEqual(before.routes.map((r) => r.metrics));
    expect(after.routes.map((r) => r.events)).toEqual(before.routes.map((r) => r.events));
    for (const policy of [SYNTHETIC_POLICY, PILOT_POLICY]) for (const profile of ['shortest', 'preferences', 'documented'] as const) {
      expect(parts.reduce((sum, e) => sum + edgeCost(e, req.preferences, policy, profile), 0)).toBeCloseTo(edgeCost(original, req.preferences, policy, profile), 10);
    }
    const a = pathFrom([original], (e) => e.lengthM); const b = pathFrom(parts, (e) => e.lengthM);
    expect(sharedPhysicalLength(a, b)).toBe(100); expect(nearDuplicate(a, b, .85)).toBe(true);
    b.edges[0]!.events[0]!.stageId = 'another-physical-stage';
    expect(nearDuplicate(a, b, .85)).toBe(false);
  });
  it('uses length overlap rather than the number of matching edge IDs', () => {
    const edge = createSyntheticSnapshot().graph.edges[0]!; edge.events = [];
    const make = (id: string, physicalId: string, start: number, end: number): Edge => ({ ...edge, id, lengthM: end - start, physical: { id: physicalId, startM: start, endM: end } });
    const a = pathFrom([make('a', 'shared', 0, 100)], (e) => e.lengthM);
    const b = pathFrom([make('b', 'shared', 0, 85), make('c', 'different', 0, 15)], (e) => e.lengthM);
    expect(nearDuplicate(a, b, .85)).toBe(true);
    expect(nearDuplicate(a, b, .86)).toBe(false);
  });
});

describe('resolved facts and freshness', () => {
  it('retains conflict, charges conflict cost and excludes it from a hard documented path', () => {
    const snapshot = createSyntheticSnapshot();
    const original = snapshot.evidence.find((e) => e.id === 'B-crossing-object-0-audible_signal')!;
    snapshot.evidence.push({ ...original, featureKey: 'audible_signal', id: 'opposing-record', sourceRecordId: 'opposing-record', value: false });
    for (const edge of snapshot.graph.edges) for (const event of edge.events) if (event.objectId === original.objectId)
      event.facts.audible_signal = { state: 'conflicting', summaryCode: 'DISAGREEING_OBSERVATIONS', evidenceIds: [original.id, 'opposing-record'] };
    const engine = createPlanner(snapshot, SYNTHETIC_POLICY, () => 0);
    const result = engine.plan(routeRequest, context);
    expect(result.routes.find((r) => r.id === result.recommendation.routeId)!.metrics.distanceM).toBe(1120);
    // The conflicting B alternative is dominated by C, but its resolved input is retained.
    const b = snapshot.graph.edges.find((e) => e.id === 'B-edge-0')!;
    expect(edgeCost(b, routeRequest.preferences, SYNTHETIC_POLICY, 'preferences')).toBe(600);
    const strict = engine.plan({ ...routeRequest, preferences: { ...routeRequest.preferences, audibleRequirement: 'documented' } }, context);
    expect(strict.baseline.distanceM).toBe(1120);
    expect(strict.routes).toHaveLength(1);
    snapshot.graph.edges = snapshot.graph.edges.filter((e) => e.id.startsWith('B'));
    const onlyB = createPlanner(snapshot, SYNTHETIC_POLICY, () => 0).plan(routeRequest, context);
    expect(onlyB.routes[0]!.metrics.audibleSignals.conflicting).toBe(1);
    expect(onlyB.warnings.some((w) => w.code === 'CONFLICTING_FEATURE_DATA')).toBe(true);
  });
  it('requires actual recent evidence, not a recent reimport timestamp', () => {
    const snapshot = createSyntheticSnapshot();
    const verifiedAt = '2026-10-02T10:00:00Z';
    for (const evidence of snapshot.evidence) if (evidence.featureKey === 'audible_signal') {
      evidence.verificationStatus = 'field_verified'; evidence.verifiedAt = verifiedAt;
    }
    for (const edge of snapshot.graph.edges) for (const event of edge.events) {
      const fact = event.facts.audible_signal;
      if (fact.state === 'known') { fact.reliability = 'field_verified'; fact.verifiedAt = verifiedAt; fact.freshness = 'recent'; }
    }
    const strict: RouteRequest = { ...routeRequest, preferences: { ...routeRequest.preferences, audibleRequirement: 'field_verified_recent' } };
    const engine = createPlanner(snapshot, SYNTHETIC_POLICY, () => 0);
    expect(engine.plan(strict, context).baseline.distanceM).toBe(980);
    expect(() => engine.plan(strict, { ...context, asOf: '2027-10-03T10:00:00Z' })).toThrow('NO_MATCHING_ROUTE');
    expect(() => engine.plan(strict, { ...context, asOf: '2026-10-01T10:00:00Z' })).toThrow('NO_MATCHING_ROUTE');
  });
  it.each(['unknown', 'conflicting'] as const)('does not treat steps=%s as known absence or known stairs', (state) => {
    const edge = createSyntheticSnapshot().graph.edges[0]!;
    edge.steps = state === 'unknown' ? { state, reason: 'missing', evidenceIds: [] }
      : { state, summaryCode: 'DISAGREEING_OBSERVATIONS', evidenceIds: ['yes', 'no'] };
    expect(allowed(edge, { ...routeRequest.preferences, avoidKnownSteps: true }, SYNTHETIC_POLICY, context.asOf)).toBe(true);
    expect(edge.steps.state).toBe(state);
    edge.steps = { state: 'known', value: true, evidenceIds: ['yes'], reliability: 'source_declared', freshness: 'unknown', observedAt: null, verifiedAt: null };
    expect(allowed(edge, { ...routeRequest.preferences, avoidKnownSteps: true }, SYNTHETIC_POLICY, context.asOf)).toBe(false);
  });
});

describe('shortest and loopless search against exhaustive small-graph oracle', () => {
  it('matches independently enumerated simple paths on cyclic directed graphs', () => {
    const template = createSyntheticSnapshot().graph.edges[0]!;
    for (let seed = 1; seed <= 20; seed++) {
      const edges: Edge[] = [];
      for (let from = 0; from < 5; from++) for (let to = 0; to < 5; to++) {
        if (from === to || (seed * 13 + from * 17 + to * 7) % 4 === 0) continue;
        edges.push({ ...template, id: `${from}-${to}`, from: String(from), to: String(to), lengthM: 1 + (seed + from * 3 + to * 11) % 20, events: [] });
      }
      const all: ReturnType<typeof pathFrom>[] = [];
      const enumerate = (node: string, path: Edge[], visited: Set<string>) => {
        if (node === '4') { all.push(pathFrom(path, (e) => e.lengthM)); return; }
        for (const edge of edges.filter((e) => e.from === node && !visited.has(e.to))) enumerate(edge.to, [...path, edge], new Set([...visited, edge.to]));
      };
      enumerate('0', [], new Set(['0'])); all.sort(comparePaths);
      const graph = adjacency(edges); const budget = () => new SearchBudget(50000, 2000, () => 0);
      expect(dijkstra(graph, '0', '4', (e) => e.lengthM, () => true, budget())).toEqual(all[0] ?? null);
      const generated = [...yen(graph, '0', '4', (e) => e.lengthM, () => true, budget(), 12)];
      expect(generated).toEqual(all.slice(0, 12));
    }
  });
});
