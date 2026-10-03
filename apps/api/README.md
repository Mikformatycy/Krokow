# API — katalog i routing synthetic/pilot

## Prawdziwe dane Krakowa

```powershell
$env:API_DATA_MODE = 'pilot'
npm.cmd exec --yes --package=node@24.21.0 --package=pnpm@10.34.6 --call "pnpm start:api"
```

Loader sprawdza checksum archiwalnego OSM i buduje graf pieszy w pamięci.
Uruchomienie nie pobiera nic z sieci i nie wymaga bazy do obliczenia trasy.
Katalog: `GET /v1/places?cityId=krakow-stare-miasto-pilot&query=`.
Pięć punktów to wejścia Galerii Krakowskiej i High5ive. Wyszukiwanie np.
`High5ive` zwraca dwa wejścia, a nazwa spoza katalogu pustą listę.

Odpowiedzi mają `mode=pilot`, `navigationEligibility=preview_only`,
rzeczywiste współrzędne i geometrię. Przykładowa trasa z
`osm-place-3719851597` do `osm-place-5213212813` ma ok. 420 m i jedno
przejście z nieznaną akustyką. Jawne wymaganie akustyki daje
`NO_MATCHING_ROUTE`, a nie domyślne rozluźnienie preferencji.
Prośba o punkt poza katalogiem nie tworzy łącznika przez bliskość.

Ograniczenia i audyt: [real-pilot](../../docs/real-pilot.md).
Do sprawdzenia danych służy `pnpm audit:pilot`. `/readyz` zachowuje osobne
kryterium bazy i bez niej zwraca 503, mimo że katalog i routing w RAM
obsługują żądania. To nie migracja ani deklaracja gotowości produkcyjnej.

## Dotychczasowy demonstrator synthetic

Fastify udostępnia katalog, źródła, opublikowane dowody, schemat OpenAPI oraz
health/readiness. Schematy wejścia i wyjścia pochodzą z `@krok/contracts`.
Punkty demonstracyjne są fikcyjne i mają `preview_only`.

Uruchomienie z katalogu głównego, po instalacji wspólnego workspace:

```powershell
$env:API_DATA_MODE = 'synthetic'
npm.cmd exec --yes --package=node@24.21.0 --package=pnpm@10.34.6 --call "pnpm start:api"
```

`pnpm dev:api` uruchamia ten sam serwer z obserwowaniem plików. Zatrzymanie:
Ctrl+C. Domyślny adres: `http://127.0.0.1:3001`. `.env` jest odczytywany
z katalogu głównego; istniejące zmienne procesu mają pierwszeństwo.
Bez jawnego `API_DATA_MODE=synthetic` lub `API_DATA_MODE=pilot` katalog pozostaje niedostępny i zwraca 503.
Nie ma automatycznego przełączania na demo po błędzie bazy lub źródła.

| Endpoint | Zachowanie B-01/B-02 |
| --- | --- |
| `GET /healthz` | 200, gdy proces obsługuje HTTP. |
| `GET /readyz` | Osobne kontrole bazy/PostGIS, aktywnego grafu i kontraktu. W trybie synthetic graf jest aktywny; brak bazy nadal daje 503. |
| `GET /v1/coverage` | Tekstowy opis fikcyjnego obszaru, capabilities i polityka. |
| `GET /v1/places?cityId=synthetic-city&query=` | Dwa fikcyjne punkty. Puste zapytanie pokazuje oba; wyszukiwanie nazwy nie rozróżnia wielkości liter. Jeden znak, nadmiarowe pola i powtórzone parametry dają 400. |
| `GET /v1/sources` | Publiczny rejestr źródeł synthetic. |
| `GET /v1/features/A-crossing-object-0/evidence` | Zredagowane dowody obiektu. Poprawne nieznane ID zwraca pustą listę. |
| `POST /v1/routes` | Rzeczywiste obliczenia grafu synthetic, walidacja wejścia/wyjścia, kontrola capabilities, punktów i wersji. Bez jawnego trybu synthetic: SOURCE_UNAVAILABLE (503). |
| `GET /openapi.json` | OpenAPI generowane ze wspólnych schematów. |

Przykładowy request: `examples/route-request.json`. Błędne współrzędne dają
VALIDATION_ERROR (400), prawidłowe współrzędne są obecnie wyłączoną capability
(422). Identyczne punkty dają SAME_ENDPOINT. Brak plannera nie oznacza NO_PATH
i nie zwraca gotowego przykładu sukcesu. `RoutePlanner` w `src/planner.ts`
łączy API z `@krok/routing` przez adapter `src/routing.ts`.

Testowy planner jest wstrzykiwany wyłącznie w testach, żeby sprawdzić walidację
wyjść HTTP oraz błędy. Runtime go nie używa. API sprawdza m.in. zgodność wersji,
limitu alternatyw, objazdu i wymogów akustyki. Warunki grafu, legalność dostępu
i zapisane schody sprawdza silnik grafu.

W trybie synthetic żądanie z `examples/route-request.json` daje 740/980/1120 m
i rekomendację 980 m. Wyłączenie `preferAudibleSignals` zmienia ją na 740 m.
`audibleRequirement=documented` usuwa korytarz A i ustala baseline 980 m;
`field_verified_recent` daje NO_MATCHING_ROUTE — dane demonstracyjne nie
udają kontroli w terenie. Parametry dotyku i oddzielenia nie zmieniają kosztów
w polityce `synthetic-acoustic-v1`; szczegóły i ograniczenia:
[routing](../../packages/routing/README.md).

Runtime używa `synthetic-graph-v2` / `synthetic-evidence-v2`. To nowy graf,
a nie snapshot v1 z fixtures M-01. DTO pozostaje `1.0.0-draft.2`.
Klient powinien używać wersji otrzymanej odpowiedzi, nie wpisywać na stałe
identyfikatorów tras lub dowodów z fixtures. Żądanie starej wersji daje 409.
Obliczenia w RAM nie wymagają działającej bazy; `/readyz` nadal ją sprawdza.

Konfiguracja w `.env.example`: API_HOST, API_PORT, API_DATA_MODE oraz jawna
lista API_ALLOWED_ORIGINS. Domyślnie API nasłuchuje lokalnie; konfiguracja
`0.0.0.0` służy osobnemu testowi z telefonem w sieci lokalnej. CORS dopuszcza
domyślnie web na localhost:8081 i localhost:8085, bez cookies. CORS nie jest
mechanizmem uwierzytelnienia. Publiczny deployment, rate limiting i HTTPS
pozostają osobnym zakresem; ten serwer jest lokalnym fundamentem.

Readiness wykonuje ograniczone czasowo zapytanie `SELECT PostGIS_Version()`.
Brak konfiguracji, bazy, rozszerzenia albo timeout daje database=false.
Nie wykonujemy migracji. Wszystkie odpowiedzi mają `Cache-Control: no-store`.
Log zawiera ID nadane przez serwer, metodę, statyczny szablon endpointu i status;
nie zawiera URL z query, body, preferencji, współrzędnych, nagłówków ani błędów pg.
Nieznane ścieżki dają neutralne tekstowe 404; nie dodano nowego kodu do draft.2.
Błędy parsera JSON, rozmiaru body (16 KiB) i typu zawartości są mapowane na
VALIDATION_ERROR, bez odbijania treści żądania.

Kontrole z katalogu głównego:

```sh
pnpm test:api
pnpm test:routing
pnpm test:contracts
pnpm lint
pnpm typecheck
pnpm test
pnpm check:generated
```

Aktualne wyniki i niewykonane testy: [docs/status.md](../../docs/status.md).
