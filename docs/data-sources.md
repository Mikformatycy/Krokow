# Rejestr źródeł danych

Stan: 2026-10-04. Pochodzenie i warunki danych są oddzielne od ich wiarygodności. Wszystkie realne rekordy infrastruktury obecnego prototypu są niezweryfikowane w terenie. Edycja OSM ani ponowne pobranie nie są obserwacją stanu infrastruktury.

| Zbiór | Pozyskanie | Rola |
| --- | --- | --- |
| [krakow-prototype](../packages/ingestion/data/krakow-prototype/README.md) | Wyciąg BBBike Cracow/OSM, 2026-10-03T20:39:21.626Z; raw-map.json.gz, capture.json/checksum | Aktualny graf: loadKrakowPrototype, 30 punktów, 6043 węzły, 12554 krawędzie, 479 etapów. |
| [krakow-search](../packages/ingestion/data/krakow-search/README.md) | Overpass, relation/2768922, 2026-10-03T20:40:40.212Z; raw katalogu/granicy, zapytania i checksumy | 96 526 wpisów bazowych + 30 punktów grafu = 96 556 w API. Nie potwierdza udogodnień. |
| [krakow](../packages/ingestion/data/krakow/README.md) | Starszy eksport OSM map API; data/checksum w archiwum | Fixture regresji pięciu wejść, loadKrakowPilot; nie aktualny graf runtime. |
| Synthetic | Własne fixtures kontraktów i packages/routing/src/synthetic.ts | Fikcyjne przykłady/testy, oznaczone, preview_only. |

## Warunki i atrybucja

OSM: © OpenStreetMap contributors, [ODbL i atrybucja](https://www.openstreetmap.org/copyright). BBBike jest dystrybutorem OSM, nie niezależnym potwierdzeniem. [Eksport BBBike](https://download.bbbike.org/osm/bbbike/Cracow/), [zasady Overpass](https://dev.overpass-api.de/overpass-doc/en/preface/commons.html).

Metadane opisują wykorzystane eksporty. Przed kolejnym importem/dystrybucją operator sprawdza warunki źródła i obowiązki dla danych pochodnych. Nie deklarujemy pełnego audytu licencyjnego. [Licencje komponentów](dependencies.md).

Raw może zawierać publiczne metadane autorów OSM. Indeks/API pomijają autorów, kontakty i zbędne notatki. UI pokazuje atrybucję; dowód zachowuje obiekt, zakres i daty.

## Aktualizacja i awarie

Runtime czyta archiwa i kontroluje checksumy; nie odpytuje OSM/Overpass przy wpisywaniu fraz ani obliczeniu trasy. P0: import operatora na żądanie; harmonogram nie jest wdrożony.

pnpm import:osm jest osobnym adapterem małego bbox i stagingu, nie aktualizacją wszystkich archiwów runtime. Ma ograniczone ponowienia, Retry-After, kontrolę integralności i zachowuje ostatni dobry snapshot. [Ingestion](../packages/ingestion/README.md).

Nowy graf/katalog wymaga archiwum, audytu, testów i kontrolowanego restartu. Błąd źródła daje SOURCE_UNAVAILABLE, brak informacji o udogodnieniu — unknown; nie uruchamia synthetic. [Proces](operations.md).

Nie używamy wewnętrznych systemów ani miejskich API UMK/MJO. Portale briefu są potencjalnymi źródłami, nie istniejącymi integracjami.

## Weryfikacja

[Audyt](data-audit-report.md) sprawdza raw → normalizację → graf → API. To kontrola programowa, nie terenowa. 479 etapów ma unknown akustyki; zapis nawierzchni obiektu nie ocenia całej trasy. Korekty i konflikty: [resolver](b03-evidence.md).
