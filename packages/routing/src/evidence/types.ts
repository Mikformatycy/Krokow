import type { BooleanFact, Evidence, PublicSource } from '@krok/contracts';

export type FeatureKey = Evidence['featureKey'];
export type EvidenceScope = Evidence['scope'];
export type FactValue<K extends FeatureKey> = K extends 'tactile_paving'
  ? Extract<Evidence, { featureKey: 'tactile_paving' }>['value']
  : K extends 'surface' ? Extract<Evidence, { featureKey: 'surface' }>['value'] : boolean;
export type ResolvedFact<K extends FeatureKey = FeatureKey> = Exclude<BooleanFact, { state: 'known' }>
  | (Omit<Extract<BooleanFact, { state: 'known' }>, 'value'> & { value: FactValue<K> });

/** Trusted ingestion/moderation metadata; never taken from an OSM note or request body. */
export interface EvidenceCandidate {
  evidence: unknown;
  publication: 'published' | 'pending' | 'rejected';
  origin?: { sourceId: string; sourceRecordId: string };
}
export interface Supersession {
  id: string;
  replacementId: string;
  supersededIds: readonly string[];
  reviewedAt: string;
  justification: string;
}
export interface ResolutionPolicy {
  id: string;
  infrastructureMaxAgeDays: number;
  temporaryObservationMaxAgeHours: number;
}
export interface ResolutionRequest<K extends FeatureKey = FeatureKey> {
  objectId: string;
  featureKey: K;
  scope: EvidenceScope;
  candidates: readonly EvidenceCandidate[];
  sources: readonly PublicSource[];
  policy: ResolutionPolicy;
  supersessions?: readonly Supersession[];
}
export type ExclusionReason = 'invalid_record' | 'not_published' | 'other_feature'
  | 'missing_source' | 'invalid_time' | 'other_scope' | 'ambiguous_scope'
  | 'expired_temporary' | 'undated_temporary' | 'superseded';
export interface ResolutionAudit {
  asOf: string;
  policyId: string;
  excluded: { evidenceId: string | null; reason: ExclusionReason }[];
  origins: { sourceId: string; sourceRecordId: string; evidenceIds: string[] }[];
  independentOriginCount: number;
  issues: ('inconsistent_origin' | 'unsupported_observation')[];
  supersessions: { id: string; replacementId: string; supersededIds: string[]; reviewedAt: string; justification: string }[];
  witnessId: string | null;
}
export interface Resolution<K extends FeatureKey = FeatureKey> {
  fact: ResolvedFact<K>;
  audit: ResolutionAudit;
}
