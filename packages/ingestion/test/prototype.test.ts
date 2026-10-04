import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { createPlanner, PILOT_POLICY } from '@krok/routing';
import type { RouteRequest } from '@krok/contracts';
import { loadKrakowPrototype, prototypePlaces } from '../src/krakow-prototype';

const { snapshot } = await loadKrakowPrototype();
const planner = createPlanner(snapshot, PILOT_POLICY);
const request = (from: number, to: number): RouteRequest => ({ cityId: snapshot.cityId,
  origin: { kind: 'place', placeId: `osm-place-${from}` }, destination: { kind: 'place', placeId: `osm-place-${to}` },
  locale: 'pl-PL', maxAlternatives: 3, preferences: { preferAudibleSignals: true, preferTactilePaving: true,
    preferSeparatedFootways: true, avoidKnownSteps: true, audibleRequirement: 'none', maxDetourRatio: 1.6 } });
const context = { requestId: 'prototype-test', asOf: snapshot.snapshotFetchedAt };

describe('real central Krakow prototype archive', () => {
  it('provides 30 exact endpoints and distinguishes pedestrian points from entrances', () => {
    expect(snapshot.places).toHaveLength(30);
    expect(snapshot.places.filter(place => place.kind === 'poi')).toHaveLength(15);
    expect(snapshot.places[0]).toMatchObject({ name: 'Rynek Główny — punkt na ciągu pieszym', kind: 'poi' });
    for (const place of snapshot.places) expect(snapshot.graph.nodes.find(node => node.id === place.nodeId)?.coordinate).toEqual(place.coordinate);
    expect(snapshot.places.find(place => place.id === 'osm-place-752177530')?.address).toBe('Rajska 1');
  });
  it.each([
    [14121238341, 6128078603], [2519190127, 2996091179], [14121238341, 8930701234],
    [278057644, 1517013550], [752177530, 12923496910], [11983033100, 6307183196],
  ])('computes a sourced route %i → %i with continuous actual geometry', (from, to) => {
    const response = planner.plan(request(from, to), context);
    expect(response.mode).toBe('pilot'); expect(response.navigationEligibility).toBe('preview_only');
    for (const route of response.routes) {
      expect(route.geometry!.coordinates[0]).toEqual(snapshot.places.find(p => p.id === `osm-place-${from}`)!.coordinate);
      expect(route.geometry!.coordinates.at(-1)).toEqual(snapshot.places.find(p => p.id === `osm-place-${to}`)!.coordinate);
      expect(route.steps[0]!.instructionKey).toBe('route.start'); expect(route.steps.at(-1)!.instructionKey).toBe('route.arrive');
      expect(route.metrics.distanceM).toBeGreaterThan(0);
      expect(route.metrics.crossingWaitDurationSec).toBeNull();
    }
    expect(response.evidenceCatalog.every(e => e.observedAt === null && e.verifiedAt === null)).toBe(true);
    expect(response.warnings.some(w => w.code === 'SYNTHETIC_DATA')).toBe(false);
  });
  it('preserves the original 420 m route and hard acoustic requirement', () => {
    const input = request(3719851597, 5213212813);
    const response = planner.plan(input, context);
    expect(response.routes[0]!.metrics.distanceM).toBeCloseTo(420.217459, 3);
    expect(() => planner.plan({ ...input, preferences: { ...input.preferences, audibleRequirement: 'documented' } }, context)).toThrow('NO_MATCHING_ROUTE');
  });
  it('returns NO_PATH across disconnected clusters instead of joining across tracks', () => {
    expect(() => planner.plan(request(14121238341, 3719851597), context)).toThrow('NO_PATH');
    expect(() => planner.plan(request(3719851597, 14121238341), context)).toThrow('NO_PATH');
  });
  it('refuses to reuse a named point when its exact parent way membership is absent', async () => {
    const raw = gunzipSync(await readFile(new URL('../data/krakow-prototype/raw-map.json.gz', import.meta.url)));
    const document = JSON.parse(raw.toString()) as { elements: { type: string; id: number; nodes?: number[] }[] };
    const way = document.elements.find(element => element.type === 'way' && element.id === 304542178)!;
    way.nodes = way.nodes!.filter(node => node !== 14121238341);
    expect(() => prototypePlaces(Buffer.from(JSON.stringify(document)))).toThrow('Unproven named pedestrian point');
  });
});
