import { expect, test } from '@playwright/test';
import { createRouteResponse } from '@krok/contracts/fixtures';
import { SpeechCoordinator } from '../src/adapters/speech/coordinator';
import type { SpeechPort, SpeechStatus, SpeechVoice } from '../src/adapters/speech/coordinator';
import { SimulationSession } from '../src/features/simulation/session';
import { simulationItemSummary } from '../src/features/simulation/summary';
import { simulationItemText } from '../src/features/simulation/text';

function fixture() {
  const spoken: { text: string; done(): void; error(): void }[] = [];
  const statuses: SpeechStatus[] = [];
  let stops = 0; let time = 0;
  const port: SpeechPort = {
    voices: () => Promise.resolve([{ id: 'pl', language: 'pl-PL' }]),
    stop: () => { stops++; return Promise.resolve(); },
    speak: (text, _voice, callbacks) => { spoken.push({ text, ...callbacks }); },
  };
  const speech = new SpeechCoordinator(port, (status) => statuses.push(status));
  const announced: { text: string; interrupt: boolean }[] = [];
  const announcer = { announce: (text: string, interrupt: boolean) => { announced.push({ text, interrupt }); } };
  const session = (withAnnouncer = false) => new SimulationSession(createRouteResponse(), 'A', () => time, speech, 1, withAnnouncer ? announcer : null);
  const drain = (from = 0) => {
    for (let i = from; i < spoken.length; i++) {
      if (i > 100) throw new Error('Queue did not finish');
      spoken[i]!.done();
    }
  };
  return { port, speech, spoken, statuses, announced, session, drain, stops: () => stops, setTime: (value: number) => { time = value; } };
}
function enable(session: SimulationSession) { session.setReader(false); session.setSpeechEnabled(true); }

test('enqueue retains events during voice discovery and speaking without interrupting the queue', async () => {
  const f = fixture(); let resolve!: (voices: SpeechVoice[]) => void;
  f.port.voices = () => new Promise((done) => { resolve = done; });
  const pending = f.speech.enqueue(['first']);
  await expect.poll(() => typeof resolve).toBe('function');
  await f.speech.enqueue(['second']); resolve([{ id: 'pl', language: 'pl-PL' }]); await pending;
  await f.speech.enqueue(['third']);
  expect(f.spoken.map((part) => part.text)).toEqual(['first']);
  expect(f.stops()).toBe(1);
  f.drain(); expect(f.spoken.map((part) => part.text)).toEqual(['first', 'second', 'third']);
  expect(f.statuses.at(-1)).toBe('done');
  f.speech.dispose();
});

test('replacement discards appended messages and stale callbacks cannot consume the new queue', async () => {
  const f = fixture(); await f.speech.enqueue(['old']); await f.speech.enqueue(['discard']);
  await f.speech.play(['replacement']); await f.speech.enqueue(['new tail']);
  f.spoken[0]!.done(); f.spoken[0]!.error();
  expect(f.spoken.map((part) => part.text)).toEqual(['old', 'replacement']);
  f.drain(1); expect(f.spoken.map((part) => part.text)).toEqual(['old', 'replacement', 'new tail']);
  f.speech.dispose();
});

test('long speech chunks preserve text and do not split UTF-16 surrogate pairs', async () => {
  const f = fixture(); const text = 'a'.repeat(499) + '😀' + 'b'.repeat(1001);
  await f.speech.play([text]); f.drain();
  expect(f.spoken.map((part) => part.text).join('')).toBe(text);
  for (const part of f.spoken) {
    expect(part.text.length).toBeLessThanOrEqual(500);
    expect(part.text).not.toMatch(/^[\uDC00-\uDFFF]|[\uD800-\uDBFF]$/);
  }
  f.speech.dispose();
});

test('text is available by default; enabling voice requires known reader state and explicit repeat', async () => {
  const f = fixture(); const session = f.session(); session.start();
  expect(session.text).toContain('Symulacja.'); expect(f.spoken).toHaveLength(0);
  session.setSpeechEnabled(true); session.repeat();
  expect(session.readerState).toBeNull(); expect(f.spoken).toHaveLength(0);
  session.setReader(false); expect(f.spoken).toHaveLength(0);
  session.repeat(); await expect.poll(() => f.spoken.length).toBe(1);
  expect(f.spoken[0]!.text).toBe(session.text);
  session.setSpeechEnabled(false); f.spoken[0]!.done();
  expect(f.spoken).toHaveLength(1); expect(session.text).not.toBeNull();
  f.speech.dispose();
});

test('large ticks append all steps in order while an earlier message is still speaking', async () => {
  const f = fixture(); const session = f.session(); enable(session);
  const start = session.start(); await expect.poll(() => f.spoken.length).toBe(1);
  const stops = f.stops(); f.setTime(1_000_000); const finish = session.tick();
  expect(session.state.status).toBe('completed'); expect(f.spoken).toHaveLength(1);
  f.drain();
  const expected = [...start.emissions, ...finish.emissions].map(({ item }) => simulationItemText(item)).join(' ');
  expect(f.spoken.map((part) => part.text).join(' ')).toBe(expected);
  expect(f.stops()).toBe(stops); expect(f.statuses.at(-1)).toBe('done');
  expect(expected).toContain('Brak danych'); expect(expected).toContain('Brak opisany');
  expect(expected).not.toMatch(/teraz możesz przejść|jest zielone|trasa bezpieczna|brak przeszkód/i);
  expect(session.tick().emissions).toEqual([]); f.speech.dispose();
});

