import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { createRouteResponse } from '@krok/contracts/fixtures';
import { prepareSimulation } from '../src/features/simulation/plan';
import { simulationItemText } from '../src/features/simulation/text';

interface Tracker { clock: number; spoken: string[]; cancelled: number; utterances: SpeechSynthesisUtterance[]; gps: number }
async function prepare(page: Page, polish = true) {
  await page.addInitScript((hasPolish) => {
    const tracker: Tracker = { clock: 0, spoken: [], cancelled: 0, utterances: [], gps: 0 };
    Object.defineProperty(window, '__simulationTest', { value: tracker });
    Object.defineProperty(performance, 'now', { value: () => tracker.clock });
    Object.defineProperty(navigator, 'geolocation', { value: {
      getCurrentPosition: () => { tracker.gps++; }, watchPosition: () => { tracker.gps++; },
    } });
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: class {
      text: string; constructor(text: string) { this.text = text; }
    } });
    const engine = new EventTarget();
    Object.assign(engine, {
      getVoices: () => [{ voiceURI: 'local', lang: hasPolish ? 'pl-PL' : 'en-US', localService: true }],
      speak: (utterance: SpeechSynthesisUtterance) => { tracker.spoken.push(utterance.text); tracker.utterances.push(utterance); },
      cancel: () => { tracker.cancelled++; },
    });
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: engine });
  }, polish);
  await page.goto('/plan');
  await page.getByRole('button', { name: 'Przygotowane przykłady bez API', exact: true }).click();
  await page.getByRole('button', { name: 'Przywróć punkty i ustawienia przykładu A/B/C' }).click();
  await page.getByRole('button', { name: 'Pokaż przykład dla ustawień', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Symulacja wybranego wariantu' })).toBeVisible();
  await page.getByRole('button', { name: 'Odsłuch: wariant 1, 740 m' }).click();
}
const state = (page: Page) => page.evaluate(() => {
  const tracker = Reflect.get(window, '__simulationTest') as Tracker;
  return { spoken: tracker.spoken, cancelled: tracker.cancelled, gps: tracker.gps };
});
const time = (page: Page, value: number) => page.evaluate((next) => { (Reflect.get(window, '__simulationTest') as Tracker).clock = next; }, value);
const visibility = (page: Page, value: 'hidden' | 'visible') => page.evaluate((next) => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: next }); document.dispatchEvent(new Event('visibilitychange'));
}, value);
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
async function callbacks(page: Page, index?: number) {
  await page.evaluate((only) => {
    const tracker = Reflect.get(window, '__simulationTest') as Tracker;
    const items = only === undefined ? tracker.utterances : tracker.utterances.slice(only, only + 1);
    for (let i = 0; i < items.length; i++) {
      if (i > 100) throw new Error('Unbounded speech queue');
      const item = items[i]!;
      item.onend?.call(item, {} as SpeechSynthesisEvent);
      item.onend?.call(item, {} as SpeechSynthesisEvent);
    }
  }, index);
}

test('keyboard controls replay once, preserve every event as text and reset without GPS', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
  await prepare(page);
  await expect(page.getByRole('checkbox', { name: 'Włącz głos symulacji' })).not.toBeChecked();
  await button(page, 'Rozpocznij symulację').focus(); await page.keyboard.press('Enter');
  await expect(page.getByTestId('simulation-status')).toHaveText('Symulacja w toku.');
  await time(page, 10_000);
  await expect(page.getByTestId('simulation-progress')).toHaveText('Postęp symulacji: 192 m z 740 m.');
  await button(page, 'Pauza symulacji').click();
  const history = await page.getByTestId('simulation-events').innerText();
  await time(page, 500_000);
  await button(page, 'Powtórz zdarzenie symulacji').click();
  await expect(page.getByTestId('simulation-status')).toHaveText('Symulacja wstrzymana.');
  await expect(page.getByTestId('simulation-events')).toHaveText(history, { useInnerText: true });
  await button(page, 'Wznów symulację').click();
  await expect(page.getByTestId('simulation-progress')).toHaveText('Postęp symulacji: 192 m z 740 m.');
  await time(page, 600_000);
  await expect(page.getByTestId('simulation-status')).toContainText('dotarła do końca');
  const expected = prepareSimulation(createRouteResponse(), 'A').items.map(simulationItemText);
  const rendered = await page.getByTestId('simulation-events').locator('div[dir="auto"]').allTextContents();
  expect(rendered.filter((part) => part.startsWith('Symulacja.'))).toEqual(expected);
  await expect(button(page, 'Rozpocznij symulację')).toBeDisabled();
  await button(page, 'Resetuj symulację').click();
  await expect(page.getByTestId('simulation-events')).toHaveCount(0);
  await expect(page.getByTestId('simulation-progress')).toHaveText('Postęp symulacji: 0 m z 740 m.');
  await button(page, 'Rozpocznij symulację').click();
  await expect(page.getByTestId('simulation-events')).toContainText('Start:');
  await button(page, 'Zakończ symulację').click();
  await expect(page.getByTestId('simulation-status')).toContainText('zakończona przez użytkownika');
  expect(await state(page)).toMatchObject({ spoken: [], gps: 0 }); expect(errors).toEqual([]);
});

