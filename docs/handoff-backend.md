# Handoff B — backend, dane i integracja

> **Dokument historyczny — odczytuj w kontekście opisanej iteracji.**
> Aktualny stan: [README](../README.md), [odbiór](testing.md) i [status](status.md).
> Integracja wyszukiwania/API jest zakończona; ostatnia pełna kontrola miała
> 620 testów PASS, a pięć prób iPhone/VoiceOver potwierdził użytkownik.
> Nowe podsumowanie i pozostałe próby urządzenia są otwarte. Dawne A/B,
> NOT TESTED, „do integracji” i listy przyszłych modułów niżej nie opisują
> automatycznie stanu obecnego. Aktualne materiały PDF/film są do wykonania.

> Przekazanie całego projektu, 2026-10-04: aktualny punkt wejścia to
> [handoff-codex.md](handoff-codex.md). Poniżej zachowano raporty i wyniki
> poprzednich iteracji. Ich historyczny podział A/B nie ogranicza następcy.

## 2026-10-04 — wyszukiwanie miasta i fakty przy trasie — GOTOWE DO INTEGRACJI

Użytkownik wznowił implementację po zakończeniu UI. Ta sekcja zastępuje
wcześniejszą blokadę „sam plan”. Zapis zakresu:
[prototype-completion.md](prototype-completion.md), wyniki audytu:
[data-audit-report.md](data-audit-report.md). Gotowy kreator A zachowano.

### Działanie

- Pilot mobile wyszukuje w 96 556 wpisach katalogu Krakowa. Do obliczeń
  przekazuje wyłącznie jawne wiązanie do jednego z 30 punktów grafu.
  Adres i przyczyna unavailable są czytelne także w etykiecie czytnika.
  Nie ma cichego powrotu do starego katalogu podczas awarii nowego endpointu.
- Obecne DTO `evidenceCatalog` zawiera rekordy dokładnych obiektów wszystkich
  zwracanych wariantów. Nie zmieniono kontraktu ani semantyki rankingu.
  Nowe rozwijane szczegóły „Informacje o odcinkach” podają wartość, obiekt,
  źródło, status, zakres i oddzielne daty. Nie przypisują całego katalogu
  jednemu wariantowi lub całej jego długości. Szablony mowy, symulacja i
  koordynator pozostały bez zmian; nowe szczegóły są tekstem dla czytnika.
- Główne demo: Galeria Krakowska — wejście od Pawiej → High5ive, budynek 1 —
  wejście zachodnie, 420 m, 1 etap z nieznaną akustyką, 5 zapisów nawierzchni.
  „Utwardzona” nie jest potwierdzeniem równej nawierzchni ani dostępności.
- „Nowa Huta” daje rzeczywiste wyniki bez obsługi tras; przycisk pokazuje
  przyczynę, a „Pokaż punkty z trasami” przywraca propozycje. Wymagana
  udokumentowana akustyka na głównej parze → NO_MATCHING_ROUTE; Rynek →
  Galeria → NO_PATH. Preferencje nie są automatycznie rozluźniane.

### Pliki tej iteracji

- Dane/audyt: nowe `packages/ingestion/src/accessibility-audit.ts`,
  `audit-accessibility-cli.ts`, `test/accessibility-audit.test.ts`,
  `data/audits/accessibility-before.json` i `accessibility-audit.json`.
- Backend: `packages/routing/src/present.ts`, `apps/api/test/prototype.test.ts`.
- Funkcjonalna integracja mobile: `src/adapters/api/HttpRouteApi.ts`,
  `MockRouteApi.ts`, `src/features/planning/searchCatalog.ts`, `PlaceStep.tsx`,
  `RouteResults.tsx`, `test/search-catalog.spec.ts`, `test/pilot/pilot.e2e.ts`.
- Dokumentacja: zakres, raport audytu, plan audytu, własny wpis statusu,
  ten handoff, nota B w handoff-mobile oraz aktualizacja polecenia w głównym
  i katalogowych AGENTS, codex-start i claude-start. Starsze raporty A zachowano.

### Weryfikacja

Komendy uruchamiano przez `npm.cmd exec --yes --package=node@24.21.0
--package=pnpm@10.34.6 --call "<komenda>"`:

