import { z } from 'zod';
import { CapabilitySchema, CoordinateSchema, EligibilitySchema, EnvelopeShape, IdSchema, ModeSchema, PolicySchema, PolygonSchema, TextSchema, UtcSchema } from './common';
import { EvidenceSchema, PublicSourceSchema } from './evidence';

const modeShape = { mode: ModeSchema, navigationEligibility: EligibilitySchema };
function modeCheck(value: z.infer<typeof ModeSchema>, eligibility: z.infer<typeof EligibilitySchema>, ctx: z.RefinementCtx) {
  if (value === 'synthetic' && eligibility !== 'preview_only') ctx.addIssue({ code: 'custom', path: ['navigationEligibility'], message: 'Synthetic requires preview_only' });
}
export const CoverageResponseSchema = z.strictObject({
  ...EnvelopeShape, ...modeShape, cityId: IdSchema, name: TextSchema, description: TextSchema,
  capabilities: z.array(CapabilitySchema), polygon: PolygonSchema.nullable(), policy: PolicySchema,
}).superRefine((value, ctx) => {
  modeCheck(value.mode, value.navigationEligibility, ctx);
  if (value.mode === 'pilot' && value.polygon === null) ctx.addIssue({ code: 'custom', path: ['polygon'], message: 'Pilot requires coverage polygon' });
  if (value.mode === 'synthetic' && (value.polygon !== null || value.capabilities.some((c) => c !== 'catalog_routes'))) ctx.addIssue({ code: 'custom', message: 'Synthetic catalog has no field capabilities or real coverage' });
});
export const PlacesQuerySchema = z.strictObject({ cityId: IdSchema, query: z.union([z.literal(''), z.string().min(2).max(100)]) });
export const PlaceSchema = z.strictObject({ id: IdSchema, cityId: IdSchema, name: TextSchema, description: TextSchema, coordinate: CoordinateSchema.nullable() });
export const PlacesResponseSchema = z.strictObject({ ...EnvelopeShape, ...modeShape, cityId: IdSchema, places: z.array(PlaceSchema).max(10) }).superRefine((value, ctx) => {
  modeCheck(value.mode, value.navigationEligibility, ctx);
  if (new Set(value.places.map((p) => p.id)).size !== value.places.length) ctx.addIssue({ code: 'custom', path: ['places'], message: 'Duplicate places' });
  value.places.forEach((place, index) => {
    if (place.cityId !== value.cityId) ctx.addIssue({ code: 'custom', path: ['places', index, 'cityId'], message: 'City mismatch' });
    if ((value.mode === 'synthetic') !== (place.coordinate === null)) ctx.addIssue({ code: 'custom', path: ['places', index, 'coordinate'], message: 'Synthetic has no real coordinates; pilot requires coordinates' });
  });
});
export const SourcesResponseSchema = z.strictObject({ ...EnvelopeShape, mode: ModeSchema, sources: z.array(PublicSourceSchema) }).superRefine((value, ctx) => {
  if (new Set(value.sources.map((s) => s.id)).size !== value.sources.length) ctx.addIssue({ code: 'custom', message: 'Duplicate sources' });
  if (value.sources.some((s) => (s.kind === 'synthetic') !== (value.mode === 'synthetic'))) ctx.addIssue({ code: 'custom', message: 'Source mode mismatch' });
});
export const FeatureEvidenceResponseSchema = z.strictObject({
  ...EnvelopeShape, mode: ModeSchema, objectId: IdSchema, evidenceVersion: IdSchema,
  evidence: z.array(EvidenceSchema), sources: z.array(PublicSourceSchema),
}).superRefine((value, ctx) => {
  const sources = new Set(value.sources.map((s) => s.id));
  if (sources.size !== value.sources.length || new Set(value.evidence.map((e) => e.id)).size !== value.evidence.length) ctx.addIssue({ code: 'custom', message: 'Duplicate catalog IDs' });
  if (value.sources.some((s) => (s.kind === 'synthetic') !== (value.mode === 'synthetic'))) ctx.addIssue({ code: 'custom', message: 'Source mode mismatch' });
  value.evidence.forEach((e, i) => {
    if (!sources.has(e.sourceId) || e.objectId !== value.objectId) ctx.addIssue({ code: 'custom', path: ['evidence', i], message: 'Evidence reference mismatch' });
  });
});
export const HealthResponseSchema = z.strictObject({ status: z.literal('ok') });
export const ReadyResponseSchema = z.strictObject({
  ...EnvelopeShape, status: z.enum(['ready', 'not_ready']), checkedAt: UtcSchema,
  checks: z.strictObject({ database: z.boolean(), graph: z.boolean(), contract: z.boolean() }),
}).refine((r) => (r.status === 'ready') === (r.checks.database && r.checks.graph && r.checks.contract), 'Readiness checks must match status');
export type CoverageResponse = z.infer<typeof CoverageResponseSchema>;
export type PlacesResponse = z.infer<typeof PlacesResponseSchema>;
