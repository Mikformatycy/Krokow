# @krok/ingestion — lokalny audyt OSM

Adapter B-04 pobiera mały, stały bbox Krakowa: południe 50.065, zachód
19.939, północ 50.071, wschód 19.950. Uruchamia go operator, poza obsługą
zapytań użytkownika. Wynik jest stagingiem danych, bez grafu, katalogu
punktów aplikacji i nawigacji terenowej.

Z katalogu głównego, przy Node 24 / pnpm przypiętym w repo:

```sh
pnpm import:osm --help
pnpm import:osm
pnpm test:ingestion
```

Na Windows można użyć wrappera z głównego README:

```powershell
npm.cmd exec --yes --package=node@24.21.0 --package=pnpm@10.34.6 --call "pnpm import:osm"
```

Domyślny zapis: `%LOCALAPPDATA%/Krokow/osm` na Windows,
`~/.local/share/Krokow/osm` na innych systemach. `--root DIR` wybiera
oddzielny katalog. Pliki nie są automatycznie dodawane do Git.

Można odtworzyć zapisany wcześniej pełny wynik tego samego zapytania
Overpass `out meta`, podając rzeczywistą datę jego pozyskania:

```sh
pnpm import:osm --file /absolute/path/raw.json --fetched-at 2026-10-03T18:00:00Z
```

To przykład składni; data nie może zastępować nieznanej daty pobrania.
Plik musi zawierać węzły wszystkich dróg oraz wersje i daty edycji.
Nie należy przekazywać danych z innego obszaru jako tego snapshotu.

Układ zapisu:

- `runs/<uuid>/query.overpassql`, `raw.json`, `candidate.json`, `manifest.json`:
  surowe bajty i checksum, wersja adaptera, źródło/licencja, daty i raport.
  Błąd zapisuje `failure.json`; przed pobraniem raw może nie istnieć.
- `snapshots/<semantic-sha256>/snapshot.json`: niezmienny poprawny wynik.
  Kolejne pobranie tej samej treści zachowuje jego pierwotne daty; osobny
  run zachowuje nowy fetch. Kolejność elementów/tagów i nagłówek Overpass
  nie tworzą nowej wersji semantycznej. Wersja OSM/tagi/geometria tworzą.
- `current.json`: atomowo zastępowany wskaźnik ostatniego poprawnego
  stagingu. Jest rozstrzygający przy przerwaniu procesu, nie sam manifest.
- `import.lock`: blokada równoległego zapisu. Po awarii procesu operator
  powinien najpierw potwierdzić, że importer nie działa; adapter nie usuwa
  samodzielnie zastanej blokady.

Downloader używa jednego endpointu, bez redirectów, najwyżej dwóch prób,
40 s na próbę i limitu 8 MiB. Respektuje Retry-After; oczekiwanie ponad
60 s kończy import. Błędny JSON, częściowa odpowiedź, brak referencji,
daty z przyszłości, cofnięte rewizje i zmiana bez podniesienia wersji są
odrzucane. Spadek liczby highway ways poniżej połowy lub wzrost ponad
dwukrotność blokuje zmianę wskaźnika do przeglądu. Nie ma automatycznego
obejścia blokady. Inny bbox wymaga osobnego katalogu.

Normalizacja obejmuje jawne yes/no akustyki, crossing:signals i poręczy,
cztery wartości tactile_paving, wybrane nawierzchnie oraz highway=steps.
Brak tagu nie generuje false. Nieobsługiwane wartości i wieloznaczny level
trafiają do raportu; tags pozostają w raw i elements. Nie wyprowadzamy
ciągłych oznaczeń dotykowych z pojedynczego punktu ani poziomu z layer.
Ogólne check_date nie jest potwierdzeniem konkretnego udogodnienia.
Paved opisuje klasę nawierzchni, nie równość czy dostępność chodnika.

Evidence przechodzi istniejący schemat kontraktu i resolver B-03.
observation/verification pozostają null, freshness unknown. Audyt dotyczy
pojedynczych obiektów w jednym snapshotcie; nie zamyka konfliktów między
historycznymi rewizjami ani obserwacjami terenowymi. Przed publikacją grafu
trzeba połączyć historię dowodów i przejść osobny przegląd B-05/B-06/A.

Ograniczenia: lokalny staging, bez trwałości transakcyjnej PostGIS,
bez gwarancji odporności na awarię zasilania/fsync i bez odzyskiwania blokady
po zabiciu procesu. Nie powstają połączenia z bliskości geometrycznej.
Nie ma potwierdzonego pobrania realnego snapshotu w tej iteracji:
połączenie do publicznego endpointu kończyło się timeoutem.
Raport i wyniki testów: [B-04](../../docs/b04-ingestion.md).
