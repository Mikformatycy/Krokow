import type { BooleanFact, Evidence, RouteOption, RouteReason, TactileFact, Warning } from '@krok/contracts';

export const metres = (value: number) => `${Math.round(value)} m`;
export const walkingTime = (seconds: number) => `około ${Math.ceil(seconds / 60)} min`;
export const walkingText = (seconds: number) => `${walkingTime(seconds)} marszu`;
/** Each state keeps its own word; a zero never turns into "all confirmed". */
export function audibleSummary(signals: RouteOption['metrics']['audibleSignals']): string {
  const stages = signals.present + signals.absent + signals.unknown + signals.conflicting;
  if (stages === 0) return 'Sygnalizacja dźwiękowa: w danych trasy nie ma etapów przejść.';
  if (stages === 1) {
    if (signals.unknown === 1) return 'Brak danych o sygnalizacji dźwiękowej.';
    if (signals.conflicting === 1) return 'Sprzeczne dane o sygnalizacji dźwiękowej.';
    if (signals.absent === 1) return 'W danych zapisano brak sygnalizacji dźwiękowej.';
    return 'W danych zapisano sygnalizację dźwiękową.';
  }
  const parts = [[signals.present, 'opisana obecność'], [signals.absent, 'zapisany brak'], [signals.unknown, 'brak danych'], [signals.conflicting, 'sprzeczne dane']] as const;
  return `Sygnalizacja dźwiękowa — ${parts.filter(([count]) => count > 0).map(([count, text]) => `${text}: ${count}`).join(', ')} (etapy przejść: ${stages}).`;
}
export function crossingText(metrics: RouteOption['metrics']): string {
  const count = metrics.crossingCount;
  if (count === 0) return 'W danych trasy nie zapisano przejść.';
  const noun = count === 1 ? 'przejście' : count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14) ? 'przejścia' : 'przejść';
  return `${count} ${noun}.${metrics.crossingStageCount === count ? '' : ` Etapy przejść: ${metrics.crossingStageCount}.`}`;
}
export const variantName = (index: number, recommended: boolean) => `Wariant ${index + 1}${recommended ? ', polecany' : ''}`;
export function placeCountText(count: number): string {
  const tens = count % 100; const units = count % 10;
  const noun = count === 1 ? 'punkt' : units >= 2 && units <= 4 && (tens < 12 || tens > 14) ? 'punkty' : 'punktów';
  return `Znaleziono ${count} ${noun}`;
}
/** Raw record value in words; never reads booleans or enum codes aloud. */
export function evidenceValueText(evidence: Evidence): string {
  switch (evidence.featureKey) {
    case 'tactile_paving': return { yes: 'zapisano obecność', no: 'zapisano brak', partial: 'zapisano częściowe oznaczenie', incorrect: 'zapisano nieprawidłowe oznaczenie' }[evidence.value];
    case 'surface': return { asphalt: 'nawierzchnia asfaltowa', paved: 'nawierzchnia utwardzona', unpaved: 'nawierzchnia nieutwardzona', unknown: 'nawierzchnia nieokreślona' }[evidence.value];
    default: return evidence.value ? 'zapisano obecność' : 'zapisano brak';
  }
}
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