```text
pnpm --filter @krok/contracts --filter @krok/routing --filter @krok/ingestion --filter @krok/api test
pnpm --filter @krok/ingestion --filter @krok/api test
pnpm typecheck
pnpm lint
pnpm test:mobile
pnpm --filter @krok/mobile exec playwright test --config test/pilot.config.ts
pnpm --filter @krok/mobile exec playwright test --config test/pilot.config.ts -g searches
pnpm build:web
pnpm --filter @krok/ingestion exec tsx src/audit-accessibility-cli.ts data/audits/accessibility-audit.json
pnpm --filter @krok/ingestion exec tsx src/audit-accessibility-cli.ts test-results/accessibility-repeat.json
pnpm --filter @krok/api exec tsx src/audit-prototype-http.ts https://chaos-virtuous-mumble.ngrok-free.dev test-results/http-completion.json
```

Wyniki: contracts 132, routing 87, ingestion 88, API 115 PASS; mobile
162/162 PASS. Pilot: 8/10 w pierwszym przebiegu; błędny selektor obejmował
widoczny komunikat i jego kopię w announcerze. Zawężono do korzenia aplikacji;
ponowienie obu przypadków (desktop/narrow) 2/2 PASS. Test audytu początkowo
przekroczył timeout podczas wczytywania archiwum; ładowanie przeniesiono poza
ciało testu; pełny ingestion/API ponowiony i PASS. Lint/typecheck/eksport PASS.
Raport audytu odtworzony bajt w bajt; SHA-256 podany w statusie.
Publiczny HTTP: 3 pary 200 i dwie oczekiwane odmowy 422; osobny POST przez
tunel potwierdza 5 rekordów nawierzchni i preview_only rzeczywistej trasy.

### Stan uruchomienia i przekazanie

API 3001 PID 3212, API 3003 PID 28596 (stan po restarcie); Metro 8081
PID 25536, gateway 8082 PID 20088 — pozostawione. Testowe Metro 8085
zamknął runner. Dotychczasowy tunel ngrok działa. Bez commitów/pushów.

**Dalszy odbiór A/użytkownika:** przeładować Expo Go; sprawdzić na iPhonie
Nową Hutę, powrót do punktów z trasami, główną parę demo oraz odczyt nowych
szczegółów przez VoiceOver. Telefon/TalkBack/teren po tej zmianie:
**nieprzetestowane**. Nie deklarujemy pełnego odbioru dostępności.
Nie rozszerzono topologii ani zasięgu tras na całe miasto. Pozostają duże
objazdy i rozłączne grupy; fakty mają nieznaną aktualność terenową. ORS i
materiały zgłoszeniowe P-06 nadal poza zrealizowanym zakresem.

## 2026-10-04 — plan audytu danych, bez implementacji

Użytkownik zlecił ujednolicenie instrukcji i sam plan. Obowiązuje
[data-audit-plan.md](data-audit-plan.md). P-01–P-06 są PLANOWANE, jeszcze
nieuruchomione; nie traktować wcześniejszego GOTOWE DO INTEGRACJI jako zgody
na nowe zmiany. ORS jest opcją do późniejszej oceny, nie nową architekturą.

Przyszłe pierwsze zadanie B: P-01, audyt lokalnych archiwów raw → fakty →
graf → odpowiedzi, odtwarzalny raport stanów/zakresu/dat/luk i wybór
kandydatów do demonstracji. Bez nowego importu, zmiany raw i danych runtime.
Dokumenty startowe uporządkowano: codex-start = B, claude-start = A.
Podział i brak worktrees/commitów/pushów są w two-codex-plan.md.

Zmiany tej iteracji są wyłącznie organizacyjne; kod/dane/kontrakty i procesy
nie były zmieniane. Nie wykonano audytu ani testów aplikacji. Zakres plików
i kontrole dokumentów: własny wpis B w [status.md](status.md).
**Przekazanie A:** przeczytać nowy plan i claude-start; przyszły P-04/P-05
opierać na istniejącym kreatorze i raporcie B. Teraz nie rozpoczynać realizacji.

## B-05/B-06 — domknięcie funkcjonalnego prototypu — GOTOWE DO INTEGRACJI

