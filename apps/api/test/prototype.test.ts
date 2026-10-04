import { afterAll, describe, expect, it } from 'vitest';
import { ApiErrorSchema, PlaceSearchResponseSchema, PlacesResponseSchema, RouteResponseSchema } from '@krok/contracts';
import { loadKrakowCityCatalog, loadKrakowPrototype } from '@krok/ingestion';
import { PILOT_POLICY } from '@krok/routing';
import { createCitySearch } from '../src/place-search';
import { createSnapshotServices } from '../src/routing';
import { buildApi } from '../src/app';

const { snapshot } = await loadKrakowPrototype();
const api = buildApi({ ...createSnapshotServices(snapshot, PILOT_POLICY),
  placeSearch: createCitySearch(await loadKrakowCityCatalog(), snapshot), logging: false, databaseReady: () => Promise.resolve(false) });
afterAll(async () => { await api.close(); });
const search = async (query: string) => PlaceSearchResponseSchema.parse((await api.inject(`/v1/place-search?cityId=krakow&query=${encodeURIComponent(query)}`)).json());
const preferences = { preferAudibleSignals: true, preferTactilePaving: true, preferSeparatedFootways: true,
  avoidKnownSteps: true, audibleRequirement: 'none', maxDetourRatio: 1.6 };

describe('prototype city search to route over HTTP', () => {
  it('finds the same real entrances for a dictated house number on both search endpoints', async () => {
    const numeric = await search('Pawia 5');
    const spoken = await search('pawia pięć');
    expect(spoken.places).toEqual(numeric.places);
    expect(spoken.total).toBe(numeric.total);
    expect(spoken.hasMore).toBe(numeric.hasMore);
    expect(spoken.places.some(place => place.name === 'Galeria Krakowska — wejście od Pawiej'
      && place.routing.status === 'available' && place.routing.placeId === 'osm-place-3719851597')).toBe(true);
    const legacy = async (query: string) => PlacesResponseSchema.parse((await api.inject(
      `/v1/places?cityId=${snapshot.cityId}&query=${encodeURIComponent(query)}`)).json());
    expect((await legacy('pawia pięć')).places).toEqual((await legacy('Pawia 5')).places);
  });

  it('finds routable named points alongside ordinary city addresses', async () => {
    for (const query of ['Rynek Glowny', 'Florianska', 'Maly Rynek', 'Kanonicza', 'Rajska 1', 'Pawia 7']) {
      const result = await search(query);
      expect(result.places.some(place => place.routing.status === 'available'), query).toBe(true);
    }
    const broad = await search('Nowa Huta');
    expect(broad.places.length).toBeGreaterThan(0);
    expect(broad.places.every(place => place.routing.status === 'unavailable')).toBe(true);
  });
  it('uses actual returned endpoint IDs to compute route information', async () => {
    const origin = (await search('Rynek Glowny')).places.find(place => place.routing.status === 'available')!;
    const destination = (await search('Florianska')).places.find(place => place.routing.status === 'available')!;
    expect(origin.kind).toBe('poi');
    if (origin.routing.status !== 'available' || destination.routing.status !== 'available') throw new Error('Missing endpoints');
    const response = await api.inject({ method: 'POST', url: '/v1/routes', payload: {
      cityId: origin.routing.cityId, origin: { kind: 'place', placeId: origin.routing.placeId },
      destination: { kind: 'place', placeId: destination.routing.placeId }, locale: 'pl-PL', maxAlternatives: 3, preferences,
    } });
    expect(response.statusCode).toBe(200);
    const route = RouteResponseSchema.parse(response.json());
    expect(route.routes[0]!.geometry!.coordinates[0]).toEqual(origin.coordinate);
    expect(route.routes[0]!.geometry!.coordinates.at(-1)).toEqual(destination.coordinate);
    expect(route.sourceCatalog[0]!.kind).toBe('osm');
    const edgeIds = new Set(route.routes.flatMap(option => option.edgeIds));
    const objectIds = new Set(snapshot.graph.edges.filter(edge => edgeIds.has(edge.id)).map(edge => edge.objectId));
    expect(route.evidenceCatalog).toEqual(snapshot.evidence.filter(e => objectIds.has(e.objectId)));
    expect(route.evidenceCatalog.some(e => e.featureKey === 'surface')).toBe(true);
    expect(route.evidenceCatalog.every(e => e.verificationStatus === 'unverified' && e.verifiedAt === null)).toBe(true);
  });
  it('keeps the legacy endpoint functional for a place beyond ten suggestions', async () => {
    const response = await api.inject(`/v1/places?cityId=${snapshot.cityId}&query=Rajska`);
    const named = await api.inject(`/v1/places?cityId=${snapshot.cityId}&query=Biblioteka`);
    expect(response.statusCode).toBe(200);
    expect(PlacesResponseSchema.parse(response.json()).places.map(p => p.id)).toContain('osm-place-752177530');
    expect(PlacesResponseSchema.parse(named.json()).places.map(p => p.id)).toContain('osm-place-752177530');
  });
  it('shows ten initial choices while reporting all thirty available endpoints', async () => {
    const response = await search('');
    expect(response.places).toHaveLength(10);
    expect(response.total).toBe(30); expect(response.hasMore).toBe(true);
    expect(response.places.every(place => place.routing.status === 'available')).toBe(true);
  });
  it('returns a typed NO_PATH between disconnected real endpoints', async () => {
    const response = await api.inject({ method: 'POST', url: '/v1/routes', payload: {
      cityId: snapshot.cityId, origin: { kind: 'place', placeId: 'osm-place-14121238341' },
      destination: { kind: 'place', placeId: 'osm-place-3719851597' }, locale: 'pl-PL', maxAlternatives: 3, preferences,
    } });
    expect(ApiErrorSchema.parse(response.json()).error.code).toBe('NO_PATH');
  });
});
