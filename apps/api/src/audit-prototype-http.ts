import { writeFile } from 'node:fs/promises';
import { ApiErrorSchema, CoverageResponseSchema, PlaceSearchResponseSchema, RouteResponseSchema } from '@krok/contracts';

// Fixed public demonstration points only. No user input, GPS or personal route history.
const base = new URL(process.argv[2] ?? 'http://127.0.0.1:3003');
if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password) throw new Error('Expected HTTP API base without credentials');
const headers = base.hostname.endsWith('.ngrok-free.dev') || base.hostname.endsWith('.ngrok-free.app')
  ? { 'ngrok-skip-browser-warning': '1' } : {};
async function request(path: string, payload?: unknown) {
  const response = await fetch(new URL(path, base), { method: payload ? 'POST' : 'GET',
    headers: { ...headers, ...(payload ? { 'Content-Type': 'application/json' } : {}) },
    ...(payload ? { body: JSON.stringify(payload) } : {}), signal: AbortSignal.timeout(15_000) });
  const value: unknown = await response.json();
  return { status: response.status, value };
}
const coverage = CoverageResponseSchema.parse((await request('/v1/coverage')).value);
const suggestions = PlaceSearchResponseSchema.parse((await request('/v1/place-search?cityId=krakow&query=')).value);
if (coverage.mode !== 'pilot' || suggestions.total !== 30) throw new Error('Wrong prototype dataset');
const checks: Record<string, unknown>[] = [];
const preferences = { preferAudibleSignals: true, preferTactilePaving: true, preferSeparatedFootways: true,
  avoidKnownSteps: true, audibleRequirement: 'none', maxDetourRatio: 1.6 };
for (const [originQuery, destinationQuery] of [['Rynek Glowny', 'Florianska'], ['Maly Rynek', 'Plac Mariacki'], ['Galeria Pawiej', 'High5ive zachodnie']]) {
  const endpoints = [];
  for (const query of [originQuery!, destinationQuery!]) {
    const result = PlaceSearchResponseSchema.parse((await request(`/v1/place-search?cityId=krakow&query=${encodeURIComponent(query)}`)).value);
    const point = result.places.find(place => place.routing.status === 'available');
    if (!point || point.routing.status !== 'available') throw new Error('Expected routable search result');
    endpoints.push({ ...point, routing: point.routing });
  }
  const [origin, destination] = endpoints;
  if (!origin || !destination) throw new Error('Missing demonstration points');
  const before = performance.now();
  const result = await request('/v1/routes', { cityId: origin.routing.cityId,
    origin: { kind: 'place', placeId: origin.routing.placeId }, destination: { kind: 'place', placeId: destination.routing.placeId },
    preferences, locale: 'pl-PL', maxAlternatives: 3 });
  const parsed = RouteResponseSchema.parse(result.value);
  if (result.status !== 200 || parsed.mode !== 'pilot' || parsed.navigationEligibility !== 'preview_only') throw new Error('Invalid route response');
  for (const route of parsed.routes) if (JSON.stringify(route.geometry?.coordinates[0]) !== JSON.stringify(origin.coordinate)
    || JSON.stringify(route.geometry?.coordinates.at(-1)) !== JSON.stringify(destination.coordinate)) throw new Error('Wrong route endpoints');
  const selected = parsed.routes.find(route => route.id === parsed.recommendation.routeId)!;
  checks.push({ origin: origin.name, destination: destination.name, http: result.status,
    distanceM: selected.metrics.distanceM, crossings: selected.metrics.crossingStageCount,
    calculation: parsed.calculation.status, graphVersion: parsed.dataContext.graphVersion,
    durationMs: Math.round(performance.now() - before) });
}
for (const scenario of [
  { from: 'osm-place-14121238341', to: 'osm-place-3719851597', audibleRequirement: 'none', code: 'NO_PATH' },
  { from: 'osm-place-3719851597', to: 'osm-place-5213212813', audibleRequirement: 'documented', code: 'NO_MATCHING_ROUTE' },
]) {
  const response = await request('/v1/routes', { cityId: coverage.cityId, origin: { kind: 'place', placeId: scenario.from },
    destination: { kind: 'place', placeId: scenario.to }, preferences: { ...preferences, audibleRequirement: scenario.audibleRequirement }, locale: 'pl-PL', maxAlternatives: 3 });
  const code = ApiErrorSchema.parse(response.value).error.code;
  if (code !== scenario.code) throw new Error('Unexpected route error');
  checks.push({ expected: scenario.code, actual: code, http: response.status });
}
const report = { checkedAt: new Date().toISOString(), baseUrl: base.origin, catalogSize: suggestions.catalogSize, routePoints: suggestions.total, checks };
if (process.argv[3]) await writeFile(process.argv[3], JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