test('plan and simulation share speech, discard stale callbacks and reader blocks voice', async ({ page }) => {
  await prepare(page);
  await button(page, 'Odsłuchaj wybrany plan').click();
  await expect.poll(async () => (await state(page)).spoken.length).toBe(1);
  await page.getByRole('checkbox', { name: 'Włącz głos symulacji' }).click();
  await button(page, 'Rozpocznij symulację').click();
  await expect.poll(async () => (await state(page)).spoken.length).toBe(2);
  await callbacks(page, 0); expect((await state(page)).spoken).toHaveLength(2);
  await time(page, 10_000);
  await expect(page.getByTestId('simulation-progress')).toContainText('192 m');
  await button(page, 'Pauza symulacji').click();
  await callbacks(page, 1); expect((await state(page)).spoken).toHaveLength(2);
  await button(page, 'Powtórz zdarzenie symulacji').click();
  await expect.poll(async () => (await state(page)).spoken.length).toBe(3);
  await page.getByRole('checkbox', { name: 'Korzystam z czytnika — wyłącz głos aplikacji' }).click();
  await expect(page.getByRole('checkbox', { name: 'Włącz głos symulacji' })).toBeDisabled();
  await button(page, 'Powtórz zdarzenie symulacji').click();
  await callbacks(page); expect((await state(page)).spoken).toHaveLength(3);
  await page.getByRole('checkbox', { name: 'Korzystam z czytnika — wyłącz głos aplikacji' }).click();
  expect((await state(page)).spoken).toHaveLength(3);
  await button(page, 'Odsłuchaj wybrany plan').click();
  await expect.poll(async () => (await state(page)).spoken.length).toBe(4);
  await expect(page.getByTestId('simulation-status')).toContainText('zakończona');
  await time(page, 1_000_000); await callbacks(page, 2);
  expect((await state(page)).spoken).toHaveLength(4);
});

test('background pauses ticks and speech; return requires resume without catch-up', async ({ page }) => {
  await prepare(page);
  await page.getByRole('checkbox', { name: 'Włącz głos symulacji' }).click();
  await button(page, 'Rozpocznij symulację').click();
  await expect.poll(async () => (await state(page)).spoken.length).toBe(1);
  await time(page, 5_000); await expect(page.getByTestId('simulation-progress')).toContainText('96 m');
  await visibility(page, 'hidden');
  await expect(button(page, 'Wznów symulację')).toBeDisabled();
  await time(page, 500_000); await callbacks(page);
  await visibility(page, 'visible');
  await expect(page.getByTestId('simulation-status')).toHaveText('Symulacja wstrzymana.');
  await expect(page.getByTestId('simulation-progress')).toContainText('96 m');
  expect((await state(page)).spoken).toHaveLength(1);
  await button(page, 'Wznów symulację').click(); await time(page, 501_000);
  await expect(page.getByTestId('simulation-progress')).toContainText('115 m');
  await expect.poll(async () => (await state(page)).spoken.length).toBe(2);
  expect((await state(page)).spoken[1]).toContain('100 metrów od startu'); // New event, not the cancelled segment.
});

test('variant, form edit and replacement response remove the old simulation', async ({ page }) => {
  await prepare(page);
  await page.getByRole('checkbox', { name: 'Włącz głos symulacji' }).click();
  await button(page, 'Rozpocznij symulację').click();
  await expect.poll(async () => (await state(page)).spoken.length).toBe(1);
  await button(page, 'Odsłuch: wariant 2, 980 m').click();
  await expect(page.getByTestId('simulation-events')).toHaveCount(0);
  await expect(page.getByRole('checkbox', { name: 'Włącz głos symulacji' })).not.toBeChecked();
  await callbacks(page); expect((await state(page)).spoken).toHaveLength(1);
  await button(page, 'Rozpocznij symulację').click();
  await expect(page.getByTestId('simulation-progress')).toContainText('z 980 m');
  const stops = (await state(page)).cancelled;
  await page.getByRole('textbox', { name: 'Maksymalny mnożnik długości' }).fill('1,5');
  await expect(page.getByTestId('simulation')).toHaveCount(0);
  await expect.poll(async () => (await state(page)).cancelled).toBeGreaterThan(stops);
  await page.getByRole('textbox', { name: 'Maksymalny mnożnik długości' }).fill('1,6');
  await button(page, 'Pokaż przykład dla ustawień').click();
  await expect(page.getByTestId('simulation-status')).toHaveText('Symulacja gotowa do rozpoczęcia.');
  await expect(page.getByTestId('simulation-events')).toHaveCount(0);
  await callbacks(page); expect((await state(page)).spoken).toHaveLength(1);
});

