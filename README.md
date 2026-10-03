# Kroków

<img src="logo.png" alt="Logo Kroków: litera K z białych lasek" width="160">

Repozytorium: [Mikformatycy/Krokow](https://github.com/Mikformatycy/Krokow).
Frontend, API, routing, kontrakty i rdzeń symulacji znajdują się razem
w tym monorepo. `Kroków` to nazwa produktu; `krokow` jest identyfikatorem
technicznym używanym przez narzędzia.

Pobranie całego projektu do jednego folderu:

```sh
git clone https://github.com/Mikformatycy/Krokow.git Kroków
cd Kroków
```

Stare worktrees backendu i symulacji nie są potrzebne do uruchomienia.
Ich kod został zintegrowany tutaj; symulacja jest dostępna na ekranie wyniku.

## Nawigacja piesza uwzględniająca infrastrukturę istotną dla osoby niewidomej

**Status: backend z prawdziwymi trasami OSM i aplikacja podglądu planu.** Wspólny workspace zawiera schematy Zod, fixtures, OpenAPI, katalog miejsc i silnik tras. Tryb `pilot` obejmuje pięć rzeczywistych wejść w okolicy Galerii Krakowskiej; `synthetic` zachowuje fikcyjne przykłady do testów. Oba tryby służą podglądowi, bez prowadzenia GPS. Kontrakt pozostaje draftem do przeglądu. Bieżący stan integracji interfejsu, wyniki kontroli i ograniczenia są w [docs/status.md](docs/status.md).

Aplikacja wyszukuje pięć rzeczywistych wejść w okolicy Galerii Krakowskiej i pobiera obliczone trasy na zarchiwizowanych danych OSM; [zakres pilota i wyniki](docs/real-pilot.md). Testy integracji UI opisano w [handoffie mobile](docs/handoff-mobile.md) i statusie B. Film i prezentacja są odłożone. Dotychczasowe [materiały](deliverables/README.md) zachowano jako historyczną wersję roboczą ze starą nazwą.

API prawdziwych danych uruchamia się przez `API_DATA_MODE=pilot`; korzysta
z dołączonego snapshotu i nie wymaga pobierania OSM ani Dockera do obliczeń.
Opcjonalny tryb `synthetic` zachowuje fikcyjne trasy A/B/C.
Instrukcja obu trybów: [API](apps/api/README.md).

Produkt ma odpowiadać na pytanie: **"Którą trasę wybrać i co, według dostępnych danych, spotkam po drodze?"** Nie ocenia trasy jako bezwarunkowo bezpiecznej. Oddziela przydatność infrastruktury od tego, jak dobrze jest ona udokumentowana.

## Szybki start na iPhonie — obecny komputer

Po pobraniu projektu zainstaluj zależności:

```powershell
npm.cmd exec --yes --package=node@24.21.0 --package=pnpm@10.34.6 --call "pnpm install --frozen-lockfile"
```

Otwórz dwa terminale PowerShell w katalogu
repozytorium. iPhone z Expo Go i komputer muszą mieć połączenie w tej samej
sieci lokalnej (komputer może być podłączony kablem). Nie trzeba uruchamiać
Dockera do obliczania tras z dołączonego snapshotu.

Terminal 1 — API:

```powershell
$env:API_DATA_MODE = 'pilot'
$env:API_HOST = '0.0.0.0'
$env:API_PORT = '3001'
npm.cmd exec --yes --package=node@24.21.0 --package=pnpm@10.34.6 --call "pnpm start:api"
```

Terminal 2 — Expo Go:

```powershell
$env:EXPO_PUBLIC_API_URL = 'http://10.250.193.184:3001'
$env:REACT_NATIVE_PACKAGER_HOSTNAME = '10.250.193.184'
npm.cmd exec --yes --package=node@24.21.0 --package=pnpm@10.34.6 --call "pnpm --filter @krok/mobile exec expo start --go --lan --port 8081 --max-workers 2"
```

`10.250.193.184` to adres komputera sprawdzony w tej sesji. Po zmianie sieci
sprawdź `ipconfig` i podmień go w obu zmiennych. Zeskanuj kod QR aparatem
iPhone'a i otwórz w Expo Go. Aktualny adres projektu: `exp://10.250.193.184:8081`.
Gdy pojawi się prośba iOS o dostęp Expo Go do sieci lokalnej, zezwól na niego.
Zostaw oba terminale uruchomione; `Ctrl+C` zatrzymuje odpowiedni serwer.
Nie uruchamiaj drugiej kopii, jeśli porty 3001/8081 są już zajęte przez tę aplikację.

W aplikacji otwórz planowanie, wybierz start **Galeria Krakowska — wejście
od Pawiej** i cel **High5ive, budynek 1 — wejście zachodnie**, potem **Oblicz
trasy**. Backend wyznacza około **420 m**, z jednym przejściem i brakiem
danych o jego akustyce. Katalog obejmuje wyłącznie pięć wejść opisanych
w [zakresie pilota](docs/real-pilot.md), a nie wszystkie adresy Krakowa.
Włączenie twardego wymagania akustyki może zwrócić brak dopasowanej trasy.
Odsłuch opisuje plan; nie jest prowadzeniem na podstawie pozycji telefonu.
Podgląd na komputerze: `http://localhost:8081`.

Jeżeli telefon nie łączy się, otwórz w Safari `http://10.250.193.184:3001/healthz`.
Oczekiwana odpowiedź to `{"status":"ok"}`. Brak odpowiedzi wskazuje problem
połączenia do API; sama działająca strona nie potwierdza działania Expo.
Zapisz komunikat błędu z Expo Go, jeżeli projekt nadal się nie otwiera.

Jeśli LAN jest niedostępny: [uruchomienie przez własny ngrok](docs/phone-tunnel.md).
Przygotowany gateway przekazuje przez jeden tunel zarówno Expo, jak i API.

## Najpierw przeczytaj

| Plik | Przeznaczenie |
| --- | --- |
| [plan.md](plan.md) | Zakres, etapy, zadania z kryteriami odbioru i podział pracy dwóch osób. |
| [architecture.md](architecture.md) | Komponenty, graf, ranking tras, model faktów, nawigacja, prywatność i wdrożenie. |
| [AGENTS.md](AGENTS.md) | Wspólne instrukcje repozytorium, automatycznie odczytywane przez Codexa. |
| [CLAUDE.md](CLAUDE.md) | Instrukcje roli B / Codex backend, pod historyczną nazwą. |
| [agent.md](agent.md) | Krótki punkt wejścia dla człowieka; nie zastępuje AGENTS.md. |
| [contracts.md](contracts.md) | Opis wejściowy kontraktu. Schematy i fixtures: [pakiet kontraktów](packages/contracts/README.md); propozycje draft.2: [przegląd F-02](docs/f02-review.md). |
| [workflow.md](workflow.md) | Własność plików, branche, zmiany kontraktu i przekazywanie pracy. |
| [docs/demo-script.md](docs/demo-script.md) | Scenariusz demonstracji oraz granica użycia prototypu. |
| [docs/mobile-ux.md](docs/mobile-ux.md) | Plan ekranów i wymagania frontendu do F-02. |
| [docs/decisions.md](docs/decisions.md) | Wersje i decyzje techniczne bootstrapu. |

Wyniki testów zapisujemy w `docs/status.md` i handoffach obu ról. Samo istnienie dokumentu planu nie oznacza odbioru ani wykonania testu urządzenia.

## Ustalony podział

**Osoba A + Codex:** Expo/React Native, ekrany, obsługa czytnika, tekstowy opis trasy, komunikaty, lokalny stan nawigacji, testy interfejsu. **Osoba B + druga instancja Codexa (zastępująca Claude Code):** Fastify/TypeScript, PostgreSQL/PostGIS, import danych, model wiarygodności, graf, algorytm, API, deployment. Kontrakty i reguły wpływające na komunikaty o przejściach zatwierdzają obie osoby.

Nie jest to twierdzenie o przewadze jednego modelu. To organizacyjny podział ograniczający konflikty zmian. Człowiek odpowiada za odbiór, prawdziwość danych i testy terenowe.

## Jak rozpocząć

1. Sklonuj wspólne repozytorium według instrukcji na górze i przeczytaj [aktualny status](docs/status.md).
2. Zainstaluj zależności i uruchom API pilot oraz Expo. Docker jest potrzebny wyłącznie do osobnych prac z PostGIS.
3. Dalszą pracę zacznij od [codex-start.md](codex-start.md) lub [claude-start.md](claude-start.md), zgodnie z rolą. Obie role korzystają z tego samego repozytorium, kontraktu i lockfile.

### Właściwe nazwy plików instrukcji

Wspólne reguły są w `AGENTS.md`. Rola B / Codex czyta także `CLAUDE.md` i `claude-start.md`; historyczne nazwy zostały zachowane po przejęciu backendu. Nie twórz drugiego `claude.md`: na systemie plików ignorującym wielkość liter kolidowałby z `CLAUDE.md`.

## Stack i wersje

Decyzja projektowa: **React Native + Expo + Expo Router + TypeScript**, **Fastify + TypeScript**, **PostgreSQL + PostGIS**, monorepo **pnpm**, wspólne schematy **Zod**. Biblioteki natywne instaluj przez `expo install`, a nie dobieraj niezależnie wersji React Native. Expo wspiera monorepo, ale trzeba unikać zdublowanych pakietów natywnych [S03, S08].

W F-01/F-03 zapisz w `docs/decisions.md` rzeczywiście użyte wersje Node, pnpm, SDK Expo i telefonów. Kandydat dla Node: wspierana linia 24 LTS [S17]. SDK Expo: stabilna wersja **rzeczywiście zgodna z Expo Go na telefonach zespołu w dniu startu**. Nie kopiuj wersji z losowego tutoriala; nie używaj canary. Ten pakiet nie potwierdza działania konkretnej kombinacji urządzeń.

## Uruchomienie fundamentu

Wersje: Node **24.21.0** (plik `.node-version`) i pnpm **10.34.6** (`packageManager`). Wszystkie komendy wykonuj z katalogu głównego. Nie używaj `npm install` w repozytorium; wspólny lockfile to `pnpm-lock.yaml`.

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm --filter @krok/mobile exec playwright install chromium
pnpm test
```

Jeżeli system ma inną wersję Node albo nie ma pnpm, można uruchomić przypięte narzędzia z cache npm, bez globalnej instalacji. Sprawdzony wariant PowerShell:

```powershell
npm.cmd exec --yes --package=node@24.21.0 --package=pnpm@10.34.6 --call "pnpm install --frozen-lockfile"
npm.cmd exec --yes --package=node@24.21.0 --package=pnpm@10.34.6 --call "pnpm --filter @krok/mobile exec playwright install chromium"
npm.cmd exec --yes --package=node@24.21.0 --package=pnpm@10.34.6 --call "pnpm lint && pnpm typecheck && pnpm test"
```

`npm exec` uruchamia narzędzia; zależności workspace nadal instaluje pnpm. Przy aktualizacji zależności regeneruj lockfile przez `pnpm install` i sprawdź późniejszą instalację z `--frozen-lockfile`.

### Lokalny PostGIS

Uruchom Docker z obsługą kontenerów Linux. Skopiuj `.env.example` do `.env`, o ile własny plik jeszcze nie istnieje. PowerShell:

```powershell
if (-not (Test-Path -LiteralPath .env)) { Copy-Item -LiteralPath .env.example -Destination .env }
```

Przykładowe hasło służy wyłącznie lokalnemu developmentowi. `.env` jest ignorowany przez Git. Baza nasłuchuje na `127.0.0.1:54329`; port można zmienić przez `POSTGRES_PORT`. Następnie:

```sh
pnpm db:config
pnpm db:up
pnpm db:check
pnpm test:db
pnpm db:stop
```

`db:config` sprawdza Compose bez wypisywania wartości środowiska. `db:up` czeka na healthcheck. `db:check` sprawdza połączenie i zapytanie PostGIS. `test:db` sprawdza rozszerzenie oraz pomiar odległości dla syntetycznych współrzędnych w transakcji tylko do odczytu. `db:stop` zatrzymuje kontener, zachowując wolumen. Obraz PostGIS jest przypięty digestem; zmiana hasła w `.env` nie zmienia hasła w już zainicjalizowanym wolumenie.

Workflow `.github/workflows/ci.yml` wykonuje instalację z lockfile, lint, typecheck, testy (w tym Chromium), eksport web i sprawdzenie PostGIS. Wynik lokalny nie oznacza wykonanego workflow na GitHubie.

### Podgląd Expo — formularz, HTTP i porównanie

SDK 57 dobrano do zgłoszonego iPhone'a z Expo Go 57.0.9 (obsługa SDK 57.0.0). Test urządzenia i VoiceOver pozostaje osobnym odbiorem; wąski viewport Playwright nie zastępuje telefonu.

```sh
pnpm dev:mobile
pnpm dev:web
pnpm test:e2e:web
pnpm build:web
pnpm --filter @krok/mobile exec expo install --check
```

Uruchom jeden wybrany serwer: `dev:mobile` pokazuje kod QR do otwarcia w Expo Go, `dev:web` otwiera przeglądarkę. iPhone i komputer powinny być w tej samej sieci. Na hoście bez pnpm użyj powyższego wrappera `npm.cmd exec`, np. z `--call "pnpm dev:mobile"`.

Testy web uruchamiają własne Metro na `http://localhost:8085` oraz API synthetic na `127.0.0.1:3002`. Sprawdzają dwa rozmiary okna, klawiaturę, powiększenie CSS do 200%, brak żądania lokalizacji i przepływ HTTP. Eksport web trafia do `apps/mobile/dist`. Gotowe przykłady nie wymagają API; obliczenia HTTP wymagają uruchomienia backendu. Baza nie jest potrzebna do grafu synthetic w RAM.

Uruchom API w trybie synthetic (instrukcja niżej), następnie Expo. Wybierz „Otwórz demonstrację planowania” lub `/plan`, „Przywróć punkty i ustawienia przykładu A/B/C” i „Oblicz trasy”. Wynik pokazuje 740/980/1120 m i rekomendację 980 m. Wyłączenie preferencji akustyki oraz ponowne obliczenie zmienia rekomendację na 740 m. Karty zawierają długość, braki danych, uzasadnienia, rozwijany przebieg i dowody z osobnymi datami.

Przycisk „Przygotowane przykłady bez API” jawnie włącza dawny mock M-01. Awaria sieci nigdy nie wybiera go automatycznie. Ustawienia są zachowywane po błędzie, a zmiana formularza unieważnia poprzedni wynik. Wymaganie potwierdzenia akustyki w terenie daje NO_MATCHING_ROUTE, ponieważ fikcyjne deklaracje nie udają weryfikacji. W tej polityce miękkie preferencje dotyku i oddzielenia nie zmieniają rankingu. Zakres: [integracja demo](docs/demo-integration.md), historyczny [M-01](docs/m01-mobile.md).

Sekcja „Odsłuch planu” pozwala wybrać wariant, uruchomić czytanie, zatrzymać je i powtórzyć od początku. Tekst odsłuchu można rozwinąć niezależnie od głosu. Własna mowa nie startuje automatycznie; zmiana wariantu/formularza, opuszczenie ekranu i ukrycie aplikacji zatrzymują kolejkę. Native używa `expo-speech ~57.0.3`, dobranego do lokalnego SDK 57. Web wymaga lokalnego polskiego głosu Web Speech; jego brak wyświetla komunikat. Wykryty czytnik native blokuje TTS aplikacji. W przeglądarce użytkownik zaznacza „Korzystam z czytnika — wyłącz głos aplikacji”; ustawienie obowiązuje dla bieżącego wyniku. Zakres i ograniczenia: [minimalny odsłuch](docs/demo-speech.md).

Odbiór na iPhonie: otwarcie trzech ekranów i powrót, wybór punktów, zmiana preferencji, błąd identycznych punktów i odczyt wyniku. Sprawdź przewijanie przy większym tekście, kolejność odczytu i fokus nagłówka po przejściu przy włączonym VoiceOver. Sprawdź odsłuch, zatrzymanie, zmianę wariantu oraz blokowanie własnego TTS przy aktywnym czytniku. Zapisz wersję iOS oraz wynik; nie zaznaczaj etapów jako odebranych bez testu telefonu. iPhone/VoiceOver i Android/TalkBack: **nieprzetestowane na urządzeniu**.

### API i kontrakt

Uruchomienie lokalnego API: `pnpm start:api` lub `pnpm dev:api` z obserwowaniem plików. Jawny katalog demonstracyjny wymaga `API_DATA_MODE=synthetic`; bez tej zmiennej dane są niedostępne. Instrukcja i endpointy: [apps/api/README.md](apps/api/README.md). Domyślny adres to `http://127.0.0.1:3001`.

`pnpm test:api` uruchamia testy HTTP i konfiguracji, a `pnpm test:routing` sprawdza algorytm grafu. `pnpm test:contracts` sprawdza wspólny kontrakt, `pnpm contracts:export` generuje przykłady i OpenAPI, a `pnpm check:generated` sprawdza ich aktualność. Wszystkie te skrypty są zintegrowane z workspace. Readiness wymaga aktywnego grafu i działającej bazy; w trybie synthetic można obliczać trasy w RAM także przy niedostępnej bazie.

`db:migrate` i `data:seed:demo` **nie są jeszcze zaimplementowane**. API wyznacza trasy na grafie synthetic w RAM. `pnpm import:osm` uruchamia osobny lokalny adapter i audyt małego obszaru OSM; `pnpm test:ingestion` sprawdza normalizację i zachowanie danych po awarii. [Instrukcja importera](packages/ingestion/README.md) opisuje zapis oraz import z pliku. Pobranie z publicznego Overpass nie powiodło się w ostatniej próbie. Realny graf, jego publikacja do API i zapis w bazie pozostają do wykonania.

Na telefonie `localhost` oznacza telefon, nie laptop. Przed startem Expo ustaw `EXPO_PUBLIC_API_URL` na osiągalny adres komputera w sieci lokalnej, np. `http://192.168.1.10:3001`, oraz uruchom API z `API_HOST=0.0.0.0`. Podstaw rzeczywisty adres komputera; oba urządzenia muszą być w tej samej sieci. Bez konfiguracji native pokazuje jawną informację, a web używa `http://localhost:3001`. Zmienna jest publiczną konfiguracją bundla, nigdy miejscem na sekrety. Tunel Metro nie wystawia automatycznie API. Publiczny deployment HTTPS pozostaje poza zakresem lokalnego demo.

Nie uruchamiaj scaffoldingu w niepustym `apps/mobile` z nadpisaniem instrukcji. Wygeneruj szablon w katalogu tymczasowym, scal go świadomie i zachowaj `AGENTS.md`.

## Granice prototypu

P0 to wyszukiwanie punktów w małym obszarze, rzeczywiste obliczanie alternatyw na grafie, opis danych i odsłuch oraz jawna symulacja przejścia. P1 dodaje eksperymentalne prowadzenie na pierwszym planie po przejściu testów. Działanie z zablokowanym ekranem, wykrywanie przeszkód i bieżącego stanu świateł nie należą do P0/P1. Expo Go nie jest docelową ścieżką produkcyjną; lokalizacja w tle wymaga odrębnej konfiguracji i odpowiedniego buildu [S04, S07].

Dane `synthetic` nie mogą uruchomić trybu terenowego. Wszystkie przykłady w `examples/` są fikcyjne i nie opisują rzeczywistych przejść w Krakowie.
