import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

export async function details(page: Page, label: string) {
  const button = page.getByRole('button', { name: label, exact: true });
  await expect(button).toBeVisible();
  if (await button.getAttribute('aria-expanded') === 'false') await button.click();
}
/** Visible app tree only; the hidden screen-reader region repeats announced text outside it. */
export const app = (page: Page) => page.locator('#root');
export const heading = (page: Page, name: string) => page.getByRole('heading', { name, exact: true });
export const back = (page: Page) => page.getByRole('button', { name: 'Wstecz', exact: true }).click();

/** Step 1: switch the data source to the prepared A/B/C answers. */
export async function useMock(page: Page) {
  const source = page.getByTestId('data-source');
  await expect(source).toBeVisible();
  if ((await source.getAttribute('aria-label'))?.startsWith('Przełącz na przykłady')) await source.click();
  await expect(page.getByTestId('data-source')).toHaveAttribute('aria-label', /^Przełącz na obliczanie/);
}
/** Step 1: fill the A/B/C example and land on the review step. */
export async function example(page: Page) {
  await page.getByRole('button', { name: 'Użyj przykładu A/B/C', exact: true }).click();
  await expect(heading(page, 'Twoja trasa')).toBeVisible();
}
export async function calculate(page: Page) {
  await page.getByRole('button', { name: /^(Oblicz trasy|Pokaż przykład)$/ }).click();
}
/** Walk back with the top "Wstecz" button until the review step is shown. */
export async function toReview(page: Page) {
  for (let i = 0; i < 3 && !await heading(page, 'Twoja trasa').isVisible(); i++) await back(page);
  await expect(heading(page, 'Twoja trasa')).toBeVisible();
}
export async function openSettings(page: Page) {
  await toReview(page);
  await page.getByRole('button', { name: /^Ustawienia trasy/ }).click();
  await expect(heading(page, 'Ustawienia trasy')).toBeVisible();
}
export async function closeSettings(page: Page) {
  await page.getByRole('button', { name: 'Gotowe', exact: true }).click();
  await expect(heading(page, 'Twoja trasa')).toBeVisible();
}
