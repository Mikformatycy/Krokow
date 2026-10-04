import { describe, expect, it } from 'vitest';
import { readFile, readdir } from 'node:fs/promises';
import { z } from 'zod';
import { ApiErrorSchema, BooleanFactSchema, CoverageResponseSchema, FeatureEvidenceResponseSchema, PlacesQuerySchema, PlacesResponseSchema, ReadyResponseSchema, RouteRequestSchema, RouteResponseSchema, SCHEMA_VERSION, ERROR_HTTP_STATUS } from '../src/index';
import type { RouteResponse } from '../src/index';
import { coverageResponse, createRouteResponse, errorScenarios, featureEvidenceResponse, fixtureDocuments, placesResponse, routeRequest, routeScenarios } from '../src/fixtures';
import { createOpenApiDocument, publicSchemas } from '../src/openapi';

function first(response: RouteResponse) {
  const route = response.routes[0]; const event = route?.events[0]; const evidence = response.evidenceCatalog[0];
  if (!route || !event || !evidence) throw new Error('Incomplete test setup');
  return { route, event, evidence };
}

describe('authored fixtures shared by mobile and API', () => {
  it('creates independent plans without mutating shared fixture catalogs or policy', () => {
    const firstPlan = createRouteResponse();
    const secondPlan = createRouteResponse();
    firstPlan.policy.policyVersion = 'local-change';
    const source = firstPlan.sourceCatalog[0]; if (source) source.status = 'unavailable';
    firstPlan.warnings[0]?.evidenceIds.push('local-change');
    expect(secondPlan).toEqual(createRouteResponse());
    expect(secondPlan.policy.policyVersion).toBe('synthetic-acoustic-v1');
  });
  it.each(fixtureDocuments)('$file passes its exported Zod validator and JSON round trip', ({ schema, value }) => {
    expect(schema.safeParse(value).success).toBe(true);
    expect(schema.parse(JSON.parse(JSON.stringify(value)))).toEqual(value);
  });
  it.each(routeScenarios)('$id has a valid associated request and bounded alternatives', ({ request, response }) => {
    expect(RouteRequestSchema.safeParse(request).success).toBe(true);
    expect(response.routes.length).toBeLessThanOrEqual(request.maxAlternatives);
    expect(response.routes.every((r) => r.metrics.distanceM <= request.preferences.maxDetourRatio * response.baseline.distanceM)).toBe(true);
  });
  it.each(errorScenarios)('$id uses the declared error shape, request shape and HTTP mapping', ({ id, request, response }) => {
    expect(ApiErrorSchema.safeParse(response).success).toBe(true);
    expect(RouteRequestSchema.safeParse(request).success).toBe(id !== 'VALIDATION_ERROR');
    expect(ERROR_HTTP_STATUS[response.error.code]).toBeGreaterThanOrEqual(400);
  });
  it('keeps A/B/C distances and B recommendation without claiming computed routing', () => {
    const response = createRouteResponse();
    expect(response.routes.map((r) => r.metrics.distanceM)).toEqual([740, 980, 1120]);
    expect(response.recommendation.routeId).toBe('B');
    expect(response.routes[1]?.metrics.extraDistanceM).toBe(240);
  });
  it('preserves hidden baseline, nulls and empty crossing counters', () => {
    const single = routeScenarios.find((s) => s.id === 'single')?.response;
    expect(single?.baseline.distanceM).toBe(740);
    expect(single?.routes[0]?.metrics.distanceM).toBe(980);
    expect(single?.routes[0]?.metrics.crossingWaitDurationSec).toBeNull();
    const zero = routeScenarios.find((s) => s.id === 'zero-crossings')?.response;
    expect(zero?.routes[0]?.metrics.audibleSignals).toEqual({ present: 0, absent: 0, unknown: 0, conflicting: 0 });
  });
});

