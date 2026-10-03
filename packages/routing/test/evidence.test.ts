import { describe, expect, it } from 'vitest';
import { BooleanFactSchema, EvidenceSchema, RouteResponseSchema, SurfaceSchema, TactileFactSchema, factSchema } from '@krok/contracts';
import { routeRequest } from '@krok/contracts/fixtures';
import type { Evidence, PublicSource } from '@krok/contracts';
import { resolveEvidence } from '../src/evidence/resolve';
import type { EvidenceCandidate, ResolutionRequest, Supersession } from '../src/evidence/types';
import { createPlanner, SYNTHETIC_POLICY } from '../src';
import { createSyntheticSnapshot, SYNTHETIC_FETCHED_AT } from '../src/synthetic';

const now = '2026-10-03T12:00:00.000Z';
const observed = '2026-10-01T12:00:00.000Z';
const scope = { side: 'left', direction: 'forward', level: 0 } as const;
const source: PublicSource = { id: 'osm', kind: 'osm', name: 'OSM test snapshot', sourceUrl: 'https://www.openstreetmap.org',
  attribution: 'OpenStreetMap contributors', license: 'ODbL-1.0', lastFetchedAt: now, status: 'ok' };
function e(id: string, value = true, patch: Partial<Evidence> = {}): Evidence {
  return EvidenceSchema.parse({ id, value, sourceId: 'osm', sourceRecordId: id, objectId: 'crossing-1',
    featureKey: 'audible_signal', fetchedAt: now, sourceModifiedAt: null, observedAt: observed,
    verifiedAt: null, validUntil: null, verificationStatus: 'unverified', scope, note: null, ...patch });
}
const c = (evidence: unknown, metadata: Partial<Omit<EvidenceCandidate, 'evidence'>> = {}): EvidenceCandidate => ({ evidence, publication: 'published', ...metadata });
function request(candidates: EvidenceCandidate[], patch: Partial<ResolutionRequest> = {}): ResolutionRequest {
  return { objectId: 'crossing-1', featureKey: 'audible_signal', scope, candidates, sources: [source],
    policy: { id: 'test-age-policy', infrastructureMaxAgeDays: 180, temporaryObservationMaxAgeHours: 48 }, ...patch };
}
const resolve = (candidates: EvidenceCandidate[], patch: Partial<ResolutionRequest> = {}) => resolveEvidence(request(candidates, patch), () => now);
const field = (id: string, value = true, date = observed) => e(id, value, { verificationStatus: 'field_verified', observedAt: date, verifiedAt: date });
const decision = (patch: Partial<Supersession> = {}): Supersession => ({ id: 'review-1', replacementId: 'verified',
  supersededIds: ['no'], reviewedAt: now, justification: 'Operator reviewed the new field observation for this crossing stage.', ...patch });

