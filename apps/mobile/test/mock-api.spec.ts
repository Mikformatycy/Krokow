import { expect, test } from '@playwright/test';
import { createRouteResponse } from '@krok/contracts/fixtures';
import { DemoUnavailable, demoRequest, InvalidResponse, MockRouteApi, parseDemoResponse, RouteFailure } from '../src/adapters/api/MockRouteApi';
import { buildRequest } from '../src/features/planning/form';

test('mock matches the entire request and rejects unsupported preferences, endpoints and versions', async () => {
  const api = new MockRouteApi();
  const request = demoRequest();
  expect((await api.plan(request)).routes.map((route) => route.metrics.distanceM)).toEqual([740, 980, 1120]);
  expect((await api.plan({ ...request, maxAlternatives: 1 })).routes).toHaveLength(1);
  for (const changed of [
    { ...request, origin: request.destination, destination: request.origin },
    { ...request, maxAlternatives: 2 as const },
    { ...request, preferences: { ...request.preferences, avoidKnownSteps: true } },
    { ...request, preferences: { ...request.preferences, maxDetourRatio: 1.1 } },
    { ...request, expectedVersions: { graphVersion: 'other', evidenceVersion: 'other', policyVersion: 'other' } },
  ]) await expect(api.plan(changed)).rejects.toBeInstanceOf(DemoUnavailable);
});

test('hard requirements return the shared error and preserve input', async () => {
  const request = demoRequest();
  request.preferences.audibleRequirement = 'field_verified_recent';
  await expect(new MockRouteApi().plan(request)).rejects.toMatchObject({ response: { error: { code: 'NO_MATCHING_ROUTE', details: { blockingRequirements: ['audibleRequirement'] } } } });
  expect(request.preferences.audibleRequirement).toBe('field_verified_recent');
  await expect(new MockRouteApi().plan({ ...request, destination: request.origin })).rejects.toBeInstanceOf(RouteFailure);
});

test('client rejects unknown statuses and synthetic data permitting field navigation', () => {
  const response = createRouteResponse();
  expect(() => parseDemoResponse({ ...response, schemaVersion: 'future' })).toThrow(InvalidResponse);
  expect(() => parseDemoResponse({ ...response, navigationEligibility: 'foreground_experimental' })).toThrow(InvalidResponse);
  expect(() => parseDemoResponse({ ...response, calculation: { status: 'mystery', exhaustive: false } })).toThrow(InvalidResponse);
  expect(() => parseDemoResponse({ ...response, routes: [] })).toThrow(InvalidResponse);
});

test('catalog supports search and empty results without coordinates, and copies fixture data', async () => {
  const api = new MockRouteApi();
  const coverage = await api.coverage();
  const start = await api.places(coverage.cityId, 'START');
  expect(start.places.map((place) => place.id)).toEqual(['demo-start']);
  expect(start.places[0]?.coordinate).toBeNull();
  expect((await api.places(coverage.cityId, 'xyz')).places).toEqual([]);
  start.places.length = 0;
  expect((await api.places(coverage.cityId, '')).places).toHaveLength(2);
  expect(() => api.places(coverage.cityId, 'a')).toThrow();
});

test('form rejects missing or same endpoints and malformed detours before submission', () => {
  const request = demoRequest();
  const build = (start: string, end: string, detour: string) => buildRequest(request.cityId, start, end, request.preferences, detour, 3);
  expect(build('', '', '1,6')).toMatchObject({ field: 'origin' });
  expect(build('demo-start', '', '1,6')).toMatchObject({ field: 'destination' });
  expect(build('demo-start', 'demo-start', '1,6')).toMatchObject({ field: 'destination' });
  for (const detour of ['', '0.9', '2.1', 'Infinity', '1.6oops', '1e0']) expect(build('demo-start', 'demo-end', detour)).toMatchObject({ field: 'detour' });
  expect(build('demo-start', 'demo-end', '1,6')).toEqual(request);
});
