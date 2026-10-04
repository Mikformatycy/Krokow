import { expect, test } from '@playwright/test';
import { placeSearchResponse } from '@krok/contracts/fixtures';
import { HttpRouteApi } from '../src/adapters/api/HttpRouteApi';
import { InvalidResponse } from '../src/adapters/api/MockRouteApi';
import { searchCatalog } from '../src/features/planning/searchCatalog';

const cityId = 'krakow-stare-miasto-pilot';
const source = { id: 'osm', kind: 'osm', name: 'OpenStreetMap', attribution: '© OpenStreetMap contributors',
  sourceUrl: 'https://www.openstreetmap.org/copyright', license: 'ODbL 1.0', status: 'ok', lastFetchedAt: placeSearchResponse.fetchedAt };
const catalog = { ...placeSearchResponse, mode: 'pilot', cityId: 'krakow', catalogSize: 20, total: 2, hasMore: false, sources: [source],
  places: [
    { ...placeSearchResponse.places[0]!, id: 'search-point', name: 'Wybrany punkt', sourceId: 'osm', coordinate: [19.94, 50.06], positionKind: 'mapped_point',
      routing: { status: 'available', cityId, placeId: 'route-point' } },
    { ...placeSearchResponse.places[0]!, id: 'search-area', name: 'Obszar bez tras', sourceId: 'osm', coordinate: [19.95, 50.07], positionKind: 'representative_point',
      routing: { status: 'unavailable', reason: 'unresolved' } },
  ],
};
const client = (value: unknown) => new HttpRouteApi('https://example.test', () => Promise.resolve(new Response(JSON.stringify(value), { headers: { 'content-type': 'application/json' } })));

test('uses the explicit route binding and never a city search ID or centroid', async () => {
  const result = await searchCatalog(client(catalog), cityId, 'pilot', 'punkt');
  expect(result.choices[0]!.id).toBe('search-point');
  expect(result.choices[0]!.place?.id).toBe('route-point');
  expect(result.choices[1]!.place).toBeNull();
  expect(result.choices[1]!.detail).toContain('Brak potwierdzonego połączenia');
});
test('rejects cross-city bindings, unknown states and inconsistent response counts', async () => {
  for (const bad of [
    { ...catalog, places: [{ ...catalog.places[0]!, routing: { status: 'available', cityId: 'other', placeId: 'route-point' } }, catalog.places[1]!] },
    { ...catalog, places: [{ ...catalog.places[0]!, routing: { status: 'future' } }, catalog.places[1]!] },
    { ...catalog, total: 0 },
    { ...catalog, cityId: 'other' },
  ]) await expect(searchCatalog(client(bad), cityId, 'pilot', 'punkt')).rejects.toBeInstanceOf(InvalidResponse);
});
