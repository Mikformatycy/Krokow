import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { app, calculate, details, example, heading, useMock } from './ui-helpers';

const announcements = (page: Page) => page.locator('#krokow-announcer p').allTextContents();

test('search announces the settled result count once and choosing moves on to the next step', async ({ page }) => {
  await page.goto('/plan');
  await useMock(page);
  const start = page.getByRole('textbox', { name: 'Wyszukaj start' });
  await start.pressSequentially('Fikc', { delay: 40 });
  await expect(app(page).getByText('Znaleziono 2 punkty dla „Fikc”.')).toBeVisible();
  await expect.poll(() => announcements(page)).toEqual(['Znaleziono 2 punkty dla „Fikc”.']);
  await page.getByRole('button', { name: 'Fikcyjny cel', exact: true }).click();
  await expect(heading(page, 'Dokąd idziesz?')).toBeFocused();
  await expect(page.getByText('Skąd: Fikcyjny cel')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Fikcyjny cel', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Fikcyjny start', exact: true })).toBeVisible();
  expect(await announcements(page)).toEqual(['Znaleziono 2 punkty dla „Fikc”.']);
});

test('Enter (Szukaj) releases the field at once and moves focus to the first result', async ({ page }) => {
  await page.goto('/plan');
  await useMock(page);
  const start = page.getByRole('textbox', { name: 'Wyszukaj start' });
  await start.fill('cel.');
  await page.keyboard.press('Enter');
  await expect(start).not.toBeFocused();
  await expect(page.getByRole('button', { name: 'Fikcyjny cel', exact: true })).toBeFocused();
  await expect(app(page).getByText('Znaleziono 1 punkt dla „cel”.')).toBeVisible();
  await start.fill('F');
  await page.keyboard.press('Enter');
  await start.focus(); await start.fill('Fi');
  await expect(app(page).getByText('Znaleziono 2 punkty dla „Fi”.')).toBeVisible();
  await expect(start).toBeFocused();
});

test('catalog failure is an alert with an explicit retry', async ({ page }) => {
  let fail = true;
  await page.route('**/v1/places**', (route) => fail ? route.abort() : route.continue());
  await page.goto('/plan');
  await expect(page.getByRole('alert').filter({ hasText: 'Nie można wczytać miejsc.' })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Fikcyjny start', exact: true })).toHaveCount(0);
  fail = false;
  await page.getByRole('button', { name: 'Ponów wczytywanie', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Fikcyjny start', exact: true })).toBeVisible();
});

test('typing after submitting a pending search keeps focus and ignores the late answer', async ({ page }) => {
  await page.goto('/plan');
  await expect(page.getByRole('button', { name: 'Fikcyjny start', exact: true })).toBeVisible();
  let release = () => {};
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/v1/places?**', async route => {
    if (new URL(route.request().url()).searchParams.get('query') === 'cel') await pending;
    await route.continue();
  });
  const start = page.getByRole('textbox', { name: 'Wyszukaj start' });
  try {
    const requested = page.waitForRequest(request => new URL(request.url()).searchParams.get('query') === 'cel');
    await start.fill('cel');
    await start.press('Enter');
    await requested;
    await start.fill('Fi');
    await expect(app(page).getByText('Znaleziono 2 punkty dla „Fi”.')).toBeVisible();
    await expect(start).toBeFocused();
    const answered = page.waitForResponse(response => new URL(response.url()).searchParams.get('query') === 'cel');
    release();
    await answered;
    await expect(app(page).getByText('Znaleziono 2 punkty dla „Fi”.')).toBeVisible();
    await expect(start).toBeFocused();
  } finally { release(); }
});

test('calculation exposes a busy state and evidence values are words, not codes', async ({ page }) => {
  await page.route('**/v1/routes', async (route) => { await new Promise((done) => setTimeout(done, 600)); await route.continue(); });
  await page.goto('/plan');
  await example(page);
  await calculate(page);
  await expect(page.getByRole('button', { name: 'Obliczanie…' })).toHaveAttribute('aria-busy', 'true');
  await expect(heading(page, 'Twój plan')).toBeFocused();
  await details(page, 'Porównanie, źródła i daty');
  await page.getByRole('button', { name: 'Pokaż przebieg i dowody wariantu 1' }).click();
  await expect(page.getByText(/W rekordzie zapisano (obecność|brak)\./).first()).toBeVisible();
  await expect(page.getByText(/Wartość w rekordzie|rekordzie:? (true|false|yes|no|partial|incorrect)\b/)).toHaveCount(0);
});

test('data source is one plain switch-like button without a nested region', async ({ page }) => {
  await page.goto('/plan');
  const source = page.getByTestId('data-source');
  await expect(source).toHaveAttribute('aria-label', 'Przełącz na przykłady bez API, Teraz: obliczanie tras przez API');
  await expect(source).not.toHaveAttribute('aria-expanded', /.*/);
  await source.click();
  await expect(page.getByTestId('data-label')).toHaveText('Demo: dane fikcyjne');
  await expect(page.getByTestId('data-source')).toHaveAttribute('aria-label', 'Przełącz na obliczanie przez API, Teraz: gotowe przykłady A/B/C, nie nowe obliczenia');
  await expect(heading(page, 'Skąd idziesz?')).toBeFocused();
});

test('the data label is read last: hidden in the top bar for readers and repeated after the content', async ({ page }) => {
  await page.goto('/plan');
  const top = page.getByText('Demo: dane fikcyjne').first();
  await expect(top).toBeVisible();
  await expect(top).toHaveAttribute('aria-hidden', 'true');
  const label = page.getByTestId('data-label');
  await expect(label).toHaveText('Demo: dane fikcyjne');
  await expect(label).not.toHaveAttribute('aria-hidden', /.*/);
  // In reading order the back button is followed by the step content, and the label is the last text.
  const order = await page.evaluate(() => {
    const walker = document.createTreeWalker(document.getElementById('root')!, NodeFilter.SHOW_TEXT);
    const texts: string[] = [];
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent?.trim();
      if (text && !node.parentElement?.closest('[aria-hidden="true"], style, script')) texts.push(text);
    }
    return texts;
  });
  const step = order.indexOf('Krok 1 z 3');
  expect(order.slice(0, step).join(' ')).toMatch(/^‹\s*Wstecz$/);
  expect(order.at(-1)).toBe('Demo: dane fikcyjne');
  expect(order.filter((text) => text === 'Demo: dane fikcyjne')).toHaveLength(1);
});
