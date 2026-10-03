import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ApiErrorSchema, CoverageResponseSchema, PlacesResponseSchema, RouteResponseSchema, SCHEMA_VERSION } from '@krok/contracts';
import { loadKrakowPilot } from '@krok/ingestion';
import { PILOT_POLICY } from '@krok/routing';
import { buildApi } from '../src/app';
import { createSnapshotServices } from '../src/routing';

const real = await loadKrakowPilot();
const services = createSnapshotServices(real.snapshot, PILOT_POLICY);
const api = buildApi({ ...services, databaseReady: () => Promise.resolve(false), logging: false });
const request = { cityId: real.snapshot.cityId, origin: { kind: 'place', placeId: 'osm-place-3719851597' },
  destination: { kind: 'place', placeId: 'osm-place-5213212813' }, locale: 'pl-PL', maxAlternatives: 3,
  preferences: { preferAudibleSignals: true, preferTactilePaving: true, preferSeparatedFootways: true, avoidKnownSteps: true, audibleRequirement: 'none', maxDetourRatio: 1.6 } };
beforeAll(async () => { await api.ready(); });
afterAll(async () => { await api.close(); });
describe('archived real Krakow data over HTTP', () => {
  it('serves real coverage and searches actual graph-bound entrances without synthetic fallback', async () => {
    const coverage = await api.inject('/v1/coverage');
    expect(coverage.statusCode).toBe(200);
    expect(CoverageResponseSchema.parse(coverage.json())).toMatchObject({ mode: 'pilot', navigationEligibility: 'preview_only', schemaVersion: SCHEMA_VERSION });
    const places = await api.inject(`/v1/places?cityId=${request.cityId}&query=High5ive`);
    const parsed = PlacesResponseSchema.parse(places.json()); expect(parsed.places).toHaveLength(2);
    expect(parsed.places.every(p => p.coordinate !== null)).toBe(true);
    const missing = await api.inject(`/v1/places?cityId=${request.cityId}&query=Atlantyda`);
    expect(PlacesResponseSchema.parse(missing.json()).places).toEqual([]);
  });
  it('computes the real 420 m route with actual geometry and honest missing acoustic data', async () => {
    const response = await api.inject({ method: 'POST', url: '/v1/routes', payload: request });
    expect(response.statusCode).toBe(200);
    const result = RouteResponseSchema.parse(response.json());
    expect(result.mode).toBe('pilot'); expect(result.navigationEligibility).toBe('preview_only');
    expect(result.routes[0]!.metrics.distanceM).toBeGreaterThan(415); expect(result.routes[0]!.metrics.distanceM).toBeLessThan(425);
    expect(result.routes[0]!.metrics.crossingStageCount).toBe(1);
    expect(result.routes[0]!.events[0]!.facts.audible_signal.state).toBe('unknown');
    expect(result.routes[0]!.geometry!.coordinates[0]).toEqual(real.snapshot.places[0]!.coordinate);
    expect(result.routes[0]!.geometry!.coordinates.at(-1)).toEqual(real.snapshot.places[1]!.coordinate);
    expect(result.sourceCatalog[0]!.kind).toBe('osm'); expect(result.warnings.some(w => w.code === 'SYNTHETIC_DATA')).toBe(false);
    expect(response.body.length).toBeLessThan(30_000);
  });
  it.each(['documented', 'field_verified_recent'])('does not relax acoustic requirement %s', async audibleRequirement => {
    const response = await api.inject({ method: 'POST', url: '/v1/routes', payload: { ...request, preferences: { ...request.preferences, audibleRequirement } } });
    expect(ApiErrorSchema.parse(response.json()).error.code).toBe('NO_MATCHING_ROUTE');
  });
  it('rejects coordinates and synthetic point IDs in real mode', async () => {
    const response = await api.inject({ method: 'POST', url: '/v1/routes', payload: { ...request, origin: { kind: 'place', placeId: 'synthetic-a' } } });
    expect(ApiErrorSchema.parse(response.json()).error.code).toBe('UNRESOLVED_ENDPOINT');
    const coordinate = await api.inject({ method: 'POST', url: '/v1/routes', payload: { ...request, origin: { kind: 'coordinate', latitude: 50.068, longitude: 19.945 } } });
    expect(ApiErrorSchema.parse(coordinate.json()).error.code).toBe('FEATURE_NOT_ENABLED');
  });
  it('keeps source acquisition dates stable and verifies all twenty directed catalog pairs', async () => {
    for (const from of real.snapshot.places) for (const to of real.snapshot.places) {
      if (from.id === to.id) continue;
      const response = await api.inject({ method: 'POST', url: '/v1/routes', payload: { ...request, origin: { kind: 'place', placeId: from.id }, destination: { kind: 'place', placeId: to.id } } });
      expect(response.statusCode).toBe(200);
      const result = RouteResponseSchema.parse(response.json());
      expect(result.dataContext.snapshotFetchedAt).toBe(real.snapshot.snapshotFetchedAt);
      expect(result.sourceCatalog.every(s => s.kind === 'osm')).toBe(true);
      expect(result.evidenceCatalog.every(e => e.observedAt === null && e.verifiedAt === null)).toBe(true);
    }
  });
});