test('pause cancels current and queued messages; repeat stays paused and resume does not replay backlog', async () => {
  const f = fixture(); const session = f.session(); enable(session); session.start();
  await expect.poll(() => f.spoken.length).toBe(1);
  f.setTime(300_000); session.tick(); const text = session.text; session.pause();
  f.spoken[0]!.done(); expect(f.spoken).toHaveLength(1);
  session.repeat(); await expect.poll(() => f.spoken.length).toBe(2);
  expect(f.spoken[1]!.text).toBe(text); expect(session.state.status).toBe('paused');
  session.pause(); f.spoken[1]!.done(); expect(f.spoken).toHaveLength(2);
  f.setTime(900_000); session.resume(); expect(session.tick().emissions).toEqual([]);
  expect(f.spoken).toHaveLength(2); f.speech.dispose();
});

test('background and reader changes cancel speech without automatic catch-up on return', async () => {
  const f = fixture(); const session = f.session(); enable(session); session.start();
  await expect.poll(() => f.spoken.length).toBe(1);
  session.setActive(false); f.spoken[0]!.done(); session.setActive(true);
  f.setTime(500_000); expect(session.tick().emissions).toEqual([]);
  expect(session.state.status).toBe('paused'); expect(f.spoken).toHaveLength(1);
  session.repeat(); await expect.poll(() => f.spoken.length).toBe(2);
  session.setReader(true); f.spoken[1]!.done(); session.repeat();
  expect(f.spoken).toHaveLength(2); session.setReader(false);
  expect(f.spoken).toHaveLength(2); session.repeat();
  await expect.poll(() => f.spoken.length).toBe(3); f.speech.dispose();
});

test('invalidated session and late platform callbacks cannot stop a replacement session', async () => {
  const f = fixture(); const old = f.session(); enable(old); old.start();
  await expect.poll(() => f.spoken.length).toBe(1); old.invalidate('route_changed');
  const next = f.session(); enable(next); next.start();
  await expect.poll(() => f.spoken.length).toBe(2); const stops = f.stops();
  old.invalidate('unmounted'); old.pause(); old.reset(); old.setReader(true); old.setSpeechEnabled(false);
  old.setActive(false); old.repeat(); f.spoken[0]!.done(); f.spoken[0]!.error();
  expect(f.statuses.at(-1)).toBe('speaking'); expect(f.stops()).toBe(stops);
  f.drain(1); expect(f.statuses.at(-1)).toBe('done'); f.speech.dispose();
});

test('missing voice and device failures preserve text and discard backlog before explicit retry', async () => {
  for (const failure of ['voice', 'stop', 'speak'] as const) {
    const f = fixture(); const session = f.session(); enable(session);
    if (failure === 'voice') f.port.voices = () => Promise.resolve([]);
    if (failure === 'stop') f.port.stop = () => Promise.reject(new Error('device'));
    if (failure === 'speak') f.port.speak = () => { throw new Error('device'); };
    session.start(); await expect.poll(() => f.statuses.at(-1)).toBe(failure === 'voice' ? 'unavailable' : 'error');
    expect(session.text).toContain('Symulacja.'); expect(f.spoken).toHaveLength(0);
    f.port.voices = () => Promise.resolve([{ id: 'pl', language: 'pl-PL' }]);
    f.port.stop = () => Promise.resolve();
    f.port.speak = (text, _voice, callbacks) => { f.spoken.push({ text, ...callbacks }); };
    session.repeat(); await expect.poll(() => f.spoken.length).toBe(1); f.drain();
    expect(f.spoken.map((part) => part.text).join(' ')).toBe(session.text); f.speech.dispose();
  }
});

test('active reader receives short progress and a full interrupting repeat, never the app voice', async () => {
  const f = fixture(); const session = f.session(true);
  session.setReader(true); session.setSpeechEnabled(true);
  const start = session.start();
  expect(f.announced).toEqual([{ text: start.emissions.map(({ item }) => simulationItemSummary(item)).join(' '), interrupt: false }]);
  f.setTime(1_000_000); const finish = session.tick();
  expect(finish.emissions.length).toBeGreaterThan(1);
  expect(f.announced.at(-1)).toEqual({ text: finish.emissions.map(({ item }) => simulationItemSummary(item)).join(' '), interrupt: false });
  session.repeat();
  expect(f.announced.at(-1)).toEqual({ text: session.text, interrupt: true });
  expect(session.text).toBe(simulationItemText(finish.emissions.at(-1)!.item));
  await Promise.resolve(); expect(f.spoken).toHaveLength(0);
  expect(f.announced.map(({ text }) => text).join(' ')).not.toMatch(/teraz możesz przejść|jest zielone|trasa bezpieczna|brak przeszkód/i);
  f.speech.dispose();
});

test('unknown reader state announces once per event; confirmed absence switches to voice without duplicates', async () => {
  const f = fixture(); const session = f.session(true);
  session.setSpeechEnabled(true); session.start();
  expect(session.readerState).toBeNull(); expect(f.announced).toHaveLength(1); expect(f.spoken).toHaveLength(0);
  session.pause(); f.setTime(500_000); session.tick();
  expect(f.announced).toHaveLength(1);
  session.setReader(false); session.repeat();
  await expect.poll(() => f.spoken.length).toBe(1);
  expect(f.announced).toHaveLength(1);
  session.setReader(true); session.repeat();
  expect(f.announced).toHaveLength(2); expect(f.spoken).toHaveLength(1);
  session.invalidate('route_changed'); session.repeat(); session.resume(); session.tick();
  expect(f.announced).toHaveLength(2); f.speech.dispose();
});