describe('strict requests and knowledge states', () => {
  it.each([Number.NaN, Infinity, -Infinity, -91, 91])('rejects invalid latitude %s', (latitude) => {
    expect(RouteRequestSchema.safeParse({ ...routeRequest, origin: { kind: 'coordinate', latitude, longitude: 0 } }).success).toBe(false);
  });
  it.each([-181, 181, Infinity])('rejects invalid longitude %s', (longitude) => {
    expect(RouteRequestSchema.safeParse({ ...routeRequest, origin: { kind: 'coordinate', latitude: 0, longitude } }).success).toBe(false);
  });
  it.each([0.9, 2.1, '1.6', null])('does not coerce maxDetourRatio %s', (maxDetourRatio) => {
    expect(RouteRequestSchema.safeParse({ ...routeRequest, preferences: { ...routeRequest.preferences, maxDetourRatio } }).success).toBe(false);
  });
  it('rejects client asOf and omitted preferences instead of silently defaulting', () => {
    expect(RouteRequestSchema.safeParse({ ...routeRequest, asOf: '2026-10-03T10:00:00Z' }).success).toBe(false);
    expect(RouteRequestSchema.safeParse({ ...routeRequest, preferences: {} }).success).toBe(false);
  });
  it('accepts same endpoints structurally for the SAME_ENDPOINT domain error', () => {
    expect(RouteRequestSchema.safeParse({ ...routeRequest, destination: routeRequest.origin }).success).toBe(true);
  });
  it('distinguishes known(false), unknown and conflicting without positive fallback', () => {
    const response = createRouteResponse(); const route = first(response).route;
    expect(route.events[1]?.facts.audible_signal).toMatchObject({ state: 'known', value: false });
    expect(route.events[2]?.facts.audible_signal).toEqual({ state: 'unknown', reason: 'missing', evidenceIds: [] });
    expect(BooleanFactSchema.safeParse({ state: 'unknown', reason: 'missing', evidenceIds: [], value: false }).success).toBe(false);
    expect(BooleanFactSchema.safeParse({ state: 'conflicting', summaryCode: 'DISAGREEING_OBSERVATIONS', evidenceIds: ['x', 'x'] }).success).toBe(false);
    expect(BooleanFactSchema.safeParse({ state: 'available', value: true, evidenceIds: [] }).success).toBe(false);
  });
  it('rejects undocumented error details, unknown codes and wrong retry behavior', () => {
    const error = errorScenarios.find((s) => s.id === 'NO_PATH')?.response;
    if (!error) throw new Error('Missing error fixture');
    expect(ApiErrorSchema.safeParse({ ...error, error: { ...error.error, retryable: true } }).success).toBe(false);
    expect(ApiErrorSchema.safeParse({ ...error, error: { ...error.error, code: 'NEW_SUCCESS' } }).success).toBe(false);
    expect(ApiErrorSchema.safeParse({ ...error, error: { ...error.error, details: { sql: 'private diagnostic' } } }).success).toBe(false);
  });
});