**Pilne dla A:** testowe API 127.0.0.1:3003 już serwuje rozszerzony graf:
30 punktów, 96 556 wpisów wyszukiwarki, bez zmian DTO. GET search → POST
routes przeszedł na rzeczywistym HTTP. Instrukcje i gotowe pary:
[prototype-backend.md](prototype-backend.md). Punkty obejmują Rynek Główny,
Floriańską, Mały Rynek, plac Mariacki, bulwary, wejścia biblioteki i dawny pilot.
Pierwsze 10 sugestii jest z tej samej połączonej części centrum. Wyszukanie
Galerii/High5ive nadal działa. Trasy między niepołączonymi grupami zwracają
NO_PATH. Wybór named point `kind=poi` jest dozwolony przy routing.available;
nie ograniczaj selekcji tylko do `kind=entrance`.

**Procesy:** B restartuje wyłącznie swoje API na 127.0.0.1:3001/3003.
Zauważono dodatkowy proces API PID 29932 na 0.0.0.0:3001 uruchomiony o
23:19:34; B go nie uruchamiała i nie zatrzymuje. Nie uruchamiaj kolejnego API
na tym samym porcie. Metro/gateway pozostają bez zmian przez B.

**Wyniki B:** API 115, ingestion 87, routing 87, contracts 132 = **421 PASS**;
typecheck i lint czterech pakietów PASS; 31 generated zgodnych; diff check PASS. Regresje obejmują
punkty poza pierwszą dziesiątką, globalną walidację katalogu, wyszukanie →
wybór → plan, ciągłość geometrii, źródła, stare 420 m, twarde wymagania i
brak połączenia. Nowy surowy snapshot i metadata odtworzono identycznie
udokumentowanym skryptem Python. 50 tras + 4 NO_PATH w audycie; p95 silnika
66 ms. Indeks miejski: 100 zapytań, p95 9,56 ms; budowa 15,8 s.

**Publiczne API już przełączone.** HTTPS ngrok PASS: trzy trasy wyszukane po
nazwie, prawidłowe końce geometrii, dwa kontrolowane błędy 422. Archiwalne
wyniki: data/krakow-prototype/http-{local,public}-audit.json. GraphVersion
`osm-walk-v1-4196644a76e0dfaae55e59dc`. API 3001 PID 5792 (launcher 17536),
API 3003 PID 10804 (launcher 25036). Logi apps/api/test-results/prototype-api-*.
Pięć rozłącznych grup katalogu, nie pełny routing miejski. Ograniczenie budżetu
alternatyw występuje jawnie przy części dłuższych tras; nie ma rozluźniania
wymagań, GPS ani potwierdzeń terenowych. UI/telefonu/VoiceOver, PostGIS i
zdalnego CI B nie testowała. Bez commitów/pushów i bez zmian UI.

