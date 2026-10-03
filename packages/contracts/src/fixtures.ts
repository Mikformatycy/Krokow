import type { z } from 'zod';
import { SCHEMA_VERSION, RouteRequestSchema } from './common';
import type { RouteRequest } from './common';
import { RouteResponseSchema } from './routes';
import type { RouteOption, RouteResponse } from './routes';
import type { BooleanFact, Evidence, PublicSource, TactileFact } from './evidence';
import { ApiErrorSchema } from './errors';
import type { ApiError } from './errors';
import { CoverageResponseSchema, FeatureEvidenceResponseSchema, HealthResponseSchema, PlacesResponseSchema, ReadyResponseSchema, SourcesResponseSchema } from './catalog';
import type { Warning } from './messages';

// These are authored DTO examples, not outputs of an implemented route planner.
const now = '2026-10-03T10:00:00Z';
const envelope = { schemaVersion: SCHEMA_VERSION, requestId: 'synthetic-example' } as const;
const policy = { policyVersion: 'synthetic-acoustic-v1', fieldVerificationMaxAgeDays: 180 };
const versions = { graphVersion: 'synthetic-graph-v1', evidenceVersion: 'synthetic-evidence-v1', policyVersion: policy.policyVersion };
const source: PublicSource = {
  id: 'synthetic-source', kind: 'synthetic', name: 'Fikcyjne dane demonstracyjne', sourceUrl: null,
  attribution: 'Kroków — fikcyjne przykłady', license: 'CC0-1.0', lastFetchedAt: now, status: 'ok',
};
export const routeRequest: RouteRequest = {
  cityId: 'synthetic-city', origin: { kind: 'place', placeId: 'demo-start' }, destination: { kind: 'place', placeId: 'demo-end' },
  preferences: { preferAudibleSignals: true, preferTactilePaving: false, preferSeparatedFootways: false, avoidKnownSteps: false, audibleRequirement: 'none', maxDetourRatio: 1.6 },
  maxAlternatives: 3, locale: 'pl-PL',
};
const syntheticWarning: Warning = { code: 'SYNTHETIC_DATA', severity: 'warning', messageKey: 'warning.synthetic_data', params: {}, evidenceIds: [] };

function buildResponse(): RouteResponse {
  const evidenceCatalog: Evidence[] = [];
  const warnings: Warning[] = [syntheticWarning];
  function observation(id: string, objectId: string, value: boolean): Evidence {
    return { id, sourceId: source.id, sourceRecordId: id, objectId, featureKey: 'audible_signal', value,
      fetchedAt: now, sourceModifiedAt: null, observedAt: null, verifiedAt: null, validUntil: null,
      verificationStatus: 'source_declared', scope: { side: null, direction: 'forward', level: 0 },
      note: 'Fikcyjny dowód; nie opisuje prawdziwego miejsca.',
    };
  }
  const routes: RouteOption[] = ([
    { id: 'A', distance: 740, values: [true, false, null], labels: ['shortest'] },
    { id: 'B', distance: 980, values: [true, true, true], labels: ['recommended', 'better_documented'] },
    { id: 'C', distance: 1120, values: [true], labels: ['fewer_crossings'] },
  ] as const).map((spec) => {
    const events = spec.values.map((value, i) => {
      const objectId = `${spec.id}-object-${i}`;
      let audible: BooleanFact;
      if (value === null) {
        audible = { state: 'unknown', reason: 'missing', evidenceIds: [] };
        warnings.push({ code: 'MISSING_FEATURE_DATA', severity: 'warning', messageKey: 'warning.missing_feature_data', params: { objectId, featureKey: 'audible_signal' }, evidenceIds: [] });
      } else {
        const evidence = observation(`${objectId}-audible`, objectId, value);
        evidenceCatalog.push(evidence);
        audible = { state: 'known', value, evidenceIds: [evidence.id], reliability: 'source_declared', freshness: 'unknown', observedAt: null, verifiedAt: null };
      }
      const tactile: TactileFact = { state: 'unknown', reason: 'missing', evidenceIds: [] };
      warnings.push({ code: 'MISSING_FEATURE_DATA', severity: 'warning', messageKey: 'warning.missing_feature_data', params: { objectId, featureKey: 'tactile_paving' }, evidenceIds: [] });
      return { id: `${objectId}-event`, kind: 'crossing' as const, offsetM: (i + 1) * 100,
        objectId, crossingId: `${spec.id}-crossing-${i}`, stageId: `${spec.id}-stage-${i}`,
        instructionKey: 'route.crossing_approach' as const, facts: { audible_signal: audible, tactile_paving: tactile } };
    });
    return {
      id: spec.id, labels: [...spec.labels], geometry: null, edgeIds: [`${spec.id}-start`, `${spec.id}-end`],
      metrics: { distanceM: spec.distance, walkingDurationSec: spec.distance / 1.2, assumedWalkingSpeedMps: 1.2,
        crossingWaitDurationSec: null, extraDistanceM: spec.distance - 740, crossingCount: events.length, crossingStageCount: events.length,
        audibleSignals: { present: spec.values.filter((v) => v === true).length, absent: spec.values.filter((v) => v === false).length, unknown: spec.values.filter((v) => v === null).length, conflicting: 0 }, unknownSegmentLengthM: null },
      steps: [
        { id: `${spec.id}-start-step`, startM: 0, endM: 0, instructionKey: 'route.start', params: { placeName: 'Fikcyjny start' } },
        { id: `${spec.id}-segment`, startM: 0, endM: spec.distance, instructionKey: 'route.follow_segment', params: { segmentName: `Fikcyjny odcinek ${spec.id}` } },
        { id: `${spec.id}-arrive`, startM: spec.distance, endM: spec.distance, instructionKey: 'route.arrive', params: { placeName: 'Fikcyjny cel' } },
      ], events,
    };
  });
  return { ...envelope, generatedAt: now, asOf: now, mode: 'synthetic', navigationEligibility: 'preview_only',
    dataContext: { cityId: 'synthetic-city', ...versions, snapshotFetchedAt: now, sourceStatus: 'ok', sourceIds: [source.id] }, policy,
    calculation: { status: 'finished', exhaustive: false }, baseline: { distanceM: 740, walkingDurationSec: 740 / 1.2, basis: 'same_hard_constraints' }, routes,
    recommendation: { routeId: 'B', reasons: [
      { code: 'MORE_DOCUMENTED_AUDIBLE_SIGNALS', params: { routePresentCount: 3, baselinePresentCount: 1 }, evidenceIds: ['B-object-0-audible', 'B-object-1-audible', 'B-object-2-audible'] },
      { code: 'DETOUR_FOR_PREFERENCES', params: { extraDistanceM: 240 }, evidenceIds: [] },
    ] }, evidenceCatalog, sourceCatalog: [source], warnings };
}

