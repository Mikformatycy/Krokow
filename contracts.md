# Kontrakt frontend-backend

**Wersja opisowa:** `1.0.0-draft.1`. To specyfikacja wejściowa zadania F-02, nie już wdrożony schemat. Po wspólnym zatwierdzeniu jedynym źródłem definicji jest `packages/contracts/src`; OpenAPI jest generowane. Przykłady w `examples/` mają zostać objęte testem zgodności Zod.

## 1. Zasady transportu

JSON UTF-8 przez HTTPS poza lokalnym developmentem. Współrzędne nazwane `latitude`/`longitude` w endpointach wejściowych; geometria wyjściowa GeoJSON `[longitude, latitude]`. Metry i sekundy, skończone liczby, daty ISO 8601 UTC. Nie zamieniamy `null` na 0 lub bieżący czas.

`schemaVersion` identyfikuje kontrakt, a `graphVersion`, `evidenceVersion`, `policyVersion` są odrębnymi wersjami danych i algorytmu. Nie logujemy request body trasy, komentarzy ani surowych współrzędnych. Dla tras i zgłoszeń `Cache-Control: no-store`.

Błędne dane wejściowe są odrzucane, a nie milcząco korygowane. Serwer może ignorować nieznane pola tylko po jawnie przyjętej polityce kompatybilności; domyślnie wejście jest strict. Klient może tolerować dodatkowe opcjonalne pola odpowiedzi, lecz nie może zamieniać nieznanego stanu faktu w pozytywny wynik.

## 2. Endpointy

| Metoda i ścieżka | Faza | Wejście / rezultat |
| --- | --- | --- |
| `GET /healthz` | P0 | Liveness procesu; bez danych wrażliwych. |
| `GET /readyz` | P0 | Gotowość bazy, aktywnego grafu i kontraktu; 503 przy braku gotowości. |
| `GET /v1/coverage` | P0 | Obszar, tryb danych, lista możliwości; polygon w trybie pilot. |
| `GET /v1/places?cityId=...&query=...` | P0 | Maks. 10 wyników z lokalnego katalogu; zapytanie 2-100 znaków, pusty tekst może zwracać polecane punkty. |
| `POST /v1/routes` | P0 | 1-3 alternatywy, fakty, źródła, uzasadnienie i wersje. P1 używa tego samego endpointu do replan. |
| `GET /v1/sources` | P0 | Jawny rejestr źródeł, licencje, ostatni import, stan dostawcy. |
| `GET /v1/features/:id/evidence` | P0 | Tylko opublikowane, zredagowane dowody dla faktów obiektu; bez prywatnych zgłoszeń. |
| `POST /v1/reports` | P1 | Zgłoszenie do moderacji; 202 nie oznacza potwierdzenia ani publikacji. |
| `GET /openapi.json` | P0 | Dokument generowany ze wspólnych schematów. |

Nie dodajemy publicznego endpointu moderatora ani kont tylko po to, aby pokazać demonstrator.

## 3. Zapytanie o trasę

Pełny przykład: [route-request.json](../examples/route-request.json).

```ts
type Endpoint =
  | { kind: 'place'; placeId: string }
  | { kind: 'coordinate'; latitude: number; longitude: number };

type RouteRequest = {
  cityId: string;
  origin: Endpoint;
  destination: Endpoint;
  preferences: {
    preferAudibleSignals: boolean;
    preferTactilePaving: boolean;
    preferSeparatedFootways: boolean;
    avoidKnownSteps: boolean;
    audibleRequirement: 'none' | 'documented' | 'field_verified_recent';
    maxDetourRatio: number;
  };
  maxAlternatives: 1 | 2 | 3;
  locale: 'pl-PL';
};
```

P0 obsługuje katalog miejsc; `coordinate` jest capability P1, wymagającym przetestowanego dopasowania do grafu. Wyłączona capability daje `FEATURE_NOT_ENABLED`, nie niejawne przypięcie do najbliższej drogi. Identyczne start/cel dają `SAME_ENDPOINT`, aby klient poprosił o zmianę, zamiast sugerować pełną trasę zerowej długości.

Zakres `maxDetourRatio`: 1,0-2,0, wartość początkowa 1,6. Dotyczy długości względem najkrótszej trasy spełniającej **te same** ograniczenia, nie względem linii prostej. `avoidKnownSteps` usuwa zapisane schody, ale nie dowodzi nieobecności schodów w danych niepełnych.

