import { expect, test } from '@playwright/test';
import { routeScenarios } from '@krok/contracts/fixtures';
import { back, calculate, closeSettings, details, example, heading, openSettings, toReview } from './ui-helpers';

test('computes routes over real HTTP, compares metrics and exposes evidence with keyboard', async ({ page }, testInfo) => {
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => { Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition() { throw new Error('Unexpected GPS'); }, watchPosition() { throw new Error('Unexpected GPS'); } } }); });
  await page.goto('/plan');
  await expect(page.getByTestId('data-source')).toHaveAttribute('aria-label', /^Przełącz na przykłady bez API, Teraz: obliczanie tras przez API/);
  await example(page);
  await calculate(page);
  await expect(page.getByTestId('route-summary')).toContainText('980 m');
  await expect(page.getByTestId('route-summary')).toContainText('Wariant 2, polecany');
  await details(page, 'Porównanie, źródła i daty');
  const recommended = page.getByTestId('route-card-2');
  await expect(recommended).toContainText('Rekomendowany');
  await expect(recommended).toContainText('Wariant dłuższy o 240 m');
  await recommended.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('computed-routes.png') });
  await expect(page.getByTestId('route-card-1')).toContainText('brak opisany: 1; brak danych: 1');
  await page.getByRole('button', { name: 'Pokaż przebieg i dowody wariantu 1' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Ukryj przebieg i dowody wariantu 1' })).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByText('Start: Fikcyjny start.', { exact: false }).last()).toBeVisible();
  await expect(page.getByText(/Źródło: Fikcyjny graf A\/B\/C/).first()).toBeVisible();
  await expect(page.getByText(/Brak opisany\. Deklaracja źródła/)).toBeVisible();
  await expect(page.getByText(/Brak danych — nie oznacza/).first()).toBeVisible();
  await openSettings(page);
  await page.getByRole('switch', { name: 'Preferuj opisaną sygnalizację dźwiękową' }).click();
  await closeSettings(page);
  await calculate(page);
  await expect(page.getByTestId('route-summary')).toContainText('740 m');
  await expect(page.getByTestId('route-summary')).toContainText('Wariant 1, polecany');
  await page.evaluate(() => { document.body.style.zoom = '2'; });
  await page.getByRole('button', { name: 'Nowa trasa', exact: true }).scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('preserves hard requirements on real API failure, then computes one constrained option', async ({ page }) => {
  await page.goto('/plan');
  await example(page);
  await openSettings(page);
  const requirement = page.getByRole('radio', { name: 'Wymagaj potwierdzenia w terenie w ciągu 180 dni' });
  await requirement.click(); await closeSettings(page);
  await calculate(page);
  await expect(page.getByRole('alert')).toContainText('Brak trasy spełniającej wybrane wymagania');
  await openSettings(page);
  await expect(requirement).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('radio', { name: 'Wymagaj opisanej obecności akustyki bez konfliktu' }).click();
  await page.getByRole('radio', { name: 'Maksymalnie 1', exact: true }).click();
  await closeSettings(page);
  await calculate(page);
  await expect(page.getByTestId('route-summary')).toContainText('980 m');
  await expect(page.getByTestId('route-summary')).not.toContainText('Wariant');
  await expect(page.getByRole('button', { name: /^Inne warianty/ })).toHaveCount(0);
  await details(page, 'Porównanie, źródła i daty');
  await expect(page.getByText(/Najkrótsza trasa spełniająca te same twarde wymagania: 980 m/)).toBeVisible();
});

test('does not replace network failure with a mock and allows explicit retry', async ({ page }) => {
  await page.goto('/plan');
  await example(page);
  await page.route('**/v1/routes', (route) => route.abort('failed'));
  await calculate(page);
  await expect(page.getByRole('alert')).toContainText('Brak połączenia z API');
  await expect(heading(page, 'Twój plan')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Oblicz trasy', exact: true })).toBeVisible();
  await page.unroute('**/v1/routes');
  await calculate(page);
  await expect(page.getByTestId('route-summary')).toContainText('980 m');
});

test('catalog outage has an explicit retry and no implicit mock', async ({ page }) => {
  await page.route('**/v1/coverage', (route) => route.abort('failed'));
  await page.goto('/plan');
  await expect(page.getByRole('alert')).toContainText('Brak połączenia z API');
  await expect(page.getByRole('button', { name: 'Użyj przykładu A/B/C' })).toHaveCount(0);
  await expect(page.getByTestId('data-source')).toBeVisible();
  await page.unroute('**/v1/coverage');
  await page.getByRole('button', { name: 'Ponów połączenie' }).click();
  await expect(page.getByRole('button', { name: 'Użyj przykładu A/B/C' })).toBeVisible();
});

test('ignores a delayed result after preferences change', async ({ page }) => {
  let release = () => {}; const gate = new Promise<void>((resolve) => { release = resolve; });
  let received = false; let delivered = false;
  await page.route('**/v1/routes', async (route) => {
    const response = await route.fetch(); received = true; await gate;
    await route.fulfill({ response }); delivered = true;
  });
  await page.goto('/plan');
  await example(page);
  await calculate(page);
  await expect.poll(() => received).toBe(true);
  await openSettings(page);
  await page.getByRole('switch', { name: 'Preferuj opisaną sygnalizację dźwiękową' }).click();
  release(); await expect.poll(() => delivered).toBe(true);
  await expect(heading(page, 'Twój plan')).toHaveCount(0);
  await expect(heading(page, 'Ustawienia trasy')).toBeVisible();
  await closeSettings(page);
  await page.unroute('**/v1/routes');
  await calculate(page);
  await expect(page.getByTestId('route-summary')).toContainText('740 m');
});

test('renders conflict and budget-limited warnings from validated contract scenarios', async ({ page }) => {
  const conflict = routeScenarios.find((s) => s.response.routes.some((r) => r.metrics.audibleSignals.conflicting > 0))!;
  await page.route('**/v1/routes', (route) => route.fulfill({ json: conflict.response }));
  await page.goto('/plan');
  await example(page);
  await calculate(page);
  await details(page, 'Porównanie, źródła i daty');
  await page.getByRole('button', { name: 'Pokaż przebieg i dowody wariantu 1' }).click();
  await expect(page.getByText('Sprzeczne informacje — źródła podają różne wartości.')).toBeVisible();
  await page.unroute('**/v1/routes');
  const limited = routeScenarios.find((s) => s.response.calculation.status === 'budget_limited')!;
  await page.route('**/v1/routes', (route) => route.fulfill({ json: limited.response }));
  await back(page); await toReview(page);
  await calculate(page);
  await expect(page.getByText(/Wynik częściowy: osiągnięto limit obliczeń/)).toBeVisible();
});