test('leaving the screen ends playback and returning never resumes it', async ({ page }) => {
  await prepare(page);
  await page.getByRole('checkbox', { name: 'Włącz głos symulacji' }).click();
  await button(page, 'Rozpocznij symulację').click();
  await expect.poll(async () => (await state(page)).spoken.length).toBe(1);
  const stops = (await state(page)).cancelled;
  await page.getByRole('link', { name: 'Wróć do początku' }).click();
  await expect.poll(async () => (await state(page)).cancelled).toBeGreaterThan(stops);
  await time(page, 1_000_000); await callbacks(page);
  expect((await state(page)).spoken).toHaveLength(1);
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Zaplanuj przykład trasy' })).toBeVisible();
  await expect(page.getByText('Symulacja w toku.', { exact: true })).toHaveCount(0);
  expect((await state(page)).spoken).toHaveLength(1);
});

test('missing voice leaves simulation progress and event text usable', async ({ page }) => {
  await prepare(page, false);
  await page.getByRole('checkbox', { name: 'Włącz głos symulacji' }).click();
  await button(page, 'Rozpocznij symulację').click();
  await expect(page.getByText(/Brak dostępnego polskiego głosu/)).toBeVisible();
  await time(page, 10_000); await expect(page.getByTestId('simulation-progress')).toContainText('192 m');
  await expect(page.getByTestId('simulation-events')).toContainText('Etap przejścia');
  await button(page, 'Pauza symulacji').click();
  await button(page, 'Powtórz zdarzenie symulacji').click();
  await expect(page.getByText(/Brak dostępnego polskiego głosu/)).toBeVisible();
  expect((await state(page)).spoken).toHaveLength(0);
});

test('finishing a voiced replay speaks each item once even with duplicated callbacks', async ({ page }) => {
  await prepare(page);
  await page.getByRole('checkbox', { name: 'Włącz głos symulacji' }).click();
  await button(page, 'Rozpocznij symulację').click();
  await expect.poll(async () => (await state(page)).spoken.length).toBe(1);
  await time(page, 100_000);
  await expect(page.getByTestId('simulation-status')).toContainText('dotarła do końca');
  await callbacks(page);
  const expected = prepareSimulation(createRouteResponse(), 'A').items.map(simulationItemText);
  expect((await state(page)).spoken).toEqual(expected);
  await expect(page.getByText('Odsłuch zakończony.', { exact: true })).toBeVisible();
});

test('HTTP result can be simulated and new calculation cannot resume the old session', async ({ page }) => {
  await prepare(page);
  await button(page, 'Obliczanie tras przez API').click();
  await button(page, 'Oblicz trasy').click();
  await expect(page.getByRole('heading', { name: 'Symulacja wybranego wariantu' })).toBeVisible();
  await button(page, 'Rozpocznij symulację').click();
  await time(page, 100_000);
  await expect(page.getByTestId('simulation-status')).toContainText('dotarła do końca');
  await button(page, 'Oblicz trasy').click();
  await expect(page.getByTestId('simulation-status')).toHaveText('Symulacja gotowa do rozpoczęcia.');
  await expect(page.getByTestId('simulation-events')).toHaveCount(0);
});

test('speech error preserves text and stopping voice prevents later automatic utterances', async ({ page }) => {
  await prepare(page);
  await page.getByRole('checkbox', { name: 'Włącz głos symulacji' }).click();
  await button(page, 'Rozpocznij symulację').click();
  await expect.poll(async () => (await state(page)).spoken.length).toBe(1);
  await page.evaluate(() => {
    const utterance = (Reflect.get(window, '__simulationTest') as Tracker).utterances[0]!;
    utterance.onerror?.call(utterance, {} as SpeechSynthesisErrorEvent);
  });
  await expect(page.getByText('Nie udało się odtworzyć tekstu. Pozostaje on dostępny na ekranie.')).toBeVisible();
  await expect(page.getByTestId('simulation-current')).toContainText('Symulacja.');
  await button(page, 'Powtórz zdarzenie symulacji').click();
  await expect.poll(async () => (await state(page)).spoken.length).toBe(2);
  await button(page, 'Zatrzymaj odsłuch').click();
  await expect(page.getByRole('checkbox', { name: 'Włącz głos symulacji' })).not.toBeChecked();
  await time(page, 100_000); await callbacks(page);
  await expect(page.getByTestId('simulation-status')).toContainText('dotarła do końca');
  expect((await state(page)).spoken).toHaveLength(2);
});
