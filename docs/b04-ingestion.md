# B-04 — ograniczony import OSM

Zakres zapisany przed implementacją, 2026-10-03, B: adapter snapshotu,
surowe dane/checksum/licencja, konserwatywna normalizacja, raport pokrycia
i odporne zapisanie ostatniego dobrego wyniku. Bez publikowania tras pilot,
nowego endpointu, zmian mobile i tworzenia połączeń geometrią.

Założenia: mały wycinek Krakowa, publiczny Overpass wyłącznie na żądanie
operatora, poza obsługą zapytania o trasę. Jedno stałe źródło, ograniczony
czas/rozmiar/liczba prób, Retry-After/backoff bez przełączania serwerów.
Surowy snapshot i audyt nie są dowodem spójnego grafu ani dostępności trasy.

Kryteria: testy walidacji bbox/danych/tagów, rozróżnienie type/id, brak
domyślania false i dat obserwacji, checksum oraz idempotencja; 429, timeout,
uszkodzona odpowiedź i błędne referencje nie zastępują ostatniego dobrego
snapshotu. Raport realnego pobrania ma podać zarówno obecne tagi, jak i
braki/odrzucenia. Trasy wymagają późniejszego B-05/B-06 i przeglądu A.

Źródła sprawdzone na potrzeby adaptera:

- [Zasady używania publicznego Overpass](https://dev.overpass-api.de/overpass-doc/en/preface/commons.html): import operatora, małe zapytanie, ograniczone ponowienia; publiczny endpoint nie jest backendem zapytań użytkownika.
- [traffic_signals:sound](https://wiki.openstreetmap.org/wiki/Key:traffic_signals:sound) i [tactile_paving](https://wiki.openstreetmap.org/wiki/Key:tactile_paving): interpretujemy tylko jawnie obsługiwane wartości. Brak tagu nie oznacza braku infrastruktury.
- [Atrybucja i licencja OSM](https://www.openstreetmap.org/copyright): OpenStreetMap contributors, ODbL; zachowujemy pochodzenie i informację o licencji snapshotu.

## Wynik implementacji

Pakiet `@krok/ingestion`: walidacja małego bbox i kompletnego JSON,
konserwatywna normalizacja do istniejącego EvidenceSchema i audyt resolverem
B-03, downloader z limitami, niezmienne snapshoty i atomowy wskaźnik,
CLI. Korzysta z istniejących wersji tsx/Vitest; instalacja offline dopisała
wyłącznie importer workspace do lockfile. Instrukcja:
[README pakietu](../packages/ingestion/README.md),
[rejestr źródeł](data-sources.md).

42 testy obejmują identyfikatory node/way, permutacje, malformed/partial
responses, referencje, wartości tagów, pochodzenie i daty, ograniczenia
przestrzeni/rozmiaru, Retry-After (sekundy i data), timeout, idempotencję,
zmianę i cofnięcie wersji, checksum, blokadę równoległego importu oraz
zachowanie ostatniego dobrego wyniku przy ośmiu scenariuszach awarii.
Fixtures są jawnie syntetycznymi wejściami testu parsera, nie danymi miasta.

Końcowe komendy przez przypięty wrapper Node/pnpm: `pnpm lint`,
`pnpm typecheck`, `pnpm test:ingestion` (42), `pnpm test:routing` (87),
`pnpm test:contracts` (121), `pnpm test:api` (86), `pnpm check:generated`
(29 plików) — wszystkie PASS. Instalacja `pnpm install --offline
--network-concurrency=4 --child-concurrency=1` — PASS.
Kontrola odtwarzalności `pnpm install --offline --frozen-lockfile` i
`pnpm import:osm --help` — PASS; lockfile pozostał aktualny bez przeliczenia.

## Próba realnego pobrania — nieudana

2026-10-03: pierwsze ograniczone POST w PowerShell przekroczyło 40 s.
Po przerwie uruchomiono `pnpm import:osm`: dwie ograniczone próby tego
samego endpointu zakończyły się `network_or_timeout`. Osobna diagnostyka
DNS zwróciła adresy; połączenie HTTPS do hosta nie powstało przed limitem
10 s. Nie zmieniano endpointu ani nie próbowano omijać limitów.

Zapis lokalny `%LOCALAPPDATA%/Krokow/osm/runs/` zawiera zapytanie i kod
niepowodzenia. Nie ma raw ani poprawnego current.json, a więc brak
podstaw do podania realnej liczby przejść, akustyki czy oznaczeń dotykowych.
Wyniki testów nie zastępują tego raportu. **B-04 nie jest w pełni odebrane**:
pozostaje pobranie oraz przejrzenie realnego raportu pokrycia.

Lokalny staging nie jest bazą PostGIS ani aktywnym grafem. B-05 musi
zweryfikować topologię, poziomy, strony i etapy przejść oraz historię
sprzecznych dowodów przed publikacją. Kontrakty/API/mobile bez zmian.
Nie testowano telefonu, bazy ani odporności na utratę zasilania w B-04.
