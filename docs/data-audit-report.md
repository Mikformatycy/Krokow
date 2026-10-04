# Audyt danych prototypu — 2026-10-04

Wykonano P-01 na archiwum używanym obecnie przez API. To audyt plików
i przepływu informacji, nie sprawdzenie w terenie. Raport przed poprawką:
`packages/ingestion/data/audits/accessibility-before.json`; raport po:
`packages/ingestion/data/audits/accessibility-audit.json`.

Wejście: `krakow-prototype/raw-map.json.gz`, SHA-256 rozpakowanych danych
`c0a1618bba5a436f0292606a60850a4b3d11a4942a9fa2f0358842b2a970f2d2`.
Pozyskanie: 2026-10-03T20:39:21.626Z. GraphVersion:
`osm-walk-v1-4196644a76e0dfaae55e59dc`. Raport zawiera asOf każdego obliczenia;
zegar nie nadaje importowi statusu potwierdzenia. Archiwum starszego pilota
pozostaje fixture regresji. Katalog `krakow-search` jest katalogiem miejsc,
nie bazą infrastruktury tras; nie wliczamy jego POI do mianowników audytu.
Pełny audyt historycznego archiwum i miejskich POI nie jest częścią tego wyniku.

## Surowe dane i przypisanie

| Populacja | Liczba | Akustyka | Oznaczenia dotykowe |
|---|---:|---|---|
| Punkty przejść | 894 | yes 65, no 4, brak 825 | yes 233, no 454, partial 5, incorrect 8, mixed 3, brak 191 |
| Linie przejść | 732 | yes 1, brak 731 | yes 9, no 2, brak 721 |
| Etapy przyjęte do grafu | 479 | unknown 479 | yes 6, no 2, unknown 471 |

Przeciwne kierunki tej samej krawędzi nie są liczone jako osobne dowody:
12554 krawędzie kierunkowe reprezentują 6277 odcinków fizycznych, 3571
obiektów OSM. Wszystkie 8344 znormalizowane rekordy mają status unverified;
nie ma terenowych obserwacji/potwierdzeń. Czas zmiany obiektu OSM pozostaje
osobnym polem. W tym pojedynczym archiwum nie zaobserwowano konfliktów;
obsługę konfliktu sprawdzają istniejące jawnie syntetyczne fixtures.

Na obiektach grafu są 3147 rekordy nawierzchni, 15 oznaczeń dotykowych,
1 sygnalizacji świetlnej i 1 poręczy. 70 rekordów akustyki pozostaje poza
zakresem obiektów linii przyjętych do grafu. Nie przenosimy automatycznie
tagów punktu na całe przejście, jego stronę lub etap. Tagi mixed, compacted
i inne nieobsługiwane wartości oraz niejednoznaczne poziomy są jawne w
sekcji skippedNormalization. kerb/incline/smoothness/lit są policzone
surowo, ale obecny normalizator i kontrakt ich nie publikują jako faktów.

Wyłączenia topologii: 3314 nieobsługiwanych typów dróg, 455 przypadków
poziomów/wnętrz, 380 ograniczeń dostępu, 37 obszarów bez liniowego ciągu,
249 przejść wymagających sprawdzenia topologii. To nie są informacje,
że w tych miejscach nie da się przejść; ograniczenia dotyczą modelu.

## Wykryta i usunięta utrata danych

Presenter publikował wyłącznie dowody akustyki/oznaczeń zdarzeń przejść.
Pomijał np. nawierzchnię znaną dla dokładnie tego obiektu OSM, po którym
biegnie wariant. Obecnie istniejące `evidenceCatalog` obejmuje także
rekordy obiektów krawędzi zwracanych wariantów. Nie obejmuje pobliskich
punktów, całego archiwum ani wariantów odrzuconych przez wyszukiwanie.
Nie zmieniono wire formatów, faktów, kosztów ani twardych wymagań.

Katalog jest wspólny dla wszystkich wariantów odpowiedzi. Aplikacja
opisuje go jako zapisy o obiektach w znalezionych wariantach, z identyfikatorem
OSM, wartością, zakresem, statusem, źródłem i osobnymi datami. Nie przypisuje
wszystkich tych rekordów wybranemu wariantowi ani całej długości drogi.
Dokładne powiązanie rekord → pozycja w wybranym wariancie wymaga w przyszłości
rozszerzenia kontraktu. „Utwardzona” obejmuje także kostkę; nie znaczy „równa”.

## P-02: wybrane rzeczywiste przykłady

| Start → cel (punkt/ wejście OSM) | Długość | Etapy | Rekordy nawierzchni przed → po |
|---|---:|---:|---:|
| Galeria Pawia 3719851597 → High5ive zach. 5213212813 | 420 m | 1 | 0 → 5 |
| Rynek Główny 14121238341 → Floriańska 6128078603 | 1173 m | 2 | 0 → 25 |
| Bulwar Czerwieński 278057644 → Bulwar Rodła 279117089 | 479 m | 0 | 0 → 3 |

Wszystkie trzy mają niepełne informacje na całej długości (m.in. brak
rozstrzygnięcia schodów/oddzielenia chodnika). Zero etapów nie dowodzi
braku przejść w terenie. Trasa Rynek–Floriańska pokazuje duży objazd
wynikający z zachowawczej topologii, dlatego główną demonstracją jest
Galeria–High5ive. Wymagana udokumentowana akustyka na tej trasie zwraca
NO_MATCHING_ROUTE; połączenie Rynek–Galeria zwraca odrębne NO_PATH.

Wniosek: dane pozwalają pokazać rzeczywiste informacje o nawierzchni
i uczciwe braki danych. Nie pozwalają obiecać trasy z potwierdzoną akustyką,
bezpiecznego przejścia ani prowadzenia GPS. Nie dodano importów, ankiet,
fikcyjnych udogodnień do realnych miejsc ani zależności od obsługi przez UMK.

## Odtworzenie

W repo, Node 24 i pnpm 10.34.6:

```powershell
pnpm --filter @krok/ingestion exec tsx src/audit-accessibility-cli.ts data/audits/accessibility-audit.json
```

Raport jest deterministyczny: przypięte archiwum, checksum, asOf i licznik
operacji, bez pomiarów czasu hosta. `accessibility-before.json` to zachowany
wynik sprzed poprawki presentera; aktualna komenda generuje wynik po poprawce.
Weryfikacja działania i odbiór urządzenia: bieżący wpis B w `status.md`.