describe('evidence resolution', () => {
  it('keeps missing distinct from documented absence and never infers freshness from fetch', () => {
    expect(resolve([]).fact).toEqual({ state: 'unknown', reason: 'missing', evidenceIds: [] });
    const result = resolve([c(e('no', false, { observedAt: null, sourceModifiedAt: now }))]);
    expect(result.fact).toMatchObject({ state: 'known', value: false, freshness: 'unknown', observedAt: null, verifiedAt: null });
    expect(BooleanFactSchema.safeParse(result.fact).success).toBe(true);
  });
  it.each(['pending', 'rejected'] as const)('excludes %s moderation and does not promote publication to verification', (publication) => {
    const result = resolve([c(e('no', false), { publication }), c(e('yes'))]);
    expect(result.fact).toMatchObject({ state: 'known', value: true, reliability: 'community_mapped', evidenceIds: ['yes'] });
    expect(result.audit.excluded).toContainEqual({ evidenceId: 'no', reason: 'not_published' });
  });
  it('rejects inconsistent publication decisions for the same ID', () => {
    expect(() => resolve([c(e('x')), c(e('x'), { publication: 'rejected' })])).toThrow('publication');
  });
  it('does not silently accept malformed values beside valid evidence', () => {
    const result = resolve([c({ ...e('invalid'), value: 'maybe' }), c(e('yes'))]);
    expect(result.fact).toMatchObject({ state: 'unknown', reason: 'unsupported_value' });
    expect(result.audit.excluded).toContainEqual({ evidenceId: null, reason: 'invalid_record' });
  });
  it('fails closed on unknown sources but separates another object or feature', () => {
    expect(resolve([c(e('x', true, { sourceId: 'missing' }))]).fact.state).toBe('unknown');
    expect(resolve([c(e('x', true, { objectId: 'other' })), c(e('y', true, { featureKey: 'steps' }))]).fact)
      .toMatchObject({ state: 'unknown', reason: 'missing' });
  });
  it.each([{ side: 'right' }, { direction: 'backward' }, { level: 1 }] as const)('never joins disjoint scope %j', (patch) => {
    const result = resolve([c(e('other', false, { scope: { ...scope, ...patch } })), c(e('yes'))]);
    expect(result.fact).toMatchObject({ state: 'known', value: true, evidenceIds: ['yes'] });
    expect(result.audit.excluded).toContainEqual({ evidenceId: 'other', reason: 'other_scope' });
  });
  it.each([{ side: null }, { direction: null }, { level: null }, { side: 'both' }] as const)('does not widen uncertain scope %j', (patch) => {
    const result = resolve([c(e('other', false, { scope: { ...scope, ...patch } })), c(e('yes'))]);
    expect(result.fact).toMatchObject({ state: 'unknown', reason: 'ambiguous_scope' });
    expect(result.fact.evidenceIds).toEqual([]); // Never export mixed-scope references as one fact.
  });
  it('supports explicit matching unspecified scope without claiming a side', () => {
    const unscoped = { side: null, direction: null, level: null };
    expect(resolve([c(e('x', true, { scope: unscoped }))], { scope: unscoped }).fact.state).toBe('known');
  });
  it('does not vote away an older independent conflict', () => {
    const result = resolve([c(e('old-no', false, { observedAt: '2020-01-01T00:00:00.000Z' })),
      c(field('official-yes')), c(e('another-yes'))]);
    expect(result.fact).toEqual({ state: 'conflicting', summaryCode: 'DISAGREEING_OBSERVATIONS',
      evidenceIds: ['another-yes', 'official-yes', 'old-no'] });
    expect(BooleanFactSchema.safeParse(result.fact).success).toBe(true);
  });
  it('does not hide proven conflict behind additional malformed or ambiguous observations', () => {
    const result = resolve([c(e('no', false)), c(e('yes')), c({ bad: true }), c(e('unknown-side', true, { scope: { ...scope, side: null } }))]);
    expect(result.fact.state).toBe('conflicting');
    expect(result.audit.issues).toContain('unsupported_observation');
  });
  it('deduplicates repeated imports and mirrors without inventing independent votes', () => {
    const origin = { sourceId: 'original', sourceRecordId: 'node-123' };
    const result = resolve([c(e('x'), { origin }), c(e('x'), { origin }), c(e('mirror'), { origin })]);
    expect(result.audit.independentOriginCount).toBe(1);
    expect(result.fact.evidenceIds).toEqual(['mirror', 'x']);
  });
  it('surfaces opposing revisions of one origin as unknown with an explicit audit issue', () => {
    const result = resolve([c(e('old', false, { sourceRecordId: 'node-1' })), c(e('new', true, { sourceRecordId: 'node-1' }))]);
    expect(result.fact).toMatchObject({ state: 'unknown', reason: 'unsupported_value' });
    expect(result.audit.issues).toEqual(['inconsistent_origin']);
  });
  it('does not confuse provenance tuple delimiters', () => {
    const result = resolve([c(e('x'), { origin: { sourceId: 'a-b', sourceRecordId: 'c' } }),
      c(e('y'), { origin: { sourceId: 'a', sourceRecordId: 'b-c' } })]);
    expect(result.audit.independentOriginCount).toBe(2);
  });
  it('rejects the same evidence ID with incompatible observations', () => {
    expect(() => resolve([c(e('x')), c(e('x', false))])).toThrow('incompatible');
  });
  it('does not refresh an observation through repeated fetch or unrelated source changes', () => {
    const old = e('old', true, { observedAt: '2020-01-01T00:00:00.000Z', fetchedAt: '2020-01-02T00:00:00.000Z' });
    expect(resolve([c(old)]).fact).toEqual(resolve([c({ ...old, fetchedAt: now, sourceModifiedAt: now })]).fact);
    expect(resolve([c(old)]).fact).toMatchObject({ freshness: 'stale' });
  });
  it('does not combine old field verification with a new community observation into recent verification', () => {
    const old = field('verified', true, '2020-01-01T00:00:00.000Z');
    const result = resolve([c(old), c(e('community', true, { observedAt: now }))]);
    expect(result.fact).toMatchObject({ reliability: 'field_verified', freshness: 'stale', observedAt: old.observedAt, verifiedAt: old.verifiedAt });
    expect(result.audit.witnessId).toBe('verified');
  });
  it('has an inclusive age threshold but exclusive validUntil', () => {
    const policy = { id: 'two-days', infrastructureMaxAgeDays: 2, temporaryObservationMaxAgeHours: 48 };
    expect(resolve([c(e('x'))], { policy }).fact).toMatchObject({ freshness: 'recent' });
    expect(resolve([c(e('x', true, { observedAt: '2026-10-01T11:59:59.999Z' }))], { policy }).fact).toMatchObject({ freshness: 'stale' });
    expect(resolve([c(e('x', true, { validUntil: now }))]).fact).toMatchObject({ freshness: 'stale' });
  });
  it.each(['observedAt', 'verifiedAt', 'sourceModifiedAt', 'fetchedAt'] as const)('rejects a future %s without accepting the remaining evidence', (key) => {
    const record = { ...field('x'), [key]: '2027-01-01T00:00:00.000Z' };
    expect(resolve([c(record), c(e('other'))]).fact).toMatchObject({ state: 'unknown', reason: 'unsupported_value' });
  });
  it('rejects invalid observation/verification/window chronology', () => {
    expect(resolve([c({ ...field('x'), verifiedAt: '2026-09-30T12:00:00.000Z' })]).fact.state).toBe('unknown');
    expect(resolve([c(e('x', true, { validUntil: '2026-09-30T12:00:00.000Z' }))]).fact.state).toBe('unknown');
  });
  it.each([true, false])('expired temporary value %s becomes unknown, not evidence of clearance', (value) => {
    const result = resolve([c(e('obstruction', value, { featureKey: 'temporary_obstruction', validUntil: now }))], { featureKey: 'temporary_obstruction' });
    expect(result.fact).toEqual({ state: 'unknown', reason: 'missing', evidenceIds: [] });
    expect(result.audit.excluded).toContainEqual({ evidenceId: 'obstruction', reason: 'expired_temporary' });
  });
  it('requires a dated temporary observation and expires it without validUntil by policy', () => {
    const patch = { featureKey: 'temporary_obstruction' } as const;
    expect(resolve([c(e('x', true, { ...patch, observedAt: null }))], patch).audit.excluded[0]?.reason).toBe('undated_temporary');
    expect(resolve([c(e('x', true, { ...patch, observedAt: '2026-09-01T00:00:00.000Z' }))], patch).fact.state).toBe('unknown');
    expect(resolve([c(e('x', true, patch))], patch).fact.state).toBe('known');
  });
  it('returns tactile/surface facts using contract value vocabularies', () => {
    const tactile = resolve([c(e('t', true, { featureKey: 'tactile_paving', value: 'partial' }))], { featureKey: 'tactile_paving' });
    expect(TactileFactSchema.parse(tactile.fact)).toMatchObject({ value: 'partial' });
    const surface = resolve([c(e('s', true, { featureKey: 'surface', value: 'unpaved' }))], { featureKey: 'surface' });
    expect(factSchema(SurfaceSchema).parse(surface.fact)).toMatchObject({ value: 'unpaved' });
    expect(resolve([c(e('u', true, { featureKey: 'surface', value: 'unknown' }))], { featureKey: 'surface' }).fact.state).toBe('unknown');
  });
  it('requires an explicit field review to supersede and keeps its audit plus aliases', () => {
    const origin = { sourceId: 'osm', sourceRecordId: 'no' };
    const candidates = [c(e('no', false)), c(e('mirror', false), { origin }), c(field('verified', true, now))];
    expect(resolve(candidates).fact.state).toBe('conflicting');
    const result = resolve(candidates, { supersessions: [decision()] });
    expect(result.fact).toMatchObject({ state: 'known', value: true, evidenceIds: ['verified'] });
    expect(result.audit.supersessions[0]).toEqual({ ...decision(), supersededIds: ['mirror', 'no'] });
  });
  it.each([
    { replacementId: 'no' }, { supersededIds: ['missing'] }, { supersededIds: ['verified'] },
    { reviewedAt: '2027-01-01T00:00:00.000Z' }, { reviewedAt: '2020-01-01T00:00:00.000Z' },
    { justification: ' ' }, { supersededIds: [] }, { supersededIds: ['no', 'no'] },
  ])('rejects invalid supersession %j', (patch) => {
    expect(() => resolve([c(e('no', false)), c(field('verified', true, now))], { supersessions: [decision(patch)] })).toThrow();
  });
  it('does not supersede observations newer than the field visit or with unknown observation time', () => {
    for (const date of [now, null]) {
      expect(() => resolve([c(e('no', false, { observedAt: date })), c(field('verified'))], { supersessions: [decision()] })).toThrow('ordered');
    }
  });
  it('rejects pending replacement and a replacement from another scope', () => {
    for (const candidate of [c(field('verified'), { publication: 'pending' }), c({ ...field('verified'), scope: { ...scope, side: 'right' } })]) {
      expect(() => resolve([c(e('no', false)), candidate], { supersessions: [decision()] })).toThrow();
    }
  });
  it('supports reviewed chains independent of decision order and rejects cycles', () => {
    const candidates = [c(field('no', false)), c(field('verified')), c(field('latest', false, now))];
    const first = decision(); const last = decision({ id: 'review-2', replacementId: 'latest', supersededIds: ['verified'] });
    expect(resolve(candidates, { supersessions: [last, first] })).toEqual(resolve(candidates, { supersessions: [first, last] }));
    expect(resolve(candidates, { supersessions: [last, first] }).fact).toMatchObject({ value: false, evidenceIds: ['latest'] });
    expect(() => resolve(candidates, { supersessions: [first, decision({ id: 'cycle', replacementId: 'no', supersededIds: ['verified'] })] })).toThrow('cycle');
  });
  it('is deterministic, immutable, samples its injected clock once and returns independent output', () => {
    const input = request([c(e('z')), c(e('a')), c(e('other', false, { objectId: 'other' }))]);
    const before = structuredClone(input); let calls = 0;
    const result = resolveEvidence(input, () => { calls++; return now; });
    expect(calls).toBe(1); expect(input).toEqual(before);
    expect(result).toEqual(resolveEvidence({ ...input, candidates: [...input.candidates].reverse() }, () => now));
    result.fact.evidenceIds.push('mutated'); result.audit.origins[0]!.evidenceIds.push('mutated');
    expect(input).toEqual(before); expect(resolveEvidence(input, () => now).fact.evidenceIds).toEqual(['a', 'z']);
  });
  it('validates the clock, policy and source identities', () => {
    expect(() => resolveEvidence(request([]), () => 'tomorrow')).toThrow();
    for (const age of [0, -1, NaN, Infinity]) expect(() => resolve([], { policy: { id: 'bad', infrastructureMaxAgeDays: age, temporaryObservationMaxAgeHours: 48 } })).toThrow();
    expect(() => resolve([], { sources: [source, source] })).toThrow('Duplicate source');
  });
  it('rebuilds synthetic facts without changing the graph, recommendation, contract or hard constraints', () => {
    const snapshot = createSyntheticSnapshot(); const original = structuredClone(snapshot);
    const shared = { candidates: snapshot.evidence.map((entry) => c(entry)), sources: snapshot.sources,
      scope: { side: null, direction: 'both', level: 0 } as const, policy: request([]).policy };
    for (const edge of snapshot.graph.edges) {
      for (const [property, featureKey] of [['steps', 'steps'], ['separatedFootway', 'separated_footway']] as const) {
        edge[property] = resolveEvidence({ ...shared, objectId: edge.objectId, featureKey }, () => SYNTHETIC_FETCHED_AT).fact;
      }
      for (const event of edge.events) {
        event.facts.audible_signal = resolveEvidence({ ...shared, objectId: event.objectId, featureKey: 'audible_signal' }, () => SYNTHETIC_FETCHED_AT).fact;
        event.facts.tactile_paving = resolveEvidence({ ...shared, objectId: event.objectId, featureKey: 'tactile_paving' }, () => SYNTHETIC_FETCHED_AT).fact;
      }
    }
    expect(snapshot).toEqual(original);
    const planner = createPlanner(snapshot, SYNTHETIC_POLICY, () => 0);
    const context = { requestId: 'resolver-integration', asOf: SYNTHETIC_FETCHED_AT };
    const response = planner.plan(routeRequest, context);
    expect(RouteResponseSchema.safeParse(response).success).toBe(true);
    expect(response.routes.map((route) => route.metrics.distanceM)).toEqual([740, 980, 1120]);
    expect(response.routes.find((route) => route.id === response.recommendation.routeId)?.metrics.distanceM).toBe(980);
    const hard = { ...routeRequest, preferences: { ...routeRequest.preferences, audibleRequirement: 'field_verified_recent' as const } };
    expect(() => planner.plan(hard, context)).toThrow('NO_MATCHING_ROUTE');
  });
});