Wymóg `documented` przy akustyce oznacza `known(true)` bez konfliktu na każdym etapie przejścia; `field_verified_recent` dodatkowo potrzebuje odpowiedniej weryfikacji i świeżości. Przy braku dowodu nie wolno rozluźnić wymagania. `asOf` ustala serwer; klient nie ustawia daty służącej pozornemu odświeżeniu faktów.

## 4. Odpowiedź z trasami

Pełny przykład synthetic: [route-response.json](../examples/route-response.json). Wszystkie odległości i udogodnienia w nim są fikcyjne. `geometry=null` jest dopuszczalne dla synthetic, ponieważ nie opisujemy prawdziwej przestrzeni. W `pilot` każda trasa wymaga ciągłej geometrii i poprawnych endpointów.

```ts
type RouteResponse = {
  schemaVersion: string;
  requestId: string;
  generatedAt: string;
  asOf: string;
  mode: 'synthetic' | 'pilot';
  navigationEligibility: 'preview_only' | 'foreground_experimental';
  dataContext: {
    cityId: string;
    graphVersion: string;
    evidenceVersion: string;
    policyVersion: string;
    snapshotFetchedAt: string;
    sourceStatus: 'ok' | 'degraded';
    sourceIds: string[];
  };
  calculation: { status: 'finished' | 'budget_limited'; exhaustive: false };
  baseline: { distanceM: number; walkingDurationSec: number;
              basis: 'same_hard_constraints' };
  routes: RouteOption[];
  recommendation: { routeId: string; reasons: RouteReason[] };
  evidenceCatalog: Evidence[];
  sourceCatalog: PublicSource[];
  warnings: Warning[];
};
```

`exhaustive=false` oznacza ograniczone generowanie alternatyw, nie niedokończenie poprawnie znalezionej trasy. `finished` oznacza wykonanie zaplanowanej procedury, a nie przeszukanie wszystkich możliwych dróg. `budget_limited` wymaga czytelnego ostrzeżenia. Pusta tablica `routes` nie jest sukcesem; brak wyniku ma osobny błąd.

`baseline` zawsze opisuje najkrótszą trasę spełniającą te same twarde ograniczenia. Dla `maxAlternatives=1` można pokazać tylko rekomendację; przy limicie co najmniej 2 zachowaj też najkrótszą opcję, o ile jest inna. Objazdu nie przeliczaj względem minimum spośród samych widocznych kart.

`synthetic` bezwzględnie wymusza `preview_only` w backendzie i w kliencie. Nawet `foreground_experimental` nie wystarcza do uruchomienia sesji: wymagane są zgoda, jakość pozycji, aktywna aplikacja, aktualna polityka i odebrane testy P1.

### RouteOption

| Pole | Znaczenie / inwariant |
| --- | --- |
| `id` | Opaque ID opcji w ramach odpowiedzi; `recommendation.routeId` musi występować w `routes`. |
| `labels` | Dowolne pasujące etykiety: `shortest`, `recommended`, `better_documented`, `fewer_crossings`; poparte metrykami. |
| `geometry` | GeoJSON LineString w pilot; `null` tylko synthetic. Kolejność punktów zgodna z przejściem. |
| `edgeIds` | Skierowane krawędzie w kolejności; użyteczne do deduplikacji i wyjaśnienia. |
| `metrics.distanceM` | Suma długości krawędzi. |
| `metrics.walkingDurationSec` | Model czasu samego marszu, nie koszt grafu. |
| `metrics.assumedWalkingSpeedMps` | Jawne założenie prędkości; początkowo 1,2 m/s. |
| `metrics.crossingWaitDurationSec` | `null`, gdy nie znamy czasu oczekiwania; MVP nie pobiera faz świateł. |
| `metrics.extraDistanceM` | Względem `baseline.distanceM`, także gdy najkrótsza trasa nie jest pokazana przy limicie jednej opcji. |
| `metrics.crossingCount` | Liczba odrębnych fizycznych przejść. |
| `metrics.crossingStageCount` | Liczba przechodzonych etapów; wyspa może zwiększyć tę liczbę. |
| `metrics.audibleSignals` | Liczniki `present`, `absent`, `unknown`, `conflicting`; suma = crossingStageCount. |
| `metrics.unknownSegmentLengthM` | Metry odcinków bez rozpoznanych istotnych cech, bez podwójnego liczenia; `null`, gdy metryka nie została wyliczona. |
| `steps` | Lista manewrów z `startM`, `endM`, kontrolowanym `instructionKey` i parametrami. |
| `events` | Zdarzenia na trasie z monotonicznym `offsetM`, obiektem, etapem i faktami. |

