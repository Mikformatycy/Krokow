import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { back, calculate, details, example, heading } from './ui-helpers';

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
  await example(page);
  await calculate(page);
  await expect(heading(page, 'Twój plan')).toBeVisible();
}
const state = (page: Page) => page.evaluate(() => {
  const value: unknown = Reflect.get(window, '__speechTest');
  return value as { spoken: string[]; cancelled: number };
});
const listen = (page: Page) => page.getByRole('button', { name: 'Odsłuchaj plan', exact: true });

test('speech starts explicitly, stops on variant change and is cancelled when leaving the result', async ({ page }) => {
  await prepare(page); expect((await state(page)).spoken).toHaveLength(0);
  await listen(page).click();
  await expect(page.getByTestId('speech-status')).toHaveText('Trwa odsłuch.');
  await expect(page.getByRole('button', { name: 'Zatrzymaj odsłuch', exact: true })).toBeVisible();
  expect((await state(page)).spoken).toHaveLength(1);
  await details(page, 'Inne warianty (2)');
  await page.getByRole('radio', { name: 'Wariant 1, 740 m' }).click();
  await expect(page.getByTestId('speech-status')).toHaveText('Odsłuch zatrzymany.');
  await listen(page).click();
  expect((await state(page)).spoken).toHaveLength(2);
  const count = (await state(page)).cancelled;
  await back(page);
  await expect(heading(page, 'Twoja trasa')).toBeVisible();
  await expect.poll(async () => (await state(page)).cancelled).toBeGreaterThan(count);
});

test('reader switch removes own voice and keeps the identical plan text', async ({ page }) => {
  await prepare(page);
  await listen(page).click();
  await details(page, 'Ustawienia głosu');
  await page.getByRole('switch', { name: 'Korzystam z czytnika — wyłącz głos aplikacji' }).click();
  await expect(listen(page)).toHaveCount(0);
  await expect(page.getByTestId('speech-status')).toHaveText('Głos aplikacji jest wyłączony, bo korzystasz z czytnika ekranu.');
  await details(page, 'Przebieg trasy');
  await expect(page.getByText('To fikcyjne dane demonstracyjne. Odsłuch planu, bez prowadzenia w terenie.')).toBeVisible();
  expect((await state(page)).spoken).toHaveLength(1);
});

test('missing Polish voice has a visible fallback to text', async ({ page }) => {
  await prepare(page, false);
  await listen(page).click();
  await expect(page.getByTestId('speech-status')).toContainText('Brak polskiego głosu na urządzeniu');
  expect((await state(page)).spoken).toHaveLength(0);
  await details(page, 'Przebieg trasy');
  await expect(page.getByText(/^Długość wariantu: 980 metrów/)).toBeVisible();
});

test('hiding the page stops speech without continuing in background', async ({ page }) => {
  await prepare(page);
  await listen(page).click();
  await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); });
  await expect(page.getByTestId('speech-status')).toHaveText('Odsłuch zatrzymany.');
  expect((await state(page)).spoken).toHaveLength(1);
});
