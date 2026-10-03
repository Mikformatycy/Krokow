import { Writable } from 'node:stream';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ApiErrorSchema, CoverageResponseSchema, ERROR_HTTP_STATUS, FeatureEvidenceResponseSchema,
  PlacesResponseSchema, ReadyResponseSchema, RouteResponseSchema, SourcesResponseSchema,
} from '@krok/contracts';
import { createRouteResponse, errorScenarios, routeRequest } from '@krok/contracts/fixtures';
import { buildApi } from '../src/app';
import type { ApiDependencies } from '../src/app';
import { syntheticCatalog } from '../src/dataset';
import { PublicError } from '../src/errors';
import type { RoutePlanner } from '../src/planner';

const now = new Date('2026-10-03T11:00:00Z');
const apps: ReturnType<typeof buildApi>[] = [];
function api(overrides: Partial<ApiDependencies> = {}) {
  const app = buildApi({ dataset: syntheticCatalog(), databaseReady: () => Promise.resolve(true), clock: () => now, logging: false, ...overrides });
  apps.push(app);
  return app;
}
afterEach(async () => { await Promise.all(apps.splice(0).map((app) => app.close())); });

// Test double only: the runnable API never imports this or returns stored route successes.
function testPlanner(change?: (response: ReturnType<typeof createRouteResponse>) => unknown): RoutePlanner {
  return {
    isReady: () => true,
    plan: (_request, context) => {
      const response = createRouteResponse();
      response.requestId = context.requestId; response.asOf = context.asOf; response.generatedAt = context.asOf;
      return Promise.resolve(change ? change(response) : response);
    },
  };
}
const post = (app: ReturnType<typeof buildApi>, payload: unknown = routeRequest) =>
  app.inject({ method: 'POST', url: '/v1/routes', payload: JSON.stringify(payload), headers: { 'content-type': 'application/json' } });
function errorCode(body: string) { return ApiErrorSchema.parse(JSON.parse(body)).error.code; }

describe('catalog HTTP endpoints', () => {
  it('serves validated coverage with a server-generated request ID', async () => {
    const response = await api().inject({ url: '/v1/coverage', headers: { 'x-request-id': 'client-controlled-id' } });
    const data = CoverageResponseSchema.parse(response.json());
    expect(response.statusCode).toBe(200);
    expect(data.mode).toBe('synthetic'); expect(data.navigationEligibility).toBe('preview_only');
    expect(data.requestId).toBe(response.headers['x-request-id']);
    expect(data.requestId).not.toBe('client-controlled-id');
  });
  it.each([
    ['', 2], ['START', 1], ['fikcyjny', 2], ['nieistniejący', 0],
  ] as const)('searches catalog for %s without fabricated points', async (query, count) => {
    const response = await api().inject({ url: `/v1/places?cityId=synthetic-city&query=${encodeURIComponent(query)}` });
    expect(response.statusCode).toBe(200);
    const data = PlacesResponseSchema.parse(response.json());
    expect(data.places).toHaveLength(count);
    expect(data.places.every((p) => p.coordinate === null)).toBe(true);
  });
  it.each([
    'cityId=synthetic-city&query=a', 'cityId=synthetic-city', 'cityId=synthetic-city&query=ab&query=cd',
    'cityId=synthetic-city&query=&extra=private-value', `cityId=synthetic-city&query=${'a'.repeat(101)}`,
  ])('rejects invalid query %s', async (query) => {
    const response = await api().inject({ url: `/v1/places?${query}` });
    expect(response.statusCode).toBe(400); expect(errorCode(response.body)).toBe('VALIDATION_ERROR');
    expect(response.body).not.toContain('private-value');
  });
  it.each(['other-city', 'unconfigured'])('does not silently switch city %s to demo', async (cityId) => {
    const response = await api().inject({ url: `/v1/places?cityId=${cityId}&query=` });
    expect(response.statusCode).toBe(503); expect(errorCode(response.body)).toBe('SOURCE_UNAVAILABLE');
  });
  it('serves public source and evidence schemas, including an empty unknown object', async () => {
    const app = api();
    expect(SourcesResponseSchema.parse((await app.inject('/v1/sources')).json()).sources[0]?.kind).toBe('synthetic');
    const evidence = FeatureEvidenceResponseSchema.parse((await app.inject('/v1/features/A-object-0/evidence')).json());
    expect(evidence.evidence).toHaveLength(1);
    expect(evidence.evidence[0]?.observedAt).toBeNull();
    expect(FeatureEvidenceResponseSchema.parse((await app.inject('/v1/features/unknown/evidence')).json()).evidence).toEqual([]);
  });
  it('serves the generated OpenAPI version used by the schemas', async () => {
    const response = await api().inject('/openapi.json');
    expect(response.statusCode).toBe(200);
    const body: unknown = response.json();
    expect(body).toMatchObject({ openapi: '3.1.0', info: { version: '1.0.0-draft.2' } });
  });
});

