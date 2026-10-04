import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { HttpRouteApi } from '../../src/adapters/api/HttpRouteApi';
import { demoRequest, InvalidResponse, RouteFailure } from '../../src/adapters/api/MockRouteApi';
import { speechText } from '../../src/features/planning/speechText';
import { prepareSimulation } from '../../src/features/simulation/plan';
import { calculate, closeSettings, details, heading, openSettings } from '../ui-helpers';

const configuredApiUrl: unknown = process.env['PILOT_TEST_API_URL'];
const origin = typeof configuredApiUrl === 'string' ? configuredApiUrl : 'http://127.0.0.1:3003';
const input = { ...demoRequest(), cityId: 'krakow-stare-miasto-pilot',
  origin: { kind: 'place' as const, placeId: 'osm-place-3719851597' },
  destination: { kind: 'place' as const, placeId: 'osm-place-5213212813' } };
const startName = 'Galeria Krakowska — wejście od Pawiej';
const endName = 'High5ive, budynek 1 — wejście zachodnie';

test('real pilot HTTP validates geometry, uncertainty, requirements and preview-only playback', async () => {
  const api = new HttpRouteApi(origin);
  const coverage = await api.coverage();
  expect(coverage.mode).toBe('pilot'); expect(coverage.polygon).not.toBeNull();
  const places = await api.places(coverage.cityId, 'Galeria');
  expect(places.places.length).toBeGreaterThan(0);
  expect(places.places.every((place) => place.coordinate !== null && place.name.includes('Galeria'))).toBe(true);
  const result = await api.plan(input);
  expect(result.mode).toBe('pilot'); expect(result.navigationEligibility).toBe('preview_only');
  expect(result.routes[0]!.geometry?.type).toBe('LineString');
  expect(result.routes[0]!.metrics.audibleSignals.unknown).toBeGreaterThan(0);
  const spoken = speechText(result.routes[0]!, result).join(' ');
  expect(spoken).toContain('rzeczywistych danych'); expect(spoken).not.toContain('fikcyjne');
  expect(spoken).toContain('Brak danych');
  expect(() => prepareSimulation(result, result.routes[0]!.id)).toThrow();
  for (const audibleRequirement of ['documented', 'field_verified_recent'] as const) {
    await expect(api.plan({ ...input, preferences: { ...input.preferences, audibleRequirement } })).rejects.toBeInstanceOf(RouteFailure);
  }
  for (const changed of [
    { ...result, navigationEligibility: 'foreground_experimental' },
    { ...result, mode: 'future' },
    { ...result, routes: result.routes.map((route) => ({ ...route, geometry: null })) },
  ]) {
    const client = new HttpRouteApi(origin, () => Promise.resolve(new Response(JSON.stringify(changed), { headers: { 'content-type': 'application/json' } })));
    await expect(client.plan(input)).rejects.toBeInstanceOf(InvalidResponse);
  }
  const lying = new HttpRouteApi(origin, () => Promise.resolve(new Response(JSON.stringify(result), { headers: { 'content-type': 'application/json' } })));
  await expect(lying.plan({ ...input, preferences: { ...input.preferences, audibleRequirement: 'documented' } })).rejects.toBeInstanceOf(InvalidResponse);
});

async function choose(page: Page) {
  await page.goto('/plan');
  await expect(page.getByTestId('data-label')).toHaveText('Dane OSM: tylko podgląd');
  await expect(page.getByRole('button', { name: 'Użyj przykładu A/B/C' })).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Wyszukaj start' }).fill('Pawia 5');
  await page.getByRole('button', { name: `${startName}. Pawia 5`, exact: true }).click();
  await page.getByRole('textbox', { name: 'Wyszukaj cel' }).fill('High5ive');
  await page.getByRole('button', { name: endName }).click();
  await expect(heading(page, 'Twoja trasa')).toBeVisible();
}

