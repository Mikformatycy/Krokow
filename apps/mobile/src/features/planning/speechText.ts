import type { RouteOption, RouteResponse } from '@krok/contracts';
import { factText, reasonText, stepText, warningText } from './routeText';
import { speechChunks } from '../../adapters/speech/chunks';

/** Same data and templates as the visible plan; bounded chunks for native speech engines. */
export function speechText(route: RouteOption, response: RouteResponse): string[] {
  const parts = [
    response.mode === 'synthetic' ? 'To fikcyjne dane demonstracyjne. Odsłuch planu, bez prowadzenia w terenie.'
      : 'To podgląd planu na rzeczywistych danych. Bez prowadzenia w terenie. Dane nie są potwierdzeniem warunków na miejscu.',
    `Długość wariantu: ${Math.round(route.metrics.distanceM)} metrów. Najkrótsza dopuszczalna trasa: ${Math.round(response.baseline.distanceM)} metrów.`,
    'Opis infrastruktury nie informuje o bieżącym świetle ani o możliwości wejścia na jezdnię.',
    ...new Set(response.warnings.filter((warning) => ['SEARCH_BUDGET_LIMITED', 'SOURCE_DEGRADED', 'SNAPSHOT_STALE'].includes(warning.code)).map(warningText)),
  ];
  if (response.recommendation.routeId === route.id) parts.push(...response.recommendation.reasons.map(reasonText));
  const priority = { 'route.start': 0, 'route.follow_segment': 2, 'route.arrive': 3 } as const;
  const timeline = [
    ...route.steps.map((step, i) => ({ offset: step.startM, priority: priority[step.instructionKey], order: i, text: stepText(step) })),
    ...route.events.map((event, i) => ({ offset: event.offsetM, priority: 1, order: i,
      text: `Etap przejścia ${i + 1}, ${Math.round(event.offsetM)} metrów od startu. Sygnalizacja dźwiękowa: ${factText(event.facts.audible_signal)} Oznaczenia dotykowe: ${factText(event.facts.tactile_paving)}` })),
  ].sort((a, b) => a.offset - b.offset || a.priority - b.priority || a.order - b.order);
  parts.push(...timeline.map((item) => item.text));
  parts.push('Koniec opisu planu. Źródła i daty pobrania są dostępne w szczegółach wariantu.');
  return speechChunks(parts);
}
