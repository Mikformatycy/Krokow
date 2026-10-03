import { z } from 'zod';
import { CountSchema, IdSchema, IdsSchema, NonnegativeSchema, UtcSchema } from './common';

const reason = <C extends string, P extends z.ZodType>(code: C, params: P) =>
  z.strictObject({ code: z.literal(code), params, evidenceIds: IdsSchema });
export const RouteReasonSchema = z.discriminatedUnion('code', [
  reason('SHORTER_DISTANCE', z.strictObject({ distanceM: NonnegativeSchema })),
  reason('MORE_DOCUMENTED_AUDIBLE_SIGNALS', z.strictObject({ routePresentCount: CountSchema, baselinePresentCount: CountSchema })),
  reason('FEWER_UNKNOWN_AUDIBLE_SIGNALS', z.strictObject({ routeUnknownCount: CountSchema, baselineUnknownCount: CountSchema })),
  reason('FEWER_CROSSING_STAGES', z.strictObject({ routeStageCount: CountSchema, baselineStageCount: CountSchema })),
  reason('DETOUR_FOR_PREFERENCES', z.strictObject({ extraDistanceM: NonnegativeSchema })),
]);
const warning = <C extends string, K extends string, P extends z.ZodType>(code: C, messageKey: K, params: P) =>
  z.strictObject({ code: z.literal(code), severity: z.enum(['info', 'warning', 'critical']), messageKey: z.literal(messageKey), params, evidenceIds: IdsSchema });
export const WarningSchema = z.discriminatedUnion('code', [
  warning('SYNTHETIC_DATA', 'warning.synthetic_data', z.strictObject({})),
  warning('MISSING_FEATURE_DATA', 'warning.missing_feature_data', z.strictObject({ objectId: IdSchema, featureKey: z.enum(['audible_signal', 'tactile_paving']) })),
  warning('CONFLICTING_FEATURE_DATA', 'warning.conflicting_feature_data', z.strictObject({ objectId: IdSchema, featureKey: z.enum(['audible_signal', 'tactile_paving']) })),
  warning('SNAPSHOT_STALE', 'warning.snapshot_stale', z.strictObject({ snapshotFetchedAt: UtcSchema })),
  warning('SOURCE_DEGRADED', 'warning.source_degraded', z.strictObject({ sourceIds: IdsSchema.min(1) })),
  warning('SEARCH_BUDGET_LIMITED', 'warning.search_budget_limited', z.strictObject({})),
]);
export type RouteReason = z.infer<typeof RouteReasonSchema>;
export type Warning = z.infer<typeof WarningSchema>;