test('dictated address spelling finds the real entrance without rewriting the search field', async ({ page }) => {
  await page.goto('/plan');
  const search = page.getByRole('textbox', { name: 'Wyszukaj start' });
  await search.fill('pawia pięć');
  const entrance = page.getByRole('button', { name: `${startName}. Pawia 5`, exact: true });
  await expect(entrance).toBeVisible();
  await expect(search).toHaveValue('pawia pięć');
  await entrance.click();
  await expect(page.getByRole('textbox', { name: 'Wyszukaj cel' })).toBeVisible();
});

test('repeated final dictation text leaves ready search results selectable', async ({ page }) => {
  await page.goto('/plan');
  const search = page.getByRole('textbox', { name: 'Wyszukaj start' });
  await search.fill('pawia pięć');
  const entrance = page.getByRole('button', { name: `${startName}. Pawia 5`, exact: true });
  await expect(entrance).toBeEnabled();
  await search.evaluate((input: HTMLInputElement) => {
    const value = input.value;
    // Browsers normally suppress an unchanged input event; native dictation can repeat it.
    // Change React's value tracker, then restore the DOM value through the native setter.
    input.value = `${value} `;
    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!;
    descriptor.set!.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(search).toHaveValue('pawia pięć');
  await expect(entrance).toBeEnabled();
  await entrance.click();
  await expect(page.getByRole('textbox', { name: 'Wyszukaj cel' })).toBeVisible();
});

test('real points yield a short plan with sources and unknowns, without synthetic simulation or GPS', async ({ page }, testInfo) => {
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => Object.defineProperty(navigator, 'geolocation', { value: {
    getCurrentPosition() { throw new Error('Unexpected GPS'); }, watchPosition() { throw new Error('Unexpected GPS'); },
  } }));
  await choose(page);
  await calculate(page);
  await expect(heading(page, 'Twój plan')).toBeFocused();
  await expect(page.getByText(/Źródła:.*OpenStreetMap/)).toBeVisible();
  const summary = page.getByTestId('route-summary');
  await expect(summary).toContainText('420 m · około 6 min');
  await expect(summary).toContainText('1 przejście.');
  await expect(summary).toContainText('Brak danych o sygnalizacji dźwiękowej.');
  await expect(summary).not.toContainText(/Wariant|polecany/);
  const endpoints = page.getByTestId('route-endpoints');
  await expect(endpoints).toContainText('Galeria Krakowska → High5ive, budynek 1');
  await expect(endpoints).toContainText('wejście od Pawiej → wejście zachodnie');
  await expect(page.getByText(/Rekomendacja:/)).toHaveCount(0);
  await expect(page.getByTestId('simulation')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /symulacj/i })).toHaveCount(0);
  await expect(page.getByText(/fikcyjne|syntetyczn/i)).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('pilot-plan.png'), fullPage: true });
  await page.evaluate(() => { document.body.style.zoom = '2'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(endpoints).toContainText('wejście zachodnie');
  await page.evaluate(() => { document.body.style.zoom = '1'; });
  await details(page, 'Przebieg trasy');
  await expect(page.getByText(/^To podgląd planu na rzeczywistych danych/)).toBeVisible();
  await details(page, 'Porównanie, źródła i daty');
  await expect(page.getByText(/Źródło rzeczywistych danych/)).toBeVisible();
  await expect(page.getByText(/Licencja:.*ODbL/)).toBeVisible();
  await details(page, 'Informacje o odcinkach');
  await expect(page.getByText(/Nawierzchnia: nawierzchnia/).first()).toBeVisible();
  await expect(page.getByText(/wpis niezweryfikowany w terenie/).first()).toBeVisible();
  await expect(page.getByText(/Zmiana rekordu:.*Obserwacja: nieznana.*Potwierdzenie: nieznana/).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('searches the city, explains unavailable routing and returns to usable suggestions', async ({ page }) => {
  let routeRequests = 0;
  page.on('request', request => { if (request.url().endsWith('/v1/routes')) routeRequests++; });
  await page.goto('/plan');
  await page.getByRole('textbox', { name: 'Wyszukaj start' }).fill('Nowa Huta');
  await expect(page.locator('#root').getByText(/Znaleziono .*dla „Nowa Huta”/)).toBeVisible();
  const result = page.getByRole('button', { name: /Nowa Huta.*(Poza zasięgiem|Brak potwierdzonego)/ }).first();
  await result.click();
  await expect(page.getByRole('alert')).toContainText('Wybierz inny punkt');
  await expect(heading(page, 'Skąd idziesz?')).toBeVisible();
  expect(routeRequests).toBe(0);
  await page.getByRole('button', { name: 'Pokaż punkty z trasami', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Wyszukaj start' })).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Rynek Główny — punkt na ciągu pieszym', exact: true })).toBeFocused();
});

test('city search outage has a retry and does not silently use the small catalog', async ({ page }) => {
  let oldCatalogRequests = 0;
  page.on('request', request => { if (request.url().includes('/v1/places?')) oldCatalogRequests++; });
  await page.route('**/v1/place-search?**', route => route.abort());
  await page.goto('/plan');
  await expect(page.getByRole('alert')).toContainText('Nie można wczytać miejsc');
  expect(oldCatalogRequests).toBe(0);
  await page.unroute('**/v1/place-search?**');
  await page.getByRole('button', { name: 'Ponów wczytywanie' }).click();
  await expect(page.getByRole('button', { name: 'Rynek Główny — punkt na ciągu pieszym', exact: true })).toBeFocused();
});

test('return to route suggestions can be repeated after a failed request', async ({ page }) => {
  await page.goto('/plan');
  await page.getByRole('textbox', { name: 'Wyszukaj start' }).fill('Nowa Huta');
  const suggestions = page.getByRole('button', { name: 'Pokaż punkty z trasami', exact: true });
  await expect(suggestions).toBeVisible();
  await page.route('**/v1/place-search?**', route => route.abort());
  await suggestions.click();
  await expect(page.getByRole('alert')).toContainText('Nie można wczytać miejsc');
  await page.unroute('**/v1/place-search?**');
  await suggestions.click();
  await expect(page.getByRole('button', { name: 'Rynek Główny — punkt na ciągu pieszym', exact: true })).toBeFocused();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('pilot no-match preserves the explicit hard requirement and never substitutes examples', async ({ page }) => {
  await choose(page); await openSettings(page);
  const hard = page.getByRole('radio', { name: 'Wymagaj opisanej obecności akustyki bez konfliktu' });
  await hard.click(); await closeSettings(page);
  await calculate(page);
  await expect(page.getByRole('alert')).toContainText('Brak trasy spełniającej wybrane wymagania');
  await expect(page.getByText(/Akustyka: wymagana opisana obecność bez konfliktu./)).toBeVisible();
  await expect(page.getByTestId('simulation')).toHaveCount(0);
  await expect(heading(page, 'Twój plan')).toHaveCount(0);
  await openSettings(page); await expect(hard).toHaveAttribute('aria-checked', 'true');
  await closeSettings(page);
  await expect(page.getByRole('button', { name: `Skąd: ${startName}, Zmień start`, exact: true })).toBeVisible();
});

test('disconnected real points show no path without suggesting a preference change', async ({ page }) => {
  await page.goto('/plan');
  await page.getByRole('button', { name: 'Rynek Główny — punkt na ciągu pieszym', exact: true }).click();
  await page.getByRole('textbox', { name: 'Wyszukaj cel' }).fill('Galeria');
  await page.getByRole('button', { name: `${startName}. Pawia 5`, exact: true }).click();
  const response = page.waitForResponse(result => result.url().endsWith('/v1/routes'));
  await calculate(page);
  const failure = await response;
  expect(failure.status()).toBe(422);
  expect(await failure.json()).toMatchObject({ error: { code: 'NO_PATH' } });
  await expect(page.getByRole('alert')).toContainText('W dostępnych danych nie znaleziono połączenia pomiędzy tymi punktami. Ustawienia nie zostały zmienione.');
  await expect(page.getByRole('alert')).not.toContainText('zmienić preferencje');
  await expect(heading(page, 'Twój plan')).toHaveCount(0);
  await expect(page.getByTestId('simulation')).toHaveCount(0);
  await expect(page.getByRole('button', { name: `Dokąd: ${startName}, Zmień cel`, exact: true })).toBeVisible();
});
