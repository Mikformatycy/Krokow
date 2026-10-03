import type { BooleanFact, RouteOption, RouteReason, TactileFact, Warning } from '@krok/contracts';

export const metres = (value: number) => `${Math.round(value)} m`;
export const dateText = (value: string | null) => value === null ? 'nieznana' : value.replace('T', ' ').replace(/(\.\d+)?Z$/, ' UTC');
export function reasonText(reason: RouteReason): string {
  switch (reason.code) {
    case 'SHORTER_DISTANCE': return `Najkrótsza dopuszczalna długość: ${metres(reason.params.distanceM)}.`;
    case 'DETOUR_FOR_PREFERENCES': return `Wariant dłuższy o ${metres(reason.params.extraDistanceM)}, wybrany zgodnie z preferencjami.`;
    case 'MORE_DOCUMENTED_AUDIBLE_SIGNALS': return `Opisana obecność sygnału dźwiękowego: ${reason.params.routePresentCount} etapów, wobec ${reason.params.baselinePresentCount} na najkrótszej dopuszczalnej trasie.`;
    case 'FEWER_UNKNOWN_AUDIBLE_SIGNALS': return `Brak danych o akustyce: ${reason.params.routeUnknownCount} etapów, wobec ${reason.params.baselineUnknownCount} na najkrótszej dopuszczalnej trasie.`;
    case 'FEWER_CROSSING_STAGES': return `Etapy przejść: ${reason.params.routeStageCount}, wobec ${reason.params.baselineStageCount} na najkrótszej dopuszczalnej trasie.`;
  }
}
export function factSummary(fact: BooleanFact | TactileFact): string {
  if (fact.state === 'unknown') return 'Brak danych — nie oznacza obecności ani braku udogodnienia.';
  if (fact.state === 'conflicting') return 'Sprzeczne informacje — źródła podają różne wartości.';
  const value = typeof fact.value === 'boolean' ? fact.value ? 'Obecność opisana' : 'Brak opisany'
    : { yes: 'Obecność opisana', no: 'Brak opisany', partial: 'Częściowe oznaczenie', incorrect: 'Oznaczenie opisane jako nieprawidłowe' }[fact.value];
  const reliability = { field_verified: 'Potwierdzenie terenowe', source_declared: 'Deklaracja źródła', community_mapped: 'Wpis społeczności' }[fact.reliability];
  const freshness = { recent: 'Aktualność: w oknie polityki', stale: 'Aktualność: starsze niż okno polityki', unknown: 'Aktualność nieznana' }[fact.freshness];
  return `${value}. ${reliability}. ${freshness}.`;
}
export function factText(fact: BooleanFact | TactileFact): string {
  const summary = factSummary(fact);
  return fact.state === 'known' ? `${summary} Obserwacja: ${dateText(fact.observedAt)}. Potwierdzenie: ${dateText(fact.verifiedAt)}.` : summary;
}
export function stepText(step: RouteOption['steps'][number]): string {
  switch (step.instructionKey) {
    case 'route.start': return `Start: ${step.params.placeName}.`;
    case 'route.follow_segment': return `Odcinek: ${step.params.segmentName}. Długość ${metres(step.endM - step.startM)}.`;
    case 'route.arrive': return `Cel planu: ${step.params.placeName}.`;
  }
}
export function warningText(warning: Warning): string {
  switch (warning.code) {
    case 'SYNTHETIC_DATA': return 'Dane fikcyjne. Wyłącznie podgląd, bez prowadzenia w terenie.';
    case 'MISSING_FEATURE_DATA': return `Brak danych: ${warning.params.featureKey === 'audible_signal' ? 'sygnalizacja dźwiękowa' : 'oznaczenia dotykowe'}. Szczegóły przy etapie przejścia.`;
    case 'CONFLICTING_FEATURE_DATA': return `Sprzeczne informacje: ${warning.params.featureKey === 'audible_signal' ? 'sygnalizacja dźwiękowa' : 'oznaczenia dotykowe'}. Szczegóły przy etapie przejścia.`;
    case 'SNAPSHOT_STALE': return `Zestaw danych może być nieaktualny. Pobrano: ${dateText(warning.params.snapshotFetchedAt)}.`;
    case 'SOURCE_DEGRADED': return 'Co najmniej jedno źródło ma ograniczoną dostępność. Sprawdź rejestr źródeł poniżej.';
    case 'SEARCH_BUDGET_LIMITED': return 'Wynik częściowy: osiągnięto limit obliczeń. Lista wariantów może być niepełna.';
  }
}