Dla trasy bez przejść wszystkie cztery liczniki akustyki wynoszą 0, ale nie opisujemy jej jako "100% potwierdzona". Wszystkie offsety mieszczą się w `[0, distanceM]`. Identyfikatory zdarzeń są stabilne wewnątrz wersji planu; deduplikacja odczytu uwzględnia route ID i event ID.

### Zdarzenie przejścia

```ts
type CrossingEvent = {
  id: string;
  kind: 'crossing';
  offsetM: number;
  objectId: string;
  crossingId: string;
  stageId: string;
  instructionKey: 'route.crossing_approach';
  facts: {
    audible_signal: Fact<boolean>;
    tactile_paving: Fact<'yes' | 'no' | 'partial' | 'incorrect'>;
  };
};
```

`offsetM` to położenie zdarzenia na geometrii, nie zgoda na uruchomienie polecenia przy danym GPS. Urządzenie podejmuje lokalną decyzję, czy jego pozycja jest wystarczająco wiarygodna do komunikatu informacyjnego. Brak `left/right` jest celowy: nie znamy tej relacji bez zweryfikowanego kierunku podejścia.

### Fact i Evidence

Wspólny model Fact opisano w `architecture.md`, sekcja 5.2. `known` ma `value`, `evidenceIds`, `reliability`, `freshness`, `observedAt`, `verifiedAt`. `unknown` ma `reason` i `evidenceIds`; `conflicting` ma `summaryCode` i referencje do co najmniej dwóch sprzecznych obserwacji. Nie przekazujemy `value=true` dla konfliktu.

`Evidence` zawiera: `id`, `sourceId`, `sourceRecordId`, `objectId`, `featureKey`, `value`, `fetchedAt`, `sourceModifiedAt`, `observedAt`, `verifiedAt`, `validUntil`, `verificationStatus`, `scope`, `note`. Zakres ma pola `side`, `direction`, `level`, dopuszczające `null` dla nieustalonej informacji. Nieustalony zakres nie jest dopasowywany na korzyść użytkownika.

`verificationStatus`: `unverified`, `source_declared`, `field_verified`. W synthetic każde źródło ma typ `synthetic`, a daty rzeczywistych obserwacji/potwierdzeń pozostają `null`. Fixtures mogą osobno symulować weryfikację do testowania polityki, lecz nadal muszą blokować nawigację terenową.

`PublicSource` zawiera `id`, `kind`, `name`, `sourceUrl`, `attribution`, `license`, `lastFetchedAt`, `status`. `sourceUrl=null` jest dozwolone dla własnego synthetic. Nie kopiujemy do publicznego katalogu danych kontaktowych autora zgłoszenia.

## 5. Uzasadnienia i ostrzeżenia

`RouteReason = { code, params, evidenceIds }`. Klient korzysta z kontrolowanych szablonów, nie z interpretacji swobodnego tekstu backendu. Klucze pierwszej wersji: `SHORTER_DISTANCE`, `MORE_DOCUMENTED_AUDIBLE_SIGNALS`, `FEWER_UNKNOWN_AUDIBLE_SIGNALS`, `FEWER_CROSSING_STAGES`, `DETOUR_FOR_PREFERENCES`.

Przykład parametrów dla akustyki: `routePresentCount`, `baselinePresentCount`; dla objazdu: `extraDistanceM`. "Documented" w kodzie oznacza informację o obecności, nie formalną gwarancję. Tłumaczenie nie może wzmacniać pewności faktu.

`Warning = { code, severity, messageKey, params, evidenceIds }`. Pierwsze kody: `SYNTHETIC_DATA`, `MISSING_FEATURE_DATA`, `CONFLICTING_FEATURE_DATA`, `SNAPSHOT_STALE`, `SOURCE_DEGRADED`, `SEARCH_BUDGET_LIMITED`. `severity`: `info`, `warning`, `critical`. Kolor nie jest jedyną reprezentacją.

## 6. Błędy i reakcja interfejsu

