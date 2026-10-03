import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function prepare(page: Page, polish = true) {
  await page.addInitScript((hasPolish) => {
    const tracker = { spoken: [] as string[], cancelled: 0 };
    Object.defineProperty(window, '__speechTest', { value: tracker });
    // Stub the utterance as well: native DOM setters reject a fake Voice object.
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: class {
      text: string;
      constructor(text: string) { this.text = text; }
    } });
    const engine = new EventTarget();
    Object.assign(engine, { getVoices: () => [{ voiceURI: 'test-local', lang: hasPolish ? 'pl-PL' : 'en-US', localService: true }],
      speak: (utterance: SpeechSynthesisUtterance) => { tracker.spoken.push(utterance.text); },
      cancel: () => { tracker.cancelled++; } });
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: engine });
  }, polish);
  await page.goto('/plan');
  await page.getByRole('button', { name: 'Przywróć punkty i ustawienia przykładu A/B/C' }).click();
  await page.getByRole('button', { name: 'Oblicz trasy', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Odsłuch planu' })).toBeVisible();
}
const state = (page: Page) => page.evaluate(() => {
  const value: unknown = Reflect.get(window, '__speechTest');
  return value as { spoken: string[]; cancelled: number };
});
test('speech starts explicitly, stops on variant changes and cancels on form edit', async ({ page }) => {
  await prepare(page); expect((await state(page)).spoken).toHaveLength(0);
  await page.getByRole('button', { name: 'Odsłuchaj wybrany plan' }).click();
  await expect(page.getByText('Trwa odsłuch planu.')).toBeVisible();
  expect((await state(page)).spoken).toHaveLength(1);
  await page.getByRole('button', { name: 'Odsłuch: wariant 1, 740 m' }).click();
  await expect(page.getByText(/Odsłuch zatrzymany/)).toBeVisible();
  await page.getByRole('button', { name: 'Powtórz plan od początku' }).click();
  expect((await state(page)).spoken).toHaveLength(2);
  const count = (await state(page)).cancelled;
  await page.getByRole('checkbox', { name: 'Preferuj opisaną sygnalizację dźwiękową' }).click();
  await expect.poll(async () => (await state(page)).cancelled).toBeGreaterThan(count);
  await expect(page.getByRole('heading', { name: 'Odsłuch planu' })).toHaveCount(0);
});
test('reader switch stops own voice and exposes the identical text', async ({ page }) => {
  await prepare(page);
  await page.getByRole('button', { name: 'Odsłuchaj wybrany plan' }).click();
  await page.getByRole('checkbox', { name: 'Korzystam z czytnika — wyłącz głos aplikacji' }).click();
  await expect(page.getByRole('button', { name: 'Odsłuchaj wybrany plan' })).toBeDisabled();
  await expect(page.getByText(/Własny głos aplikacji wyłączony/)).toBeVisible();
  await page.getByRole('button', { name: 'Pokaż tekst odsłuchu' }).click();
  await expect(page.getByText('To fikcyjne dane demonstracyjne. Odsłuch planu, bez prowadzenia w terenie.')).toBeVisible();
  expect((await state(page)).spoken).toHaveLength(1);
});
test('missing Polish voice has a visible fallback to text', async ({ page }) => {
  await prepare(page, false);
  await page.getByRole('button', { name: 'Odsłuchaj wybrany plan' }).click();
  await expect(page.getByText(/Brak dostępnego polskiego głosu/)).toBeVisible();
  expect((await state(page)).spoken).toHaveLength(0);
  await page.getByRole('button', { name: 'Pokaż tekst odsłuchu' }).click();
  await expect(page.getByText('Tekst wybranego odsłuchu')).toBeVisible();
});
test('hiding the page stops speech without continuing in background', async ({ page }) => {
  await prepare(page);
  await page.getByRole('button', { name: 'Odsłuchaj wybrany plan' }).click();
  await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); });
  await expect(page.getByText(/Odsłuch zatrzymany/)).toBeVisible();
  expect((await state(page)).spoken).toHaveLength(1);
});
