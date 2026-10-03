import { EvidenceSchema, IdSchema, PublicSourceSchema, ScopeSchema, UtcSchema } from '@krok/contracts';
import type { Evidence } from '@krok/contracts';
import type { EvidenceScope, FeatureKey, Resolution, ResolutionAudit, ResolutionRequest, Supersession } from './types';

interface Entry { evidence: Evidence; origin: { sourceId: string; sourceRecordId: string } }
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
const scopeKey = (scope: EvidenceScope) => JSON.stringify([scope.side, scope.direction, scope.level]);
const originKey = (entry: Entry) => JSON.stringify([entry.origin.sourceId, entry.origin.sourceRecordId]);
// Acquisition time, mirror identity and explanatory notes do not create a new observation.
const observationKey = (entry: Entry) => JSON.stringify([originKey(entry), entry.evidence.objectId,
  entry.evidence.featureKey, scopeKey(entry.evidence.scope), entry.evidence.value,
  entry.evidence.observedAt, entry.evidence.verifiedAt, entry.evidence.verificationStatus, entry.evidence.validUntil]);
const eventTime = (e: Evidence) => e.verifiedAt ?? e.observedAt;
const rank = (e: Evidence) => e.verificationStatus === 'field_verified' ? 3 : e.verificationStatus === 'source_declared' ? 2 : 1;

function scopeRelation(a: EvidenceScope, b: EvidenceScope): 'exact' | 'ambiguous' | 'disjoint' {
  if (scopeKey(a) === scopeKey(b)) return 'exact';
  for (const dimension of ['side', 'direction', 'level'] as const) {
    const x = a[dimension]; const y = b[dimension];
    if (x !== y && x !== null && y !== null && x !== 'both' && y !== 'both') return 'disjoint';
  }
  return 'ambiguous';
}

function validateTime(e: Evidence, now: number): boolean {
  if ([e.fetchedAt, e.sourceModifiedAt, e.observedAt, e.verifiedAt]
    .some((date) => date !== null && Date.parse(date) > now)) return false;
  if (e.observedAt !== null && e.verifiedAt !== null && Date.parse(e.observedAt) > Date.parse(e.verifiedAt)) return false;
  const time = eventTime(e);
  return time === null || e.validUntil === null || Date.parse(e.validUntil) >= Date.parse(time);
}

function supersede(entries: Entry[], decisions: readonly Supersession[], asOf: number, audit: ResolutionAudit): Entry[] {
  const byId = new Map(entries.map((entry) => [entry.evidence.id, entry]));
  const removed = new Map<string, string>();
  const ids = new Set<string>();
  for (const decision of [...decisions].sort((a, b) => compare(a.id, b.id))) {
    IdSchema.parse(decision.id); UtcSchema.parse(decision.reviewedAt);
    if (ids.has(decision.id) || !decision.justification.trim() || !decision.supersededIds.length
      || new Set(decision.supersededIds).size !== decision.supersededIds.length) throw new Error('Invalid supersession decision');
    ids.add(decision.id);
    const replacement = byId.get(decision.replacementId);
    if (!replacement || replacement.evidence.verificationStatus !== 'field_verified'
      || replacement.evidence.verifiedAt === null) throw new Error('Supersession requires published field verification');
    const verified = Date.parse(replacement.evidence.verifiedAt);
    const reviewed = Date.parse(decision.reviewedAt);
    if (reviewed < verified || reviewed > asOf) throw new Error('Invalid supersession review time');
    const expanded = new Set<string>();
    for (const oldId of decision.supersededIds) {
      const old = byId.get(oldId);
      if (!old || scopeKey(old.evidence.scope) !== scopeKey(replacement.evidence.scope)
        || old.evidence.objectId !== replacement.evidence.objectId
        || old.evidence.featureKey !== replacement.evidence.featureKey) throw new Error('Supersession scope mismatch');
      const oldTime = eventTime(old.evidence);
      if (oldTime === null || Date.parse(oldTime) > verified) throw new Error('Supersession requires ordered observation dates');
      for (const alias of entries.filter((entry) => observationKey(entry) === observationKey(old))) {
        const id = alias.evidence.id;
        if (id === decision.replacementId || (removed.has(id) && removed.get(id) !== decision.replacementId)) throw new Error('Ambiguous supersession');
        removed.set(id, decision.replacementId); expanded.add(id);
      }
    }
    audit.supersessions.push({ ...decision, supersededIds: [...expanded].sort(compare) });
  }
  for (const id of removed.keys()) {
    const visited = new Set<string>(); let cursor: string | undefined = id;
    while (cursor !== undefined) {
      if (visited.has(cursor)) throw new Error('Supersession cycle');
      visited.add(cursor); cursor = removed.get(cursor);
    }
  }
  return entries.filter((entry) => {
    if (!removed.has(entry.evidence.id)) return true;
    audit.excluded.push({ evidenceId: entry.evidence.id, reason: 'superseded' }); return false;
  });
}