// Zod returns an independent deep copy, also on mobile without structuredClone.
export function createRouteResponse(): RouteResponse { return RouteResponseSchema.parse(buildResponse()); }
const response = buildResponse();
const single = buildResponse();
single.routes = single.routes.filter((r) => r.id === 'B');
// Catalogs may retain referenced comparison evidence for a hidden baseline.
const limited = buildResponse();
limited.calculation.status = 'budget_limited';
limited.warnings.push({ code: 'SEARCH_BUDGET_LIMITED', severity: 'warning', messageKey: 'warning.search_budget_limited', params: {}, evidenceIds: [] });
const degraded = buildResponse();
degraded.dataContext.sourceStatus = 'degraded';
degraded.sourceCatalog = [{ ...source, status: 'degraded' }];
degraded.warnings.push({ code: 'SOURCE_DEGRADED', severity: 'warning', messageKey: 'warning.source_degraded', params: { sourceIds: [source.id] }, evidenceIds: [] });
const conflict = buildResponse();
const firstRoute = conflict.routes[0];
const firstEvent = firstRoute?.events[0];
const firstEvidence = conflict.evidenceCatalog[0];
if (!firstRoute || !firstEvent || !firstEvidence) throw new Error('Incomplete authored fixture');
conflict.evidenceCatalog.push({ ...firstEvidence, featureKey: 'audible_signal', id: 'conflict-counterexample', sourceRecordId: 'conflict-counterexample', value: false });
firstEvent.facts.audible_signal = { state: 'conflicting', summaryCode: 'DISAGREEING_OBSERVATIONS', evidenceIds: [firstEvidence.id, 'conflict-counterexample'] };
firstRoute.metrics.audibleSignals.present--; firstRoute.metrics.audibleSignals.conflicting++;
conflict.recommendation.reasons = [{ code: 'DETOUR_FOR_PREFERENCES', params: { extraDistanceM: 240 }, evidenceIds: [] }];
conflict.warnings.push({ code: 'CONFLICTING_FEATURE_DATA', severity: 'warning', messageKey: 'warning.conflicting_feature_data', params: { objectId: firstEvent.objectId, featureKey: 'audible_signal' }, evidenceIds: [firstEvidence.id, 'conflict-counterexample'] });
const stale = buildResponse();
const staleEvent = stale.routes[0]?.events[0]; const staleEvidence = stale.evidenceCatalog[0];
if (!staleEvent || !staleEvidence || staleEvent.facts.audible_signal.state !== 'known') throw new Error('Incomplete authored stale fixture');
staleEvidence.observedAt = '2025-01-01T10:00:00Z'; staleEvidence.verifiedAt = '2025-01-01T10:00:00Z'; staleEvidence.verificationStatus = 'field_verified';
staleEvidence.note = 'Symulowana historyczna weryfikacja wyłącznie do testu polityki.';
Object.assign(staleEvent.facts.audible_signal, { reliability: 'field_verified', freshness: 'stale', observedAt: staleEvidence.observedAt, verifiedAt: staleEvidence.verifiedAt });
for (const [i, value] of (['partial', 'incorrect'] as const).entries()) {
  const event = stale.routes[0]?.events[i]; if (!event) throw new Error('Missing tactile fixture event');
  const id = `tactile-${value}`;
  stale.evidenceCatalog.push({ ...staleEvidence, id, sourceRecordId: id, objectId: event.objectId, featureKey: 'tactile_paving', value,
    observedAt: null, verifiedAt: null, verificationStatus: 'source_declared', note: 'Fikcyjne oznaczenia dotykowe.' });
  event.facts.tactile_paving = { state: 'known', value, evidenceIds: [id], reliability: 'source_declared', freshness: 'unknown', observedAt: null, verifiedAt: null };
}
stale.warnings = stale.warnings.filter((w) => !(w.code === 'MISSING_FEATURE_DATA' && w.params.featureKey === 'tactile_paving' && ['A-object-0', 'A-object-1'].includes(w.params.objectId)));
const noCrossings = buildResponse();
const noCrossingsRoute = noCrossings.routes[0]; if (!noCrossingsRoute) throw new Error('Missing route');
noCrossingsRoute.id = 'no-crossings'; noCrossingsRoute.labels = ['shortest', 'recommended']; noCrossingsRoute.events = [];
noCrossingsRoute.metrics.crossingCount = 0; noCrossingsRoute.metrics.crossingStageCount = 0;
noCrossingsRoute.metrics.audibleSignals = { present: 0, absent: 0, unknown: 0, conflicting: 0 };
noCrossings.routes = [noCrossingsRoute]; noCrossings.evidenceCatalog = []; noCrossings.warnings = [syntheticWarning];
noCrossings.recommendation = { routeId: noCrossingsRoute.id, reasons: [{ code: 'SHORTER_DISTANCE', params: { distanceM: 740 }, evidenceIds: [] }] };