describe('liveness and readiness', () => {
  it('keeps liveness independent of database and graph', async () => {
    const app = api({ databaseReady: () => Promise.resolve(false) });
    expect((await app.inject('/healthz')).json()).toEqual({ status: 'ok' });
    const response = await app.inject('/readyz');
    expect(response.statusCode).toBe(503);
    expect(ReadyResponseSchema.parse(response.json())).toMatchObject({ status: 'not_ready', checks: { database: false, graph: false, contract: true } });
  });
  it('does not claim a catalog is an active graph', async () => {
    const response = await api().inject('/readyz');
    expect(response.statusCode).toBe(503);
    expect(ReadyResponseSchema.parse(response.json()).checks).toEqual({ database: true, graph: false, contract: true });
  });
  it('requires all dependencies before returning 200', async () => {
    const response = await api({ planner: testPlanner() }).inject('/readyz');
    expect(response.statusCode).toBe(200);
    expect(ReadyResponseSchema.parse(response.json()).status).toBe('ready');
  });
  it('contains failed database probes and a hung probe', async () => {
    for (const databaseReady of [() => Promise.reject(new Error('private pg connection')), () => new Promise<boolean>(() => undefined)]) {
      const response = await api({ databaseReady, readinessTimeoutMs: 10 }).inject('/readyz');
      expect(response.statusCode).toBe(503); expect(response.body).not.toContain('private');
      expect(ReadyResponseSchema.parse(response.json()).checks.database).toBe(false);
    }
  });
  it('does not fall back to synthetic when no dataset is configured', async () => {
    const app = buildApi({ databaseReady: () => Promise.resolve(true), logging: false }); apps.push(app);
    for (const url of ['/v1/coverage', '/v1/sources', '/v1/places?cityId=synthetic-city&query=']) {
      const response = await app.inject(url);
      expect(response.statusCode).toBe(503); expect(errorCode(response.body)).toBe('SOURCE_UNAVAILABLE');
    }
  });
});

