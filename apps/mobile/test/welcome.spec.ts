import { expect, test } from '@playwright/test';
import { heading } from './ui-helpers';

test('opens an honest preview without asking for location or offering field navigation', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'geolocation', { value: {
      getCurrentPosition() { throw new Error('Unexpected location request'); },
      watchPosition() { throw new Error('Unexpected location subscription'); },
    } });
  });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'pl');
  await expect(heading(page, 'To mały krok dla człowieka, ale wielki krok dla Krakowa')).toBeVisible();
  const logo = page.getByRole('img', { name: 'Logo Kroków — białe laski ułożone w literę K' });
  await expect(logo).toBeVisible();
  await expect.poll(() => logo.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await expect(page.getByText('Podgląd aplikacji', { exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.getByText('Plan pieszej trasy z jasną informacją, czego nie wiemy. Bez prowadzenia w terenie.')).toBeVisible();
  await expect(page.getByRole('button', { name: /nawig|wyznacz|porównaj/i })).toHaveCount(0);
  await expect(page.getByRole('link')).toHaveCount(2);
  expect(errors).toEqual([]);
});

test('supports keyboard navigation between screens and focuses their headings', async ({ page }) => {
  await page.goto('/');
  await expect(heading(page, 'To mały krok dla człowieka, ale wielki krok dla Krakowa')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Zaplanuj trasę' })).toBeFocused();
  await page.keyboard.press('Tab');
  const details = page.getByRole('link', { name: 'Jak czytać informacje o trasie' });
  await expect(details).toBeFocused();
  await expect(details).toHaveCSS('border-top-color', 'rgb(10, 88, 202)');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/about-data$/);
  await expect(heading(page, 'Co wiemy, a czego nie wiemy')).toBeFocused();
  for (const title of ['Obecność opisana', 'Brak opisany', 'Brak danych', 'Sprzeczne informacje']) {
    await expect(heading(page, title)).toBeVisible();
  }
  // Chrome makes a scroller without focusable children keyboard-focusable; the next stop is the back button.
  await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'Wstecz', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(heading(page, 'To mały krok dla człowieka, ale wielki krok dla Krakowa')).toBeFocused();
});

test('loads the data screen directly, keeps it readable at 200 percent and returns home without history', async ({ page }) => {
  await page.goto('/about-data');
  await expect(heading(page, 'Co wiemy, a czego nie wiemy')).toBeVisible();
  await page.evaluate(() => { document.body.style.zoom = '2'; });
  await expect(page.getByText(/Nie opisują konkretnego miejsca/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Wstecz', exact: true }).click();
  await expect(heading(page, 'To mały krok dla człowieka, ale wielki krok dla Krakowa')).toBeVisible();
});
