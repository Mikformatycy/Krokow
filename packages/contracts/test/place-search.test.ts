import { describe, expect, it } from 'vitest';
import { PlaceSearchItemSchema, PlaceSearchQuerySchema, PlaceSearchResponseSchema } from '../src/place-search';
import { placeSearchResponse } from '../src/fixtures';

describe('additive city search contract', () => {
  it('distinguishes route-bound entrances, outside coverage and unresolved representative points', () => {
    expect(PlaceSearchResponseSchema.parse(placeSearchResponse)).toEqual(placeSearchResponse);
    expect(placeSearchResponse.places.map(p => p.routing.status)).toEqual(['available', 'unavailable', 'unavailable']);
  });
  it.each(['', 'Rynek Główny', 'Pawia 7', 'a'.repeat(100)])('accepts bounded query %s', query => {
    expect(PlaceSearchQuerySchema.safeParse({ cityId: 'krakow', query }).success).toBe(true);
  });
  it.each(['a', 'a'.repeat(101)])('rejects query length outside bounds', query => {
    expect(PlaceSearchQuerySchema.safeParse({ cityId: 'krakow', query }).success).toBe(false);
  });
  it('rejects fake routing through a representative point and unsupported states', () => {
    expect(PlaceSearchItemSchema.safeParse({ ...placeSearchResponse.places[0], positionKind: 'representative_point' }).success).toBe(false);
    expect(PlaceSearchItemSchema.safeParse({ ...placeSearchResponse.places[0], routing: { status: 'probably' } }).success).toBe(false);
  });
  it('rejects impossible counts, missing source references, duplicate IDs and real coordinates on synthetic', () => {
    for (const changed of [
      { ...placeSearchResponse, total: 1 }, { ...placeSearchResponse, hasMore: true }, { ...placeSearchResponse, sources: [] },
      { ...placeSearchResponse, searchVersion: 'future' }, { ...placeSearchResponse, navigationEligibility: 'foreground_experimental' },
      { ...placeSearchResponse, places: [placeSearchResponse.places[0], placeSearchResponse.places[0]] },
      { ...placeSearchResponse, places: [{ ...placeSearchResponse.places[0], coordinate: [19.9, 50.0] }] },
    ]) expect(PlaceSearchResponseSchema.safeParse(changed).success).toBe(false);
  });
});
