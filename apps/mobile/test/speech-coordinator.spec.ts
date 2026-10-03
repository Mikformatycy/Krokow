import { expect, test } from '@playwright/test';
import { createRouteResponse } from '@krok/contracts/fixtures';
import { SpeechCoordinator } from '../src/adapters/speech/coordinator';
import type { SpeechPort, SpeechStatus, SpeechVoice } from '../src/adapters/speech/coordinator';
import { speechText } from '../src/features/planning/speechText';

function fixture() {
  const states: SpeechStatus[] = []; const spoken: { text: string; done(): void; error(): void }[] = [];
  let stops = 0;
  const port: SpeechPort = { voices: () => Promise.resolve([{ id: 'pl', language: 'pl-PL' }]),
    stop: () => { stops++; return Promise.resolve(); },
    speak: (text, _voice, callbacks) => { spoken.push({ text, ...callbacks }); } };
  const controller = new SpeechCoordinator(port, (state) => states.push(state));
  return { controller, port, spoken, states, stops: () => stops };
}
test('speech queue deduplicates callbacks, replaces prior plan and stops stale utterances', async () => {
  const f = fixture();
  await f.controller.play(['first', 'second']); expect(f.spoken.map((s) => s.text)).toEqual(['first']);
  f.spoken[0]!.done(); f.spoken[0]!.done(); expect(f.spoken.map((s) => s.text)).toEqual(['first', 'second']);
  await f.controller.play(['new']); f.spoken[1]!.done(); f.spoken[1]!.error();
  expect(f.spoken.map((s) => s.text)).toEqual(['first', 'second', 'new']);
  expect(f.states.at(-1)).toBe('speaking');
  f.controller.stop(); f.spoken[2]!.done(); expect(f.states.at(-1)).toBe('stopped');
  f.controller.dispose();
});
test('stopping during voice discovery and reader mode prevent speech', async () => {
  const f = fixture(); let resolve!: (voices: SpeechVoice[]) => void;
  f.port.voices = () => new Promise((done) => { resolve = done; });
  const pending = f.controller.play(['first']);
  await expect.poll(f.stops).toBe(1);
  f.controller.stop(); resolve([{ id: 'pl', language: 'pl-PL' }]); await pending;
  expect(f.spoken).toHaveLength(0);
  f.controller.setBlocked(true); await f.controller.play(['blocked']);
  expect(f.states.at(-1)).toBe('reader'); expect(f.spoken).toHaveLength(0);
  f.controller.dispose();
});
test('speech handles absent Polish voice, stop failure and errors in later chunks', async () => {
  const missing = fixture(); missing.port.voices = () => Promise.resolve([{ id: 'en', language: 'en-US' }]);
  await missing.controller.play(['test']); expect(missing.states.at(-1)).toBe('unavailable'); expect(missing.spoken).toHaveLength(0);
  const failure = fixture(); failure.port.stop = () => Promise.reject(new Error('device')); await failure.controller.play(['test']);
  expect(failure.states.at(-1)).toBe('error'); expect(failure.spoken).toHaveLength(0);
  const later = fixture(); await later.controller.play(['first', 'second']);
  later.port.speak = () => { throw new Error('device'); }; later.spoken[0]!.done();
  expect(later.states.at(-1)).toBe('error'); later.controller.dispose();
});
test('concurrent starts serialize stop operations and only latest plan speaks', async () => {
  const f = fixture(); let finish = () => {}; let active = 0; let maximum = 0;
  f.port.stop = () => { active++; maximum = Math.max(maximum, active); return new Promise<void>((resolve) => { finish = () => { active--; resolve(); }; }); };
  const first = f.controller.play(['old']); const second = f.controller.play(['new']);
  await expect.poll(() => active).toBe(1); finish();
  await first; await expect.poll(() => active).toBe(1); finish(); await second;
  expect(maximum).toBe(1); expect(f.spoken.map((s) => s.text)).toEqual(['new']);
  f.port.stop = () => Promise.resolve(); f.controller.dispose();
});
test('spoken plan keeps unknown distinct from absence, bounded chunks and one event per stage', () => {
  const response = createRouteResponse(); const route = response.routes[0]!;
  const parts = speechText(route, response); const text = parts.join(' ');
  expect(text).toContain('fikcyjne dane'); expect(text).toContain('Brak opisany'); expect(text).toContain('Brak danych');
  expect(text.match(/Etap przejścia/g)).toHaveLength(3);
  expect(parts.every((part) => part.length <= 500)).toBe(true);
  expect(text.indexOf('Start:')).toBeLessThan(text.indexOf('Etap przejścia 1'));
  expect(text.indexOf('Etap przejścia 3')).toBeLessThan(text.indexOf('Cel planu:'));
  expect(text).not.toMatch(/teraz możesz przejść|jest zielone|trasa bezpieczna|brak przeszkód/i);
});
