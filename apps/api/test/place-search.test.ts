import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Writable } from 'node:stream';
import { ApiErrorSchema, PlaceSearchResponseSchema } from '@krok/contracts';
import { loadKrakowCityCatalog, loadKrakowPilot } from '@krok/ingestion';
import { PILOT_POLICY } from '@krok/routing';
import { buildApi } from '../src/app';
import { createCitySearch } from '../src/place-search';
import { createSnapshotServices } from '../src/routing';

const catalog = await loadKrakowCityCatalog();
const { snapshot } = await loadKrakowPilot();
const service = createCitySearch(catalog, snapshot);
let logs = '';
const logStream = new Writable({ write(chunk: Buffer, _encoding, callback) { logs += chunk.toString(); callback(); } });
const api = buildApi({ ...createSnapshotServices(snapshot, PILOT_POLICY), placeSearch: service, databaseReady: () => Promise.resolve(false), logStream });
const url = (query: string, cityId = 'krakow') => `/v1/place-search?cityId=${cityId}&query=${encodeURIComponent(query)}`;
beforeAll(async () => { await api.ready(); });
afterAll(async () => { await api.close(); });

describe('whole Krakow search over real archived OSM', () => {
  it('indexes far more than ten places, keeps query results bounded and exposes source/date/version', async () => {
    const response = await api.inject(url('apteka'));
    expect(response.statusCode).toBe(200);
    const result = PlaceSearchResponseSchema.parse(response.json());
    expect(result.catalogSize).toBeGreaterThan(90_000);
    expect(result.places).toHaveLength(10); expect(result.total).toBeGreaterThan(10); expect(result.hasMore).toBe(true);
    expect(result.mode).toBe('pilot'); expect(result.sources[0]!.kind).toBe('osm');
    expect(result.fetchedAt).toBe(catalog.fetchedAt); expect(result.requestId).toBe(response.headers['x-request-id']);
    expect(response.headers['cache-control']).toBe('no-store');
  });
  it.each(['Rynek Glowny', 'Nowa Huta', 'Wawel', 'Pawia 5', 'Aleja Solidarnosci', 'Wolica'])('finds %s in the city, without granting fake route bindings', async query => {
    const result = PlaceSearchResponseSchema.parse((await api.inject(url(query))).json());
    expect(result.places.length).toBeGreaterThan(0);
    for (const place of result.places) if (place.positionKind === 'representative_point') expect(place.routing.status).toBe('unavailable');
  });
  it('allows only five exact pilot entrances, preserves their IDs and returns detached copies', async () => {
    const result = PlaceSearchResponseSchema.parse((await api.inject(url(''))).json());
    expect(result.places).toHaveLength(5);
    const ids = result.places.map(p => p.routing.status === 'available' ? p.routing.placeId : null);
    expect(ids.sort()).toEqual(snapshot.places.map(p => p.id).sort());
    result.places[0]!.name = 'mutated';
    expect(service.search('krakow', '', 'new').places[0]!.name).not.toBe('mutated');
    const addressMatches = service.search('krakow', 'Pawia 7', 'test').places.filter(place => place.routing.status === 'available');
    expect(addressMatches).toHaveLength(2); expect(addressMatches.every(place => place.address === 'Pawia 7')).toBe(true);
  });
  it('distinguishes no match from unavailable catalog and validates malformed input', async () => {
    const empty = PlaceSearchResponseSchema.parse((await api.inject(url('qzxqzxqzxqzx'))).json());
    expect(empty.places).toEqual([]); expect(empty.total).toBe(0);
    const unavailable = await api.inject(url('apteka', 'warszawa'));
    expect(unavailable.statusCode).toBe(503); expect(ApiErrorSchema.parse(unavailable.json()).error.code).toBe('SOURCE_UNAVAILABLE');
    for (const query of ['a', 'x'.repeat(101)]) expect((await api.inject(url(query))).statusCode).toBe(400);
    expect((await api.inject(url('apteka') + '&extra=private')).statusCode).toBe(400);
    const offline = buildApi({ databaseReady: () => Promise.resolve(false), logging: false });
    try { expect((await offline.inject(url('apteka'))).statusCode).toBe(503); } finally { await offline.close(); }
  });
  it('never routes a city POI by injecting its search ID into the old route endpoint', async () => {
    const found = service.search('krakow', 'Wawel', 'test').places[0]!;
    expect(found.routing).toEqual({ status: 'unavailable', reason: 'outside_coverage' });
    const response = await api.inject({ method: 'POST', url: '/v1/routes', payload: {
      cityId: snapshot.cityId, origin: { kind: 'place', placeId: found.id }, destination: { kind: 'place', placeId: snapshot.places[0]!.id },
      locale: 'pl-PL', maxAlternatives: 1, preferences: { preferAudibleSignals: true, preferTactilePaving: true,
        preferSeparatedFootways: true, avoidKnownSteps: true, audibleRequirement: 'none', maxDetourRatio: 1.6 },
    } });
    expect(ApiErrorSchema.parse(response.json()).error.code).toBe('UNRESOLVED_ENDPOINT');
  });
  it('does not log search phrases, headers, or coordinate/history data', async () => {
    const marker = 'private-search-987654';
    await api.inject({ url: url(marker), headers: { 'x-private': 'secret-header' } });
    await api.inject(url('prywatna pięć'));
    expect(logs).toContain('"endpoint":"/v1/place-search"');
    expect(logs).not.toContain(marker); expect(logs).not.toContain('secret-header');
    expect(logs).not.toContain('query=');
    expect(logs).not.toContain('prywatna');
  });
});
