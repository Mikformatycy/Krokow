import type { z } from 'zod';
import type { BooleanFact, Evidence, TactileFact } from './evidence';
import type { RouteResponse } from './routes';

const close = (a: number, b: number) => Math.abs(a - b) <= 0.001;
const sameScope = (a: Evidence, b: Evidence) => a.scope.side === b.scope.side && a.scope.direction === b.scope.direction && a.scope.level === b.scope.level;

/** Structural/reference validation only. Graph QA and evidence resolution belong to B-02/B-03. */
export function validateRouteResponse(value: RouteResponse, ctx: z.RefinementCtx) {
  const fail = (path: (string | number)[], message: string) => ctx.addIssue({ code: 'custom', path, message });
  const unique = (ids: string[], path: (string | number)[]) => {
    if (new Set(ids).size !== ids.length) fail(path, 'Duplicate IDs');
  };
  const evidence = new Map(value.evidenceCatalog.map((e) => [e.id, e]));
  const sources = new Map(value.sourceCatalog.map((s) => [s.id, s]));
  unique(value.evidenceCatalog.map((e) => e.id), ['evidenceCatalog']);
  unique(value.sourceCatalog.map((s) => s.id), ['sourceCatalog']);
  unique(value.routes.map((r) => r.id), ['routes']);
  unique(value.routes.map((r) => JSON.stringify(r.edgeIds)), ['routes']);
  if (value.mode === 'synthetic' && value.navigationEligibility !== 'preview_only') fail(['navigationEligibility'], 'Synthetic requires preview_only');
  if (value.policy.policyVersion !== value.dataContext.policyVersion) fail(['policy'], 'Policy version mismatch');
  if (Date.parse(value.asOf) > Date.parse(value.generatedAt)) fail(['asOf'], 'asOf exceeds generation time');
  if (Date.parse(value.dataContext.snapshotFetchedAt) > Date.parse(value.generatedAt)) fail(['dataContext', 'snapshotFetchedAt'], 'Future snapshot');
  for (const id of value.dataContext.sourceIds) if (!sources.has(id)) fail(['dataContext', 'sourceIds'], 'Missing source');
  for (const [i, source] of value.sourceCatalog.entries()) {
    if ((source.kind === 'synthetic') !== (value.mode === 'synthetic')) fail(['sourceCatalog', i, 'kind'], 'Source mode mismatch');
    if (!value.dataContext.sourceIds.includes(source.id)) fail(['sourceCatalog', i, 'id'], 'Source outside data context');
    if (value.dataContext.sourceStatus === 'ok' && source.status !== 'ok') fail(['dataContext', 'sourceStatus'], 'Degraded source requires degraded context');
  }
  for (const [i, entry] of value.evidenceCatalog.entries()) {
    if (!sources.has(entry.sourceId)) fail(['evidenceCatalog', i, 'sourceId'], 'Missing source');
    for (const key of ['observedAt', 'verifiedAt'] as const) {
      if (entry[key] !== null && Date.parse(entry[key]) > Date.parse(value.asOf)) fail(['evidenceCatalog', i, key], 'Observation after asOf');
    }
    if (Date.parse(entry.fetchedAt) > Date.parse(value.generatedAt)) fail(['evidenceCatalog', i, 'fetchedAt'], 'Future fetch');
  }
  const checkRefs = (ids: string[], path: (string | number)[]) => {
    for (const id of ids) if (!evidence.has(id)) fail(path, 'Missing evidence');
  };
  const checkFact = (fact: BooleanFact | TactileFact, objectId: string, featureKey: string, path: (string | number)[]) => {
    checkRefs(fact.evidenceIds, [...path, 'evidenceIds']);
    const entries = fact.evidenceIds.flatMap((id) => { const entry = evidence.get(id); return entry ? [entry] : []; });
    if (entries.some((e) => e.objectId !== objectId || e.featureKey !== featureKey)) fail(path, 'Evidence belongs to another object or feature');
    const first = entries[0];
    if (fact.state === 'known') {
      if (entries.some((e) => e.value !== fact.value)) fail(path, 'Known value contradicts evidence');
      if (first && entries.some((e) => !sameScope(first, e))) fail(path, 'Known evidence scopes disagree');
      if (fact.observedAt !== null && !entries.some((e) => e.observedAt === fact.observedAt)) fail(path, 'Observation date lacks evidence');
      if (fact.verifiedAt !== null && !entries.some((e) => e.verifiedAt === fact.verifiedAt)) fail(path, 'Verification date lacks evidence');
      if (fact.reliability === 'field_verified' && (fact.verifiedAt === null || !entries.some((e) => e.verificationStatus === 'field_verified' && e.verifiedAt === fact.verifiedAt))) fail(path, 'Field reliability lacks verification');
      if (fact.reliability === 'source_declared' && !entries.some((e) => e.verificationStatus === 'source_declared' || e.verificationStatus === 'field_verified')) fail(path, 'Declared reliability lacks declaration');
      if (fact.freshness !== 'unknown' && fact.observedAt === null && fact.verifiedAt === null) fail(path, 'Fetch date cannot establish freshness');
      if (fact.reliability === 'field_verified' && fact.freshness === 'recent' && fact.verifiedAt !== null && Date.parse(value.asOf) - Date.parse(fact.verifiedAt) > value.policy.fieldVerificationMaxAgeDays * 86_400_000) fail(path, 'Verification exceeds policy window');
    }
    if (fact.state === 'conflicting') {
      if (new Set(entries.map((e) => e.value)).size < 2) fail(path, 'Conflict requires distinct observations');
      if (new Set(entries.map((e) => JSON.stringify([e.sourceId, e.sourceRecordId]))).size < 2) fail(path, 'Copies of one source record are not independent observations');
      if (first && entries.some((e) => !sameScope(first, e))) fail(path, 'Conflict evidence scopes disagree');
    }
  };
  const warnCodes = new Set(value.warnings.map((w) => w.code));
  const requireWarning = (code: RouteResponse['warnings'][number]['code']) => {
    if (!warnCodes.has(code)) fail(['warnings'], `Missing ${code} warning`);
  };
  if (value.mode === 'synthetic') requireWarning('SYNTHETIC_DATA');
  if (value.calculation.status === 'budget_limited') requireWarning('SEARCH_BUDGET_LIMITED');
  if (value.dataContext.sourceStatus === 'degraded') requireWarning('SOURCE_DEGRADED');
  value.warnings.forEach((warning, i) => {
    checkRefs(warning.evidenceIds, ['warnings', i, 'evidenceIds']);
    if (warning.code === 'SOURCE_DEGRADED' && warning.params.sourceIds.some((id) => !sources.has(id))) fail(['warnings', i, 'params'], 'Missing warning source');
    if (warning.code === 'SNAPSHOT_STALE' && warning.params.snapshotFetchedAt !== value.dataContext.snapshotFetchedAt) fail(['warnings', i, 'params'], 'Snapshot date mismatch');
  });
  const baseline = value.routes.find((r) => close(r.metrics.distanceM, value.baseline.distanceM));
  for (const [i, route] of value.routes.entries()) {
    const path = ['routes', i]; const m = route.metrics;
    unique(route.events.map((e) => e.id), [...path, 'events']);
    unique(route.events.map((e) => `${e.crossingId}/${e.stageId}`), [...path, 'events']);
    unique(route.steps.map((s) => s.id), [...path, 'steps']);
    unique(route.labels, [...path, 'labels']);
    if (value.mode === 'pilot' && route.geometry === null) fail([...path, 'geometry'], 'Pilot requires geometry');
    if (!close(m.distanceM - value.baseline.distanceM, m.extraDistanceM)) fail([...path, 'metrics', 'extraDistanceM'], 'Detour is relative to baseline');
    if (m.distanceM < value.baseline.distanceM) fail([...path, 'metrics', 'distanceM'], 'Route shorter than baseline');
    if (route.labels.includes('shortest') && !close(m.distanceM, value.baseline.distanceM)) fail([...path, 'labels'], 'Unsupported shortest label');
    if (route.labels.includes('recommended') !== (route.id === value.recommendation.routeId)) fail([...path, 'labels'], 'Recommendation label mismatch');
    if (baseline && route.labels.includes('better_documented') && m.audibleSignals.present <= baseline.metrics.audibleSignals.present) fail([...path, 'labels'], 'Unsupported documentation label');
    if (baseline && route.labels.includes('fewer_crossings') && m.crossingCount >= baseline.metrics.crossingCount) fail([...path, 'labels'], 'Unsupported crossing label');
    if (m.unknownSegmentLengthM !== null && m.unknownSegmentLengthM > m.distanceM) fail([...path, 'metrics'], 'Unknown length exceeds route');
    if (m.crossingStageCount !== route.events.length || m.crossingCount !== new Set(route.events.map((e) => e.crossingId)).size) fail([...path, 'metrics'], 'Crossing count mismatch');
    const counts = { present: 0, absent: 0, unknown: 0, conflicting: 0 };
    let lastOffset = -1;
    for (const [j, event] of route.events.entries()) {
      if (event.offsetM < lastOffset || event.offsetM > m.distanceM) fail([...path, 'events', j, 'offsetM'], 'Event offsets out of order or bounds');
      lastOffset = event.offsetM;
      const fact = event.facts.audible_signal;
      counts[fact.state === 'known' ? fact.value ? 'present' : 'absent' : fact.state]++;
      for (const key of ['audible_signal', 'tactile_paving'] as const) {
        checkFact(event.facts[key], event.objectId, key, [...path, 'events', j, 'facts', key]);
        if (event.facts[key].state !== 'known') {
          const code = event.facts[key].state === 'unknown' ? 'MISSING_FEATURE_DATA' : 'CONFLICTING_FEATURE_DATA';
          if (!value.warnings.some((w) => w.code === code && w.params.objectId === event.objectId && w.params.featureKey === key)) fail(['warnings'], 'Missing warning for fact');
        }
      }
    }
    for (const key of ['present', 'absent', 'unknown', 'conflicting'] as const) if (counts[key] !== m.audibleSignals[key]) fail([...path, 'metrics', 'audibleSignals', key], 'Fact count mismatch');
    let end = 0;
    for (const [j, step] of route.steps.entries()) {
      if (!close(step.startM, end) || step.endM < step.startM || step.endM > m.distanceM) fail([...path, 'steps', j], 'Steps must cover the route in order');
      if (step.instructionKey === 'route.start' && (j !== 0 || step.startM !== 0 || step.endM !== 0)) fail([...path, 'steps', j], 'Start must be first at zero');
      if (step.instructionKey === 'route.arrive' && (j !== route.steps.length - 1 || !close(step.startM, m.distanceM) || !close(step.endM, m.distanceM))) fail([...path, 'steps', j], 'Arrival must be last at route end');
      end = step.endM;
    }
    if (route.steps[0]?.instructionKey !== 'route.start' || route.steps.at(-1)?.instructionKey !== 'route.arrive' || !close(end, m.distanceM)) fail([...path, 'steps'], 'Missing start, arrival or route coverage');
  }
  const recommended = value.routes.find((r) => r.id === value.recommendation.routeId);
  if (!recommended) fail(['recommendation', 'routeId'], 'Missing recommended route');
  value.recommendation.reasons.forEach((reason, i) => {
    const path = ['recommendation', 'reasons', i];
    checkRefs(reason.evidenceIds, [...path, 'evidenceIds']);
    if (!recommended) return;
    const m = recommended.metrics;
    switch (reason.code) {
      case 'SHORTER_DISTANCE':
        if (!close(reason.params.distanceM, m.distanceM) || !close(m.distanceM, value.baseline.distanceM)) fail(path, 'Shortest reason mismatch');
        break;
      case 'DETOUR_FOR_PREFERENCES':
        if (!close(reason.params.extraDistanceM, m.extraDistanceM) || m.extraDistanceM <= 0) fail(path, 'Detour reason mismatch');
        break;
      case 'MORE_DOCUMENTED_AUDIBLE_SIGNALS':
        if (reason.params.routePresentCount !== m.audibleSignals.present || reason.params.routePresentCount <= reason.params.baselinePresentCount || (baseline && reason.params.baselinePresentCount !== baseline.metrics.audibleSignals.present)) fail(path, 'Documented signals reason mismatch');
        break;
      case 'FEWER_UNKNOWN_AUDIBLE_SIGNALS':
        if (reason.params.routeUnknownCount !== m.audibleSignals.unknown || reason.params.routeUnknownCount >= reason.params.baselineUnknownCount || (baseline && reason.params.baselineUnknownCount !== baseline.metrics.audibleSignals.unknown)) fail(path, 'Unknown signals reason mismatch');
        break;
      case 'FEWER_CROSSING_STAGES':
        if (reason.params.routeStageCount !== m.crossingStageCount || reason.params.routeStageCount >= reason.params.baselineStageCount || (baseline && reason.params.baselineStageCount !== baseline.metrics.crossingStageCount)) fail(path, 'Stage reason mismatch');
    }
  });
}
