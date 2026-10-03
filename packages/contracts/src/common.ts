import { z } from 'zod';

export const SCHEMA_VERSION = '1.0.0-draft.2';
export const IdSchema = z.string().min(1).max(160);
export const TextSchema = z.string().min(1).max(500);
export const UtcSchema = z.iso.datetime({ offset: false });
export const NonnegativeSchema = z.number().finite().nonnegative();
export const CountSchema = z.number().int().nonnegative();
export const IdsSchema = z.array(IdSchema).refine((ids) => new Set(ids).size === ids.length, 'Duplicate IDs');
export const VersionSetSchema = z.strictObject({
  graphVersion: IdSchema, evidenceVersion: IdSchema, policyVersion: IdSchema,
});
export const PolicySchema = z.strictObject({
  policyVersion: IdSchema, fieldVerificationMaxAgeDays: z.number().int().positive(),
});
export const EnvelopeShape = { schemaVersion: z.literal(SCHEMA_VERSION), requestId: IdSchema };
export const CoordinateSchema = z.tuple([
  z.number().finite().min(-180).max(180), z.number().finite().min(-90).max(90),
]);
export const LineStringSchema = z.strictObject({
  type: z.literal('LineString'), coordinates: z.array(CoordinateSchema).min(2),
});
const RingSchema = z.array(CoordinateSchema).min(4).refine((points) => {
  const first = points[0]; const last = points.at(-1);
  return first?.[0] === last?.[0] && first?.[1] === last?.[1];
}, 'Polygon ring must close');
export const PolygonSchema = z.strictObject({ type: z.literal('Polygon'), coordinates: z.array(RingSchema).min(1) });
export const ModeSchema = z.enum(['synthetic', 'pilot']);
export const EligibilitySchema = z.enum(['preview_only', 'foreground_experimental']);
export const CapabilitySchema = z.enum(['catalog_routes', 'coordinate_endpoints', 'foreground_navigation']);
export const EndpointSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('place'), placeId: IdSchema }),
  z.strictObject({ kind: z.literal('coordinate'), latitude: z.number().finite().min(-90).max(90), longitude: z.number().finite().min(-180).max(180) }),
]);
export const PreferencesSchema = z.strictObject({
  preferAudibleSignals: z.boolean(), preferTactilePaving: z.boolean(),
  preferSeparatedFootways: z.boolean(), avoidKnownSteps: z.boolean(),
  audibleRequirement: z.enum(['none', 'documented', 'field_verified_recent']),
  maxDetourRatio: z.number().finite().min(1).max(2),
});
export const RouteRequestSchema = z.strictObject({
  cityId: IdSchema, origin: EndpointSchema, destination: EndpointSchema,
  preferences: PreferencesSchema, maxAlternatives: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  locale: z.literal('pl-PL'), expectedVersions: VersionSetSchema.optional(),
});
export type RouteRequest = z.infer<typeof RouteRequestSchema>;
export type Preferences = z.infer<typeof PreferencesSchema>;