```ts
type ApiError = {
  schemaVersion: string;
  requestId: string;
  error: {
    code: string;
    messageKey: string;
    retryable: boolean;
    details: Record<string, unknown>;
  };
};
```

`details` ma osobny, kontrolowany schemat dla każdego kodu, a nie dowolny obiekt wyjątku/SQL. Przykład: [route-unavailable.json](../examples/route-unavailable.json).

| HTTP / kod | Dokładne znaczenie | Reakcja UI |
| --- | --- | --- |
| 400 `VALIDATION_ERROR` | Błędny kształt/liczba/zakres wejścia | Wskaż pole; zachowaj formularz. |
| 422 `SAME_ENDPOINT` | Te same punkty start/cel | Poproś o inny punkt. |
| 422 `OUTSIDE_COVERAGE` | Punkt poza opublikowanym obszarem | Pokaż zakres i katalog punktów. |
| 422 `UNRESOLVED_ENDPOINT` | Brak uzasadnionego dopasowania do grafu/strony | Nie rysuj łącznika; wybór punktu katalogowego. |
| 422 `NO_PATH` | W bazowym grafie pieszego dostępu nie znaleziono połączenia po zakończonym wyszukiwaniu | "Brak znanej trasy w tym zbiorze", nie "nie da się dojść". |
| 422 `NO_MATCHING_ROUTE` | Bazowe połączenie istnieje, ale twarde wymagania wykluczyły wszystkie drogi | Pokaż blokujące wymagania; zmiana tylko po zgodzie. |
| 409 `DATA_VERSION_CHANGED` | Żądana wersja nie jest już dostępna | Zaproponuj przeliczenie; nie zmieniaj sesji w tle. |
| 422 `FEATURE_NOT_ENABLED` | Np. endpoint coordinate w P0 | Wyjaśnij zakres funkcji. |
| 503 `SOURCE_UNAVAILABLE` | Brak usable snapshotu; nie tylko awaria dostawcy | Retry i podgląd zapisanego planu, nigdy ukryty mock. |
| 504 `SEARCH_LIMIT_REACHED` | Budżet wyczerpany przed znalezieniem poprawnego wyniku | "Nie ukończono obliczenia", możliwość ponowienia. |
| 429 `RATE_LIMITED` | Limit żądań | Komunikat, `Retry-After`, bez agresywnych powtórzeń. |
| 500 `INTERNAL_ERROR` | Kontrolowany błąd techniczny | Neutralny komunikat i request ID; bez szczegółów serwera. |

Rozróżnienie `NO_PATH`/`NO_MATCHING_ROUTE` może wymagać dodatkowego sprawdzenia łączności bez preferencji, ale nadal z legalnym dostępem pieszym i zamknięciami. Nie zgadujemy przyczyny po samym pustym wyniku listy kandydatów.

## 7. Zgłoszenie P1

Wejście: `cityId`, `objectId`, `category`, `comment` do 500 znaków, `observedAt` podane jako deklaracja użytkownika; opcjonalna przybliżona pozycja tylko gdy obiekt nie może być wybrany inaczej. Kategorie: niezgodne dane, niedziałający sygnalizator, czasowa przeszkoda, inne. Bez zdjęć i danych zdrowotnych na starcie.

`Idempotency-Key` chroni przed zdublowaniem po ponowieniu. Wynik 202: `reportId`, `status=pending_moderation`, `createdAt`. Brak publicznego odczytu prywatnego raportu przez zgadywalne ID. Frontend pokazuje "przyjęto do moderacji", nie "dane poprawione". Raport offline pozostaje lokalnym szkicem i wymaga jawnego wysłania po odzyskaniu sieci.

## 8. Test kontraktowy

Każdy fixture JSON musi przejść odpowiedni schemat. Odpowiedź HTTP podlega dodatkowym inwariantom: wersje spójne, wszystkie evidence IDs istnieją, liczniki zgodne ze zdarzeniami, offsety w granicach, geometry wymagana w pilot, synthetic zawsze preview-only, recommendation wskazuje dostępną opcję.

Zmiana kontraktu zaczyna się od PR ze schematem, przykładem i konsekwencjami dla UI. Dopiero po akceptacji obie implementacje korzystają z nowej wersji. Nie edytujemy przykładów tylko po to, aby ominąć nieudany test algorytmu.
