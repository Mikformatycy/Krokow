# Utrzymanie, przenoszenie i skalowanie

Stan: 2026-10-04. **Propozycja dalszego utrzymania**, nie deklaracja działającej usługi lub podpisanej umowy. Prototyp działa lokalnie na archiwach OSM; [start](../README.md). Nie wymaga wewnętrznych systemów UMK/MJO ani ręcznej bazy utrzymywanej przez Miasto.

## Zakres odpowiedzialności

Model obejmuje hosting, aktualizacje, bezpieczeństwo, zgłoszenia i finansowanie. Opis określa wymagane role bez przypisywania ich konkretnemu podmiotowi. Przed publicznym pilotażem pozostaje wskazanie podmiotu odpowiedzialnego za usługę i kontaktu.

| Obszar | Rola | Zakres |
| --- | --- | --- |
| Produkt i finansowanie | Właściciel produktu | Odbiór zakresu, budżet, umowy z partnerami i zastępstwo. |
| Hosting i wydania | Opiekun techniczny | API/web, TLS, aktualizacje z lockfile, monitoring i przywracanie wersji. |
| Dane i topologia | Opiekun danych | Warunki źródeł, import, checksumy, audyt zmian i publikacja archiwum. |
| Bezpieczeństwo | Opiekun techniczny i właściciel produktu | Sekrety poza klientem, zależności, logi proxy/API, retencja i incydenty. |
| Zgłoszenia | Moderator | Prywatny kanał, kontrola dowodów, korekty z historią, odpowiedź zgłaszającemu. |
| Dostępność | Opiekun UX i testerzy | Klawiatura, czytnik, kontrast, powiększenie i konsultacje po istotnej zmianie. |

Jedna osoba może pełnić kilka ról. Kontakty, terminy reakcji i zastępstwa trzeba ustalić przed publicznym pilotażem.

## Stan obecny i proponowane wdrożenie

Dziś: Fastify z grafem i katalogiem w RAM, plikowe archiwa, Expo/web i opcjonalny tunel HTTPS. Nie ma produkcyjnego kontenera API, harmonogramu importu, panelu moderacji, kont ani odebranego odtworzenia usługi. Compose obsługuje tylko lokalną bazę.

Pierwszy pilot: statyczny frontend web i API poza UMK, reverse proxy HTTPS, archiwa tylko do odczytu. Przed udostępnieniem: limity nadużyć/zasobów, redakcja logów proxy, test odtworzenia, kontakt zgłoszeniowy i test czytnika. Metro nie jest docelową usługą.

PostGIS jest przyszłym magazynem obserwacji i historii moderacji. Obecne trasy nie potrzebują bazy, lecz /readyz nadal jej wymaga. Przed wdrożeniem trzeba ustalić właściwe kryterium readiness; /healthz nie sprawdza całej funkcjonalności.

## Aktualizacje i korekty

1. P0: import uruchamiany na żądanie przed pokazem, z zachowaniem źródła, licencji, zapytania, checksum i pierwotnej daty. [Źródła](data-sources.md).
2. Propozycja dla pilota: cotygodniowy przegląd wieku/stanu źródeł. Częstotliwość pobierania dopasować do warunków dostawcy i rozmiaru obszaru; harmonogram nie działa obecnie.
3. Nowy eksport trafia do stagingu. Sprawdzamy referencje, poziomy, dostęp, graf, liczby obiektów i zmianę pokrycia. Podejrzany ubytek/topologia zatrzymuje publikację.
4. Przed publikacją: testy ingestion/routing/API/kontraktów oraz rzeczywiste pary demonstracyjne. Braków nie wypełnia się fikcyjnymi udogodnieniami.
5. Loader ma przypięte ścieżki i checksumy. Nowa wersja wymaga kontrolowanej zmiany kompletu archiwów/metadata i restartu API. Wskaźnik stagingu importera nie publikuje automatycznie grafu do runtime.
6. Awaria pozostawia ostatnie dobre dane z niezmienioną datą. Bez poprawnego katalogu/grafu — jawny błąd, bez synthetic fallbacku.
7. Przed pilotażem należy udostępnić prywatny formularz/adres zgłoszeń. Minimalny zakres: obiekt, cecha, opis, data obserwacji; bez diagnozy i historii GPS. Kanał nie został jeszcze uruchomiony.
8. Moderator odróżnia ostrzeżenie od potwierdzenia. Konflikt pozostaje do udokumentowanej decyzji. Resolver już obsługuje zastąpienie obserwacji z audytem; [reguły](b03-evidence.md). Ponowny import nie jest kontrolą terenową.

## Koszty i finansowanie

Robocza koperta małego pilota: **200–500 PLN/miesiąc na infrastrukturę**, do przeliczenia według ofert przed wyborem dostawcy. To założenie planistyczne, nie cennik ani gwarancja.

