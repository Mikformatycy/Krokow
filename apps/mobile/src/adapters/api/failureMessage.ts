import { DemoUnavailable, RouteFailure } from './MockRouteApi';
import { RequestTimeout, TransportUnavailable } from './HttpRouteApi';

export function failureMessage(failure: unknown): string {
  const unchanged = ' Ustawienia nie zostały zmienione.';
  if (failure instanceof DemoUnavailable) return 'Brak przygotowanego przykładu dla tych punktów i ustawień. To ograniczenie demonstracji, nie wynik wyszukiwania trasy. Możesz jawnie przywrócić przykład A/B/C.';
  if (failure instanceof RequestTimeout) return 'Przekroczono czas oczekiwania na API. Spróbuj ponownie.' + unchanged;
  if (failure instanceof TransportUnavailable) return 'Brak połączenia z API. Sprawdź połączenie i spróbuj ponownie.' + unchanged;
  if (!(failure instanceof RouteFailure)) return 'Nie można wyświetlić otrzymanych danych. Formularz został zachowany.';
  switch (failure.response.error.code) {
    case 'NO_MATCHING_ROUTE': return 'Brak trasy spełniającej wybrane wymagania. Możesz samodzielnie zmienić preferencje i spróbować ponownie.' + unchanged;
    case 'NO_PATH': return 'W dostępnych danych nie znaleziono połączenia pomiędzy tymi punktami.' + unchanged;
    case 'SOURCE_UNAVAILABLE': return 'Dane potrzebne do obliczenia trasy są niedostępne. Spróbuj ponownie później.' + unchanged;
    case 'DATA_VERSION_CHANGED': return 'Dane trasy zmieniły wersję. Wyślij ponownie formularz, aby otrzymać aktualny wynik.' + unchanged;
    case 'SEARCH_LIMIT_REACHED': return 'Obliczenia osiągnęły limit. Nie ustalono, czy istnieje pasująca trasa. Spróbuj ponownie.' + unchanged;
    case 'SAME_ENDPOINT': return 'Wybierz różne punkty startu i celu.';
    case 'UNRESOLVED_ENDPOINT': return 'Nie rozpoznano wybranego punktu. Wybierz go ponownie z katalogu.';
    case 'OUTSIDE_COVERAGE': return 'Wybrany punkt znajduje się poza dostępnym obszarem.';
    case 'FEATURE_NOT_ENABLED': return 'Ta funkcja nie jest dostępna w bieżącym trybie demonstracyjnym.';
    case 'RATE_LIMITED': return `Zbyt wiele zapytań. Spróbuj ponownie za ${failure.response.error.details.retryAfterSec} sekund.` + unchanged;
    case 'VALIDATION_ERROR': return 'API nie przyjęło ustawień. Sprawdź pola formularza.' + unchanged;
    case 'INTERNAL_ERROR': return 'API nie mogło obliczyć trasy. Spróbuj ponownie.' + unchanged;
  }
}
