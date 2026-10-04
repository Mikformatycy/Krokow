# Routing — B-02

Pakiet oblicza trasy z jawnych skierowanych połączeń grafu synthetic lub rzeczywistego snapshotu OSM. Aktualny runtime API używa loadKrakowPrototype i PILOT_POLICY przy API_DATA_MODE=pilot.
`createPlanner(snapshot, policy, monotonicClock)` kopiuje i waliduje snapshot,
a `plan(request, { requestId, asOf })` zwraca DTO sprawdzone przez wspólny Zod.
`asOf` jest zegarem faktów, a monotoniczny zegar służy limitowi obliczeń.
Pakiet nie korzysta z sieci, bazy ani LLM. Adapter HTTP: `apps/api/src/routing.ts`.

- Dijkstra wyznacza najkrótszą trasę pod tymi samymi twardymi ograniczeniami.
  Oddzielne profile preferencji i braków danych oraz ograniczony algorytm Yen
  dostarczają do 12 kandydatów bez pętli. Rekomendacja minimalizuje koszt
  preferencji wśród znalezionych tras mieszczących się w limicie objazdu.
- Limit domyślny: 50 000 operacji wyszukiwania i 2 sekundy. Przed udowodnieniem
  baseline wyczerpanie daje SEARCH_LIMIT_REACHED; po nim poprawny wynik częściowy
  z SEARCH_BUDGET_LIMITED. `exhaustive=false` także po normalnym zakończeniu.
- Zwracamy do trzech opcji: rekomendację, baseline przy limicie co najmniej 2,
  następnie niezdominowaną alternatywę. Przy jednakowej najkrótszej długości
  rekomendacja może reprezentować baseline. Brak sztucznego dopełniania listy.
- Deduplikacja liczy wspólną długość fizycznych odcinków, próg 85% krótszej
  trasy; podział krawędzi nie zmienia wyniku. Różne przejścia/stany faktów
  zachowują odrębność. Koszt przejścia jest naliczany raz na etap.
- Dostęp denied/unknown i zamknięcia wykluczają krawędź. `avoidKnownSteps`
  wyklucza jawne schody, a nie zastępuje braków danych potwierdzeniem ich braku.
  Akustyka documented wymaga known(true); field_verified_recent wymaga
  pochodzenia terenowego i rzeczywistej daty w oknie polityki.
- NO_PATH oznacza brak połączenia w grafie legalnego dostępu. NO_MATCHING_ROUTE
  oznacza istniejące połączenie zablokowane twardymi wymaganiami. Nigdy nie
  rozluźniamy ich w odpowiedzi. Diagnostyka podaje aktywne twarde wymagania;
  nie wyznacza minimalnego zbioru przyczyn blokady.

`createSyntheticSnapshot()` tworzy trzy fikcyjne korytarze, jawne kierunki
powrotne, dowody deklarowane i brak geometrii realnych miejsc. A/B/C:
740/980/1120 m, po włączeniu akustyki koszty 1480/1100/1160 i rekomendacja B.
Bez miękkiej preferencji akustyki koszt równa się długości i wygrywa A.
Wszystkie odpowiedzi mają `synthetic`, `preview_only` oraz ostrzeżenie.

`src/policy/default.ts` skupia parametry. Polityka `synthetic-acoustic-v1`
wyłącza miękkie kary dotyku, oddzielenia i wieku, zachowując przykład
architektury; nie jest skalibrowanym rankingiem produktu. `PILOT_POLICY`
zawiera osobne hipotezy z architektury i jest używana w trybie pilot.
Resolver obserwacji i ich starzenia B-03 jest zaimplementowany; planner przyjmuje rozstrzygnięte
fakty z dowodami i sam sprawdza datę twardego wymogu terenowego.

Testy: `pnpm test:routing`, `pnpm test:api`, `pnpm test:contracts`,
`pnpm lint`, `pnpm typecheck`. Scenariusze obejmują niezależną enumerację
małych grafów, podział krawędzi, sprzeczności, aktualność, limity oraz HTTP.
Pełne wyniki: [status](../../docs/status.md).

Ograniczenia: obliczenia synchroniczne w RAM, brak przyciągania dowolnych
współrzędnych i prowadzenia terenowego. Import OSM jest w osobnym pakiecie
ingestion; wykonano lokalne pomiary wybranego grafu, nie test obciążeniowy
całego miasta. Mobile korzysta z HTTP; zakres urządzenia: [odbiór](../../docs/testing.md).
Snapshot synthetic v2 nie zmienia starych fixtures v1.
# Resolver dowodów B-03

`resolveEvidence` oraz jego typy są eksportowane z `@krok/routing`.
Funkcja wymaga jawnej polityki i zegara, zwraca istniejący model faktu
oraz wewnętrzny audyt. Ingestion używa jej przy budowie snapshotu;
planner przyjmuje już rozstrzygnięte fakty.
Reguły, użycie i ograniczenia: [B-03](../../docs/b03-evidence.md).
