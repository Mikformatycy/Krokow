# B — B-03 EvidenceResolver

## Pilne przekazanie A: realne dane, 2026-10-03

Użytkownik nadał priorytet realnym punktom i trasom w aplikacji.
B przygotowuje snapshot/graf/API `mode: pilot`, `navigationEligibility:
preview_only` na istniejącym kontrakcie draft.2. Zakres: [real-pilot](real-pilot.md).
**A:** przy uproszczeniu UX przygotować HTTP/UI do pilot/preview_only:
HttpRouteApi nie może odrzucać pilot; walidacja RouteResponseSchema i
twardych wymagań pozostaje. Odróżnić prawdziwe dane od przykładu synthetic,
pokazać rzeczywistą nazwę obszaru i źródło, nie uruchamiać synthetic-only
SimulationSession dla pilot. Brak automatycznej zamiany błędu na przykład.
Katalog do 10 rzeczywistych punktów, współrzędne tylko pilot, bez GPS.
B wystawi testowe API na 3003 i przekaże konkretne dane po walidacji.
Nie zmieniać schematów/rankingu ani backendu; zapisać odbiór i wynik w
handoffie mobile. Przeczytać tę sekcję przed kolejną integracją.

### API pilot już uruchomione

`http://127.0.0.1:3003`, bez zmiany podglądu 3001. `/v1/coverage` podaje
`cityId=krakow-stare-miasto-pilot`, `mode=pilot`, `preview_only` i polygon.
`/v1/places?cityId=krakow-stare-miasto-pilot&query=` zwraca pięć realnych
wejść. Przykład: `osm-place-3719851597` (Galeria od Pawiej) do
`osm-place-5213212813` (High5ive, wejście zachodnie): ok. 420 m, jedno
przejście; akustyka unknown. Domyślny `audibleRequirement=none` daje trasę,
`documented`/`field_verified_recent` nie może zgadywać akustyki.
Wszystkie 10 par w audycie wyznaczyło trasy. Geometry jest rzeczywistą
LineString; źródło OSM, pobranie 2026-10-03T19:17:26.330Z.
Nie zmieniono schematów/wersji ani wag istniejącego `PILOT_POLICY`.
### Integracja publicznego podglądu

A przekazała UX i pilot jako gotowe do integracji: sześć testów realnego
HTTP/UI PASS, przegląd istniejącego kontraktu bez zmiany DTO. B przełączyła
API **3001 na pilot** po tym przekazaniu. Gateway 8082, ngrok i Metro 8081
pozostały uruchomione; A wcześniej odświeżyła bundle. Adres Expo Go bez zmiany:
`exps://chaos-virtuous-mumble.ngrok-free.dev`.
Kontrola publicznego HTTPS: coverage pilot/preview_only, pięć miejsc i POST
420,217 m / 18 punktów geometrii / akustyka unknown / źródło OSM — PASS.
Użytkownik po przeładowaniu Expo Go na iPhonie potwierdził prawdziwe punkty
i trasę ok. 420 m. Odsłuch realnego pilota i VoiceOver jeszcze bez testu.
**Przekazanie A:** utrzymać obsługę pilot i sprawdzić odsłuch oraz VoiceOver
na nowym UX; nie przywracać API synthetic przy restarcie.
Historyczny ignorowany launcher A `phone-preview-start.ps1 -Role Api` ustawia
synthetic, więc do kolejnego uruchomienia API użyć `API_DATA_MODE=pilot`
zgodnie z README (B nie edytowała lokalnego skryptu A).