const invalidResponses: { name: string; change: (r: RouteResponse) => unknown }[] = [
  { name: 'synthetic field navigation', change: (r) => { r.navigationEligibility = 'foreground_experimental'; return r; } },
  { name: 'empty routes', change: (r) => { r.routes = []; return r; } },
  { name: 'missing recommendation', change: (r) => { r.recommendation.routeId = 'missing'; return r; } },
  { name: 'unknown version', change: (r) => ({ ...r, schemaVersion: '999' }) },
  { name: 'unknown top level field', change: (r) => ({ ...r, safe: true }) },
  { name: 'unknown instruction', change: (r) => { const { route } = first(r); return { ...r, routes: [{ ...route, steps: [{ ...route.steps[0], instructionKey: 'route.cross_now' }] }] }; } },
  { name: 'missing evidence reference', change: (r) => { first(r).event.facts.audible_signal.evidenceIds = ['not-found']; return r; } },
  { name: 'duplicate evidence', change: (r) => { r.evidenceCatalog.push(first(r).evidence); return r; } },
  { name: 'missing source', change: (r) => { first(r).evidence.sourceId = 'not-found'; return r; } },
  { name: 'evidence for another object', change: (r) => { first(r).evidence.objectId = 'another-object'; return r; } },
  { name: 'known true backed by false', change: (r) => { first(r).evidence.value = false; return r; } },
  { name: 'known without evidence', change: (r) => { first(r).event.facts.audible_signal.evidenceIds = []; return r; } },
  { name: 'conflict without distinct observations', change: (r) => { const { event, evidence } = first(r); r.evidenceCatalog.push({ ...evidence, id: 'duplicate-observation' }); event.facts.audible_signal = { state: 'conflicting', summaryCode: 'DISAGREEING_OBSERVATIONS', evidenceIds: [evidence.id, 'duplicate-observation'] }; return r; } },
  { name: 'field verification without date', change: (r) => { first(r).evidence.verificationStatus = 'field_verified'; return r; } },
  { name: 'recent freshness based on import alone', change: (r) => { const fact = first(r).event.facts.audible_signal; if (fact.state === 'known') fact.freshness = 'recent'; return r; } },
  { name: 'fabricated observation date', change: (r) => { const fact = first(r).event.facts.audible_signal; if (fact.state === 'known') fact.observedAt = r.asOf; return r; } },
  { name: 'future observation', change: (r) => { first(r).evidence.observedAt = '2099-01-01T00:00:00Z'; return r; } },
  { name: 'non UTC date', change: (r) => ({ ...r, asOf: '2026-10-03T12:00:00+02:00' }) },
  { name: 'impossible calendar date', change: (r) => ({ ...r, asOf: '2026-02-30T10:00:00Z' }) },
  { name: 'policy version mismatch', change: (r) => { r.policy.policyVersion = 'other-policy'; return r; } },
  { name: 'pilot without geometry', change: (r) => { r.mode = 'pilot'; r.sourceCatalog = r.sourceCatalog.map((s) => ({ ...s, kind: 'osm', sourceUrl: 'https://www.openstreetmap.org' })); return r; } },
  { name: 'synthetic real source', change: (r) => { r.sourceCatalog = r.sourceCatalog.map((s) => ({ ...s, kind: 'osm', sourceUrl: 'https://www.openstreetmap.org' })); return r; } },
  { name: 'negative distance', change: (r) => { first(r).route.metrics.distanceM = -1; return r; } },
  { name: 'infinite distance', change: (r) => { first(r).route.metrics.distanceM = Infinity; return r; } },
  { name: 'wrong detour baseline', change: (r) => { first(r).route.metrics.extraDistanceM = 1; return r; } },
  { name: 'crossing count mismatch', change: (r) => { first(r).route.metrics.crossingCount = 1; return r; } },
  { name: 'audible count mismatch', change: (r) => { first(r).route.metrics.audibleSignals.unknown = 0; return r; } },
  { name: 'out of bounds event', change: (r) => { first(r).event.offsetM = 10000; return r; } },
  { name: 'reversed event order', change: (r) => { first(r).route.events.reverse(); return r; } },
  { name: 'duplicate event IDs', change: (r) => { const { route, event } = first(r); route.events.push(event); return r; } },
  { name: 'duplicate routes', change: (r) => { r.routes = [first(r).route, first(r).route]; return r; } },
  { name: 'unknown length larger than route', change: (r) => { first(r).route.metrics.unknownSegmentLengthM = 10000; return r; } },
  { name: 'gap in text plan', change: (r) => { const step = first(r).route.steps[1]; if (step) step.startM = 10; return r; } },
  { name: 'missing arrival', change: (r) => { first(r).route.steps.pop(); return r; } },
  { name: 'budget without warning', change: (r) => { r.calculation.status = 'budget_limited'; return r; } },
  { name: 'synthetic without warning', change: (r) => { r.warnings = r.warnings.filter((w) => w.code !== 'SYNTHETIC_DATA'); return r; } },
  { name: 'unknown fact without warning', change: (r) => { r.warnings = r.warnings.filter((w) => w.code !== 'MISSING_FEATURE_DATA'); return r; } },
  { name: 'unsupported recommendation reason', change: (r) => { r.recommendation.reasons = [{ code: 'DETOUR_FOR_PREFERENCES', params: { extraDistanceM: 1 }, evidenceIds: [] }]; return r; } },
];
describe('response safety and consistency invariants', () => {
  it.each(['same-value', 'same-record', 'different-scope'] as const)('rejects a conflict with %s even when counts and references are consistent', (kind) => {
    const scenario = routeScenarios.find((s) => s.id === 'conflicting'); if (!scenario) throw new Error('Missing conflict');
    const response = structuredClone(scenario.response);
    expect(RouteResponseSchema.safeParse(response).success).toBe(true);
    const counter = response.evidenceCatalog.find((e) => e.id === 'conflict-counterexample'); if (!counter) throw new Error('Missing counterexample');
    if (kind === 'same-value') counter.value = true;
    if (kind === 'same-record') counter.sourceRecordId = first(response).evidence.sourceRecordId;
    if (kind === 'different-scope') counter.scope.direction = 'backward';
    expect(RouteResponseSchema.safeParse(response).success).toBe(false);
  });
  it('rejects an unsupported comparison label', () => {
    const response = createRouteResponse();
    first(response).route.labels.push('better_documented');
    expect(RouteResponseSchema.safeParse(response).success).toBe(false);
  });
  it.each(invalidResponses)('rejects $name', ({ change }) => {
    expect(RouteResponseSchema.safeParse(change(createRouteResponse())).success).toBe(false);
  });
  it('does not refresh observation or verification on reimport', () => {
    const stale = routeScenarios.find((s) => s.id === 'stale-tactile'); if (!stale) throw new Error('Missing stale fixture');
    const response = structuredClone(stale.response); const before = structuredClone(first(response).event.facts.audible_signal);
    response.evidenceCatalog = response.evidenceCatalog.map((e) => ({ ...e, fetchedAt: '2026-10-03T10:01:00Z' }));
    response.generatedAt = '2026-10-03T10:02:00Z';
    const parsed = RouteResponseSchema.parse(response);
    expect(first(parsed).event.facts.audible_signal).toEqual(before);
    const fact = first(response).event.facts.audible_signal;
    if (fact.state === 'known') fact.freshness = 'recent';
    expect(RouteResponseSchema.safeParse(response).success).toBe(false);
  });
});

