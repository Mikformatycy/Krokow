# Kroków

Planowanie pieszych tras dla osób niewidomych: konkretne informacje o infrastrukturze, ich pochodzenie i jawne niewiadome. Użytkownik poznaje plan przed wyruszeniem. Prototyp nie prowadzi w terenie ani nie ocenia bieżącego stanu świateł.

Stan lokalny: **2026-10-04**. Repozytorium: [Mikformatycy/Krokow](https://github.com/Mikformatycy/Krokow). Najnowszy workspace zawiera niezatwierdzone zmiany; sklonowanie obecnej wersji zdalnej może nie odtworzyć tego stanu. Dokumentacja nie oznacza publikacji zmian.

## Co jest gotowe

- Kreator „Skąd idziesz?” → „Dokąd idziesz?” → ustawienia/podsumowanie → „Twój plan”.
- Wyszukiwarka **96 556 wpisów Krakowa**: nazwy, adresy, polskie znaki, ograniczona tolerancja literówek. API zwraca do 10 wyników; UI pokazuje początkowo 5 i pozwala rozwinąć pozostałe.
- Trasy między **30 punktami w pięciu rozłącznych grupach** centrum. Wyszukanie adresu nie oznacza możliwości wyznaczenia do niego trasy.
- Obliczenia, preferencje i twarde wymagania; osobne komunikaty braku połączenia, braku pasującej trasy i awarii.
- Tekst, odsłuch, źródła i oddzielne daty pobrania/edycji/obserwacji/potwierdzenia. Informacje o odcinkach dotyczą obiektów wszystkich zwróconych wariantów.
- Jawny tryb synthetic z fikcyjnymi trasami i symulacją, wybierany konfiguracją API. Brak automatycznego przełączenia na fikcyjne wyniki po awarii.

Graf: 6043 węzły, 12554 skierowane krawędzie, 479 etapów przejść. Akustyka wszystkich etapów jest unknown; wszystkie 8344 rekordy infrastruktury są niezweryfikowane w terenie. Rzeczywisty przykład pokazuje nawierzchnię i braki danych. To nie dowód braku urządzeń w mieście. [Audyt](docs/data-audit-report.md).

## Uruchomienie w przeglądarce

Potrzebne: kompletne źródła z archiwami danych, Node **24.21.0**, pnpm **10.34.6** i przeglądarka. Nie potrzeba Dockera, konta Expo/ngrok, klucza map ani ponownego pobierania OSM. Internet jest potrzebny do pierwszej instalacji pakietów. Wszystkie komendy wykonuj w katalogu głównym.

```sh
pnpm install --frozen-lockfile
```

**Terminal 1 — API, PowerShell:**

```powershell
$env:API_DATA_MODE = 'pilot'
$env:API_HOST = '127.0.0.1'
$env:API_PORT = '3001'
$env:API_ALLOWED_ORIGINS = 'http://localhost:8081,http://localhost:8085'
pnpm start:api
```

**Terminal 2 — interfejs, PowerShell:**

```powershell
$env:EXPO_PUBLIC_API_URL = 'http://127.0.0.1:3001'
pnpm --filter @krok/mobile exec expo start --web --localhost --port 8081 --max-workers 2
```

Otwórz **http://localhost:8081**. Pozostaw oba terminale uruchomione; Ctrl+C zatrzymuje dany proces. Inicjalizacja katalogu może potrwać kilkanaście sekund. Brak .env jest dozwolony; podgląd plikowy nie wymaga konfiguracji bazy.

Na macOS/Linux odpowiedniki dwóch terminali to:

```sh
API_DATA_MODE=pilot API_HOST=127.0.0.1 API_PORT=3001 API_ALLOWED_ORIGINS=http://localhost:8081,http://localhost:8085 pnpm start:api
```

```sh
EXPO_PUBLIC_API_URL=http://127.0.0.1:3001 pnpm --filter @krok/mobile exec expo start --web --localhost --port 8081 --max-workers 2
```

Komendy wynikają z manifestów; ta iteracja dokumentacyjna nie jest nowym testem macOS/Linux ani czystej instalacji.

### Windows bez przypiętego Node/pnpm

Istniejący npm może uruchomić wersje projektu bez podmiany globalnego Node. Zamiast pnpm użyj wrappera, zachowując powyższe zmienne środowiska:

```powershell
npm.cmd exec --yes --package=node@24.21.0 --package=pnpm@10.34.6 --call "pnpm install --frozen-lockfile"
npm.cmd exec --yes --package=node@24.21.0 --package=pnpm@10.34.6 --call "pnpm start:api"
```

W drugim terminalu:

```powershell
$env:EXPO_PUBLIC_API_URL = 'http://127.0.0.1:3001'
npm.cmd exec --yes --package=node@24.21.0 --package=pnpm@10.34.6 --call "pnpm --filter @krok/mobile exec expo start --web --localhost --port 8081 --max-workers 2"
```

### Pierwsza trasa

1. „Zaplanuj trasę” → wyszukaj **Pawia 5** (również **pawia pięć**) → **Galeria Krakowska — wejście od Pawiej**.
2. Wyszukaj **High5ive** → **High5ive, budynek 1 — wejście zachodnie**.
3. Oblicz plan: około **420 m**, około 6 minut samego marszu, jedno przejście z nieznaną akustyką.
4. Rozwiń „Przebieg trasy”, „Informacje o odcinkach” i „Porównanie, źródła i daty”. Odsłuch wymaga polskiego głosu; tekst działa niezależnie.
5. Twarde wymaganie opisanej akustyki daje odmowę i zachowanie ustawienia.
6. „Nowa Huta” pokazuje miejsca bez obsługi tras. Rynek Główny → Galeria Pawia daje odrębny brak połączenia w modelu.

## Telefon

Expo SDK **57** dobrano do zgłoszonego iPhone'a z Expo Go 57.0.9. Przy innej wersji Expo Go sprawdź zgodność; nie instaluj niezależnie React Native.

Na telefonie localhost oznacza telefon. LAN wymaga osiągalnego IP komputera, API_HOST=0.0.0.0 i EXPO_PUBLIC_API_URL ustawionego przed startem Expo. Na dotychczasowym Windowsie sprawdzono własny tunel **API → gateway → ngrok → Metro**. [Pełna instrukcja](docs/phone-tunnel.md). To opcjonalny podgląd developerski, nie stały adres demonstracji.

Użytkownik potwierdził pięć prób iPhone/VoiceOver. Nowe podsumowanie trasy i pozostałe próby urządzenia nie mają jeszcze odbioru. [Zakres](docs/testing.md).

## Synthetic

Uruchom API z API_DATA_MODE=synthetic zamiast pilot; na tym samym porcie najpierw zakończ własny poprzedni proces. Po przeładowaniu UI pokazuje fikcyjne punkty, przykład A/B/C i symulację. Trasy 740/980/1120 m są syntetyczne. Ten tryb demonstruje również konflikt, unknown i wpływ akustyki na ranking; nie opisuje prawdziwych udogodnień.

## Testy i diagnostyka

Ostatnia pełna kontrola 2026-10-04: **620 PASS** (606 workspace + 14 pilot), lint, typecheck i 31 generowanych plików PASS. To wynik wcześniejszego uruchomienia, nie każdej późniejszej zmiany dokumentacji. [Status](docs/status.md), [macierz wymagań](docs/testing.md).

```sh
pnpm --filter @krok/mobile exec playwright install chromium
pnpm lint
pnpm typecheck
pnpm test
pnpm check:generated
pnpm build:web
```

pnpm test uruchamia własne API synthetic 3002 i Metro 8085. Testy prawdziwego pilota wymagają osobnego API pilot na 3003:

```sh
pnpm --filter @krok/mobile exec playwright test --config test/pilot.config.ts
```

Można wskazać osobne API testowe przez `PILOT_TEST_API_URL` (np.
`http://127.0.0.1:3004`). Runner używa tego samego adresu w aplikacji i próbach HTTP;
nie uruchamia ani nie zatrzymuje wskazanego API.

Oba zestawy web używają 8085 — uruchamiaj je kolejno. Eksport web trafia do apps/mobile/dist; aplikacja nadal wymaga API.

- GET http://127.0.0.1:3001/healthz: działanie procesu.
- GET /v1/coverage: oczekiwane mode=pilot.
- GET /v1/place-search?cityId=krakow&query=Pawia%205: katalog.
- /readyz bez PostGIS zwraca 503 mimo działającego routingu w RAM. Nie traktuj go samodzielnie jako testu tego podglądu.
- Zajęty port: ustal proces i konfigurację; sama nazwa node nie uzasadnia zatrzymania aktywnego podglądu.

## Dokumentacja

| Dokument | Zakres |
| --- | --- |
| [requirements.md](requirements.md) | Niezmieniony brief |
| [architecture.md](architecture.md) | Aktualne komponenty i odrębny projekt rozwoju |
| [plan.md](plan.md) | Bieżący backlog |
| [operations.md](docs/operations.md) | Utrzymanie, finansowanie, przenoszenie i kolejne miasta |
| [data-sources.md](docs/data-sources.md) | Archiwa, pochodzenie i aktualność |
| [dependencies.md](docs/dependencies.md) | Zależności i odczytane licencje |
| [API](apps/api/README.md), [kontrakty](packages/contracts/README.md) | Konfiguracja, endpointy i schematy |
| [demo-script.md](docs/demo-script.md), [demo-delivery.md](docs/demo-delivery.md) | Scenariusz i brakujące materiały |
| [submission.md](docs/submission.md) | Polskie odpowiedzi do formularza |
| [AGENTS.md](AGENTS.md), [codex-start.md](codex-start.md) | Zasady i start wykonawcy |

PostGIS jest opcjonalnym modułem developerskim; komendy w operations.md. Automatyczna publikacja danych, zgłoszenia, konta, GPS, ORS i produkcyjne wdrożenie nie są gotowymi funkcjami. PDF i film są wymagane, ale poprzednie deliverables/ usunięto. Historyczne raporty zachowano. Jeden Codex obsługuje całość; dawny podział A/B nie przydziela dziś pracy.
