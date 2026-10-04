# Wyszukiwarka miejsc całego Krakowa

Stan 2026-10-04: backend i mobile są zintegrowane; jeden Codex prowadzi całość.
Katalog miasta i graf tras są odrębnymi zbiorami. Aktualny graf
prototypu ma 30 punktów w centrum; szczegóły i pary demonstracyjne:
[prototyp funkcjonalny](prototype-backend.md).

## Kontrakt używany przez UI

`GET /v1/place-search?cityId=krakow&query=Rynek%20Glowny`

Źródło definicji: `packages/contracts/src/place-search.ts`, eksporty
`PlaceSearchQuerySchema`, `PlaceSearchResponseSchema`, `PlaceSearchItem`.
Przykłady współdzielone z UI: `placeSearchResponse` z fixtures i wygenerowane
`examples/place-search.json`, `examples/place-search-empty.json` (synthetic).
Wersja addytywnego endpointu: **place-search-1** (`searchVersion`), obok
niezmienionego envelope `schemaVersion=1.0.0-draft.2`. Stare endpointy nie
zmieniają DTO ani wymaganej wersji aplikacji. OpenAPI generowane z Zod.
Wyszukiwanie jest podłączone w searchCatalog.ts i PlaceStep.tsx.
Wyniki regresji oraz zakres telefonu: [testing.md](testing.md).

Zapytanie ma 2–100 znaków. Pusty tekst daje pierwsze 10 punktów obsługiwanych
przez prototyp (`total=30`, `hasMore=true`). Odpowiedź zawiera do 10 dopasowań, `total`, `hasMore`, `catalogSize`,
nazwę obszaru, wersję i datę pozyskania katalogu oraz publiczne źródła.
`total` dotyczy danego zapytania; dla pustego tekstu dotyczy początkowych
propozycji, a nie wszystkich miejsc. `hasMore` oznacza potrzebę doprecyzowania
zapytania. Nie dodano paginacji listy całego miasta.

Wynik: `id`, `name`, `address` (lub null), `kind` (poi/address/street/entrance),
`coordinate`, `positionKind`, `sourceId`, `sourceRecordId`, `sourceModifiedAt`
i `routing`. Data edycji OSM nie jest potwierdzeniem terenowym.

| routing | Zachowanie klienta |
| --- | --- |
| `{status:"available", cityId, placeId}` | Można wybrać wskazany punkt dla istniejącego POST routes. Przekazać **routing.placeId**, nie identyfikator wyniku wyszukiwania. |
| `{status:"unavailable", reason:"outside_coverage"}` | Miejsce znalezione; poza obecnym zasięgiem tras. Nie uruchamiać obliczeń do środka obiektu. |
| `{status:"unavailable", reason:"unresolved"}` | Miejsce leży w obszarze pilota, ale nie ma potwierdzonego przypisania do grafu. Nie udawać wejścia ani łącznika. |

`positionKind=representative_point` jest orientacyjnym punktem obiektu
(środkiem bbox z OSM). Nie musi leżeć wewnątrz budynku i nigdy nie jest
końcem nawigacji. `mapped_point` oznacza pozycję węzła OSM, a nie jego
dostępność. Tylko 30 sprawdzonych przypisań do aktualnego grafu ma status
available. Są to wejścia i jawnie nazwane punkty na ciągach pieszych (`kind=poi`);
punkt na ulicy nie jest wejściem do budynku. Dwa dostępne końce mogą leżeć
w różnych częściach grafu; wtedy POST zwraca `NO_PATH`. Zgoda GPS nie jest potrzebna, współrzędne użytkownika nie są
przesyłane. `navigationEligibility=preview_only` pozostaje obowiązujące.

Stary `/v1/places` nadal zwraca katalog punktów routingu na starym cityId
`krakow-stare-miasto-pilot`; otrzymał normalizację i indeksowanie bez zmiany
kształtu odpowiedzi. `/v1/coverage` nadal opisuje **zasięg tras**, nie zasięg
wyszukiwarki miasta. Nie zastępować jednego obszaru drugim.

## Dopasowanie

- Normalizacja Unicode, wielkości liter, polskich znaków (również ł),
  interpunkcji i odstępów. Wyszukiwanie po nazwie, jawnych aliasach OSM,
  adresie, kodzie pocztowym i wybranych polskich nazwach kategorii.
