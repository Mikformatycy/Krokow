import { z } from 'zod';
import { CoordinateSchema, EnvelopeShape, IdSchema, ModeSchema, TextSchema, UtcSchema } from './common';
import { PublicSourceSchema } from './evidence';

/** Additive endpoint. Existing draft.2 places/routes remain unchanged. */
export const PLACE_SEARCH_VERSION = 'place-search-1' as const;
export const PlaceSearchQuerySchema = z.strictObject({
  cityId: IdSchema, query: z.union([z.literal(''), z.string().min(2).max(100)]),
});
export const PlaceSearchItemSchema = z.strictObject({
  id: IdSchema, name: TextSchema, address: TextSchema.nullable(),
  kind: z.enum(['address', 'street', 'poi', 'entrance']),
  coordinate: CoordinateSchema.nullable(),
  positionKind: z.enum(['mapped_point', 'representative_point']),
  sourceId: IdSchema, sourceRecordId: IdSchema, sourceModifiedAt: UtcSchema.nullable(),
  routing: z.discriminatedUnion('status', [
    z.strictObject({ status: z.literal('available'), cityId: IdSchema, placeId: IdSchema }),
    z.strictObject({ status: z.literal('unavailable'), reason: z.enum(['outside_coverage', 'unresolved']) }),
  ]),
}).superRefine((place, ctx) => {
  if (place.routing.status === 'available' && place.positionKind !== 'mapped_point') {
    ctx.addIssue({ code: 'custom', path: ['routing'], message: 'A representative point is not a proven route endpoint' });
  }
});
export const PlaceSearchResponseSchema = z.strictObject({
  ...EnvelopeShape, searchVersion: z.literal(PLACE_SEARCH_VERSION),
  mode: ModeSchema, navigationEligibility: z.literal('preview_only'),
  cityId: IdSchema, areaName: TextSchema, catalogVersion: IdSchema, fetchedAt: UtcSchema,
  catalogSize: z.number().int().min(1).max(1_000_000),
  total: z.number().int().min(0).max(1_000_000), hasMore: z.boolean(),
  places: z.array(PlaceSearchItemSchema).max(10), sources: z.array(PublicSourceSchema).min(1).max(10),
}).superRefine((value, ctx) => {
  const sources = new Set(value.sources.map(source => source.id));
  if (sources.size !== value.sources.length || new Set(value.places.map(place => place.id)).size !== value.places.length) {
    ctx.addIssue({ code: 'custom', message: 'Duplicate catalog IDs' });
  }
  if (value.total > value.catalogSize || value.total < value.places.length || value.hasMore !== (value.total > value.places.length)) {
    ctx.addIssue({ code: 'custom', message: 'Inconsistent result count' });
  }
  if (value.sources.some(source => (source.kind === 'synthetic') !== (value.mode === 'synthetic'))) {
    ctx.addIssue({ code: 'custom', message: 'Source mode mismatch' });
  }
  value.places.forEach((place, index) => {
    if (!sources.has(place.sourceId) || (place.coordinate === null) !== (value.mode === 'synthetic')) {
      ctx.addIssue({ code: 'custom', path: ['places', index], message: 'Invalid source reference or coordinate mode' });
    }
  });
});
export type PlaceSearchItem = z.infer<typeof PlaceSearchItemSchema>;
export type PlaceSearchResponse = z.infer<typeof PlaceSearchResponseSchema>;
