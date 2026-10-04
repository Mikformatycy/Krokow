import { expect, test } from '@playwright/test';
import { routeScenarios } from '@krok/contracts/fixtures';
import { audibleSummary, crossingText } from '../src/features/planning/routeText';

test('a single crossing stage keeps unknown, absence, presence and conflict distinct', () => {
  const empty = { present: 0, absent: 0, unknown: 0, conflicting: 0 };
  expect(audibleSummary({ ...empty, unknown: 1 })).toBe('Brak danych o sygnalizacji dźwiękowej.');
  expect(audibleSummary({ ...empty, absent: 1 })).toBe('W danych zapisano brak sygnalizacji dźwiękowej.');
  expect(audibleSummary({ ...empty, present: 1 })).toBe('W danych zapisano sygnalizację dźwiękową.');
  expect(audibleSummary({ ...empty, conflicting: 1 })).toBe('Sprzeczne dane o sygnalizacji dźwiękowej.');
  expect(audibleSummary(empty)).toContain('w danych trasy nie ma etapów przejść');
});

test('multiple stages retain the counts of every state and their denominator', () => {
  const summary = audibleSummary({ present: 2, absent: 1, unknown: 3, conflicting: 1 });
  for (const text of ['opisana obecność: 2', 'zapisany brak: 1', 'brak danych: 3', 'sprzeczne dane: 1', 'etapy przejść: 7']) {
    expect(summary).toContain(text);
  }
});

test('crossing counts distinguish crossings from stages, including missing crossings', () => {
  const metrics = routeScenarios[0]!.response.routes[0]!.metrics;
  for (const [count, noun] of [[1, 'przejście'], [2, 'przejścia'], [5, 'przejść'], [12, 'przejść'], [22, 'przejścia']] as const) {
    expect(crossingText({ ...metrics, crossingCount: count, crossingStageCount: count })).toBe(`${count} ${noun}.`);
  }
  expect(crossingText({ ...metrics, crossingCount: 1, crossingStageCount: 2 })).toBe('1 przejście. Etapy przejść: 2.');
  expect(crossingText({ ...metrics, crossingCount: 0, crossingStageCount: 0 })).toBe('W danych trasy nie zapisano przejść.');
});
