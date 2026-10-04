# Katalog całego Krakowa — snapshot OSM

Wpisy miejskiej wyszukiwarki, oddzielne od aktualnego grafu w `../krakow-prototype`.
**96 526** wpisów po filtracji: adresy, nazwane miejsca i ulice.
Pierwotne 114 283 rekordy: 4 726 pominięte, 13 031 powtórzonych zwykłych
adresów/odcinków ulic scalone w prezentacji wyszukiwarki. Nie scalano grafu.

Pozyskanie eksportu nazw/adresów: **2026-10-03T20:40:40.212Z** (czas
zakończenia zapisu pobrania, zachowany przy ponownym przetwarzaniu).
OSM base w odpowiedzi: 2026-10-03T20:38:07Z; baza obszarów:
2026-10-02T10:26:16Z. Źródło: [Overpass API](https://overpass-api.de/),
obszar administracyjny [Kraków, relation/2768922](https://www.openstreetmap.org/relation/2768922).
© OpenStreetMap contributors, [ODbL 1.0](https://www.openstreetmap.org/copyright).

- `raw-search.json.gz`: pełna odpowiedź JSON, 94 152 406 bajtów po dekompresji.
- `raw-boundary.json.gz`: geometria granicy administracyjnej z drugiego zapytania.
- `catalog.json.gz`: indeks wejściowy aplikacji z wybranymi polami publicznymi;
  bez kontaktów, notatek, autorów edycji i zmian infrastruktury wywnioskowanych
  z nazw. Runtime sprawdza checksum i wszystkie rekordy przed użyciem.
- `capture.json`: dokładne zapytania, SHA-256 zdekompresowanych plików,
  wersja katalogu i audyt liczby rekordów.
- `search-audit.json`: wynik odtwarzalnego pomiaru lokalnego indeksu i znane
  przykłady zapytań. Czasy zależą od komputera i obciążenia.

Granica obejmuje 19.7922355–20.2173455 E oraz 49.9676668–50.1261338 N.
Pierwszy rozważany wyciąg BBBike Cracow kończy się na 20.16 E i dlatego
**nie został użyty** jako źródło całego miasta. Nie wykonujemy serii zapytań
po siatce ani odpytywania pojedynczych miejsc. Jedno zapytanie danych i jedno
granicy; po 504 granicy jedna powtórka do tego samego dostawcy była udana.
[Zasady współdzielonej instancji Overpass](https://dev.overpass-api.de/overpass-doc/en/preface/commons.html).

## Odtwarzanie

Po dekompresji zachowanych plików do katalogu roboczego uruchom z pakietu
ingestion, wskazując **nowy** katalog wyjściowy i niezmienioną datę pozyskania:

```sh
pnpm exec tsx src/city-catalog-cli.ts raw-search.json raw-boundary.json new-output 2026-10-03T20:40:40.212Z
```

Nie pobiera z sieci i nie nadpisuje plików istniejącego snapshotu. Kontrola
surowych checksumów jest w testach ingestion. Przed publikacją kolejnego
snapshotu trzeba przejrzeć zmianę liczby wpisów i zaktualizować capture.
Ponowne przetworzenie nie odświeża daty pozyskania ani obserwacji.

Miejsca i adresy zależą od kompletności OSM. Dane nie są urzędowym rejestrem
ani potwierdzeniem dostępności. Środki obiektów są wyłącznie orientacyjne.
Katalog nie rozszerza grafu do całego Krakowa. API dodaje 30 dokładnych
przypisań aktualnego grafu (łącznie 96 556 wpisów); pozostałe wyniki mają jawny brak
obsługi trasy. Pełny kontrakt i instrukcja UI: [place-search](../../../../docs/place-search.md).
