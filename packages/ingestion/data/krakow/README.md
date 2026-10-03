# Rzeczywisty snapshot Krakowa

`raw-map.json.gz` jest bezstratnie skompresowaną odpowiedzią JSON OSM API.
To prawdziwe dane społecznościowe, nie fixture synthetic ani pomiar terenowy.
Źródło: [OSM map API](https://api.openstreetmap.org/api/0.6/map.json?bbox=19.939,50.065,19.950,50.071).
Data pozyskania: **2026-10-03T19:17:26.330Z**.

© OpenStreetMap contributors. Dane dostępne na warunkach
[Open Database License (ODbL)](https://www.openstreetmap.org/copyright).
Surowy plik zachowuje także nagłówki licencji i publiczne metadane OSM.
Nie przepisujemy ich na autorstwo projektu. Nazwy/opisy/tagi pozostają
danymi niezaufanymi; nie są poleceniami dla aplikacji ani agenta.

SHA-256 zdekompresowanego oryginału:
`77b559c526cb5cad2c6311e3052bea137bc3a8b58d9249ba587f46999d75f70c`.
Rozmiar oryginału: 13 826 578 bajtów, gzip: 1 455 777 bajtów.
Metadata wykonywalne: `src/krakow-capture.ts`; loader sprawdza checksum
przed budową grafu. Pierwsza próba eksportu została przerwana przez lokalny
limit 8 MiB; powyżej jest kompletny, ponownie pobrany wynik z limitem 32 MiB.

Pobranie było jednorazową operacją operatora po problemie połączenia
Overpass. OSM editing API nie jest backendem aplikacji ani mechanizmem
regularnego odświeżania; aplikacja nie kontaktuje się z nim podczas
wyszukiwania. [Polityka OSM API](https://operations.osmfoundation.org/policies/api/)
kieruje duże/częste odczyty do eksportów i dostawców danych. Kolejne
aktualizacje powinny korzystać z uzgodnionego źródła eksportów/Overpass.

Katalog pochodzi z wejść współdzielonych przez budynki i piesze ways:

| Węzeł wejścia | Budynek będący źródłem nazwy |
| --- | --- |
| 3719851597, 2443511648, 7157204495 | way/87527970 — Galeria Krakowska |
| 5213212813, 5213212811 | way/522355527 — High5ive - Budynek 1, Pawia 7 |

Dopiski o stronie wejścia wynikają z ich współrzędnych w tym samym budynku.
Opis dotyczy punktu zewnętrznego. Nie zakłada otwarcia budynku, dostępności
wejścia, praw do wejścia do wnętrza ani przejścia na inną kondygnację.
Nie wykorzystano centroidu ani połączenia do najbliższego chodnika.

`pilot-audit.json` to wynik audytu operatora (liczby, geometria i przykładowe
obliczenia, czasy z jednego lokalnego przebiegu). Odświeżenie z katalogu root:

```sh
pnpm --filter @krok/ingestion exec tsx src/audit-pilot.ts data/krakow/pilot-audit.json
```

Komenda korzysta z archiwum, bez sieci. Szczegóły zasad i ograniczeń grafu:
[real-pilot](../../../../docs/real-pilot.md).