**Pliki tej iteracji:** apps/api/src/{dataset,routing,main,place-search,
audit-place-search,audit-prototype-http}.ts i test/{large-catalog,prototype}.test.ts;
packages/ingestion/src/{pilot-graph,krakow-prototype,audit-prototype,index}.ts,
test/prototype.test.ts, scripts/extract-prototype.py, data/krakow-prototype/**,
aktualizacja data/krakow-search/search-audit.json; packages/routing/src/{types,graph}.ts;
README API, docs/{prototype-backend,place-search,handoff-backend}.md i własny
wpis statusu. Poprzednie niezatwierdzone zmiany B wyszukiwarki pozostają.

**Konkretne przekazanie A:** zakończyć przepływ wyszukiwarka → wybór
available (entrance lub poi) → plan → odsłuch, używając par i błędów z
prototype-backend.md. Zachować pełną nazwę punktu, unknown i preview_only.
Przejrzeć wcześniejszy addytywny kontrakt place-search-1, sprawdzić nowy
przepływ na iPhonie i odnotować rzeczywisty wynik. B nie deklaruje odbioru UI.
B zakończyła edycję tego zakresu. Nowy backend działa na dotychczasowym API.

Polecenie użytkownika: kończyć działający prototyp, priorytet funkcjonalności;
druga sesja nadal prowadzi UI. B nie edytuje apps/mobile. Zakres: rozszerzyć
realny graf i katalog końców tras na podstawie jawnej topologii OSM, usunąć
wewnętrzne ograniczenie katalogu do 10 (limit odpowiedzi pozostaje 10),
sprawdzić wyszukanie → routing → informacje/źródła/braki danych oraz błędy.
Kryteria: istniejąca trasa działa, dodatkowe rzeczywiste punkty i pary mają
testy, brak dopinania centroidów/proximity, zgodność obecnych DTO, testy
backendu i próba HTTP. Wyszukiwanie całego miasta nie oznacza routingu całego
miasta. Najpierw audyt danych, potem wybór rozsądnego zakresu publikacji.

**Dla A:** kontynuuj integrację /v1/place-search; cityId/placeId bierz z
`routing` wyniku. Liczba dostępnych punktów i zakres coverage mogą wzrosnąć;
nie zakładaj pięciu wejść na stałe. Kontrakt wire pozostaje bez zmian.

## B-05 — katalog miejsc i wyszukiwarka — GOTOWE DO INTEGRACJI

**Claude: kontrakt jest już w kodzie i gotowy do przeglądu.** Czytaj
[place-search.md](place-search.md), `PlaceSearchResponseSchema` i fixture
`placeSearchResponse` / `examples/place-search.json`. Nie zmieniono wersji
ani kształtu dotychczasowego `/v1/places` i `/v1/routes`. Wyszukiwarka całego
miasta jest pod nowym `/v1/place-search?cityId=krakow&query=...`, wersja
funkcji `place-search-1`. Przykład synthetic pokazuje wszystkie 3 sytuacje:
available, outside_coverage, unresolved. Obsługiwane wyniki mają cityId i
placeId **wewnątrz routing**. Pozostałe są tylko wynikami wyszukiwania.

Znormalizowany snapshot: **96 526 wpisów**, pobranie
2026-10-03T20:40:40.212Z. Indeks nie robi zapytań zewnętrznych. Obsługuje
Rynek Glowny, Nowa Huta, Wawel, Wolica, Pawia 5/7, apteka, High5 i literówkę
glaeria krakowska. Adresy wejść pilota pozyskane wyłącznie z dokładnej
przynależności węzła do budynku, nie z najbliższego adresu. Import adresów
zmienił hash grafu (metadata miejsc), bez zmiany geometrii i wag.

Kontrole: contracts 132 PASS, API **107 PASS**, ingestion **77 PASS**,
routing **87 PASS**, lint i typecheck backendu/contracts PASS, generated
**31 zgodnych**. Pierwszy równoległy runner API miał dwa timeouty podczas
inicjalizacji pod obciążeniem; ponowiono sekwencyjnie z `--maxWorkers 1`,
107/107 PASS. Nie zwiększano timeoutów i nie pomijano scenariuszy.
Próba osobnego API 3003 i głównego/publicznego API 3001 **PASS**. Nowy
endpoint zwraca HTTP 200, catalogSize=96 531 (96 526+5), Pawia 7 daje cztery
dopasowania w tym dwa dostępne wejścia. Regresja publicznego POST trasy:
420,217 m, pilot/preview_only; graphVersion=osm-walk-v1-e70a135b6d663db7694593cf.
API 3001 PID 32240 (launcher 17652), testowe 3003 PID 23900 (launcher 28768).
Logi i lokalny launcher w ignorowanym `apps/api/test-results/city-api-*`.
Metro 8081 PID 32140 i gateway 8082 PID 15716 pozostawione bez restartu.

Pomiar 100 zapytań na aktualnym kodzie: p50 0,64 ms, p95 16,42 ms,
max 19,71 ms; wczytanie/budowa 18,4 s na obciążonym hoście. Wyniki i stałe
zapytania w data/krakow-search/search-audit.json. To nie pomiar telefonu.
Komendy przez Node 24.21.0 / pnpm 10.34.6: `contracts:export`,
`test:contracts`, `--filter @krok/api exec vitest run --maxWorkers 1`,
`--filter @krok/ingestion exec vitest run --maxWorkers 1`, `test:routing`,
eslint apps/api packages/ingestion packages/routing packages/contracts,
typecheck wymienionych pakietów i `check:generated`. Import i audit komendy
w instrukcjach pakietu oraz place-search.md. Zakres diffu B sprawdzony osobno.

Pliki B: nowe place-index/place-search/audit i testy w apps/api, app/main oraz
README API; city-catalog/cli/loader/test/archiwum i eksporty w ingestion;
address miejsc i jego walidacja w routing; addytywne schemas/fixtures/test/
OpenAPI/README w contracts i dwa wygenerowane examples; docs/place-search,
ten handoff oraz własny wpis statusu. Nie dodano zależności ani zmian lockfile.
Nie zmieniano mobile, instrukcji/README root redagowanych przez Claude'a,
rankingu tras ani wspólnego stanu Git. Bez commitów i pushów.

**Ograniczenia / następny krok:** Claude integruje UI i przegląda nowy
kontrakt. UI nowej wyszukiwarki, telefon/VoiceOver i zdalne CI nie były
testowane w tej iteracji B. Katalog OSM nie jest pełnym urzędowym rejestrem;
graf tras nadal obejmuje mały obszar i pięć wejść. Nie oznaczono odbioru
dostępności ani routingu całego miasta. B zakończyła edycję tego zakresu.

**Aktualizacja zakresu po odpowiedzi użytkownika: CAŁY KRAKÓW.** Pozyskano
jednorazowy eksport Overpass dla granicy administracyjnej Krakowa
(relation/2768922), 114 283 rekordy nazw/adresów. Sieć nie będzie używana
w pętli wyszukiwania. Rozdzielam miejski indeks wyszukiwania od małego
katalogu punktów routingu — wyszukanie adresu nie oznacza gotowej trasy.

**Dla Claude'a, nowy endpoint do podłączenia po odbiorze kontraktu:**
`GET /v1/place-search?cityId=krakow&query=...`. Addytywny kontrakt wyszukiwania
`place-search-1` obok niezmienionych endpointów draft.2, ze wspólnymi Zod,
OpenAPI i fixture. Wynik ma nazwę, adres/kategorię, punkt orientacyjny,
pochodzenie oraz `routing`: available z cityId/placeId lub unavailable z
powodem outside_coverage/unresolved. Tylko available może zasilić POST
routes; nie przekazywać centroidu/środka obiektu jako początku prowadzenia.
Istniejący `/v1/places` pozostaje kompatybilnym katalogiem punktów routingu.
Nie oznaczam odbioru przez Claude'a za niego; opis i fixture będą gotowe
do konkretnego przeglądu. Użytkownik jawnie zlecił tę funkcję na całe miasto.

Użytkownik przypisał tej rozmowie 100% backendu; Claude równolegle odpowiada
za UI. Nowy podział zastępuje historyczne ograniczenie tej rozmowy do mobile.
Nie edytuję mobile, CLAUDE.md ani plików instrukcji edytowanych przez Claude'a.
Bez nowych worktrees/gałęzi, commitów i pushów w tej iteracji.

Zakres przed implementacją: skalowalny lokalny katalog większy niż jedna
odpowiedź, import rzeczywistych miejsc/wejść z archiwalnego OSM, indeks nazw,
adresów i aliasów, normalizacja polskich znaków i białych znaków, ranking
dopasowań oraz ograniczona tolerancja literówek. Brak sieci podczas szukania.
Początkowy obszar to obecny snapshot Krakowa; ewentualne rozszerzenie wymaga
prawdziwych danych i audytu topologii. Nie przypinam POI do najbliższej drogi.

**Dla Claude'a:** zachowuję draft.2 i `GET /v1/places?cityId=...&query=...`.
Pusty query daje do 10 początkowych punktów; 2–100 znaków daje do 10
uporządkowanych dopasowań. To limit jednej odpowiedzi, nie całego katalogu.
`id`, `name`, `description`, `coordinate` bez zmiany. ID pięciu dotychczasowych
wejść pozostają stabilne. UI nie powinno traktować pierwszych 10 pozycji jako
pełnego katalogu ani zamieniać błędu HTTP w pusty wynik. Stan pusty oznacza
brak dopasowania w aktualnym katalogu, nie brak miejsca w mieście.

Kryteria: udokumentowane pochodzenie nowych miejsc; brak centroidów/łączników
przez bliskość; testy >10 miejsc, diakrytyków, wielu słów, adresów/numerów,
literówek, stabilnego rankingu, limitów i prywatności logów; regresja trasy
420 m i twardych wymagań; lint/typecheck backendu, ingestion/API/routing/
contracts i check:generated. Podgląd API przełączę dopiero po testach;
Metro/UI pozostawiam Claude'owi. Końcowy raport i przykłady zapytań poniżej.

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
