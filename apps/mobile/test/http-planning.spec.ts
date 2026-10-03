import { expect, test } from '@playwright/test';
import { routeScenarios } from '@krok/contracts/fixtures';
import { demoOptions, details, editForm, formSettings } from './ui-helpers';

test('computes routes over real HTTP, compares metrics and exposes evidence with keyboard', async ({ page }, testInfo) => {
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => { Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition() { throw new Error('Unexpected GPS'); }, watchPosition() { throw new Error('Unexpected GPS'); } } }); });
  await page.goto('/plan');
  await demoOptions(page);
  await expect(page.getByRole('button', { name: 'Obliczanie tras przez API', exact: true })).toHaveAttribute('aria-pressed', 'true');
  // Re-selecting the active mode must not leave the catalog in permanent loading.
  await page.getByRole('button', { name: 'Obliczanie tras przez API', exact: true }).click();
  await page.getByRole('button', { name: 'Użyj przykładu A/B/C' }).click();
  await page.getByRole('button', { name: 'Oblicz trasy', exact: true }).click();
  await expect(page.getByText('Obliczono 3 warianty. Rekomendacja: 980 m.')).toBeVisible();
  await details(page, 'Porównaj trasy i sprawdź źródła');
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
  await formSettings(page);
  await page.getByRole('checkbox', { name: 'Preferuj opisaną sygnalizację dźwiękową' }).click();
  await expect(page.getByRole('heading', { name: 'Porównanie tras' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Oblicz trasy', exact: true }).click();
  await expect(page.getByText(/Obliczono .*Rekomendacja: 740 m/)).toBeVisible();
  await page.evaluate(() => { document.body.style.zoom = '2'; });
  await page.getByRole('link', { name: 'Wróć do początku' }).scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('preserves hard requirements on real API failure, then computes one constrained option', async ({ page }) => {
  await page.goto('/plan');
  await page.getByRole('button', { name: 'Użyj przykładu A/B/C' }).click();
  await formSettings(page);
  const requirement = page.getByRole('button', { name: 'Wymagaj potwierdzenia w terenie w ciągu 180 dni' });
  await requirement.click(); await page.getByRole('button', { name: 'Oblicz trasy', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Brak trasy spełniającej wybrane wymagania');
  await expect(requirement).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Wymagaj opisanej obecności akustyki bez konfliktu' }).click();
  await page.getByRole('button', { name: 'Maksymalnie 1', exact: true }).click();
  await page.getByRole('button', { name: 'Oblicz trasy', exact: true }).click();
  await expect(page.getByText('Obliczono 1 wariant. Rekomendacja: 980 m.')).toBeVisible();
  await details(page, 'Porównaj trasy i sprawdź źródła');
  await expect(page.getByText(/Najkrótsza trasa spełniająca te same twarde wymagania: 980 m/)).toBeVisible();
});

test('does not replace network failure with a mock and allows explicit retry', async ({ page }) => {
  await page.goto('/plan');
  await page.getByRole('button', { name: 'Użyj przykładu A/B/C' }).click();
  await page.route('**/v1/routes', (route) => route.abort('failed'));
  await page.getByRole('button', { name: 'Oblicz trasy', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Brak połączenia z API');
  await expect(page.getByRole('heading', { name: 'Porównanie tras' })).toHaveCount(0);
  await demoOptions(page);
  await expect(page.getByRole('button', { name: 'Obliczanie tras przez API', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.unroute('**/v1/routes');
  await page.getByRole('button', { name: 'Oblicz trasy', exact: true }).click();
  await expect(page.getByText('Obliczono 3 warianty. Rekomendacja: 980 m.')).toBeVisible();
});

test('catalog outage has an explicit retry and no implicit mock', async ({ page }) => {
  await page.route('**/v1/coverage', (route) => route.abort('failed'));
  await page.goto('/plan');
  await expect(page.getByRole('alert')).toContainText('Brak połączenia z API');
  await expect(page.getByRole('button', { name: 'Oblicz trasy', exact: true })).toHaveCount(0);
  await page.unroute('**/v1/coverage');
  await page.getByRole('button', { name: 'Ponów połączenie' }).click();
  await expect(page.getByRole('button', { name: 'Oblicz trasy', exact: true })).toBeVisible();
});

test('ignores a delayed result after preferences change', async ({ page }) => {
  let release = () => {}; const gate = new Promise<void>((resolve) => { release = resolve; });
  let received = false; let delivered = false;
  await page.route('**/v1/routes', async (route) => {
    const response = await route.fetch(); received = true; await gate;
    await route.fulfill({ response }); delivered = true;
  });
  await page.goto('/plan');
  await page.getByRole('button', { name: 'Użyj przykładu A/B/C' }).click();
  await page.getByRole('button', { name: 'Oblicz trasy', exact: true }).click();
  await expect.poll(() => received).toBe(true);
  await formSettings(page);
  await page.getByRole('checkbox', { name: 'Preferuj opisaną sygnalizację dźwiękową' }).click();
  release(); await expect.poll(() => delivered).toBe(true);
  await expect(page.getByRole('heading', { name: 'Porównanie tras' })).toHaveCount(0);
  await page.unroute('**/v1/routes');
  await page.getByRole('button', { name: 'Oblicz trasy', exact: true }).click();
  await expect(page.getByText(/Obliczono .*Rekomendacja: 740 m/)).toBeVisible();
});

test('renders conflict and budget-limited warnings from validated contract scenarios', async ({ page }) => {
  const conflict = routeScenarios.find((s) => s.response.routes.some((r) => r.metrics.audibleSignals.conflicting > 0))!;
  await page.route('**/v1/routes', (route) => route.fulfill({ json: conflict.response }));
  await page.goto('/plan');
  await page.getByRole('button', { name: 'Użyj przykładu A/B/C' }).click();
  await page.getByRole('button', { name: 'Oblicz trasy', exact: true }).click();
  await details(page, 'Porównaj trasy i sprawdź źródła');
  await page.getByRole('button', { name: 'Pokaż przebieg i dowody wariantu 1' }).click();
  await expect(page.getByText('Sprzeczne informacje — źródła podają różne wartości.')).toBeVisible();
  await page.unroute('**/v1/routes');
  const limited = routeScenarios.find((s) => s.response.calculation.status === 'budget_limited')!;
  await page.route('**/v1/routes', (route) => route.fulfill({ json: limited.response }));
  await editForm(page);
  await page.getByRole('button', { name: 'Oblicz trasy', exact: true }).click();
  await expect(page.getByText(/Wynik częściowy: osiągnięto limit obliczeń/)).toBeVisible();
});