- Wszystkie słowa zapytania muszą pasować, kolejność może być inna.
  Końcówka wpisywanego słowa może być prefiksem. `Pawia 7` nie dopasowuje
  automatycznie numeru 77 ani 7a. `ul.`, `al.`, `os.` są pomijane.
- Polskie liczebniki główne 1–999 na końcu zapytania tworzą dodatkowy wariant
  z cyframi: `pawia pięć` → `pawia 5`, `Długa dwadzieścia trzy` → `dluga 23`,
  `Pawia pięć a` → `pawia 5a`. Obsługiwane są podstawowe formy liczebników
  i pojedyncza litera a–z. Nazwa przed numerem jest wymagana. Nie przetwarza
  się liczb wewnątrz nazwy ani niepełnych/mieszanych zapisów typu `20 pięć`.
  Numer z literą pozostaje odrębny od numeru bez litery.
- Oryginalne zapytanie i nazwy w katalogu pozostają bez zmian; dopasowania
  oryginału mają pierwszeństwo przed wariantem z cyframi. Wyniki obu wariantów
  są scalane przed liczeniem `total` i ograniczeniem do 10 odpowiedzi.
  `Plac Trzech Krzyży` i `Aleja Trzeciego Maja` pozostają zwykłymi nazwami.
  Ta sama logika działa dla `/v1/place-search` i `/v1/places`, przy dyktowaniu
  systemowym i ręcznym wpisywaniu; aplikacja nie otrzymuje nagrań.
- Gdy nie ma zwykłego dopasowania: najwyżej jedna literówka lub zamiana
  sąsiednich liter w słowie od 5 znaków; dopiero po sprawdzeniu obu wariantów,
  bez zgadywania cyfr/adresów.
- Dokładna nazwa przed aliasem i prefiksem; w remisie preferowane jawne
  punkty routingu, potem stabilna nazwa/ID. Brak płatnego promowania.
- Powtarzane segmenty tej samej ulicy i zwykłe adresy node/way są scalane
  tylko w liście wyszukiwania. Nie łączy to grafu ani faktów infrastruktury.

## Źródło i ograniczenia

Jednorazowy snapshot [Overpass](https://overpass-api.de/) z obszaru OSM
relation/2768922. Archiwum, checksumy, zapytanie i kod importera są w
`packages/ingestion/data/krakow-search` i `src/city-catalog*.ts`. Wyszukiwanie
jest całkowicie lokalne w pamięci API. Nie kontaktuje się z OSM/Nominatim
na każde naciśnięcie klawisza. [Publiczny Nominatim nie zezwala na taki
autocomplete](https://operations.osmfoundation.org/policies/nominatim/).

Granica administracyjna jest składana wyłącznie po identycznych końcach
fragmentów. Wpisy są filtrowane względem tej granicy; uwzględniono też
wschodni Kraków poza 20,16° E. Obiekty graniczne z punktem reprezentatywnym
poza miastem mogą być pominięte. Katalog nie stanowi urzędowego rejestru
adresów; kompletność zależy od OSM. Nie zawiera potwierdzeń dostępności,
godzin otwarcia ani działania udogodnień. Kontakty, autorzy edycji i notatki
nie trafiają do indeksu/API; surowe archiwum zachowuje publiczne metadata OSM.

Brak dopasowania to 200 z pustą listą. Brak/poprawności snapshotu to 503
SOURCE_UNAVAILABLE; nie zastępujemy awarii fikcyjnymi wynikami. Przy awarii
indeksu miejskiego istniejący katalog tras może pozostać dostępny.
Logi nie zawierają zapytań, historii wyszukiwania, IP ani nagłówków klienta.
Odpowiedzi nie są cache'owane jako historia użytkownika; indeks publicznych
miejsc jest budowany raz przy uruchomieniu procesu.

## Kontrole operatora

Z root: `pnpm --filter @krok/api exec tsx src/audit-place-search.ts ../../packages/ingestion/data/krakow-search/search-audit.json`.
Raport zawiera wersję, przykłady stałych publicznych zapytań i p50/p95 czasu
lokalnego wywołania. Nie jest pomiarem opóźnienia telefonu/ngrok ani testem
obciążeniowym. Skrypty testów: test:api, test:ingestion, test:routing,
test:contracts, check:generated. UI: test:mobile i runner pilot;
telefon/czytnik ma osobny zapis w testing.md.
