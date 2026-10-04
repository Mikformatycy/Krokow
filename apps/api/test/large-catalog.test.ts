import { afterAll, describe, expect, it } from 'vitest';
import { PlacesResponseSchema, RouteResponseSchema } from '@krok/contracts';
import { createSyntheticSnapshot } from '@krok/routing/synthetic';
import { SYNTHETIC_POLICY } from '@krok/routing';
import { buildApi } from '../src/app';
import { createSnapshotServices } from '../src/routing';
import { validateDataset } from '../src/dataset';

// Deliberately synthetic catalog: repeated graph bindings test pagination boundaries.
const snapshot = createSyntheticSnapshot();
const target = snapshot.places[1]!;
snapshot.places.push(...Array.from({ length: 25 }, (_, i) => ({ ...target, id: `extra-${i}`, name: `Punkt próbny ${i}` })));
const services = createSnapshotServices(snapshot, SYNTHETIC_POLICY);
const api = buildApi({ ...services, databaseReady: () => Promise.resolve(false), logging: false });
afterAll(async () => { await api.close(); });

describe('full routing catalog with bounded HTTP search results', () => {
  it('retains all validated endpoints but sends at most ten suggestions', async () => {
    expect(services.dataset.places.places).toHaveLength(snapshot.places.length);
    const response = await api.inject(`/v1/places?cityId=${snapshot.cityId}&query=`);
    expect(response.statusCode).toBe(200);
    expect(PlacesResponseSchema.parse(response.json()).places).toHaveLength(10);
  });
  it('searches and routes to an endpoint beyond the first ten', async () => {
    const response = await api.inject(`/v1/places?cityId=${snapshot.cityId}&query=Punkt%20probny%2024`);
    const places = PlacesResponseSchema.parse(response.json()).places;
    expect(places.map(place => place.id)).toEqual(['extra-24']);
    const route = await api.inject({ method: 'POST', url: '/v1/routes', payload: {
      cityId: snapshot.cityId, origin: { kind: 'place', placeId: snapshot.places[0]!.id },
      destination: { kind: 'place', placeId: places[0]!.id }, locale: 'pl-PL', maxAlternatives: 3,
      preferences: { preferAudibleSignals: true, preferTactilePaving: false, preferSeparatedFootways: false,
        avoidKnownSteps: false, audibleRequirement: 'none', maxDetourRatio: 1.6 },
    } });
    expect(route.statusCode).toBe(200);
    expect(RouteResponseSchema.parse(route.json()).routes[0]!.steps.at(-1)!.params).toEqual({ placeName: 'Punkt próbny 24' });
  });
  it('rejects duplicate IDs across pages and invalid data on a later page', () => {
    const duplicate = structuredClone(services.dataset);
    duplicate.places.places[20]!.id = duplicate.places.places[0]!.id;
    expect(() => validateDataset(duplicate)).toThrow(/duplicate/);
    const invalid = structuredClone(services.dataset);
    invalid.places.places[20]!.coordinate = [19.9, 50.0];
    expect(() => validateDataset(invalid)).toThrow();
    const inconsistent = structuredClone(services.dataset);
    inconsistent.places.places[20]!.cityId = 'another-city';
    expect(() => validateDataset(inconsistent)).toThrow();
  });
});
