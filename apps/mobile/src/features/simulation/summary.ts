import { factSummary } from '../planning/routeText';
import type { SimulationItem } from './plan';
import { simulationItemText } from './text';

/** Visual summary only; the original complete speech template remains unchanged. */
export function simulationItemSummary(item: SimulationItem): string {
  if (item.kind === 'step') return simulationItemText(item);
  const { audible_signal: audible, tactile_paving: tactile } = item.crossing.facts;
  return `Symulacja. Etap przejścia, ${Math.round(item.offsetM)} metrów od startu. `
    + `Sygnalizacja dźwiękowa: ${factSummary({ ...audible, evidenceIds: [...audible.evidenceIds] })} `
    + `Oznaczenia dotykowe: ${factSummary({ ...tactile, evidenceIds: [...tactile.evidenceIds] })} `
    + 'Aplikacja nie zna aktualnego stanu świateł ani możliwości wejścia na jezdnię.';
}
