import type { RouteOption, RouteResponse } from '@krok/contracts';
import { factText, reasonText, stepText, warningText } from './routeText';

/** Same data and templates as the visible plan; bounded chunks for native speech engines. */
export function speechText(route: RouteOption, response: RouteResponse): string[] {
  const parts = [
    'To fikcyjne dane demonstracyjne. Odsłuch planu, bez prowadzenia w terenie.',
    `Długość wariantu: ${Math.round(route.metrics.distanceM)} metrów. Najkrótsza dopuszczalna trasa: ${Math.round(response.baseline.distanceM)} metrów.`,
    'Opis infrastruktury nie informuje o bieżącym świetle ani o możliwości wejścia na jezdnię.',
    ...new Set(response.warnings.filter((warning) => ['SEARCH_BUDGET_LIMITED', 'SOURCE_DEGRADED', 'SNAPSHOT_STALE'].includes(warning.code)).map(warningText)),
  ];
  if (response.recommendation.routeId === route.id) parts.push(...response.recommendation.reasons.map(reasonText));
  const timeline = [
    ...route.steps.map((step, i) => ({ offset: step.startM, order: i, text: stepText(step) })),
    ...route.events.map((event, i) => ({ offset: event.offsetM, order: route.steps.length + i,
      text: `Etap przejścia ${i + 1}, ${Math.round(event.offsetM)} metrów od startu. Sygnalizacja dźwiękowa: ${factText(event.facts.audible_signal)} Oznaczenia dotykowe: ${factText(event.facts.tactile_paving)}` })),
  ].sort((a, b) => a.offset - b.offset || a.order - b.order);
  parts.push(...timeline.map((item) => item.text));
  parts.push('Koniec opisu planu. Źródła i daty pobrania są dostępne w szczegółach wariantu.');
  return parts.flatMap((text) => {
    const chunks: string[] = []; let rest = text;
    while (rest.length > 500) {
      const boundary = rest.lastIndexOf(' ', 500); const cut = boundary > 0 ? boundary : 500;
      chunks.push(rest.slice(0, cut)); rest = rest.slice(cut).trimStart();
    }
    if (rest) chunks.push(rest); return chunks;
  });
}
