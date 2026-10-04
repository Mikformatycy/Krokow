# Kontrakt F-02

## Addytywna wyszukiwarka miasta — 2026-10-03

Nowe `PlaceSearchQuerySchema` / `PlaceSearchResponseSchema` oraz
`placeSearchResponse` z fixtures opisują `/v1/place-search`. Osobna wersja
funkcji **place-search-1**; istniejące DTO i envelope draft.2 bez zmiany.
Regeneracja tworzy także `place-search.json` i `place-search-empty.json`.
`routing.available` ma jawne cityId/placeId; obiekt z punktem orientacyjnym
nie może udawać punktu grafu. Pełna instrukcja i zakres odbioru UI:
[place-search](../../docs/place-search.md). Implementacja i testy backendu
gotowe; mobile jest podłączony. Aktualna regresja i zakres telefonu: [testing](../../docs/testing.md).

## Dotychczasowy kontrakt routingu

Wersja wykonawcza `1.0.0-draft.2`; endpoint wyszukiwania dodatkowo ma
`searchVersion=place-search-1`. Pakiet jest wspólnym źródłem schematów API i
mobile. HTTP działa w apps/api; nazwa draft nie oznacza braku implementacji.
[Przegląd F-02](../../docs/f02-review.md) jest historycznym zapisem decyzji.

Import w mobile/API:

```ts
import { RouteRequestSchema, RouteResponseSchema } from '@krok/contracts';
import type { RouteResponse } from '@krok/contracts';
import { routeScenarios } from '@krok/contracts/fixtures';

const scenario = routeScenarios.find((item) => item.id === 'abc');
if (!scenario) throw new Error('Missing fixture');
const request = RouteRequestSchema.parse(scenario.request);
const response: RouteResponse = RouteResponseSchema.parse(scenario.response);
```

`routeScenarios` zawiera pary request/response; scenariusz wybiera się jawnie.
Mock powinien odrzucać nieobsługiwane wejścia, zamiast zwracać przykładową trasę
dla dowolnych preferencji. `errorScenarios` opisuje błędy; tylko request dla
VALIDATION_ERROR jest celowo niepoprawny strukturalnie. Fixtures są przykładami
DTO, nie wynikiem zaimplementowanego routingu. Nie modyfikuj ich podczas testu:
użyj `createRouteResponse()` lub kopii. Główny eksport i fixtures nie importują Node.

Kroki i zdarzenia łączy się według offsetu. Przy remisie kolejność jest:
route.start, zdarzenia (kolejność tablicy), route.follow_segment, route.arrive.
Nie interpretuj nazwy odcinka ani note jako polecenia. Teksty dotyczące przejść
pozostają kontrolowanymi szablonami do wspólnej recenzji.

Z katalogu głównego, Node/pnpm zgodne z README:

```sh
pnpm test:contracts
pnpm contracts:export
pnpm check:generated
pnpm lint
pnpm typecheck
pnpm test
```

`contracts:export` waliduje fixtures i generuje `examples/*.json` oraz
`packages/contracts/openapi.json`. `check:generated` porównuje treść bez zapisu,
odrzuca brakujące lub nieaktualne pliki i niezarejestrowane przykłady JSON.
OpenAPI dokumentuje kształt danych; pełne kontrole relacji są w eksportowanych
walidatorach Zod. HTTP nadal musi sprawdzić powiązanie wyniku z konkretnym
requestem, twarde wymagania, limity objazdu i zgodność wersji. Implementacja
API i klienta wykonuje te kontrole; potwierdzają je testy obu pakietów.

Brak automatycznych defaults, koercji, transformacji i typów Node w wire.
SameEndpoint jest prawidłowym kształtem requestu, ale błędem domenowym API.
Nieznane pola/wersje/klucze są odrzucane. Daty obserwacji pozostają osobne
od importu; fixture stale symuluje dawne potwierdzenie z jawną notą.
