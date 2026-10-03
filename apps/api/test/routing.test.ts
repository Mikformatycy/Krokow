import { afterEach, describe, expect, it } from 'vitest';
import { ApiErrorSchema, FeatureEvidenceResponseSchema, ReadyResponseSchema, RouteResponseSchema } from '@krok/contracts';
import { routeRequest } from '@krok/contracts/fixtures';
import { SYNTHETIC_POLICY } from '@krok/routing';
import { createSyntheticSnapshot } from '@krok/routing/synthetic';
import { buildApi } from '../src/app';
import { createSyntheticServices } from '../src/routing';

const apps: ReturnType<typeof buildApi>[] = [];
const api = (services = createSyntheticServices()) => {
  const app = buildApi({ ...services, databaseReady: () => Promise.resolve(false), clock: () => new Date('2026-10-03T11:00:00Z'), logging: false });
  apps.push(app); return app;
};
afterEach(async () => { await Promise.all(apps.splice(0).map((app) => app.close())); });
const post = (app: ReturnType<typeof api>, payload: unknown = routeRequest) => app.inject({ method: 'POST', url: '/v1/routes', payload: JSON.stringify(payload), headers: { 'content-type': 'application/json' } });

describe('real routing over HTTP', () => {
  it('computes synthetic routes and serves the same versioned evidence catalog', async () => {
    const app = api(); const response = await post(app);
    expect(response.statusCode).toBe(200);
    const data = RouteResponseSchema.parse(response.json());
    expect(data.routes.map((r) => r.metrics.distanceM)).toEqual([740, 980, 1120]);
    expect(data.routes.find((r) => r.id === data.recommendation.routeId)!.metrics.distanceM).toBe(980);
    expect(data.dataContext.graphVersion).toBe('synthetic-graph-v2');
    expect(data.navigationEligibility).toBe('preview_only');
    const evidence = FeatureEvidenceResponseSchema.parse((await app.inject('/v1/features/B-crossing-object-0/evidence')).json());
    expect(evidence.evidenceVersion).toBe(data.dataContext.evidenceVersion);
    expect(evidence.evidence).toEqual(data.evidenceCatalog.filter((e) => e.objectId === evidence.objectId));
    const second = await post(app, { ...routeRequest, preferences: { ...routeRequest.preferences, preferAudibleSignals: false } });
    const changed = RouteResponseSchema.parse(second.json());
    expect(changed.routes.find((r) => r.id === changed.recommendation.routeId)!.metrics.distanceM).toBe(740);
  });
  it('does not claim database readiness from a working in-memory graph', async () => {
    const response = await api().inject('/readyz');
    expect(response.statusCode).toBe(503);
    expect(ReadyResponseSchema.parse(response.json()).checks).toEqual({ database: false, graph: true, contract: true });
  });
  it('maps hard constraints to the existing public error', async () => {
    const response = await post(api(), { ...routeRequest, preferences: { ...routeRequest.preferences, audibleRequirement: 'field_verified_recent' } });
    expect(response.statusCode).toBe(422);
    expect(ApiErrorSchema.parse(response.json()).error).toMatchObject({ code: 'NO_MATCHING_ROUTE', details: { blockingRequirements: ['audibleRequirement'] } });
  });
  it('maps graph disconnection and budget exhaustion separately', async () => {
    const snapshot = createSyntheticSnapshot(); snapshot.graph.edges = [];
    const disconnected = await post(api(createSyntheticServices(snapshot)));
    expect(disconnected.statusCode).toBe(422); expect(ApiErrorSchema.parse(disconnected.json()).error.code).toBe('NO_PATH');
    const limited = await post(api(createSyntheticServices(createSyntheticSnapshot(), { ...SYNTHETIC_POLICY, maxOperations: 1 })));
    expect(limited.statusCode).toBe(504); expect(ApiErrorSchema.parse(limited.json()).error.code).toBe('SEARCH_LIMIT_REACHED');
  });
  it('rejects the old fixture snapshot version instead of silently mixing evidence', async () => {
    const response = await post(api(), { ...routeRequest, expectedVersions: { graphVersion: 'synthetic-graph-v1', evidenceVersion: 'synthetic-evidence-v1', policyVersion: 'synthetic-acoustic-v1' } });
    expect(response.statusCode).toBe(409);
    expect(ApiErrorSchema.parse(response.json()).error).toMatchObject({ code: 'DATA_VERSION_CHANGED', details: { available: { graphVersion: 'synthetic-graph-v2', evidenceVersion: 'synthetic-evidence-v2' } } });
  });
  it('serves a constrained baseline and single option accepted by the API validator', async () => {
    const response = await post(api(), { ...routeRequest, maxAlternatives: 1, preferences: { ...routeRequest.preferences, audibleRequirement: 'documented' } });
    expect(response.statusCode).toBe(200);
    const data = RouteResponseSchema.parse(response.json()); expect(data.baseline.distanceM).toBe(980); expect(data.routes).toHaveLength(1);
  });
});
