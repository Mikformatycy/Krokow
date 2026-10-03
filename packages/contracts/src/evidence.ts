import { z } from 'zod';
import { IdSchema, IdsSchema, TextSchema, UtcSchema } from './common';

export const TactileSchema = z.enum(['yes', 'no', 'partial', 'incorrect']);
export const SurfaceSchema = z.enum(['asphalt', 'paved', 'unpaved', 'unknown']);
export function factSchema<T extends z.ZodType>(value: T) {
  return z.discriminatedUnion('state', [
    z.strictObject({
      state: z.literal('known'), value, evidenceIds: IdsSchema.min(1),
      reliability: z.enum(['field_verified', 'source_declared', 'community_mapped']),
      freshness: z.enum(['recent', 'stale', 'unknown']),
      observedAt: UtcSchema.nullable(), verifiedAt: UtcSchema.nullable(),
    }),
    z.strictObject({ state: z.literal('unknown'), reason: z.enum(['missing', 'ambiguous_scope', 'unsupported_value']), evidenceIds: IdsSchema }),
    z.strictObject({ state: z.literal('conflicting'), evidenceIds: IdsSchema.min(2), summaryCode: z.literal('DISAGREEING_OBSERVATIONS') }),
  ]);
}
export const BooleanFactSchema = factSchema(z.boolean());
export const TactileFactSchema = factSchema(TactileSchema);
export type BooleanFact = z.infer<typeof BooleanFactSchema>;
export type TactileFact = z.infer<typeof TactileFactSchema>;
export const ScopeSchema = z.strictObject({
  side: z.enum(['left', 'right', 'both']).nullable(),
  direction: z.enum(['forward', 'backward', 'both']).nullable(), level: z.number().finite().nullable(),
});
const evidenceShape = {
  id: IdSchema, sourceId: IdSchema, sourceRecordId: IdSchema, objectId: IdSchema,
  fetchedAt: UtcSchema, sourceModifiedAt: UtcSchema.nullable(), observedAt: UtcSchema.nullable(),
  verifiedAt: UtcSchema.nullable(), validUntil: UtcSchema.nullable(),
  verificationStatus: z.enum(['unverified', 'source_declared', 'field_verified']),
  scope: ScopeSchema, note: TextSchema.nullable(),
};
export const EvidenceSchema = z.discriminatedUnion('featureKey', [
  z.strictObject({ ...evidenceShape, featureKey: z.enum(['audible_signal', 'traffic_signals', 'steps', 'handrail', 'separated_footway', 'shared_cycle_path', 'temporary_obstruction']), value: z.boolean() }),
  z.strictObject({ ...evidenceShape, featureKey: z.literal('tactile_paving'), value: TactileSchema }),
  z.strictObject({ ...evidenceShape, featureKey: z.literal('surface'), value: SurfaceSchema }),
]).superRefine((evidence, ctx) => {
  if (evidence.verificationStatus === 'field_verified' && evidence.verifiedAt === null) {
    ctx.addIssue({ code: 'custom', path: ['verifiedAt'], message: 'Field verification requires a date' });
  }
  if (evidence.verificationStatus !== 'field_verified' && evidence.verifiedAt !== null) {
    ctx.addIssue({ code: 'custom', path: ['verifiedAt'], message: 'Verification date requires field_verified status' });
  }
});
export const PublicSourceSchema = z.strictObject({
  id: IdSchema, kind: z.enum(['synthetic', 'osm', 'municipal', 'field_survey', 'moderated_report']),
  name: TextSchema, sourceUrl: z.url({ protocol: /^https?$/ }).nullable(),
  attribution: TextSchema, license: TextSchema, lastFetchedAt: UtcSchema.nullable(),
  status: z.enum(['ok', 'degraded', 'unavailable']),
}).refine((source) => source.kind === 'synthetic' || source.sourceUrl !== null, 'Non-synthetic source requires a public URL');
export type Evidence = z.infer<typeof EvidenceSchema>;
export type PublicSource = z.infer<typeof PublicSourceSchema>;