/** Deterministic internal resolver. The clock is required and sampled once. No I/O. */
export function resolveEvidence<K extends FeatureKey>(request: ResolutionRequest<K>, clock: () => string): Resolution<K>;
export function resolveEvidence(request: ResolutionRequest, clock: () => string): Resolution {
  const asOf = UtcSchema.parse(clock()); const now = Date.parse(asOf);
  IdSchema.parse(request.objectId); ScopeSchema.parse(request.scope); IdSchema.parse(request.policy.id);
  if (!EvidenceSchema.options.some((option) => option.shape.featureKey.safeParse(request.featureKey).success)) throw new Error('Unsupported feature key');
  if (![request.policy.infrastructureMaxAgeDays, request.policy.temporaryObservationMaxAgeHours]
    .every((n) => Number.isFinite(n) && n > 0 && Number.isFinite(n * 86_400_000))) throw new Error('Invalid evidence age policy');
  const sourceIds = new Set<string>();
  for (const input of request.sources) {
    const source = PublicSourceSchema.parse(input);
    if (sourceIds.has(source.id)) throw new Error('Duplicate source ID');
    sourceIds.add(source.id);
  }
  const audit: ResolutionAudit = { asOf, policyId: request.policy.id, excluded: [], origins: [],
    independentOriginCount: 0, issues: [], supersessions: [], witnessId: null };
  let unsupported = false; let ambiguous = false;
  const records = new Map<string, Entry>();
  const publications = new Map<string, string>();
  for (const candidate of request.candidates) {
    if (!['published', 'pending', 'rejected'].includes(candidate.publication)) throw new Error('Invalid publication status');
    const parsed = EvidenceSchema.safeParse(candidate.evidence);
    if (!parsed.success) {
      audit.excluded.push({ evidenceId: null, reason: 'invalid_record' });
      if (candidate.publication === 'published') unsupported = true;
      continue;
    }
    const evidence = parsed.data;
    if (publications.has(evidence.id) && publications.get(evidence.id) !== candidate.publication) throw new Error('Inconsistent publication status');
    publications.set(evidence.id, candidate.publication);
    if (candidate.publication !== 'published') { audit.excluded.push({ evidenceId: evidence.id, reason: 'not_published' }); continue; }
    if (evidence.objectId !== request.objectId || evidence.featureKey !== request.featureKey) {
      audit.excluded.push({ evidenceId: evidence.id, reason: 'other_feature' }); continue;
    }
    if (!sourceIds.has(evidence.sourceId) || !validateTime(evidence, now)) {
      audit.excluded.push({ evidenceId: evidence.id, reason: sourceIds.has(evidence.sourceId) ? 'invalid_time' : 'missing_source' });
      unsupported = true; continue;
    }
    const relation = scopeRelation(evidence.scope, request.scope);
    if (relation !== 'exact') {
      audit.excluded.push({ evidenceId: evidence.id, reason: relation === 'ambiguous' ? 'ambiguous_scope' : 'other_scope' });
      ambiguous ||= relation === 'ambiguous'; continue;
    }
    const origin = candidate.origin ?? { sourceId: evidence.sourceId, sourceRecordId: evidence.sourceRecordId };
    IdSchema.parse(origin.sourceId); IdSchema.parse(origin.sourceRecordId);
    const entry: Entry = { evidence, origin: { ...origin } }; const previous = records.get(evidence.id);
    if (previous && (observationKey(previous) !== observationKey(entry)
      || previous.evidence.sourceId !== evidence.sourceId || previous.evidence.sourceRecordId !== evidence.sourceRecordId)) throw new Error('Evidence ID has incompatible content');
    // Repeated import of the same ID cannot change its observational meaning.
    if (!previous || compare(evidence.fetchedAt, previous.evidence.fetchedAt) > 0) records.set(evidence.id, entry);
  }
  let entries = supersede([...records.values()], request.supersessions ?? [], now, audit);
  entries = entries.filter(({ evidence: e }) => {
    if (e.featureKey !== 'temporary_obstruction') return true;
    const time = eventTime(e);
    if (time === null) { audit.excluded.push({ evidenceId: e.id, reason: 'undated_temporary' }); return false; }
    const expired = (e.validUntil !== null && Date.parse(e.validUntil) <= now)
      || (time !== null && now - Date.parse(time) > request.policy.temporaryObservationMaxAgeHours * 3_600_000);
    if (expired) audit.excluded.push({ evidenceId: e.id, reason: 'expired_temporary' });
    return !expired;
  }).sort((a, b) => compare(a.evidence.id, b.evidence.id));
  const origins = new Map<string, Entry[]>();
  for (const entry of entries) { const key = originKey(entry); origins.set(key, [...(origins.get(key) ?? []), entry]); }
  for (const [, group] of [...origins].sort(([a], [b]) => compare(a, b))) {
    const first = group[0]!;
    audit.origins.push({ ...first.origin, evidenceIds: group.map((e) => e.evidence.id) });
    if (new Set(group.map((e) => e.evidence.value)).size > 1) audit.issues.push('inconsistent_origin');
  }
  audit.independentOriginCount = origins.size;
  if (unsupported || entries.some((e) => e.evidence.value === 'unknown')) audit.issues.push('unsupported_observation');
  audit.issues = [...new Set(audit.issues)].sort(compare);
  audit.excluded.sort((a, b) => compare(a.evidenceId ?? '', b.evidenceId ?? '') || compare(a.reason, b.reason));
  const unknown = (reason: 'missing' | 'ambiguous_scope' | 'unsupported_value'): Resolution => ({
    fact: { state: 'unknown', reason, evidenceIds: [] }, audit,
  });
  const supported = entries.filter((e) => e.evidence.value !== 'unknown');
  const independentConflict = supported.some((a) => supported.some((b) => a.evidence.value !== b.evidence.value
    && originKey(a) !== originKey(b)
    && (a.evidence.sourceId !== b.evidence.sourceId || a.evidence.sourceRecordId !== b.evidence.sourceRecordId)));
  // Additional malformed/ambiguous observations must not hide an already established conflict.
  if (independentConflict) return { fact: { state: 'conflicting', summaryCode: 'DISAGREEING_OBSERVATIONS',
    evidenceIds: supported.map((e) => e.evidence.id) }, audit };
  if (audit.issues.length) return unknown('unsupported_value');
  if (ambiguous) return unknown('ambiguous_scope');
  if (!entries.length) return unknown('missing');
  const evidenceIds = entries.map((entry) => entry.evidence.id);
  if (new Set(entries.map((entry) => entry.evidence.value)).size > 1) {
    audit.issues.push('inconsistent_origin'); return unknown('unsupported_value');
  }
  const witness = [...entries].sort((a, b) => rank(b.evidence) - rank(a.evidence)
    || (eventTime(b.evidence) === null ? -Infinity : Date.parse(eventTime(b.evidence)!))
      - (eventTime(a.evidence) === null ? -Infinity : Date.parse(eventTime(a.evidence)!))
    || compare(a.evidence.id, b.evidence.id))[0]!.evidence;
  audit.witnessId = witness.id;
  const time = eventTime(witness);
  const maxAge = witness.featureKey === 'temporary_obstruction'
    ? request.policy.temporaryObservationMaxAgeHours * 3_600_000 : request.policy.infrastructureMaxAgeDays * 86_400_000;
  const freshness = time === null ? 'unknown' : now - Date.parse(time) > maxAge
    || (witness.validUntil !== null && Date.parse(witness.validUntil) <= now) ? 'stale' : 'recent';
  return { fact: { state: 'known', value: witness.value, evidenceIds,
    reliability: witness.verificationStatus === 'unverified' ? 'community_mapped' : witness.verificationStatus,
    freshness, observedAt: witness.observedAt, verifiedAt: witness.verifiedAt }, audit };
}
