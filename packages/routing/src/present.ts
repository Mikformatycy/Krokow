import { RouteResponseSchema, SCHEMA_VERSION } from '@krok/contracts';
import type { RouteOption, RouteReason, RouteResponse, Warning } from '@krok/contracts';
import { booleanState } from './cost';
import type { SearchResult } from './engine';
import type { Path, Place, Policy, Snapshot } from './types';

function option(path: Path, id: string, baseline: Path, policy: Policy, origin: Place, destination: Place): RouteOption {
  const events: RouteOption['events'] = [];
  const steps: RouteOption['steps'] = [{ id: 'start', startM: 0, endM: 0, instructionKey: 'route.start', params: { placeName: origin.name } }];
  let distance = 0; let unknownLength = 0;
  for (const [index, edge] of path.edges.entries()) {
    events.push(...edge.events.map((event) => ({ ...event, offsetM: distance + event.offsetM })));
    steps.push({ id: `segment-${index}`, startM: distance, endM: distance + edge.lengthM, instructionKey: 'route.follow_segment', params: { segmentName: edge.name } });
    if (edge.steps.state !== 'known' || edge.separatedFootway.state !== 'known') unknownLength += edge.lengthM;
    distance += edge.lengthM;
  }
  steps.push({ id: 'arrive', startM: distance, endM: distance, instructionKey: 'route.arrive', params: { placeName: destination.name } });
  const audibleSignals = { present: 0, absent: 0, unknown: 0, conflicting: 0 };
  for (const event of events) audibleSignals[booleanState(event.facts.audible_signal)]++;
  const coordinates = path.edges.flatMap((edge, index) => index === 0 ? edge.geometry ?? [] : edge.geometry?.slice(1) ?? []);
  return { id, labels: [], geometry: coordinates.length >= 2 ? { type: 'LineString', coordinates } : null, edgeIds: path.edges.map((e) => e.id), steps, events,
    metrics: { distanceM: distance, walkingDurationSec: distance / policy.walkingSpeedMps, assumedWalkingSpeedMps: policy.walkingSpeedMps,
      crossingWaitDurationSec: null, extraDistanceM: Math.max(0, distance - baseline.distanceM),
      crossingCount: new Set(events.map((e) => e.crossingId)).size, crossingStageCount: events.length,
      audibleSignals, unknownSegmentLengthM: unknownLength } };
}
export function present(snapshot: Snapshot, policy: Policy, result: SearchResult, origin: Place, destination: Place, context: { requestId: string; asOf: string }): RouteResponse {
  const base = option(result.baseline, 'baseline', result.baseline, policy, origin, destination);
  const routes = result.selected.map((path, index) => {
    const route = option(path, `route-${index + 1}`, result.baseline, policy, origin, destination);
    if (Math.abs(path.distanceM - result.baseline.distanceM) < 0.000001) route.labels.push('shortest');
    if (path === result.recommended) route.labels.push('recommended');
    if (route.metrics.audibleSignals.present > base.metrics.audibleSignals.present) route.labels.push('better_documented');
    if (route.metrics.crossingCount < base.metrics.crossingCount) route.labels.push('fewer_crossings');
    return route;
  });
  const recommended = routes.find((r) => r.labels.includes('recommended'))!;
  const reasons: RouteReason[] = [];
  if (recommended.metrics.extraDistanceM === 0) reasons.push({ code: 'SHORTER_DISTANCE', params: { distanceM: recommended.metrics.distanceM }, evidenceIds: [] });
  else reasons.push({ code: 'DETOUR_FOR_PREFERENCES', params: { extraDistanceM: recommended.metrics.extraDistanceM }, evidenceIds: [] });
  if (recommended.metrics.audibleSignals.present > base.metrics.audibleSignals.present) reasons.push({ code: 'MORE_DOCUMENTED_AUDIBLE_SIGNALS',
    params: { routePresentCount: recommended.metrics.audibleSignals.present, baselinePresentCount: base.metrics.audibleSignals.present },
    evidenceIds: [...new Set(recommended.events.filter((e) => e.facts.audible_signal.state === 'known' && e.facts.audible_signal.value).flatMap((e) => e.facts.audible_signal.evidenceIds))] });
  if (recommended.metrics.audibleSignals.unknown < base.metrics.audibleSignals.unknown) reasons.push({ code: 'FEWER_UNKNOWN_AUDIBLE_SIGNALS', params: { routeUnknownCount: recommended.metrics.audibleSignals.unknown, baselineUnknownCount: base.metrics.audibleSignals.unknown }, evidenceIds: [] });
  if (recommended.metrics.crossingStageCount < base.metrics.crossingStageCount) reasons.push({ code: 'FEWER_CROSSING_STAGES', params: { routeStageCount: recommended.metrics.crossingStageCount, baselineStageCount: base.metrics.crossingStageCount }, evidenceIds: [] });
  const mode = snapshot.mode ?? 'synthetic';
  const warnings: Warning[] = mode === 'synthetic' ? [{ code: 'SYNTHETIC_DATA', severity: 'warning', messageKey: 'warning.synthetic_data', params: {}, evidenceIds: [] }] : [];
  const warned = new Set<string>();
  for (const route of routes) for (const event of route.events) for (const featureKey of ['audible_signal', 'tactile_paving'] as const) {
    const fact = event.facts[featureKey]; const key = JSON.stringify([event.objectId, featureKey]);
    if (fact.state === 'known' || warned.has(key)) continue;
    warned.add(key);
    if (fact.state === 'unknown') warnings.push({ code: 'MISSING_FEATURE_DATA', severity: 'warning', messageKey: 'warning.missing_feature_data', params: { objectId: event.objectId, featureKey }, evidenceIds: fact.evidenceIds });
    else warnings.push({ code: 'CONFLICTING_FEATURE_DATA', severity: 'warning', messageKey: 'warning.conflicting_feature_data', params: { objectId: event.objectId, featureKey }, evidenceIds: fact.evidenceIds });
  }
  if (result.limited) warnings.push({ code: 'SEARCH_BUDGET_LIMITED', severity: 'warning', messageKey: 'warning.search_budget_limited', params: {}, evidenceIds: [] });
  const degraded = snapshot.sources.filter((s) => s.status !== 'ok').map((s) => s.id);
  if (degraded.length) warnings.push({ code: 'SOURCE_DEGRADED', severity: 'warning', messageKey: 'warning.source_degraded', params: { sourceIds: degraded }, evidenceIds: [] });
  const referenced = new Set(routes.flatMap(r => r.events.flatMap(e => [...e.facts.audible_signal.evidenceIds, ...e.facts.tactile_paving.evidenceIds])));
  const evidenceCatalog = mode === 'pilot' ? snapshot.evidence.filter(e => referenced.has(e.id)) : snapshot.evidence;
  return RouteResponseSchema.parse({ schemaVersion: SCHEMA_VERSION, requestId: context.requestId, generatedAt: context.asOf, asOf: context.asOf,
    mode, navigationEligibility: 'preview_only',
    dataContext: { cityId: snapshot.cityId, graphVersion: snapshot.graphVersion, evidenceVersion: snapshot.evidenceVersion,
      policyVersion: policy.id, snapshotFetchedAt: snapshot.snapshotFetchedAt, sourceStatus: degraded.length ? 'degraded' : 'ok', sourceIds: snapshot.sources.map((s) => s.id) },
    policy: { policyVersion: policy.id, fieldVerificationMaxAgeDays: policy.fieldVerificationMaxAgeDays },
    calculation: { status: result.limited ? 'budget_limited' : 'finished', exhaustive: false },
    baseline: { distanceM: base.metrics.distanceM, walkingDurationSec: base.metrics.walkingDurationSec, basis: 'same_hard_constraints' },
    routes, recommendation: { routeId: recommended.id, reasons }, evidenceCatalog, sourceCatalog: snapshot.sources, warnings });
}
