# Prawdziwe dane w aplikacji — bieżący priorytet

Polecenie użytkownika, 2026-10-03: dowieźć przepływ na realnych danych
zamiast rozwijać demonstrator. Zakres B: mały snapshot Krakowa, graf tylko
z jawnych połączeń pieszych, katalog rzeczywistych punktów na grafie,
API pilot/preview_only i integracja z klientem A. Bez GPS i potwierdzeń
terenowych; nieznane udogodnienia pozostają unknown.

Kryterium: wyszukiwanie prawdziwego punktu i poprawna trasa między dwoma
punktami przez HTTP w aplikacji, jawne źródło/obszar/braki; testy granic
topologii, twardych wymagań i odróżnienia pilot od synthetic.

Overpass z tego hosta nie nawiązuje połączenia. Sprawdzamy jednorazowy
mały eksport oficjalnego OSM API; bez automatycznej rotacji endpointów,
harmonogramu ani pobierania podczas obliczeń trasy. Zachowujemy raw,
checksum, czas i licencję. To jawnie wybrany sposób pozyskania snapshotu,
nie kontynuacja pętli ponowień Overpass.

Koordynacja: A prowadzi obecnie uproszczenie UX. B nie nadpisuje mobile;
prośba do A o obsługę istniejącego kontraktu pilot jest w handoffie B.
Backend pilot do integracji otrzyma port 3003, żeby zachować podgląd
telefonu do uzgodnionego przełączenia. Root Git/lockfile po stronie B.

## Dane i rezultat backendu

Kompletny eksport pozyskano **2026-10-03T19:17:26.330Z**. Zapis jest
w repo, skompresowany bezstratnie i sprawdzany SHA-256 przy każdym starcie:
[raw/licencja/pochodzenie](../packages/ingestion/data/krakow/README.md).
Loader nie pobiera danych podczas startu ani przy zapytaniu o trasę.

Po ekstrakcji: 4322 węzły i 1413 ways highway (w tym kontekst drogowy).
105 węzłów crossing: 6 ma `traffic_signals:sound=yes`, 99 nie ma tego tagu.
Dotyk: 53 yes, 34 no, 18 bez tagu. To statystyka rekordów snapshotu wraz
z referencjami poza bbox, nie statystyka wszystkich przejść Krakowa ani
potwierdzenie działania sygnalizacji. Nie przenosimy tych punktowych
obserwacji automatycznie na pełne etapy/przeciwne strony przejścia.

Graf: **605 węzłów, 1214 skierowanych krawędzi, 39 prostych przejść**.
Ma wiele rozłącznych składowych; katalog pięciu wejść leży w połączonym
fragmencie. Nie uzupełniono przerw sztucznymi krawędziami.
Publikowany bbox jest mniejszy od bbox pobrania: south 50.0653, west 19.9393,
north 50.0707, east 19.9497. Współrzędne spoza katalogu pozostają wyłączone.

Przykłady z audytu (rzeczywiste obliczenia, bez ustalania dystansu w kodzie):

| Początek → cel | Długość | Etapy przejścia |
| --- | --- | --- |
| Galeria, wejście od Pawiej → High5ive 1, wejście zachodnie | ok. 420 m | 1 |
| Galeria, wejście od Pawiej → High5ive 1, wejście wschodnie | ok. 487 m | 1 |
| Galeria, wejście od Pawiej → drugie wejście północno-zachodnie | ok. 142 m | 0 |
| High5ive 1, wejście wschodnie → zachodnie | ok. 186 m | 0 |

Wszystkie 20 skierowanych par pięciu wejść przechodzą test HTTP.
Akustyka przejścia głównego przykładu pozostaje unknown. Ustawienie
documented/field_verified_recent zwraca NO_MATCHING_ROUTE, bez zmiany
wymagań. Jedna znaleziona opcja pozostaje jedną opcją.

## Konserwatywne reguły grafu

- Łączymy tylko te same ID węzłów OSM. Geometria zachowuje oryginalne
  odcinki; długości są sumą odległości Haversine (R=6371008.8 m).
