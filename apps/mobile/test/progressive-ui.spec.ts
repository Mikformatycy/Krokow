import { expect, test } from '@playwright/test';
import { placesResponse } from '@krok/contracts/fixtures';
import { calculate, details, example, heading } from './ui-helpers';

test('a step offers at most five of the ten catalog answers, reveals more on request and keeps large targets', async ({ page }) => {
  const many = { ...placesResponse, places: Array.from({ length: 10 }, (_, i) => ({ ...placesResponse.places[0]!, id: `demo-place-${i + 1}`, name: `Punkt ${i + 1}` })) };
  await page.route('**/v1/places**', (route) => route.fulfill({ json: many }));
  await page.goto('/plan');
  const rows = page.getByRole('button', { name: /^Punkt \d+$/ });
  await expect(rows).toHaveCount(5);
  // The screen moves focus to its heading once on entry; wait for it so it cannot race the focus checks below.
  await expect(heading(page, 'Skąd idziesz?')).toBeFocused();
  const more = page.getByRole('button', { name: 'Więcej propozycji (5)', exact: true });
  await expect(more).toHaveAttribute('aria-expanded', 'false');
  await more.focus(); await page.keyboard.press('Enter');
  await expect(rows).toHaveCount(10);
  const fewer = page.getByRole('button', { name: 'Mniej propozycji', exact: true });
  await expect(fewer).toBeFocused();
  await expect(fewer).toHaveAttribute('aria-expanded', 'true');
  for (const control of await page.locator('[role=button],[role=switch],[role=radio],[role=link]').all()) {
    const box = await control.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(48);
  }
  for (const row of await rows.all()) expect((await row.boundingBox())?.height).toBeGreaterThanOrEqual(64);
});

test('result focuses the plan, simulation keeps one primary control and details never pause it', async ({ page }, testInfo) => {
  await page.goto('/plan');
  await example(page);
  await calculate(page);
  await expect(heading(page, 'Twój plan')).toBeFocused();
  await expect(page.getByRole('textbox')).toHaveCount(0);
  await expect(page.getByTestId('route-card-1')).toHaveCount(0);
  await expect(page.getByRole('radio', { name: 'Wariant 1, 740 m' })).toHaveCount(0);
  await expect(page.getByTestId('route-summary')).toContainText('980 m');
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

test('unknown and absence stay distinct in the chosen summary before opening source details', async ({ page }) => {
  await page.goto('/plan');
  await example(page);
  await calculate(page);
  await details(page, 'Inne warianty (2)');
  await page.getByRole('radio', { name: 'Wariant 1, 740 m' }).click();
  await expect(page.getByRole('radio', { name: 'Wariant 1, 740 m' })).toHaveAttribute('aria-checked', 'true');
  const summary = page.getByTestId('route-summary');
  await expect(summary).toContainText('zapisany brak: 1');
  await expect(summary).toContainText('brak danych: 1');
  await expect(summary).not.toContainText(/bezpieczn|wszystko potwierdzone|brak przeszkód/i);
  await details(page, 'Porównanie, źródła i daty');
  await page.getByRole('button', { name: 'Pokaż przebieg i dowody wariantu 1' }).click();
  await expect(page.getByText(/Źródło: Fikcyjny graf A\/B\/C/).first()).toBeVisible();
});
