import { expect, test } from '@playwright/test';
import { routeScenarios } from '@krok/contracts/fixtures';
import { prepareSimulation } from '../src/features/simulation/plan';
import { simulationItemSummary } from '../src/features/simulation/summary';
import { simulationItemText } from '../src/features/simulation/text';

test('concise visual descriptions keep uncertainty and age while full speech retains dates', () => {
  const observed = new Set<string>();
  for (const scenario of routeScenarios) for (const route of scenario.response.routes) {
    for (const item of prepareSimulation(scenario.response, route.id).items) {
      const brief = simulationItemSummary(item); const complete = simulationItemText(item);
      if (item.kind === 'step') { expect(brief).toBe(complete); continue; }
      expect(brief).toContain('nie zna aktualnego stanu świateł');
      expect(brief).not.toContain('Obserwacja:');
      for (const fact of Object.values(item.crossing.facts)) {
        observed.add(fact.state);
        if (fact.state === 'unknown') expect(brief).toContain('Brak danych');
        if (fact.state === 'conflicting') expect(brief).toContain('Sprzeczne informacje');
        if (fact.state === 'known') {
          expect(complete).toContain('Obserwacja:');
          if (fact.value === false || fact.value === 'no') expect(brief).toContain('Brak opisany');
          if (fact.freshness === 'stale') { observed.add('stale'); expect(brief).toContain('starsze niż okno polityki'); }
        }
      }
    }
  }
  expect([...observed]).toEqual(expect.arrayContaining(['unknown', 'known', 'conflicting', 'stale']));
});
