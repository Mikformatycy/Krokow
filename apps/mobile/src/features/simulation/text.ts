import { factText, stepText } from '../planning/routeText';
import type { SimulationItem } from './plan';

/** Same factual templates as the plan; no inference from names, notes or coordinates. */
export function simulationItemText(item: SimulationItem): string {
  if (item.kind === 'step') return `Symulacja. ${stepText(item.step)}`;
  const audible = item.crossing.facts.audible_signal;
  const tactile = item.crossing.facts.tactile_paving;
  return `Symulacja. Etap przejścia w planie, ${Math.round(item.offsetM)} metrów od startu. `
    + `Sygnalizacja dźwiękowa: ${factText({ ...audible, evidenceIds: [...audible.evidenceIds] })} `
    + `Oznaczenia dotykowe: ${factText({ ...tactile, evidenceIds: [...tactile.evidenceIds] })} `
    + 'Aplikacja nie zna aktualnego stanu świateł ani możliwości wejścia na jezdnię.';
}