| Pozycja | Sposób oszacowania |
| --- | --- |
| API/web, dysk i transfer | W kopercie infrastruktury; zmierzyć RAM indeksu, eksporty i ruch. |
| Kopie, monitoring, domena/TLS | Uwzględnić przechowanie wcześniejszych wersji i transfer. |
| Wsparcie, aktualizacje i moderacja | Osobno: roboczo 8–16 h/mies. małego pilota razy uzgodniona stawka; zweryfikować po miesiącu, bez deklaracji SLA. |
| Konsultacje i teren | Osobne sesje, dojazdy i wynagrodzenia; nie zakładać darmowej pracy. |
| Incydenty i rozwój | Osobna rezerwa w budżecie utrzymania. |

Proponowane finansowanie dalszego rozwoju i utrzymania: płatne pilotaże dla hoteli, organizatorów wydarzeń i zarządców obiektów. Podstawowe planowanie indywidualne pozostaje proponowaną bezpłatną funkcją. Partner płaci za widget/opis dojścia, integrację i aktualizacje, nie za ranking tras. Nie ma potwierdzonych umów ani przychodu; Miasto nie jest domyślnym płatnikiem.

## Przeniesienie na inną infrastrukturę

1. Przekazać kompletną wersję kodu, lockfile i archiwa krakow-prototype/krakow-search z capture.json/atrybucją. Rozstrzygnąć licencję własnego kodu; [zależności](dependencies.md). Zdalny HEAD może nie zawierać lokalnych zmian.
2. Node 24.21.0/pnpm 10.34.6, instalacja z lockfile i kontrole z README. Nie potrzeba konta OSM ani prywatnych systemów Miasta.
3. Ustawić API_DATA_MODE, API_HOST, API_PORT, API_ALLOWED_ORIGINS i EXPO_PUBLIC_API_URL. Adres klienta jest wbudowany w eksport; po zmianie ponowić eksport web.
4. Frontend udostępnić przez serwer statyczny obsługujący strony eksportu Expo, API przez HTTPS/proxy. Gotowy obraz deploymentu jeszcze nie istnieje; odbiorca przygotowuje proces, proxy i automatyczny start.
5. Sprawdzić health, coverage, Pawia 5, realną trasę, NO_PATH, NO_MATCHING_ROUTE i logi.
6. Zachować poprzedni komplet kodu/archiwów. Proponowane kopie: przy każdym wydaniu/zmianie danych, po dodaniu bazy codziennie; okresowy test odtworzenia. Procesy te nie są obecnie uruchomione.
7. Odebrać migrację z drugą osobą. Nie kopiować tokenów laptopa ani traktować domeny ngrok jako stałej zależności produktu.

Nie jest to dowód wykonanego wdrożenia na innym hostingu. Konfiguracja PostgreSQL w API/infra dopuszcza dziś lokalny host; zewnętrzna baza wymaga zmiany konfiguracji, TLS i testów.

## Miasto, źródło lub kategoria

Dodanie miasta wymaga pracy programistycznej, nie samej zmiany nazwy:

1. Wybrać potrzeby, mały obszar i publiczne źródła; osobno nazwy/adresy i infrastruktura.
2. Dodać loader/obszar/katalog w ingestion i zastąpić wybór Krakowa w apps/api/src/main.ts rejestrem miast.
3. Usunąć stałe cityId w apps/mobile/src/features/planning/searchCatalog.ts; sprawdzić wiązanie cityId/placeId po obu stronach kontraktu.
4. Kategorię wyszukiwania dodać w mapowaniu tagów/aliasów city-catalog i place-index oraz fixtures. Kategoria nazwy nie daje faktów o dostępności.
5. Źródło faktów potrzebuje adaptera, provenance, zakresu obiektu/strony/kierunku/poziomu i reguł konfliktu. Nowa cecha poza słownikiem wymaga wersji kontraktu, UI, normalizacji i testów.
6. Zbudować graf z udokumentowanej topologii, wykonać audyt pokrycia i lokalną walidację.
7. Zmierzyć czas wczytania, RAM, p95 odpowiedzi i limity. Większy obszar może wymagać trwałego indeksu/workera; nie zakładamy liniowej skalowalności.
8. Udostępnić ograniczony podgląd z lukami, testami czytnika i opiekunem danych. GPS/teren to osobny zakres odbioru.

## Opcjonalny lokalny PostGIS

Development, nie wymóg demo. Docker Linux, własny .env na podstawie .env.example (bez nadpisania istniejącego), następnie:

```sh
pnpm db:config
pnpm db:up
pnpm db:check
pnpm test:db
pnpm db:stop
```

Compose wiąże port na loopback i zachowuje wolumen. Nie istnieją db:migrate/data:seed:demo. W tej iteracji nie uruchamiano bazy ani migracji.