describe('catalog boundaries', () => {
  it.each(['', 'ab', 'a'.repeat(100)])('accepts query length %s', (query) => expect(PlacesQuerySchema.safeParse({ cityId: 'demo', query }).success).toBe(true));
  it.each(['a', 'a'.repeat(101)])('rejects unsupported query length %s', (query) => expect(PlacesQuerySchema.safeParse({ cityId: 'demo', query }).success).toBe(false));
  it('rejects another city, duplicate IDs and real synthetic coordinates', () => {
    const place = placesResponse.places[0]; if (!place) throw new Error('Missing place');
    expect(PlacesResponseSchema.safeParse({ ...placesResponse, places: [{ ...place, cityId: 'other' }] }).success).toBe(false);
    expect(PlacesResponseSchema.safeParse({ ...placesResponse, places: [place, place] }).success).toBe(false);
    expect(PlacesResponseSchema.safeParse({ ...placesResponse, places: [{ ...place, coordinate: [19, 50] }] }).success).toBe(false);
  });
  it('rejects synthetic field capabilities and pilot without a polygon', () => {
    expect(CoverageResponseSchema.safeParse({ ...coverageResponse, capabilities: ['foreground_navigation'] }).success).toBe(false);
    expect(CoverageResponseSchema.safeParse({ ...coverageResponse, mode: 'pilot' }).success).toBe(false);
  });
  it('rejects evidence for a different object and missing catalog source', () => {
    expect(FeatureEvidenceResponseSchema.safeParse({ ...featureEvidenceResponse, objectId: 'different' }).success).toBe(false);
    expect(FeatureEvidenceResponseSchema.safeParse({ ...featureEvidenceResponse, sources: [] }).success).toBe(false);
  });
  it('does not label an incomplete service ready', () => {
    expect(ReadyResponseSchema.safeParse({ schemaVersion: SCHEMA_VERSION, requestId: 'test', status: 'ready', checkedAt: '2026-10-03T10:00:00Z', checks: { database: true, graph: false, contract: true } }).success).toBe(false);
  });
});

describe('generated contract artifacts', () => {
  it('exports every public schema without lossy unrepresentable fallback', () => {
    for (const schema of Object.values(publicSchemas)) expect(() => z.toJSONSchema(schema, { unrepresentable: 'throw' })).not.toThrow();
    const document = createOpenApiDocument();
    expect(document.openapi).toBe('3.1.0');
    expect(document.info.version).toBe(SCHEMA_VERSION);
    expect(Object.keys(document.paths)).toHaveLength(9);
    expect(document.paths['/v1/place-search'].get.operationId).toBe('placeSearch');
  });
  it('validates all generated JSON examples against the same schemas', async () => {
    const base = new URL('../../../examples/', import.meta.url);
    const files = (await readdir(base)).filter((file) => file.endsWith('.json')).sort();
    expect(files).toEqual(fixtureDocuments.map((f) => f.file).sort());
    for (const fixture of fixtureDocuments) {
      const value: unknown = JSON.parse(await readFile(new URL(fixture.file, base), 'utf8'));
      expect(fixture.schema.parse(value)).toEqual(fixture.value);
    }
  });
  it('keeps the mobile import graph free of Node builtins', async () => {
    const visited = new Set<string>();
    async function inspect(path: URL): Promise<void> {
      if (visited.has(path.href)) return;
      visited.add(path.href);
      const content = await readFile(path, 'utf8');
      for (const match of content.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)) {
        const specifier = match[1]; if (!specifier) continue;
        expect(specifier === 'zod' || specifier.startsWith('.')).toBe(true);
        if (specifier.startsWith('.')) await inspect(new URL(`${specifier}.ts`, path));
      }
    }
    await inspect(new URL('../src/index.ts', import.meta.url));
    await inspect(new URL('../src/fixtures.ts', import.meta.url));
  });
});