export const routeScenarios: { id: string; request: RouteRequest; response: RouteResponse }[] = [
  { id: 'abc', request: routeRequest, response },
  { id: 'single', request: { ...routeRequest, maxAlternatives: 1 }, response: single },
  { id: 'budget-limited', request: routeRequest, response: limited },
  { id: 'source-degraded', request: routeRequest, response: degraded },
  { id: 'conflicting', request: routeRequest, response: conflict },
  { id: 'stale-tactile', request: routeRequest, response: stale },
  { id: 'zero-crossings', request: routeRequest, response: noCrossings },
].map((scenario) => ({
  ...scenario,
  request: RouteRequestSchema.parse(scenario.request),
  response: RouteResponseSchema.parse(scenario.response),
}));
const errorBodies: ApiError['error'][] = [
  { code: 'VALIDATION_ERROR', messageKey: 'error.validation_error', retryable: false, details: { fields: [{ path: ['maxAlternatives'], code: 'out_of_range' }] } },
  { code: 'SAME_ENDPOINT', messageKey: 'error.same_endpoint', retryable: false, details: {} },
  { code: 'OUTSIDE_COVERAGE', messageKey: 'error.outside_coverage', retryable: false, details: { cityId: 'synthetic-city', endpoint: 'origin' } },
  { code: 'UNRESOLVED_ENDPOINT', messageKey: 'error.unresolved_endpoint', retryable: false, details: { endpoint: 'origin' } },
  { code: 'NO_PATH', messageKey: 'error.no_path', retryable: false, details: { cityId: 'synthetic-city' } },
  { code: 'NO_MATCHING_ROUTE', messageKey: 'error.no_matching_route', retryable: false, details: { blockingRequirements: ['audibleRequirement'] } },
  { code: 'DATA_VERSION_CHANGED', messageKey: 'error.data_version_changed', retryable: false, details: { requested: { ...versions, graphVersion: 'synthetic-graph-retired' }, available: versions } },
  { code: 'FEATURE_NOT_ENABLED', messageKey: 'error.feature_not_enabled', retryable: false, details: { capability: 'coordinate_endpoints' } },
  { code: 'SOURCE_UNAVAILABLE', messageKey: 'error.source_unavailable', retryable: true, details: { cityId: 'synthetic-city' } },
  { code: 'SEARCH_LIMIT_REACHED', messageKey: 'error.search_limit_reached', retryable: true, details: {} },
  { code: 'RATE_LIMITED', messageKey: 'error.rate_limited', retryable: true, details: { retryAfterSec: 30 } },
  { code: 'INTERNAL_ERROR', messageKey: 'error.internal_error', retryable: true, details: {} },
];
export const errorScenarios = errorBodies.map((error) => {
  let request: unknown = routeRequest;
  if (error.code === 'VALIDATION_ERROR') request = { ...routeRequest, maxAlternatives: 4 };
  if (error.code === 'SAME_ENDPOINT') request = { ...routeRequest, destination: routeRequest.origin };
  if (error.code === 'NO_MATCHING_ROUTE') request = { ...routeRequest, preferences: { ...routeRequest.preferences, audibleRequirement: 'field_verified_recent' } };
  if (error.code === 'DATA_VERSION_CHANGED') request = { ...routeRequest, expectedVersions: error.details.requested };
  if (error.code === 'FEATURE_NOT_ENABLED') request = { ...routeRequest, origin: { kind: 'coordinate', latitude: 0, longitude: 0 } };
  return { id: error.code, request, response: { ...envelope, error } satisfies ApiError };
});
export const coverageResponse = {
  ...envelope, cityId: 'synthetic-city', name: 'Fikcyjny obszar demonstracyjny', description: 'Fikcyjne punkty i trasy; tylko podgląd. Brak rzeczywistego obszaru terenowego.',
  mode: 'synthetic', navigationEligibility: 'preview_only', capabilities: ['catalog_routes'], polygon: null, policy,
} satisfies z.infer<typeof CoverageResponseSchema>;
export const placesResponse = {
  ...envelope, cityId: 'synthetic-city', mode: 'synthetic', navigationEligibility: 'preview_only',
  places: [{ id: 'demo-start', cityId: 'synthetic-city', name: 'Fikcyjny start', description: 'Punkt A demonstracji', coordinate: null },
    { id: 'demo-end', cityId: 'synthetic-city', name: 'Fikcyjny cel', description: 'Punkt B demonstracji', coordinate: null }],
} satisfies z.infer<typeof PlacesResponseSchema>;
export const emptyPlacesResponse = { ...placesResponse, places: [] };
export const sourcesResponse = { ...envelope, mode: 'synthetic' as const, sources: [source] };
export const featureEvidenceResponse = { ...envelope, mode: 'synthetic' as const, objectId: 'A-object-0', evidenceVersion: versions.evidenceVersion, evidence: response.evidenceCatalog.filter((e) => e.objectId === 'A-object-0'), sources: [source] };

