import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { HttpRouteApi } from '../../src/adapters/api/HttpRouteApi';
import { demoRequest, InvalidResponse, RouteFailure } from '../../src/adapters/api/MockRouteApi';
import { speechText } from '../../src/features/planning/speechText';
import { prepareSimulation } from '../../src/features/simulation/plan';
import { details, formSettings } from '../ui-helpers';

const origin = 'http://127.0.0.1:3003';
const input = { ...demoRequest(), cityId: 'krakow-stare-miasto-pilot',
  origin: { kind: 'place' as const, placeId: 'osm-place-3719851597' },
  destination: { kind: 'place' as const, placeId: 'osm-place-5213212813' } };
const startName = 'Start: Galeria Krakowska — wejście od Pawiej';
const endName = 'Cel: High5ive, budynek 1 — wejście zachodnie';

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
  await expect(page.getByText(/Kraków — okolice Galerii Krakowskiej/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Użyj przykładu A/B/C' })).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Start: szukaj punktu' }).fill('Galeria');
  await page.getByRole('button', { name: startName, exact: true }).click();
  await page.getByRole('button', { name: endName, exact: true }).click();
}

test('real points yield a short plan with sources and unknowns, without synthetic simulation or GPS', async ({ page }, testInfo) => {
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => Object.defineProperty(navigator, 'geolocation', { value: {
    getCurrentPosition() { throw new Error('Unexpected GPS'); }, watchPosition() { throw new Error('Unexpected GPS'); },
  } }));
  await choose(page);
  await page.getByRole('button', { name: 'Oblicz trasy', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Twój plan' })).toBeFocused();
  await expect(page.getByText(/Źródła:.*OpenStreetMap/)).toBeVisible();
  await expect(page.getByText(/Akustyka: brak danych — [1-9]/)).toBeVisible();
  await expect(page.getByTestId('simulation')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /symulacj/i })).toHaveCount(0);
  await expect(page.getByText(/fikcyjne|syntetyczn/i)).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('pilot-plan.png'), fullPage: true });
  await details(page, 'Tekst i opcje odsłuchu');
  await expect(page.getByText(/^To podgląd planu na rzeczywistych danych/)).toBeVisible();
  await details(page, 'Porównaj trasy i sprawdź źródła');
  await expect(page.getByText(/Źródło rzeczywistych danych/)).toBeVisible();
  await expect(page.getByText(/Licencja:.*ODbL/)).toBeVisible();
  expect(errors).toEqual([]);
});

test('pilot no-match preserves the explicit hard requirement and never substitutes examples', async ({ page }) => {
  await choose(page); await formSettings(page);
  const hard = page.getByRole('button', { name: 'Wymagaj opisanej obecności akustyki bez konfliktu' });
  await hard.click(); await page.getByRole('button', { name: 'Ustawienia trasy', exact: true }).click();
  await page.getByRole('button', { name: 'Oblicz trasy', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Brak trasy spełniającej wybrane wymagania');
  await expect(page.getByText('Akustyka: wymagana opisana obecność bez konfliktu.')).toBeVisible();
  await expect(page.getByTestId('simulation')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Twój plan' })).toHaveCount(0);
  await formSettings(page); await expect(hard).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: startName, exact: true })).toHaveAttribute('aria-pressed', 'true');
});
