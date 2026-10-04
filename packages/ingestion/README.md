# Ingestion — archiwa, normalizacja i graf

Aktualny runtime używa **loadKrakowPrototype()** dla grafu i
**loadKrakowCityCatalog()** dla wyszukiwarki. Dane są lokalne, sprawdzane
checksumem; API nie pobiera OSM przy obliczaniu trasy.

- [krakow-prototype](data/krakow-prototype/README.md): graf centrum, 30 punktów.
- [krakow-search](data/krakow-search/README.md): katalog miejski.
- [krakow](data/krakow/README.md): starszy fixture regresji pięciu wejść;
  loadKrakowPilot() i pnpm audit:pilot dotyczą tego starszego zbioru.
- [Audyt danych](../../docs/data-audit-report.md), [rejestr źródeł](../../docs/data-sources.md).

## Aktualny audyt

Z root, Node/pnpm zgodne z README:

```sh
pnpm --filter @krok/ingestion exec tsx src/audit-accessibility-cli.ts data/audits/accessibility-audit.json
pnpm test:ingestion
```

CLI zapisuje raport; nie pobiera nowych danych, nie zmienia archiwum ani
nie wykonuje obserwacji w terenie. Raport przed wcześniejszą poprawką
pozostaje osobnym artefaktem historycznym.

Nowe dane prototypu/katalogu przygotowuje się według README danego archiwum,
do nowego katalogu, z rzeczywistą datą pozyskania. Zmiana danych runtime
wymaga audytu, zgodnych metadanych/checksum i kontrolowanego restartu API.

## Oddzielny adapter Overpass — import:osm

Istniejący adapter B-04 ma stały bbox: południe 50.065, zachód 19.939,
północ 50.071, wschód 19.950. Wynik jest stagingiem; komenda nie podmienia
automatycznie aktualnego grafu ani miejskiej wyszukiwarki.

```sh
pnpm import:osm --help
pnpm import:osm
pnpm import:osm --file /absolute/path/raw.json --fetched-at 2026-10-03T18:00:00Z
```

Ostatnia komenda to przykład składni — trzeba podać rzeczywistą datę
pozyskania pełnego wyniku Overpass out meta, nie datę ponownego przetworzenia.
Pobieranie uruchamia operator zgodnie z warunkami źródła.

Domyślny zapis: %LOCALAPPDATA%/Krokow/osm na Windows lub
~/.local/share/Krokow/osm na innych systemach; --root DIR wskazuje inny
katalog. runs/<uuid> przechowuje zapytanie/raw/checksum/manifest i wynik,
snapshots/<semantic-sha256> niezmienny poprawny snapshot,
current.json atomowo wskazuje ostatni dobry staging. import.lock blokuje
równoległy zapis; po awarii operator najpierw sprawdza działanie procesu.

Downloader: jeden endpoint, bez redirectów, do dwóch prób po 40 s,
limit 8 MiB, respektowane Retry-After. Oczekiwanie ponad 60 s kończy import.
Niepełny JSON, brak referencji, przyszłe daty, cofnięcie rewizji lub duża
zmiana pokrycia zatrzymują publikację stagingu. Awaria zachowuje ostatni
dobry wynik; nie ma cichego fallbacku do synthetic.

## Semantyka i ograniczenia

Normalizujemy jawne wartości akustyki, crossing:signals, poręczy,
tactile_paving, nawierzchni i highway=steps. Brak tagu nie tworzy false;
nieobsługiwane wartości i wieloznaczne poziomy są raportowane.
Paved nie oznacza równej/dostępnej nawierzchni. Tagi punktu nie przechodzą
automatycznie na całe przejście, a level nie wynika z samego layer.

Evidence waliduje kontrakt i resolver B-03. Dla OSM observation/verification
pozostają null; ponowny import nie nadaje świeżości terenowej. Łączenie
historii wielu źródeł i moderacja wymagają dalszej integracji.
Nie tworzymy połączeń wyłącznie z bliskości geometrii.

Staging nie jest transakcyjną bazą PostGIS ani gwarancją fsync/odporności
na awarię zasilania. Historyczny timeout Overpass z B-04 nie oznacza braku
dzisiejszych archiwów pozyskanych później. [Proces aktualizacji](../../docs/operations.md).
