import { z } from 'zod';
import { CountSchema, EligibilitySchema, EnvelopeShape, IdSchema, IdsSchema, LineStringSchema, ModeSchema, NonnegativeSchema, PolicySchema, TextSchema, UtcSchema, VersionSetSchema } from './common';
import { BooleanFactSchema, EvidenceSchema, PublicSourceSchema, TactileFactSchema } from './evidence';
import { RouteReasonSchema, WarningSchema } from './messages';
import { validateRouteResponse } from './validate-routes';

const stepShape = { id: IdSchema, startM: NonnegativeSchema, endM: NonnegativeSchema };
export const RouteStepSchema = z.discriminatedUnion('instructionKey', [
  z.strictObject({ ...stepShape, instructionKey: z.literal('route.start'), params: z.strictObject({ placeName: TextSchema }) }),
  z.strictObject({ ...stepShape, instructionKey: z.literal('route.follow_segment'), params: z.strictObject({ segmentName: TextSchema }) }),
  z.strictObject({ ...stepShape, instructionKey: z.literal('route.arrive'), params: z.strictObject({ placeName: TextSchema }) }),
]);
export const CrossingEventSchema = z.strictObject({
  id: IdSchema, kind: z.literal('crossing'), offsetM: NonnegativeSchema, objectId: IdSchema,
  crossingId: IdSchema, stageId: IdSchema, instructionKey: z.literal('route.crossing_approach'),
  facts: z.strictObject({ audible_signal: BooleanFactSchema, tactile_paving: TactileFactSchema }),
});
export const RouteMetricsSchema = z.strictObject({
  distanceM: z.number().finite().positive(), walkingDurationSec: NonnegativeSchema,
  assumedWalkingSpeedMps: z.number().finite().positive(), crossingWaitDurationSec: NonnegativeSchema.nullable(),
  extraDistanceM: NonnegativeSchema, crossingCount: CountSchema, crossingStageCount: CountSchema,
  audibleSignals: z.strictObject({ present: CountSchema, absent: CountSchema, unknown: CountSchema, conflicting: CountSchema }),
  unknownSegmentLengthM: NonnegativeSchema.nullable(),
});
export const RouteOptionSchema = z.strictObject({
  id: IdSchema, labels: z.array(z.enum(['shortest', 'recommended', 'better_documented', 'fewer_crossings'])),
  geometry: LineStringSchema.nullable(), edgeIds: IdsSchema.min(1), metrics: RouteMetricsSchema,
  steps: z.array(RouteStepSchema).min(2), events: z.array(CrossingEventSchema),
});
const RouteResponseShapeSchema = z.strictObject({
  ...EnvelopeShape, generatedAt: UtcSchema, asOf: UtcSchema, mode: ModeSchema,
  navigationEligibility: EligibilitySchema,
  dataContext: z.strictObject({ ...VersionSetSchema.shape, cityId: IdSchema, snapshotFetchedAt: UtcSchema, sourceStatus: z.enum(['ok', 'degraded']), sourceIds: IdsSchema.min(1) }),
  policy: PolicySchema,
  calculation: z.strictObject({ status: z.enum(['finished', 'budget_limited']), exhaustive: z.literal(false) }),
  baseline: z.strictObject({ distanceM: z.number().finite().positive(), walkingDurationSec: NonnegativeSchema, basis: z.literal('same_hard_constraints') }),
  routes: z.array(RouteOptionSchema).min(1).max(3),
  recommendation: z.strictObject({ routeId: IdSchema, reasons: z.array(RouteReasonSchema).min(1) }),
  evidenceCatalog: z.array(EvidenceSchema), sourceCatalog: z.array(PublicSourceSchema).min(1), warnings: z.array(WarningSchema),
});
export type RouteResponse = z.infer<typeof RouteResponseShapeSchema>;
export type RouteOption = z.infer<typeof RouteOptionSchema>;
export type CrossingEvent = z.infer<typeof CrossingEventSchema>;
export const RouteResponseSchema = RouteResponseShapeSchema.superRefine(validateRouteResponse);