describe('route boundary before B-02', () => {
  it('returns SOURCE_UNAVAILABLE, never a stored success or NO_PATH, without a planner', async () => {
    const response = await post(api());
    expect(response.statusCode).toBe(503); expect(errorCode(response.body)).toBe('SOURCE_UNAVAILABLE');
    expect(response.headers['cache-control']).toBe('no-store');
  });
  it.each([91, -91, '50.062123', null])('rejects invalid latitude %s before dispatch', async (latitude) => {
    const response = await post(api(), { ...routeRequest, origin: { kind: 'coordinate', latitude, longitude: 19.937456 } });
    expect(response.statusCode).toBe(400); expect(errorCode(response.body)).toBe('VALIDATION_ERROR');
    expect(response.body).not.toContain('19.937456');
  });
  it('rejects an out-of-range longitude', async () => {
    const response = await post(api(), { ...routeRequest, origin: { kind: 'coordinate', latitude: 50, longitude: 181 } });
    expect(response.statusCode).toBe(400);
  });
  it('distinguishes valid but disabled coordinates from malformed input', async () => {
    const response = await post(api(), { ...routeRequest, origin: { kind: 'coordinate', latitude: 50, longitude: 19 } });
    expect(response.statusCode).toBe(422); expect(errorCode(response.body)).toBe('FEATURE_NOT_ENABLED');
  });
  it('rejects identical or unresolved endpoints', async () => {
    expect(errorCode((await post(api(), { ...routeRequest, destination: routeRequest.origin })).body)).toBe('SAME_ENDPOINT');
    const response = await post(api(), { ...routeRequest, destination: { kind: 'place', placeId: 'not-a-place' } });
    expect(errorCode(response.body)).toBe('UNRESOLVED_ENDPOINT');
  });
  it('reports unavailable requested versions without rewriting the request', async () => {
    const response = await post(api(), { ...routeRequest, expectedVersions: { ...syntheticCatalog().versions, graphVersion: 'retired' } });
    expect(response.statusCode).toBe(409); expect(errorCode(response.body)).toBe('DATA_VERSION_CHANGED');
  });
  it.each(['{broken "private-value"', '{"secret":"private-value",', '1e999'])('sanitizes malformed JSON %s', async (payload) => {
    const response = await api().inject({ method: 'POST', url: '/v1/routes', payload, headers: { 'content-type': 'application/json' } });
    expect(response.statusCode).toBe(400); expect(errorCode(response.body)).toBe('VALIDATION_ERROR');
    expect(response.body).not.toContain('private-value');
  });
  it('contains body size and media failures', async () => {
    const app = api();
    for (const request of [
      { payload: JSON.stringify({ private: 'x'.repeat(20_000) }), headers: { 'content-type': 'application/json' } },
      { payload: 'private xml', headers: { 'content-type': 'application/xml' } },
    ]) {
      const response = await app.inject({ method: 'POST', url: '/v1/routes', ...request });
      expect(response.statusCode).toBe(400); expect(errorCode(response.body)).toBe('VALIDATION_ERROR');
    }
  });
  it('rejects unknown fields and values without altering preferences', async () => {
    const plan = vi.fn(testPlanner().plan); const app = api({ planner: { isReady: () => true, plan } });
    const response = await post(app, { ...routeRequest, preferences: { ...routeRequest.preferences, preferAudibleSignals: 'true' } });
    expect(response.statusCode).toBe(400); expect(plan).not.toHaveBeenCalled();
  });
});

describe('injected planner integration and output validation', () => {
  it('sanitizes a malformed controlled error instead of serializing a Zod exception', async () => {
    const fixture = errorScenarios.find((s) => s.id === 'INTERNAL_ERROR'); if (!fixture) throw new Error('Missing error');
    const error = new PublicError(structuredClone(fixture.response.error));
    Object.assign(error.body, { details: { secret: 'private-password' } });
    const response = await post(api({ planner: { isReady: () => true, plan: () => Promise.reject(error) } }));
    expect(response.statusCode).toBe(500); expect(errorCode(response.body)).toBe('INTERNAL_ERROR');
    expect(response.body).not.toContain('private-password'); expect(response.body).not.toContain('unrecognized');
  });
  it('passes the validated request and server clock to the planner, then validates its response', async () => {
    const plan = vi.fn(testPlanner().plan);
    const response = await post(api({ planner: { isReady: () => true, plan } }));
    expect(response.statusCode).toBe(200);
    const parsed = RouteResponseSchema.parse(response.json());
    expect(plan).toHaveBeenCalledWith(routeRequest, { requestId: parsed.requestId, asOf: now.toISOString() });
    expect(parsed.asOf).toBe(now.toISOString()); expect(parsed.navigationEligibility).toBe('preview_only');
  });
  it.each(errorScenarios)('maps controlled $id to the documented status', async ({ response: fixture }) => {
    const planner: RoutePlanner = { isReady: () => true, plan: () => Promise.reject(new PublicError(fixture.error)) };
    const response = await post(api({ planner }));
    expect(response.statusCode).toBe(ERROR_HTTP_STATUS[fixture.error.code]);
    expect(errorCode(response.body)).toBe(fixture.error.code);
    if (fixture.error.code === 'RATE_LIMITED') expect(response.headers['retry-after']).toBe('30');
  });
  it.each([
    'synthetic-foreground', 'bad-metrics', 'wrong-city', 'wrong-version', 'wrong-request-id', 'wrong-clock',
  ])('fails closed on %s from the planner', async (kind) => {
    const planner = testPlanner((r) => {
      if (kind === 'synthetic-foreground') r.navigationEligibility = 'foreground_experimental';
      if (kind === 'bad-metrics') r.routes[0]!.metrics.crossingStageCount = 100;
      if (kind === 'wrong-city') r.dataContext.cityId = 'other';
      if (kind === 'wrong-version') r.dataContext.graphVersion = 'other';
      if (kind === 'wrong-request-id') r.requestId = 'other';
      if (kind === 'wrong-clock') r.asOf = '2026-10-03T10:00:00Z';
      return r;
    });
    const response = await post(api({ planner }));
    expect(response.statusCode).toBe(500); expect(errorCode(response.body)).toBe('INTERNAL_ERROR');
  });
  it.each([
    { ...routeRequest, maxAlternatives: 1 },
    { ...routeRequest, preferences: { ...routeRequest.preferences, maxDetourRatio: 1 } },
    { ...routeRequest, preferences: { ...routeRequest.preferences, audibleRequirement: 'documented' } },
    { ...routeRequest, preferences: { ...routeRequest.preferences, audibleRequirement: 'field_verified_recent' } },
  ])('rejects a valid DTO that violates the actual request', async (request) => {
    const response = await post(api({ planner: testPlanner() }), request);
    expect(response.statusCode).toBe(500);
  });
  it('does not relax hard preferences when the planner reports no match', async () => {
    const fixture = errorScenarios.find((s) => s.id === 'NO_MATCHING_ROUTE'); if (!fixture) throw new Error('Missing error');
    const plan = vi.fn(() => Promise.reject(new PublicError(fixture.response.error)));
    const response = await post(api({ planner: { isReady: () => true, plan } }), fixture.request);
    expect(errorCode(response.body)).toBe('NO_MATCHING_ROUTE'); expect(plan).toHaveBeenCalledTimes(1);
  });
});

