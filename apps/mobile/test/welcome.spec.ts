import { expect, test } from '@playwright/test';

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
  await expect(page.getByRole('heading', { name: 'Poznaj trasę, zanim wyruszysz.' })).toBeVisible();
  await expect(page.getByText('PODGLĄD APLIKACJI')).toBeVisible();
  await expect(page.getByText('Poznaj plan trasy. Bez prowadzenia w terenie.')).toBeVisible();
  await expect(page.getByRole('button', { name: /nawig|wyznacz|porównaj/i })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Jak czytać informacje o trasie' })).toBeVisible();
  await expect(page.getByText(/Dostępny obszar i rodzaj danych/)).toHaveCount(0);
  await page.getByRole('button', { name: 'Więcej o aplikacji' }).click();
  await expect(page.getByText(/Dostępny obszar i rodzaj danych/)).toBeVisible();
  expect(errors).toEqual([]);
});

test('supports keyboard navigation between screens and focuses their headings', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Poznaj trasę, zanim wyruszysz.' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Zaplanuj trasę' })).toBeFocused();
  await page.keyboard.press('Tab');
  const details = page.getByRole('link', { name: 'Jak czytać informacje o trasie' });
  await expect(details).toBeFocused();
  await expect(details).toHaveCSS('border-top-color', 'rgb(7, 91, 206)');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/about-data$/);
  await expect(page.getByRole('heading', { name: 'Co wiemy, a czego nie wiemy' })).toBeFocused();
  for (const title of ['Obecność opisana', 'Brak opisany', 'Brak danych', 'Sprzeczne informacje']) {
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  }
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Wróć do początku' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Poznaj trasę, zanim wyruszysz.' })).toBeFocused();
});

test('loads the data screen directly and keeps its explanation at 200 percent zoom', async ({ page }) => {
  await page.goto('/about-data');
  await expect(page.getByRole('heading', { name: 'Co wiemy, a czego nie wiemy' })).toBeVisible();
  await page.evaluate(() => { document.body.style.zoom = '2'; });
  await expect(page.getByText(/Nie opisują konkretnego miejsca/)).toBeVisible();
  await page.getByRole('link', { name: 'Wróć do początku' }).scrollIntoViewIfNeeded();
  await expect(page.getByRole('link', { name: 'Wróć do początku' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
