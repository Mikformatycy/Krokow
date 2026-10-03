import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

export async function details(page: Page, label: string) {
  const button = page.getByRole('button', { name: label, exact: true });
  await expect(button).toBeVisible();
  if (await button.getAttribute('aria-expanded') === 'false') await button.click();
}
export async function editForm(page: Page) {
  const edit = page.getByRole('button', { name: 'Zmień trasę lub ustawienia', exact: true });
  if (await edit.count()) await edit.click();
}
export async function formSettings(page: Page) {
  await editForm(page); await details(page, 'Ustawienia trasy');
}
export async function demoOptions(page: Page) {
  await editForm(page); await details(page, 'Opcje demonstracji');
}