- Tylko liniowe footway/path/pedestrian na zewnętrznej powierzchni gruntu.
  Brak level oznacza domyślną warstwę powierzchni wyłącznie przy braku
  tagów mostu/tunelu/wnętrza/innej warstwy. Jawne niezgodne poziomy
  węzłów nie są łączone. Schody, windy i pozostałe przejścia pionowe
  odrzucono do osobnego przeglądu, zamiast zgadywać poziomy końców.
- access/foot, warunki dostępu, zamknięcia i pieszy oneway są respektowane;
  samochodowy oneway nie narzuca kierunku pieszym. Bram/szlabanu nie
  przechodzimy. Krawężnik nie oznacza zamknięcia ciągu, ale nie dopisujemy
  mu obniżenia ani dostępności. Obrysy peronów nie są torami;
  wspólne węzły rzeczywistych torów pozostają wyłączone.
- Jezdnie są tylko kontekstem. Zwykły chodnik nie przechodzi przez ich
  węzeł osiowy. Akceptowane przejście ma jawne footway=crossing, jedną
  oś jezdni w środku, dwa końce poza jezdnią i brak bocznych odgałęzień
  wewnątrz. Cały taki traversal jest jedną krawędzią i jednym zdarzeniem.
  37 bardziej złożonych/niedookreślonych ways crossing wymaga przeglądu.
- Fakty całego etapu pochodzą tylko z dokładnie odpowiadającego way.
  Tag tactile na punkcie jezdni nie potwierdza obu podejść. Brak tagów
  pozostaje unknown; daty obserwacji/weryfikacji pozostają null.
- Punkty to konkretne wejścia dzielące węzeł z chodnikiem. Wykluczono
  proponowane wejście od Worcella, którego obecne reguły nie potwierdziły
  jako połączone z grafem. Nie tworzono połączenia przez najbliższą drogę.

Nie zmieniono istniejącego PILOT_POLICY ani draft.2. Snapshot ma jawny
mode=pilot; walidator sprawdza geometrię krawędzi i przypisanie punktów.
API zwraca preview_only. Każda trasa ma prawdziwą LineString i tekstowy
przebieg; nienazwane ścieżki mają ogólny opis „Ciąg pieszy”. To podgląd
planu, nie instrukcje prowadzenia w terenie lub odczyt bieżących świateł.

## Sprawdzenie i uruchomienie

`pnpm audit:pilot` — audyt bez sieci; zapisany wynik i czasy pojedynczego
lokalnego przebiegu w [pilot-audit.json](../packages/ingestion/data/krakow/pilot-audit.json).
Nie traktujemy tej małej próbki jako benchmarku p95 produkcji.

```powershell
$env:API_DATA_MODE = 'pilot'
$env:API_PORT = '3003'
npm.cmd exec --yes --package=node@24.21.0 --package=pnpm@10.34.6 --call "pnpm start:api"
```

Katalog: `/v1/coverage`, `/v1/places?cityId=krakow-stare-miasto-pilot&query=`.
Start: `osm-place-3719851597`, cel: `osm-place-5213212813`.
Wzór body taki jak dotychczasowe RouteRequest, audibleRequirement=none.
Komplet testów B: ingestion 71, routing 87, API 92, contracts 121 — PASS.
Typecheck pakietów backendu, lint zakresu B, generated (29 plików) — PASS.

Pierwsze nowe testy miały błędne oczekiwanie pustego grafu zamiast odrzucenia
go przez walidator. Test realnego HTTP wykrył nadmierne odrzucanie obrysów
peronów jako torów; poprawiono klasyfikację oraz dodano regresję rozróżnienia.
Końcowe wyniki powyżej pochodzą z ponowienia po poprawkach.

Brak audytu terenowego i testu prawdziwych tras na urządzeniu. Baza/PostGIS
i prowadzenie GPS pozostają osobnymi etapami. Integracja UI i przełączenie
podglądu telefonu wymagają zakończenia bieżącej pracy A.