Przy końcowym sprawdzeniu B znalazła błąd web przez tunel: ngrok odpowiadał
ostrzeżeniem ERR_NGROK_6024 zamiast JSON. Po odebraniu plików A B dodaje
wyłącznie do HttpRouteApi nagłówek `ngrok-skip-browser-warning` dla domen
`.ngrok-free.dev`/`.ngrok-free.app` oraz dopuszcza go w CORS API, zachowując
zamkniętą listę originów i `credentials: omit`. Osobne testy adaptera i
preflight; konieczny kolejny restart Metro dla tej poprawki integracyjnej.
Końcowe kontrole: 136 mobile przed poprawką tunelu; po poprawce 10 adaptera,
92 API, lint/typecheck całości i build web PASS. Test widoku 390 px przez
publiczny tunel: realne punkty → wynik 420,217 m PASS. Końcowy bundle iOS
HTTP 200, 6 890 869 bajtów, zawiera poprawkę; Metro zrestartowane przez B.
To [udokumentowana opcja ngrok](https://ngrok.com/docs/pricing-limits/free-plan-limits#using-headers),
bez zmiany kontraktu, konta ani płatnego planu.

Aktualizacja B-04 po integracji A: dodano lokalny importer i audyt;
[wyniki i ograniczenia](b04-ingestion.md), [komendy](../packages/ingestion/README.md).
42 testy ingestion oraz lint/typecheck/routing/contracts/API/generated PASS.
Historyczna próba pobrania z Overpass zakończyła się timeoutem. Późniejszy
pilot korzysta z jednorazowego, zarchiwizowanego eksportu OSM API, opisanego
wyżej; nie deklarujemy sprawności pobierania Overpass na tej podstawie.

Status: **IMPLEMENTACJA I TESTY GOTOWE — do przeglądu przed podłączeniem do API**,
2026-10-03. Właściciel: dotychczasowa rozmowa B.

Zakres: czysty moduł w packages/routing, eksport, testy oraz dokumentacja.
Bez edycji mobile, kontraktów/fixtures, zależności, rankingu i działającego API.
A może niezależnie pracować nad M-04 i używać obecnego synthetic HTTP.

## Założenia przed implementacją

- Wejście: obecne Evidence/PublicSource plus wewnętrzna informacja o dopuszczeniu
  publikacji i opcjonalnym wspólnym pochodzeniu kopii. Czas UTC wstrzykiwany.
  Wewnętrzny audyt nie jest nowym formatem API.
- Dokładny zakres jest wymagany do rozstrzygnięcia. Nie rozszerzamy zakresu
  null/both na konkretną stronę/kierunek. Nakładający się, niedokładny zakres
  daje unknown/ambiguous_scope; rozłączny jest pomijany z powodem w audycie.
- Dopuszczenie raportu do publikacji nie daje field_verified. Kolejny fetch
  ani zmiana sourceModifiedAt nie ustalają świeżości. Daty i wiarygodność
  znanego faktu pochodzą z tego samego dowodu, bez łączenia starej weryfikacji
  z nową, nieweryfikowaną obserwacją w fikcyjnie świeże potwierdzenie.
- Trwała infrastruktura może pozostać stale. Wygaśnięty raport przeszkody
  nie staje się known(false); pozostaje w audycie, poza aktualnym faktem.
- Dwa różne stanowiska z niezależnych źródeł dają conflicting, niezależnie
  od większości, rangi źródła i wieku. Sprzeczne wersje jednego pochodzenia
  blokują known: unknown/unsupported_value plus jawny problem w audycie.
  **Ograniczenie draft.2:** publiczny conflicting wymaga niezależnych
  sourceId/sourceRecordId; nie zmieniamy kontraktu dla rewizji tego samego
  źródła. Przed podłączeniem do API potrzebny przegląd prezentacji tego
  przypadku. Nie jest to potwierdzenie zgodności takich danych.
- Konflikt można zamknąć wyłącznie jawną decyzją wskazującą opublikowany
  dowód field_verified, zastępowane obserwacje, datę przeglądu i uzasadnienie.
  Walidujemy zakres, chronologię i brak cyklu. Zachowujemy audyt i kopie
  pochodzenia; sam nowszy rekord nie zamyka konfliktu.
- Polityka wieku przekazywana jawnie, bez zmiany wag routingu. Progi są
  konfiguracją do późniejszej kalibracji; resolver nie potwierdza świateł live.

## Kryteria odbioru tej iteracji

Testy: known(false)/missing/unsupported, odrzucone i niedopuszczone raporty,
zakresy, duplikaty i kopie źródeł, konflikty i jawne zastąpienie, daty/future,
granice świeżości i wygaśnięcia, permutacje, niezmienność wejścia, zgodność
wyjścia z kontraktem. Lint/typecheck, contracts/routing/API i generated.

Pełne podłączenie importera/grafu i przegląd A pozostają osobnym krokiem.
Nie uruchamiać równolegle z A runnera mobile ani instalacji.

## Rezultat dla A

Eksport `resolveEvidence(request, clock)` w `@krok/routing`. Zwraca `fact`
zgodny z dotychczasowymi typami i wewnętrzny `audit`. Obecne API, fixtures,
DTO, zależności i wagi bez zmian. Dokumentacja: [B-03](b03-evidence.md).
A może kontynuować M-04; nie musi teraz podłączać tego modułu.

Do przeglądu przed realnymi danymi: sprzeczne rewizje jednego pochodzenia
nie mieszczą się w publicznym conflicting draft.2; obecnie unknown z jawnym
wewnętrznym problemem inconsistent_origin. Przypadek nie jest publikowany
przez nowe API. Udowodniony niezależny konflikt zachowuje conflicting nawet
w obecności dodatkowych błędnych/niejednoznacznych rekordów.

Pliki B: `packages/routing/src/evidence/{types,resolve}.ts`, eksport
`src/index.ts`, `test/evidence.test.ts`, README pakietu, `docs/b03-evidence.md`,
ten raport i własny wpis w centralnym statusie. Nie zmieniano plików A.

Kontrole przez Node 24.21.0 / pnpm 10.34.6:

| Polecenie | Wynik |
| --- | --- |
| pnpm lint / pnpm typecheck | PASS na stanie wspólnym w czasie kontroli. |
| pnpm test:routing | 87 PASS: 47 nowych resolvera/integracji + 40 wcześniejszych. |
| pnpm --filter @krok/routing typecheck | PASS po dodaniu testu pełnego grafu. |
| pnpm exec eslint packages/routing --max-warnings 0 | PASS po ostatniej zmianie testu. |
| pnpm test:contracts / pnpm test:api | 121 / 86 PASS. |
| pnpm check:generated | PASS, 29 artefaktów zgodnych. |
| git diff --check (zakres B) | PASS. |

Nie uruchamiano runnera mobile ani build:web — są po stronie A. Nie
uruchamiano nowego importu OSM, bazy ani testów terenowych/telefonu.
Resolver nie ustala autentyczności metadanych operatora: waliduje ich
spójność; pochodzenie musi zapewnić importer/moderacja. Nie zadeklarowano
wspólnego odbioru B-03 ani działania rzeczywistych tras.

Następny krok B: ograniczony audyt i adapter snapshotu OSM (B-04), z użyciem
resolvera; podłączenie do publikowanego grafu dopiero po przeglądzie danych
i oknie integracji. A kończy M-04 na dotychczasowym synthetic HTTP.