/** The same list drives JSON generation and contract validation; never copy DTOs into mobile. */
export const fixtureDocuments: { file: string; schema: z.ZodType; value: unknown }[] = [
  { file: 'route-request.json', schema: RouteRequestSchema, value: routeRequest },
  ...routeScenarios.map((s) => ({ file: s.id === 'abc' ? 'route-response.json' : `route-${s.id}.json`, schema: RouteResponseSchema, value: s.response })),
  ...errorScenarios.map((s) => ({ file: s.id === 'NO_MATCHING_ROUTE' ? 'route-unavailable.json' : `error-${s.id.toLowerCase()}.json`, schema: ApiErrorSchema, value: s.response })),
  { file: 'coverage.json', schema: CoverageResponseSchema, value: coverageResponse },
  { file: 'places.json', schema: PlacesResponseSchema, value: placesResponse },
  { file: 'places-empty.json', schema: PlacesResponseSchema, value: emptyPlacesResponse },
  { file: 'sources.json', schema: SourcesResponseSchema, value: sourcesResponse },
  { file: 'feature-evidence.json', schema: FeatureEvidenceResponseSchema, value: featureEvidenceResponse },
  { file: 'health.json', schema: HealthResponseSchema, value: { status: 'ok' } },
  { file: 'ready.json', schema: ReadyResponseSchema, value: { ...envelope, status: 'ready', checkedAt: now, checks: { database: true, graph: true, contract: true } } },
  { file: 'not-ready.json', schema: ReadyResponseSchema, value: { ...envelope, status: 'not_ready', checkedAt: now, checks: { database: true, graph: false, contract: true } } },
];
