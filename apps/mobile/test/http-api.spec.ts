import { expect, test } from '@playwright/test';
import { createRouteResponse, errorScenarios, routeRequest, coverageResponse, placesResponse } from '@krok/contracts/fixtures';
import { HttpRouteApi, RequestTimeout, TransportUnavailable } from '../src/adapters/api/HttpRouteApi';
import { InvalidResponse, RouteFailure } from '../src/adapters/api/MockRouteApi';

const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });
test('free ngrok API requests suppress the browser interstitial without cookies or headers on other hosts', async () => {
  for (const [origin, needsHeader] of [
    ['https://preview.ngrok-free.dev', true], ['https://preview.ngrok-free.app', true],
    ['http://localhost:3001', false], ['https://ngrok-free.dev.example.com', false],
  ] as const) {
    const api = new HttpRouteApi(origin, (_input, init) => {
      expect(init?.credentials).toBe('omit');
      const headers = new Headers(init?.headers);
      expect(headers.get('ngrok-skip-browser-warning')).toBe(needsHeader ? '1' : null);
      return Promise.resolve(json(coverageResponse));
    });
    expect((await api.coverage()).cityId).toBe(coverageResponse.cityId);
  }
});
test('HTTP validates catalogs, encodes queries and sends only the route request', async () => {
  const calls: { url: string; init: RequestInit | undefined }[] = [];
  const api = new HttpRouteApi('http://localhost:3001', (input, init) => {
    if (typeof input !== 'string') throw new Error('Expected URL string');
    const url = input; calls.push({ url, init });
    return Promise.resolve(json(url.includes('/coverage') ? coverageResponse : url.includes('/places') ? placesResponse : createRouteResponse()));
  });
  expect((await api.coverage()).mode).toBe('synthetic');
  await api.places('synthetic-city', 'a&b');
  expect(calls[1]!.url).toContain('query=a%26b');
  await api.plan(routeRequest);
  expect(calls[2]!.init?.method).toBe('POST'); expect(calls[2]!.init?.credentials).toBe('omit');
  expect(calls[2]!.init?.body).toBe(JSON.stringify(routeRequest));
});
test('HTTP rejects HTML, malformed JSON, foreign schemas, misleading statuses and wrong request context', async () => {
  const foreign = { ...createRouteResponse(), schemaVersion: 'future' };
  const wrongCity = createRouteResponse(); wrongCity.dataContext.cityId = 'another-city';
  const error = errorScenarios.find((s) => s.id === 'NO_MATCHING_ROUTE')!.response;
  for (const response of [new Response('<html>error</html>'), new Response('{', { headers: { 'content-type': 'application/json' } }), json(foreign), json(wrongCity), json(error), json(error, 500), json(createRouteResponse(), 201)]) {
    const api = new HttpRouteApi('http://localhost:3001', () => Promise.resolve(response));
    await expect(api.plan(routeRequest)).rejects.toBeInstanceOf(InvalidResponse);
  }
});
test('HTTP validates actual hard requirements, versions, alternative and detour limits', async () => {
  const api = () => new HttpRouteApi('http://localhost:3001', () => Promise.resolve(json(createRouteResponse())));
  await expect(api().plan({ ...routeRequest, maxAlternatives: 1 })).rejects.toBeInstanceOf(InvalidResponse);
  await expect(api().plan({ ...routeRequest, preferences: { ...routeRequest.preferences, maxDetourRatio: 1 } })).rejects.toBeInstanceOf(InvalidResponse);
  await expect(api().plan({ ...routeRequest, preferences: { ...routeRequest.preferences, audibleRequirement: 'documented' } })).rejects.toBeInstanceOf(InvalidResponse);
  await expect(api().plan({ ...routeRequest, expectedVersions: { graphVersion: 'other', evidenceVersion: 'other', policyVersion: 'other' } })).rejects.toBeInstanceOf(InvalidResponse);
});
test('HTTP distinguishes validated server failure, connection failure and timeout without fixtures', async () => {
  const error = errorScenarios.find((s) => s.id === 'NO_MATCHING_ROUTE')!.response;
  await expect(new HttpRouteApi('http://localhost:3001', () => Promise.resolve(json(error, 422))).plan(routeRequest)).rejects.toBeInstanceOf(RouteFailure);
  await expect(new HttpRouteApi('http://localhost:3001', () => Promise.reject(new TypeError('offline'))).plan(routeRequest)).rejects.toBeInstanceOf(TransportUnavailable);
  const slowFetch: typeof fetch = (_input, init) => new Promise((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
  });
  await expect(new HttpRouteApi('http://localhost:3001', slowFetch, 5).plan(routeRequest)).rejects.toBeInstanceOf(RequestTimeout);
});
