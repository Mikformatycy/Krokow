import { expect, test } from '@playwright/test';
import { app, back, calculate, closeSettings, details, example, heading, openSettings, useMock } from './ui-helpers';

test('picks points by keyboard in three steps and shows a synthetic example without geolocation', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'geolocation', { value: {
      getCurrentPosition() { throw new Error('Unexpected GPS'); }, watchPosition() { throw new Error('Unexpected GPS'); },
    } });
  });
  await page.goto('/plan');
  await expect(heading(page, 'Skąd idziesz?')).toBeFocused();
  await useMock(page);
  const start = page.getByRole('textbox', { name: 'Wyszukaj start' });
  await start.focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Fikcyjny start', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(heading(page, 'Dokąd idziesz?')).toBeFocused();
  await expect(page.getByText('Skąd: Fikcyjny start')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Fikcyjny start', exact: true })).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Wyszukaj cel' }).focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Fikcyjny cel', exact: true })).toBeFocused();
  await page.keyboard.press('Space');
  await expect(heading(page, 'Twoja trasa')).toBeFocused();
  await expect(page.getByRole('button', { name: 'Skąd: Fikcyjny start, Zmień start' })).toBeVisible();
  await calculate(page);
  await expect(heading(page, 'Twój plan')).toBeFocused();
  await expect(page.getByTestId('data-label')).toHaveText('Demo: dane fikcyjne');
  await details(page, 'Porównanie, źródła i daty');
  await expect(page.getByText('Wczytano warianty przykładu: A — 740 m; B — 980 m; C — 1120 m.')).toBeVisible();
  await expect(page.getByRole('button', { name: /nawig|prowadź/i })).toHaveCount(0);
  expect(errors).toEqual([]);
  await openSettings(page);
  await page.getByRole('switch', { name: 'Pomijaj odcinki oznaczone jako schody' }).click();
  await closeSettings(page);
  await calculate(page);
  await expect(page.getByRole('alert')).toContainText('Brak przygotowanego przykładu');
  await openSettings(page);
  await expect(page.getByRole('switch', { name: 'Pomijaj odcinki oznaczone jako schody' })).toHaveAttribute('aria-checked', 'true');
});

test('search waits for two characters, reports no results, goes back step by step and swaps direction', async ({ page }) => {
  await page.goto('/plan');
  await useMock(page);
  const start = page.getByRole('textbox', { name: 'Wyszukaj start' });
  await start.fill('x');
  await expect(app(page).getByText('Wpisz co najmniej 2 znaki.')).toBeVisible();
  await start.fill('xyz');
  await expect(app(page).getByText('Brak pasujących miejsc.')).toBeVisible();
  await start.fill('');
  await page.getByRole('button', { name: 'Fikcyjny start', exact: true }).click();
  await page.getByRole('button', { name: 'Fikcyjny cel', exact: true }).click();
  await back(page);
  await expect(heading(page, 'Dokąd idziesz?')).toBeFocused();
  await back(page);
  await expect(heading(page, 'Skąd idziesz?')).toBeFocused();
  await expect(page.getByRole('button', { name: 'Fikcyjny start', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Fikcyjny start', exact: true }).click();
  await expect(heading(page, 'Twoja trasa')).toBeVisible();
  await page.getByRole('button', { name: 'Zamień kierunek', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Skąd: Fikcyjny cel, Zmień start' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Dokąd: Fikcyjny start, Zmień cel' })).toBeVisible();
  await calculate(page);
  await expect(page.getByRole('alert')).toContainText('Brak przygotowanego przykładu');
});

test('preserves hard requirements after no matching route and restores only by explicit action', async ({ page }) => {
  await page.goto('/plan');
  await useMock(page);
  await example(page);
  await openSettings(page);
  const requirement = page.getByRole('radio', { name: 'Wymagaj potwierdzenia w terenie w ciągu 180 dni' });
  await requirement.click();
  await closeSettings(page);
  await expect(page.getByText(/Akustyka: wymagane potwierdzenie z ostatnich 180 dni\./)).toBeVisible();
  await calculate(page);
  await expect(page.getByRole('alert')).toContainText('Brak trasy spełniającej wybrane wymagania');
  await openSettings(page);
  await expect(requirement).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('radio', { name: 'Do 60% dłuższa' })).toHaveAttribute('aria-checked', 'true');
  await closeSettings(page);
  await back(page); await back(page);
  await example(page);
  await openSettings(page);
  await page.getByRole('radio', { name: 'Maksymalnie 1', exact: true }).click();
  await closeSettings(page);
  await calculate(page);
  await details(page, 'Porównanie, źródła i daty');
  await expect(page.getByText('Wczytano warianty przykładu: B — 980 m.')).toBeVisible();
  await page.evaluate(() => { document.body.style.zoom = '2'; });
  await page.getByRole('button', { name: 'Nowa trasa', exact: true }).scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('Escape releases the search field and the first back leaves the planner', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Zaplanuj trasę' }).click();
  const start = page.getByRole('textbox', { name: 'Wyszukaj start' });
  await start.focus(); await start.fill('Fik');
  await page.keyboard.press('Escape');
  await expect(start).not.toBeFocused();
  await expect(start).toHaveValue('Fik');
  await back(page);
  await expect(heading(page, 'To mały krok dla człowieka, ale wielki krok dla Krakowa')).toBeVisible();
});
