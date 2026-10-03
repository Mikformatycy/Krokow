import { expect, test } from '@playwright/test';
import { demoOptions, details, formSettings } from './ui-helpers';

test('selects points by keyboard and submits a synthetic example without geolocation', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'geolocation', { value: {
      getCurrentPosition() { throw new Error('Unexpected GPS'); }, watchPosition() { throw new Error('Unexpected GPS'); },
    } });
  });
  await page.goto('/plan');
  await expect(page.getByRole('heading', { name: 'Zaplanuj przykład trasy' })).toBeFocused();
  await demoOptions(page);
  await page.getByRole('button', { name: 'Przygotowane przykłady bez API', exact: true }).click();
  const start = page.getByRole('textbox', { name: 'Start: szukaj punktu' });
  await start.focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Start: Fikcyjny start', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  const end = page.getByRole('textbox', { name: 'Cel: szukaj punktu' });
  await end.focus();
  await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Cel: Fikcyjny cel', exact: true })).toBeFocused();
  await page.keyboard.press('Space');
  await page.getByRole('button', { name: 'Pokaż przykład dla ustawień' }).focus();
  await page.keyboard.press('Enter');
  await details(page, 'Porównaj trasy i sprawdź źródła');
  await expect(page.getByText('Wczytano warianty przykładu: A — 740 m; B — 980 m; C — 1120 m.')).toBeVisible();
  await expect(page.getByText('Demonstracja — fikcyjne dane. Bez prowadzenia w terenie.')).toBeVisible();
  await expect(page.getByRole('button', { name: /nawig|prowadź/i })).toHaveCount(0);
  expect(errors).toEqual([]);
  await formSettings(page);
  await page.getByRole('checkbox', { name: 'Pomijaj odcinki oznaczone jako schody' }).click();
  await expect(page.getByText(/Wczytano warianty przykładu:/)).toHaveCount(0);
  await page.getByRole('button', { name: 'Pokaż przykład dla ustawień' }).click();
  await expect(page.getByRole('alert')).toContainText('Brak przygotowanego przykładu');
  await expect(page.getByRole('checkbox', { name: 'Pomijaj odcinki oznaczone jako schody' })).toBeChecked();
});

test('validates points and detour, searches an empty catalog and swaps selected points', async ({ page }) => {
  await page.goto('/plan');
  await demoOptions(page);
  await page.getByRole('button', { name: 'Przygotowane przykłady bez API', exact: true }).click();
  await page.getByRole('button', { name: 'Pokaż przykład dla ustawień' }).click();
  await expect(page.getByRole('textbox', { name: 'Start: szukaj punktu' })).toBeFocused();
  await expect(page.getByRole('alert')).toContainText('Wybierz punkt startowy');
  await page.getByRole('textbox', { name: 'Start: szukaj punktu' }).fill('x');
  await expect(page.getByText('Wpisz co najmniej 2 znaki lub wyczyść wyszukiwanie.')).toBeVisible();
  await page.getByRole('textbox', { name: 'Start: szukaj punktu' }).fill('xyz');
  await expect(page.getByText('Brak punktów pasujących do wyszukiwania.')).toBeVisible();
  await page.getByRole('textbox', { name: 'Start: szukaj punktu' }).fill('');
  await page.getByRole('button', { name: 'Start: Fikcyjny start', exact: true }).click();
  await page.getByRole('button', { name: 'Cel: Fikcyjny start', exact: true }).click();
  await page.getByRole('button', { name: 'Pokaż przykład dla ustawień' }).click();
  await expect(page.getByRole('alert')).toContainText('Start i cel są identyczne');
  await expect(page.getByRole('textbox', { name: 'Cel: szukaj punktu' })).toBeFocused();
  await page.getByRole('button', { name: 'Cel: Fikcyjny cel', exact: true }).click();
  await formSettings(page);
  await page.getByRole('textbox', { name: 'Maksymalny mnożnik długości' }).fill('2,1');
  await page.getByRole('button', { name: 'Pokaż przykład dla ustawień' }).click();
  await expect(page.getByRole('alert')).toContainText('od 1 do 2');
  await expect(page.getByRole('textbox', { name: 'Maksymalny mnożnik długości' })).toBeFocused();
  await page.getByRole('textbox', { name: 'Maksymalny mnożnik długości' }).fill('1,6');
  await page.getByRole('button', { name: 'Zamień start z celem' }).click();
  await expect(page.getByRole('button', { name: 'Start: Fikcyjny cel', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Cel: Fikcyjny start', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Pokaż przykład dla ustawień' }).click();
  await expect(page.getByRole('alert')).toContainText('Brak przygotowanego przykładu');
});

test('preserves hard requirements after no matching route and restores only by explicit action', async ({ page }) => {
  await page.goto('/plan');
  await demoOptions(page);
  await page.getByRole('button', { name: 'Przygotowane przykłady bez API', exact: true }).click();
  await page.getByRole('button', { name: 'Użyj przykładu A/B/C' }).click();
  await formSettings(page);
  const requirement = page.getByRole('button', { name: 'Wymagaj potwierdzenia w terenie w ciągu 180 dni' });
  await requirement.click();
  await page.getByRole('button', { name: 'Pokaż przykład dla ustawień' }).click();
  await expect(page.getByRole('alert')).toContainText('Brak trasy spełniającej wybrane wymagania');
  await expect(requirement).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('textbox', { name: 'Maksymalny mnożnik długości' })).toHaveValue('1,6');
  await page.getByRole('button', { name: 'Użyj przykładu A/B/C' }).click();
  await page.getByRole('button', { name: 'Maksymalnie 1', exact: true }).click();
  await page.getByRole('button', { name: 'Pokaż przykład dla ustawień' }).click();
  await details(page, 'Porównaj trasy i sprawdź źródła');
  await expect(page.getByText('Wczytano warianty przykładu: B — 980 m.')).toBeVisible();
  await page.evaluate(() => { document.body.style.zoom = '2'; });
  await page.getByRole('link', { name: 'Wróć do początku' }).scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
