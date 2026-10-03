import { describe, expect, it } from 'vitest';
import { createPlanner, PILOT_POLICY, validateSnapshot } from '@krok/routing';
import type { RouteRequest } from '@krok/contracts';
import { buildPilotGraph, distanceM } from '../src/pilot-graph';
import { extractHighways } from '../src/map-extract';
import type { OsmElement } from '../src/osm';

const fetchedAt = '2026-10-03T18:00:00Z';
const metadata = { version: 1, timestamp: '2026-01-01T00:00:00Z' };
const node = (id: number, x: number, y = 0, tags: Record<string, string> = {}): OsmElement => ({ ...metadata, type: 'node', id, lat: 50.068 + y * .0001, lon: 19.945 + x * .0001, tags });
const way = (id: number, nodes: number[], tags: Record<string, string> = {}): OsmElement => ({ ...metadata, type: 'way', id, nodes, tags: { highway: 'footway', ...tags } });
function build(elements: OsmElement[]) { return buildPilotGraph({ elements, fetchedAt, bbox: [50.065, 19.939, 50.071, 19.950], places: [] }); }
const base = () => [node(1, 0), node(2, 1), node(3, 2), way(10, [1, 2, 3])];

describe('real-data graph rules on labelled synthetic topology inputs', () => {
  it('preserves complete curved geometry, geodesic lengths and reversed geometry', () => {
    const { snapshot } = build([node(1, 0), node(2, 0, 1), node(3, 1, 1), way(10, [1, 2, 3])]);
    const [forward, back] = snapshot.graph.edges;
    expect(forward?.geometry).toHaveLength(3);
    expect(back?.geometry).toEqual([...forward!.geometry!].reverse());
    expect(forward?.lengthM).toBeCloseTo(18.26, 0);
    expect(forward?.lengthM).toBeGreaterThan(distanceM(forward!.geometry![0]!, forward!.geometry!.at(-1)!));
    expect(forward?.steps.state).toBe('unknown'); expect(forward?.separatedFootway.state).toBe('unknown');
  });
  it('does not join distinct OSM IDs at identical coordinates', () => {
    const result = build([node(1, 0), node(2, 1), node(3, 1), node(4, 2), way(10, [1, 2]), way(11, [3, 4])]);
    expect(result.audit.components).toEqual([2, 2]);
  });
  it.each([
    { access: 'private' }, { foot: 'no' }, { access: 'customers' }, { 'foot:conditional': 'yes @ (Mo-Fr)' },
    { construction: 'yes' }, { indoor: 'yes' }, { level: '-1' }, { layer: '1' }, { bridge: 'yes' }, { tunnel: 'yes' },
    { highway: 'steps' }, { highway: 'service', foot: 'yes' }, { area: 'yes' }, { 'oneway:foot': 'reversible' },
  ])('excludes unsupported or restricted way %#', tags => {
    expect(() => build([node(1, 0), node(2, 1), way(10, [1, 2], tags)])).toThrow(/node IDs/);
  });
  it('honours specific pedestrian access and direction, ignoring car-only oneway', () => {
    expect(build([node(1, 0), node(2, 1), way(10, [1, 2], { access: 'private', foot: 'yes', oneway: 'yes' })]).snapshot.graph.edges).toHaveLength(2);
    const reverse = build([node(1, 0), node(2, 1), way(10, [1, 2], { 'oneway:foot': '-1' })]).snapshot.graph.edges;
    expect(reverse).toHaveLength(1); expect(reverse[0]?.from).toBe('osm:node/2');
  });
  it.each([{ barrier: 'gate' }, { foot: 'no' }, { level: '1' }, { railway: 'level_crossing' }])('does not pass a blocked intermediate node %#', tags => {
    expect(() => build([node(1, 0), node(2, 1, 0, tags), node(3, 2), way(10, [1, 2, 3])])).toThrow(/node IDs/);
  });
  it('retains a mapped kerb without inventing lowered kerbs or steps=false', () => {
    const result = build([node(1, 0), node(2, 1, 0, { barrier: 'kerb' }), node(3, 2), way(10, [1, 2, 3])]);
    expect(result.snapshot.graph.edges).toHaveLength(2); expect(result.snapshot.graph.edges[0]?.steps.state).toBe('unknown');
  });
  it('blocks an unmarked road intersection and accepts only explicit crossing traversal', () => {
    const nodes = [node(1, 0), node(2, 1), node(3, 2), node(4, 1, -1), node(5, 1, 1)];
    const road = way(20, [4, 2, 5], { highway: 'residential' });
    expect(() => build([...nodes, road, way(10, [1, 2, 3])])).toThrow(/node IDs/);
    const result = build([...nodes, road, way(10, [1, 2, 3], { footway: 'crossing' })]);
    expect(result.snapshot.graph.edges).toHaveLength(2);
    expect(result.audit.crossings).toBe(1);
    expect(result.snapshot.graph.edges[0]?.events[0]?.facts.audible_signal.state).toBe('unknown');
    expect(result.snapshot.graph.edges[0]?.events[0]?.offsetM).toBe(0);
    expect(result.snapshot.graph.nodes.some(n => n.id === 'osm:node/2')).toBe(false);
  });
  it('does not inflate a centre-node tactile tag to cover a complete crossing', () => {
    const result = build([node(1, 0), node(2, 1, 0, { highway: 'crossing', tactile_paving: 'yes' }), node(3, 2), node(4, 1, 1),
      way(20, [2, 4], { highway: 'residential' }), way(10, [1, 2, 3], { footway: 'crossing' })]);
    expect(result.snapshot.graph.edges[0]?.events[0]?.facts.tactile_paving.state).toBe('unknown');
  });
  it('preserves direct whole-crossing evidence and rejects a multi-road or branching crossing', () => {
    const nodes = [node(1, 0), node(2, 1), node(3, 2), node(4, 3), node(5, 1, 1), node(6, 2, 1)];
    const crossing = way(10, [1, 2, 3, 4], { footway: 'crossing', tactile_paving: 'partial' });
    const road = way(20, [2, 5], { highway: 'service' });
    const result = build([...nodes, crossing, road]);
    expect(result.snapshot.graph.edges[0]?.events[0]?.facts.tactile_paving).toMatchObject({ state: 'known', value: 'partial', freshness: 'unknown' });
    expect(() => build([...nodes, crossing, road, way(21, [3, 6], { highway: 'service' })])).toThrow(/node IDs/);
    expect(() => build([...nodes, crossing, road, way(22, [2, 6])])).toThrow(/node IDs/);
  });
  it('splits only at real junctions and never joins through an out-of-bounds detour', () => {
    const result = build([...base(), node(4, 1, 1), way(11, [2, 4])]);
    expect(result.snapshot.graph.edges).toHaveLength(6);
    expect(result.audit.components).toEqual([4]);
    const far = node(2, 1); if (far.type === 'node') far.lat = 50.09;
    expect(() => build([node(1, 0), far, node(3, 2), way(10, [1, 2, 3])])).toThrow(/node IDs/);
  });
  it('requires an exact graph binding for catalog places and rejects fake geometry/source mode', () => {
    const config = { elements: base(), fetchedAt, bbox: [50.065, 19.939, 50.071, 19.950] as const };
    expect(() => buildPilotGraph({ ...config, places: [{ nodeId: 100, name: 'Missing', description: 'test' }] })).toThrow(/proven/);
    const { snapshot } = buildPilotGraph({ ...config, places: [{ nodeId: 1, name: 'Start', description: 'test' }, { nodeId: 3, name: 'End', description: 'test' }] });
    const request: RouteRequest = { cityId: snapshot.cityId, origin: { kind: 'place', placeId: snapshot.places[0]!.id }, destination: { kind: 'place', placeId: snapshot.places[1]!.id }, locale: 'pl-PL', maxAlternatives: 3,
      preferences: { preferAudibleSignals: true, preferTactilePaving: true, preferSeparatedFootways: true, avoidKnownSteps: true, audibleRequirement: 'none', maxDetourRatio: 1.6 } };
    const response = createPlanner(snapshot, PILOT_POLICY).plan(request, { requestId: 'test', asOf: fetchedAt });
    expect(response.mode).toBe('pilot'); expect(response.navigationEligibility).toBe('preview_only'); expect(response.routes[0]?.geometry).not.toBeNull();
    expect(response.warnings.some(w => w.code === 'SYNTHETIC_DATA')).toBe(false);
    const broken = structuredClone(snapshot); broken.graph.edges[0]!.geometry![0] = [19, 50];
    expect(() => validateSnapshot(broken)).toThrow(/geometry/);
    broken.mode = 'synthetic'; expect(() => validateSnapshot(broken)).toThrow(/mode/);
  });
  it('extracts only complete highways, retaining explicit foot restrictions and barrier membership', () => {
    const raw = Buffer.from(JSON.stringify({ elements: [...base(), { type: 'way', id: 90, nodes: [2, 3], tags: { barrier: 'fence' } },
      { type: 'relation', id: 100, tags: { 'restriction:foot': 'no_left_turn' }, members: [{ type: 'way', ref: 10 }] }] }));
    const result = extractHighways(raw);
    expect(result.elements).toHaveLength(4); expect(result.restrictedWays.has(10)).toBe(true); expect(result.barrierNodes.has(2)).toBe(true);
    expect(() => extractHighways(Buffer.from('{"error":"partial","elements":[]}'))).toThrow();
  });
  it('distinguishes platform outlines from actual rails and never crosses shared rail nodes', () => {
    const raw = Buffer.from(JSON.stringify({ elements: [...base(),
      { type: 'way', id: 91, nodes: [1, 2], tags: { railway: 'platform' } },
      { type: 'way', id: 92, nodes: [2, 3], tags: { railway: 'tram' } }] }));
    const extracted = extractHighways(raw);
    expect(extracted.railNodes.has(1)).toBe(false); expect(extracted.railNodes.has(2)).toBe(true);
    expect(() => buildPilotGraph({ ...extracted, fetchedAt, bbox: [50.065, 19.939, 50.071, 19.950], places: [] })).toThrow(/node IDs/);
  });
});