describe('privacy and transport', () => {
  it('never logs coordinates, preferences, headers, query strings or internal errors', async () => {
    let logs = '';
    const stream = new Writable({ write(chunk: Buffer, _encoding, callback) { logs += chunk.toString(); callback(); } });
    const planner: RoutePlanner = { isReady: () => true, plan: () => Promise.reject(new Error('private-db-password 50.062123 preferAudibleSignals')) };
    const app = api({ logging: true, logStream: stream, planner });
    const response = await post(app);
    expect(response.statusCode).toBe(500); expect(response.body).not.toContain('private-db-password');
    await post(app, { ...routeRequest, origin: { kind: 'coordinate', latitude: 50.062123, longitude: 19.937456 } });
    await app.inject({ url: '/v1/places?cityId=synthetic-city&query=private-search', headers: { authorization: 'private-token', 'x-request-id': 'private-correlation', cookie: 'private-cookie' } });
    await app.inject('/private-path?query=private-query');
    for (const secret of ['50.062123', '19.937456', 'preferAudibleSignals', 'maxDetourRatio', 'private-db-password', 'private-search', 'private-token', 'private-correlation', 'private-cookie', 'private-path', 'private-query', 'demo-start']) expect(logs).not.toContain(secret);
    const entries: unknown[] = logs.trim().split('\n').map((line) => JSON.parse(line) as unknown);
    expect(entries).toHaveLength(4);
    expect(entries[0]).toMatchObject({ event: 'http_response', endpoint: '/v1/routes', method: 'POST', statusCode: 500 });
  });
  it('allows only configured web origins and supports preflight', async () => {
    const app = api({ allowedOrigins: ['http://localhost:8085'] });
    const response = await app.inject({ method: 'OPTIONS', url: '/v1/routes', headers: { origin: 'http://localhost:8085', 'access-control-request-method': 'POST', 'access-control-request-headers': 'content-type,ngrok-skip-browser-warning' } });
    expect(response.statusCode).toBe(204); expect(response.headers['access-control-allow-origin']).toBe('http://localhost:8085');
    expect(response.headers['access-control-allow-headers']).toContain('ngrok-skip-browser-warning');
    const denied = await app.inject({ url: '/v1/coverage', headers: { origin: 'https://untrusted.example' } });
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
  });
  it('serves actual loopback HTTP and closes the listener', async () => {
    const app = api();
    const address = await app.listen({ host: '127.0.0.1', port: 0 });
    const response = await fetch(`${address}/v1/coverage`);
    expect(response.status).toBe(200); expect(CoverageResponseSchema.parse(await response.json()).mode).toBe('synthetic');
    const ready = await fetch(`${address}/readyz`);
    expect(ready.status).toBe(503); await ready.arrayBuffer();
  });
});
