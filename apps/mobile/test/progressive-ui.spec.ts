import { expect, test } from '@playwright/test';
import { details } from './ui-helpers';

test('large controls expose only needed choices and preserve hard settings when collapsed', async ({ page }) => {
  await page.goto('/plan');
  const settings = page.getByRole('button', { name: 'Ustawienia trasy', exact: true });
  await expect(settings).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('textbox', { name: 'Maksymalny mnożnik długości' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Obliczanie tras przez API', exact: true })).toHaveCount(0);
  for (const control of await page.getByRole('button').all()) {
    const box = await control.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(64);
  }
  await page.getByRole('button', { name: 'Użyj przykładu A/B/C' }).click();
  await settings.focus(); await page.keyboard.press('Enter');
  const requirement = page.getByRole('button', { name: 'Wymagaj opisanej obecności akustyki bez konfliktu' });
  await requirement.click();
  await settings.click();
  await expect(settings).toBeFocused();
  await expect(requirement).toHaveCount(0);
  await expect(page.getByText('Akustyka: wymagana opisana obecność bez konfliktu.')).toBeVisible();
  await settings.click(); await expect(requirement).toHaveAttribute('aria-pressed', 'true');
  const detour = page.getByRole('textbox', { name: 'Maksymalny mnożnik długości' });
  await detour.fill('2,1'); await settings.click();
  await page.getByRole('button', { name: 'Oblicz trasy', exact: true }).click();
  await expect(settings).toHaveAttribute('aria-expanded', 'true');
  await expect(detour).toBeFocused();
});

test('result focuses the plan, simulation keeps one primary control and details never pause it', async ({ page }, testInfo) => {
  await page.goto('/plan');
  await page.getByRole('button', { name: 'Użyj przykładu A/B/C' }).click();
  await page.getByRole('button', { name: 'Oblicz trasy', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Twój plan' })).toBeFocused();
  await expect(page.getByRole('textbox')).toHaveCount(0);
  await expect(page.getByTestId('route-card-1')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Wybierz wariant 1, 740 m' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Powtórz plan od początku' })).toHaveCount(0);
  const main = page.getByRole('button', { name: 'Rozpocznij symulację', exact: true });
  await main.focus(); await page.keyboard.press('Enter');
  const pause = page.getByRole('button', { name: 'Pauza symulacji', exact: true });
  await expect(pause).toBeFocused();
  await page.keyboard.press('Enter');
  const resume = page.getByRole('button', { name: 'Wznów symulację', exact: true });
  await expect(resume).toBeFocused(); await page.keyboard.press('Enter');
  await expect(pause).toBeFocused();
  await details(page, 'Szczegóły symulacji');
  await expect(page.getByTestId('simulation-events')).toBeVisible();
  await page.getByRole('button', { name: 'Szczegóły symulacji', exact: true }).click();
  await expect(page.getByTestId('simulation-events')).toHaveCount(0);
  await expect(page.getByTestId('simulation-status')).toHaveText('Symulacja w toku.');
  await page.evaluate(() => { document.body.style.zoom = '2'; });
  await pause.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('simplified-simulation.png') });
  await page.getByRole('button', { name: 'Zakończ symulację', exact: true }).click();
  await expect(main).toBeFocused();
});

test('unknown and conflict stay in the selected summary before opening source details', async ({ page }) => {
  await page.goto('/plan');
  await page.getByRole('button', { name: 'Użyj przykładu A/B/C' }).click();
  await page.getByRole('button', { name: 'Oblicz trasy', exact: true }).click();
  await details(page, 'Zmień wariant');
  await page.getByRole('button', { name: 'Wybierz wariant 1, 740 m' }).click();
  await expect(page.getByText('Akustyka: brak danych — 1, konflikt — 0, brak opisany — 1.')).toBeVisible();
  await details(page, 'Porównaj trasy i sprawdź źródła');
  await page.getByRole('button', { name: 'Pokaż przebieg i dowody wariantu 1' }).click();
  await expect(page.getByText(/Źródło: Fikcyjny graf A\/B\/C/).first()).toBeVisible();
});
