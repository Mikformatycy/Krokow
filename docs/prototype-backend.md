# Prototyp funkcjonalny — backend

Aktualny zakres: miejska wyszukiwarka Krakowa (**96 556 wpisów**) oraz **30 punktów do planowania
tras na wybranych ciągach pieszych w centrum**. Runtime `API_DATA_MODE=pilot`
korzysta z `loadKrakowPrototype`; stary `loadKrakowPilot` pozostaje źródłem
regresji pięciu wejść. Nie zmieniono DTO, cityId tras, wag ani wymagań.

## Scenariusz podłączony w UI

1. Wyszukaj początek przez `/v1/place-search?cityId=krakow&query=...`.
2. Wybierz wynik z `routing.status=available`; zapamiętaj jego **routing.placeId**.
3. Wyszukaj i wybierz cel tak samo. Nazwy punktów na ciągach pieszych muszą
   pozostać pełne: to nie wejścia do wszystkich budynków przy danej ulicy.
4. Wyślij zwykły `/v1/routes`, cityId z `routing.cityId`, oba placeId,
   jawne preferencje, `locale=pl-PL`, `maxAlternatives=3`.
5. Pokaż dystans, modelowy czas marszu bez czasu oczekiwania, tekst kroków,
   przejścia, fakty/unknown i źródła ze zwróconej odpowiedzi. Nie wyliczaj
   własnej trasy ani nie podmieniaj braku połączenia na linię do celu.

Pusty tekst zwraca 10 początkowych punktów, `total=30`, `hasMore=true`.
Pierwszych 10 należy do jednej połączonej części centrum. Pełny katalog
pozostaje dostępny po wyszukaniu. Stary `/v1/places` także przeszukuje
wszystkie 30 punktów, lecz pojedyncza odpowiedź pozostaje ograniczona do 10.

## Sprawdzone pary do demonstracji

| Początek | Cel | placeId od → do |
| --- | --- | --- |
| Rynek Główny — punkt na ciągu pieszym | Floriańska — punkt na ciągu pieszym | `osm-place-14121238341` → `osm-place-6128078603` |
| Mały Rynek — punkt na ciągu pieszym | Plac Mariacki — punkt na ciągu pieszym | `osm-place-2519190127` → `osm-place-2996091179` |
| Rynek Główny — punkt na ciągu pieszym | Bazylika Przenajświętszej Trójcy — wejście | `osm-place-14121238341` → `osm-place-8930701234` |
| Galeria Krakowska — wejście od Pawiej | High5ive, budynek 1 — wejście zachodnie | `osm-place-3719851597` → `osm-place-5213212813` |
| Bulwar Czerwieński — punkt na ciągu pieszym | Kanonicza — punkt na ciągu pieszym | `osm-place-278057644` → `osm-place-1517013550` |
| Wojewódzka Biblioteka Publiczna — wejście (Rajska 1) | Studencka 13 — wejście | `osm-place-752177530` → `osm-place-12923496910` |

Dokładne odległości i czasy audytu: [route-audit.json](../packages/ingestion/data/krakow-prototype/route-audit.json).
Trasa Galeria → High5ive nadal ma 420,217 m. Rynek → Floriańska w aktualnym
grafie i profilu ma około 1173 m: to wynik ograniczonej, obsługiwanej
topologii, nie obietnica najkrótszej możliwej drogi w mieście.

## Obowiązkowe stany

- Rynek Główny → Galeria Krakowska: `NO_PATH`. Te części grafu nie mają
  obsługiwanego połączenia. Oba punkty osobno są poprawnymi końcami tras.
- Galeria → High5ive z `audibleRequirement=documented`:
  `NO_MATCHING_ROUTE`, bez automatycznej zmiany wymagania.
- Zwykły adres z miasta bez przypisania: wyszukiwarka zwraca unavailable,
  nie daje wymyślonego wejścia. Nie wysyłać centroidu do planera.
- Ten sam punkt: `SAME_ENDPOINT`. Zmiana wersji: `DATA_VERSION_CHANGED`.
- `calculation.status=budget_limited`: zwrócona trasa jest zwalidowana,
  ale szukanie alternatyw zostało ograniczone. Nie przedstawiać wyniku jako
  wyczerpującego przeszukania wszystkich tras.

## Dane i uruchomienie

Graf: 6043 węzły, 12554 skierowane krawędzie, 479 prostych przejść.
Wybrane punkty leżą w pięciu połączonych grupach; graf ma też fragmenty
bez punktów katalogu. Zasięg i opis pochodzą z `/v1/coverage`.
Polityka `pilot-v1` bez zmian. Archiwum i odtwarzanie:
[dane prototypu](../packages/ingestion/data/krakow-prototype/README.md).

Uruchomienie z root w PowerShell:

```powershell
$env:API_DATA_MODE = 'pilot'
$env:API_HOST = '127.0.0.1'
$env:API_PORT = '3001'
npm.cmd exec --yes --package=node@24.21.0 --package=pnpm@10.34.6 --call "pnpm start:api"
```

Nie uruchamiać drugiego API na tym samym porcie. Jeden wykonawca obsługuje
API i Metro; aktualna instrukcja startu jest w głównym README. Indeks jest ładowany przy starcie;
gotowość funkcjonalną sprawdza rzeczywisty GET search i POST routes.
`/readyz` nadal sprawdza także PostGIS, którego plikowy prototyp nie wymaga
do obliczeń; brak bazy pozostaje jawny. Nie deklarujemy wdrożenia produkcji.

Backend nie dostarcza prowadzenia GPS, stanu świateł, potwierdzenia
dostępności wejść ani routingu pod każdy adres Krakowa. Główny scenariusz
iPhone/VoiceOver potwierdził użytkownik; pozostały zakres i nowsze zmiany
opisuje [testing.md](testing.md). Testy backendu nie zastępują urządzenia.

## Wyniki odbioru backendu, 2026-10-03

- API 115, ingestion 87, routing 87, contracts 132 — **421 PASS**.
- Strict typecheck i lint czterech pakietów PASS; diff check PASS;
  31 artefaktów kontraktowych zgodnych.
- Skrypt ekstrakcji powtórzony na źródłowym pliku: identyczne bajty raw gzip
  i capture.json, w tym pierwotna data pobrania.
- Prawdziwe HTTP na 3003 i HTTPS przez obecny ngrok: trzy pary wybrane przez
  wyszukiwarkę → odpowiedź routes 200 z prawidłowymi końcami geometrii;
  NO_PATH i NO_MATCHING_ROUTE → 422. [Raport publiczny](../packages/ingestion/data/krakow-prototype/http-public-audit.json).
- Indeks: 100 stałych publicznych zapytań, p50 0,44 ms, p95 9,56 ms,
  max 14,45 ms; inicjalizacja 15,8 s. [Raport](../packages/ingestion/data/krakow-search/search-audit.json).
  To pomiar procesu lokalnego, nie deklaracja opóźnienia aplikacji.
- Testy UI/telefonu i PostGIS nie były częścią tej iteracji B. Nie zmieniano
  apps/mobile, zależności, manifestów ani lockfile; bez commitów i pushów.
