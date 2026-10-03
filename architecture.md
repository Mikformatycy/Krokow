# Architektura - Kroków

**Wersja specyfikacji:** 1.0, 2026-10-03. **Status:** projekt do implementacji. **Zespół:** dwie osoby; Codex wspiera frontend, Claude Code backend. **Pierwszy obszar:** mały, jawnie ograniczony fragment Krakowa, wybrany po audycie danych.

Wymagania organizatora pochodzą z załączonego briefu [B01]. Szczegółowe decyzje techniczne, współczynniki, limity i harmonogram poniżej są propozycją projektową, nie wymaganiami Miasta ani wynikiem walidacji terenowej. Źródła S01-S17 rozwinięto w `docs/sources.md`.

## 1. Produkt i granica odpowiedzialności

Użytkownik wybiera start, cel i preferencje. Aplikacja przedstawia do trzech rzeczywiście różnych tras, różnice w długości oraz listę infrastruktury i niewiadomych. Potrafi odczytać cały plan lub następny odcinek. Dłuższa trasa może wygrać, gdy lepiej odpowiada preferencjom albo prowadzi przez lepiej opisane przejścia.

Rozdzielamy trzy pytania: **czy dana infrastruktura jest opisana w danych, na ile aktualny/wiarygodny jest ten opis i czy dana trasa odpowiada preferencjom?** Żaden z tych wyników nie jest prawdopodobieństwem bezpiecznego dotarcia.

### Zakres wydań

| Zakres | P0: demonstrator konkursowy | P1: pilotaż techniczny | Po walidacji |
| --- | --- | --- | --- |
| Obszar | Jeden mały obszar, katalog sprawdzonych punktów | Ten sam obszar + rozszerzony audyt | Kolejne obszary przez konfigurację miasta |
| Trasy | Planowanie, alternatywy, tekst, odsłuch | To samo + prowadzenie foreground | Rozbudowany silnik i nawigacja w tle |
| Dane | Wersjonowany snapshot OSM; jawne braki; synthetic tylko dla testów/demo | Obserwacje terenowe, moderowane zgłoszenia | Uzgodnione źródła partnerów i regularna weryfikacja |
| Lokalizacja | Opcjonalne pokazanie pozycji; bez obietnicy prowadzenia | Eksperymentalne dopasowanie GPS przy aktywnym ekranie | Development build, testy tła i cyklu życia |
| Konto | Brak | Nadal niepotrzebne do planowania | Tylko po wykazaniu potrzeby |
| Offline | Otwarty zapis planu + etykieta wieku, bez nowych tras | To samo | Osobny projekt danych i routingu offline |

Nie budujemy wykrywania przeszkód z kamery, stanu świateł, rozpoznawania pojazdów, nawigacji wewnątrz budynków, multimodalności ani asystenta LLM. TTS nie jest generatywnym modelem. Opis infrastruktury nie oznacza, że urządzenie jest obecnie sprawne. Aplikacja nie zastępuje laski, psa przewodnika ani samodzielnej oceny sytuacji.

## 2. Główny przepływ

```text
OSM snapshot       obserwacje terenowe       zgłoszenia użytkowników
     |                     |                         |
     +----- adaptery ------+               moderacja / odrzucenie
                  |                                  |
        surowe dane + pochodzenie <-------------------+
                  |
        normalizacja faktów i topologii
                  |
        walidacja, wersjonowanie, atomowa publikacja
                  |
          PostgreSQL + PostGIS
                  |
        aktywny snapshot grafu i faktów
                  |
      Fastify API / RoutePlanner / EvidenceResolver
                  |
       wspólny kontrakt JSON / Zod / OpenAPI
                  |
     aplikacja Expo: porównanie -> szczegóły -> odsłuch
                  |
      P1: lokalny kontroler pozycji i komunikatów
```

Pozyskiwanie danych jest oddzielone od prezentacji, zgodnie z briefem [B01, s. 3]. Import uruchamia operator lub harmonogram. Zapytanie o trasę **nigdy** nie czeka na Overpass, nie scrapuje portalu i nie odpytuje systemów wewnętrznych Miasta.

## 3. Stack i granice modułów

### 3.1. Frontend

React Native + Expo Router + TypeScript. `expo-location` dla pozycji na pierwszym planie; `expo-speech` dla odsłuchu; `expo-haptics` opcjonalnie jako uzupełnienie. `react-native-maps` wyłącznie jako natywna, dodatkowa wizualizacja, nie jako interfejs obowiązkowy. Biblioteka jest dostępna w Expo Go, ale wydanie własnego binarium wymaga osobnego sprawdzenia konfiguracji dostawcy map [S06].

Stan zapytań: TanStack Query lub prosty, wspólnie wybrany adapter; stan sesji nawigacyjnej: lokalny reducer ze skończonymi stanami. Nie wprowadzamy kilku globalnych store'ów. Preferencje i jeden ostatni plan mogą być zapisane lokalnie; zapisywanie planu jest jawne i odwoływalne. Pozycje GPS nie są zapisywane w historii.

`RouteApi` ma dwie implementacje: `MockRouteApi` dla developmentu i demo synthetic oraz `HttpRouteApi` dla API. Obie walidują ten sam format. Brak API nie powoduje automatycznego przełączenia na fikcyjne wyniki.

### 3.2. Backend

Jeden proces HTTP Fastify oraz komendy importu/moderacji z tego samego codebase'u. PostgreSQL/PostGIS przechowuje dane przestrzenne, ich pochodzenie i wersje. Zwykłe SQL z parametrami przez `pg`, numerowane migracje; nie dodajemy ORM wymagającego obchodzenia typów geometrii. Zod jest kanonicznym schematem API. Integrację Fastify-Zod trzeba przypiąć do zgodnych wersji i przetestować; aktualna dokumentacja pokazuje `@fastify/type-provider-zod` wraz z kompilatorami walidacji i serializacji [S15].

Zod może eksportować JSON Schema, ale nie każdy typ/transformacja ma odpowiednik JSON [S16]. Kontrakty wire nie używają transformacji, dat jako obiektów ani typów zależnych od platformy. OpenAPI i klient typowany są pochodnymi schematów, a nie drugim ręcznie pisanym kontraktem.

### 3.3. Routing

W P0/P1 mały moduł TypeScript: graf skierowany, Dijkstra, kilka konfiguracji kosztu i ograniczone generowanie alternatyw. Pozwala to testować i wyjaśniać każdą decyzję. Nie zakładamy, że zwykła trasa piesza z zewnętrznego API automatycznie uwzględnia sygnalizację dźwiękową. Samo ocenienie trzech tras dostarczonych przez obcy silnik może pominąć trasę istotną dla profilu.

`RoutePlanner` jest interfejsem, aby później wymienić implementację na silnik obsługujący większy obszar i własne koszty. Nie uruchamiamy od razu kilku routerów, Kafki, Redis, Kubernetes ani wektorowej bazy.

## 4. Docelowa struktura repozytorium

```text
apps/
  mobile/
    src/app/                 # Expo Router; cienkie ekrany
    src/features/            # search, preferences, routes, navigation, reports
    src/adapters/            # api, speech, location, storage, maps
    src/components/          # dostępne kontrolki
  api/
    src/http/                # walidacja, statusy, prezentery
    src/services/            # use cases
    src/repositories/        # SQL i wczytywanie snapshotów
    src/cli/                 # import, moderacja, publikacja wersji
    migrations/
packages/
  contracts/src/             # kanoniczne schematy i inferowane typy
  routing/src/               # graf, koszty, alternatywy, wyjaśnienia
  ingestion/src/             # adaptery, normalizacja, kontrola topologii
  fixtures/                  # własne synthetic; oddzielnie jawne snapshoty
infra/
  compose.yaml               # lokalna baza; do utworzenia
  deployment/                # Docker, TLS, kopie, health checks
examples/                    # przykłady kontraktu, nie prawdziwe dane miasta
prompts/                     # prompty startowe
references/brief.pdf         # oryginalny załącznik
```

Reguły zależności: `mobile -> contracts`; `api -> contracts, routing, ingestion`; `routing -> contracts` tylko dla neutralnych DTO lub przez mapowanie. `contracts` nie importuje aplikacji ani modułów Node-only. Backend nie importuje mobilnych szablonów UI. Testy importu nie wymagają startu Expo.

## 5. Model danych

### 5.1. Obiekty i wersje

| Encja | Najważniejsze pola i reguły |
| --- | --- |
| `city` | `id`, nazwa, polygon pokrycia, bbox importu z buforem, strefa czasowa, aktywne źródła. |
| `source` | `id`, rodzaj, URL/rejestr, warunki/licencja, atrybucja, częstotliwość, stan pobierania. Nie ma globalnego "pewne". |
| `import_run` | wersja adaptera, checksum, start/koniec, wynik, odrzucone rekordy, błąd i ostatni sukces. |
| `raw_record` | źródło + zewnętrzny identyfikator + wersja + surowe tagi + `fetchedAt`. Idempotencja importu. |
| `graph_version` | `id`, obszar, topologia, liczniki, raport QA, `publishedAt`, status draft/active/retired. |
| `node` | ID, `graphVersion`, Point 4326, poziom, typ, powiązanie z OSM; poziom nie jest wnioskowany z odległości. |
| `edge` | ID, `from`, `to`, `graphVersion`, LineString 4326, `lengthM`, rodzaj, dostęp pieszy, kierunkowość, powiązania faktów. |
| `crossing_stage` | pojedynczy etap przejścia, `crossingId`, wejście/wyjście, kierunek, przypisanie do traversal edge. Wyspa oznacza osobne etapy. |
| `observation` | obiekt, klucz faktu, wartość, zakres strony/kierunku/poziomu, źródło, daty, status moderacji, dowód, opcjonalne wygaśnięcie. |
| `resolved_fact` | wynik deterministycznej polityki z `evidenceVersion`, referencje do obserwacji, stan i świeżość. Nie nadpisuje historii. |
| `place` | punkt docelowy i opcjonalnie sprawdzone wejście związane z węzłem; środek budynku to nie to samo co wejście. |
| `report` | kategoria, wskazany obiekt, komentarz, czas, status, lokalny receipt; brak diagnozy, brak publicznego profilu autora. |

Geometria jest zapisywana w WGS84, kolejność GeoJSON `[lng, lat]`. Długości obliczamy przez geografię PostGIS albo jedno ustalone, testowane przeliczenie metryczne, nie przez odległość euklidesową w stopniach. Każda krawędź ma skończoną dodatnią długość. Indeksy: przestrzenny na geometrii, B-tree na wersjach, endpointach i identyfikatorach źródeł. Obiekty OSM identyfikujemy przez parę `type/id`, ponieważ node i way mogą mieć ten sam numer.

### 5.2. Fakt i brak wiedzy

```ts
type Fact<T> =
  | { state: 'known'; value: T; evidenceIds: string[];
      reliability: 'field_verified' | 'source_declared' | 'community_mapped';
      freshness: 'recent' | 'stale' | 'unknown';
      observedAt: string | null; verifiedAt: string | null }
  | { state: 'unknown'; reason: 'missing' | 'ambiguous_scope' | 'unsupported_value';
      evidenceIds: string[] }
  | { state: 'conflicting'; evidenceIds: string[]; summaryCode: string };
```

To ilustracja semantyki; pełny schemat i pola wspólne implementuje F-02. `known(false)` oznacza zapisany brak danego udogodnienia, nie brak rekordu. Sprzeczność ma referencje do obu stanowisk. Świeżość nie jest tym samym co wiarygodność: stara obserwacja terenowa może być dobrze udokumentowana, ale nieaktualna.

Pierwsze klucze: `audible_signal`, `traffic_signals`, `tactile_paving`, `steps`, `handrail`, `separated_footway`, `shared_cycle_path`, `surface`, `temporary_obstruction`. Nie wszystkie są boolean. `tactile_paving` przyjmuje `yes/no/partial/incorrect`; `surface` ma słownik z kategorią nierozpoznaną. Wartość nieobsługiwana nie jest przekształcana na `false`.

Obserwacja punktowych oznaczeń dotykowych nie dowodzi istnienia ciągłej ścieżki prowadzącej. Położenie przycisku "po lewej" można wypowiedzieć wyłącznie przy znanej stronie i kierunku podejścia. GPS ani ogólny tag ulicy nie wystarczają.

### 5.3. Znaczenie czasu

`fetchedAt` = pobrano rekord. `sourceModifiedAt` = zmieniono rekord źródłowy. `observedAt` = ktoś zaobserwował dany fakt. `verifiedAt` = uprawniona osoba potwierdziła konkretny fakt w konkretnym zakresie. `validUntil` = udokumentowane lub polityką ograniczone okno ważności zdarzenia. Brak każdej z dat pozostaje jawny.

Edycja nazwy ulicy w OSM nie odświeża informacji o akustyce. Kolejny import nie odmładza danych. Dla zdarzeń czasowych wygaśnięcie raportu nie oznacza dowodu, że przeszkoda została usunięta; oznacza, że nie ma aktualnej obserwacji.

## 6. Wiarygodność i rozstrzyganie sprzeczności

Resolver porównuje tylko obserwacje o tym samym obiekcie, kluczu, kierunku, stronie i zgodnym oknie czasu. Najpierw odrzuca rekordy błędne i odrzucone przez moderację, potem identyfikuje niezależne pochodzenie; dwie kopie tego samego rekordu OSM nie są dwoma potwierdzeniami.

Nowe zgłoszenie użytkownika nie jest samo w sobie weryfikacją terenową. Przed dopuszczeniem do publikacji jest widoczne tylko zgłaszającemu i moderatorowi. Moderator może dopuścić ostrzeżenie jako **niezweryfikowane**, potwierdzić je na podstawie dowodu lub odrzucić. Dopuszczenie do publikacji nie jest potwierdzeniem faktu.

Dopuszczona, wiarygodnie przypisana sprzeczna obserwacja skutkuje `conflicting`/ostrzeżeniem, a nie uśrednieniem `true` i `false`. Ponowna, udokumentowana weryfikacja może zamknąć konflikt, ale musi zachować audyt i wskazać zastąpione obserwacje. Sama nowsza data ani status "oficjalny" nie wystarczają do przemilczenia sprzeczności.

Polityka świeżości jest konfiguracją. Wartości startowe do walidacji: 180 dni dla obserwacji stałej infrastruktury, 7 dni dla historycznej obserwacji działania sygnalizatora, 48 godzin dla niepotwierdzonego zgłoszenia przeszkody. **Nawet obserwacja działania sprzed minuty nie uprawnia do komunikatu o obecnym stanie świateł.** W MVP routing opiera się na obecności infrastruktury, nie operacyjnym statusie urządzenia.

Metryki trasy są jawne: liczba etapów przejść z informacją o akustyce, bez takiej informacji, z zapisem braku i z konfliktem; metry odcinków o nierozpoznanych istotnych cechach. Nie pokazujemy procentowego "bezpieczeństwa". Gdy brak mianownika, wskaźnik kompletności ma `null`, nie 100%.

## 7. Budowa grafu pieszego

### 7.1. Minimalna topologia

Graf zawiera chodniki/ścieżki i fizyczne połączenia, a nie tylko osie ulic. Dwie strony jezdni są odrębne. Przejście jest jawnym łącznikiem między odpowiednimi stronami; wyspa może dzielić je na etapy. Geometrie przecinające się na rysunku nie tworzą automatycznie wspólnego węzła. Mosty, tunele i poziomy wymagają zgodności topologicznej.

Importer P0 przyjmuje jawne `footway`, `path`, `pedestrian`, `steps` i połączenia przejść po sprawdzeniu dostępu. Drogi dla pojazdów mogą być pobrane jako kontekst, ale nie stają się automatycznie bezpiecznymi krawędziami pieszymi. Generowanie dwóch wirtualnych chodników z tagu `sidewalk=both` jest poza P0: wymaga poprawnej topologii skrzyżowań.

Respektujemy `foot`, `access`, bariery, zamknięcia, jawne ograniczenia i pieszy kierunek. Sam samochodowy `oneway` nie oznacza jednokierunkowego chodnika. Wątpliwe lub nieobsługiwane warunki dostępu nie są zgadywane; są odrzucone z grafu pilotażu lub oznaczone do przeglądu.

Punkt `highway=crossing` umieszczony na osi jezdni nie może spowodować, że koszt przejścia będzie naliczany osobie idącej równolegle chodnikiem. Fakty o przejściu przypisujemy do odpowiedniej traversal edge/etapu. Dopasowanie samego najbliższego punktu jest niewystarczające.

### 7.2. Końce trasy

P0 wybiera start i cel z katalogu punktów przypisanych do grafu, najlepiej przy rzeczywistym wejściu. To ogranicza ryzyko fikcyjnych łączników. Ręcznie wpisany adres spoza katalogu ma stan "poza zakresem pilotażu", nie trasę do centroidu budynku.

P1 może przyjąć bieżącą pozycję, ale dopasowanie odbywa się do krawędzi pieszej, nie najbliższego dowolnego węzła. Wirtualny węzeł może rozciąć jedną krawędź na dwa fragmenty; nie może łączyć przeciwnych chodników. Przy niejednoznaczności strony aplikacja prosi o wybór znanego punktu/odcinka i nie twierdzi, że zna stronę ulicy. Brak wiarygodnego łącznika to `UNRESOLVED_ENDPOINT`.

### 7.3. Ograniczenie obszaru

P0 celuje w graf do około 2 000 skierowanych krawędzi, z 5-10 punktami start/cel i kilkoma sensownymi alternatywami. To budżet implementacyjny, nie potwierdzona liczba danych Krakowa. Obszar publikacji mieści się wewnątrz bbox pobierania z buforem, aby granica importu nie ucinała oczywistych obejść. UI pokazuje granice pilotażu.

Brak ciągłej topologii oznacza brak znanej trasy. Nie naprawiamy go automatyczną kreską przez jezdnię. Przegląd topologii wykonuje zespół/operator, nie Miasto.

## 8. Algorytm tras i alternatyw

### 8.1. Preferencje i twarde ograniczenia

Użytkownik wybiera preferencje, nie diagnozę: preferuj akustykę, oznaczenia dotykowe i oddzielne ciągi piesze; ewentualnie pomijaj odcinki **oznaczone jako schody**; określ dopuszczalną długość objazdu.

Twarda opcja `audibleRequirement` ma trzy wartości: `none`, `documented` i `field_verified_recent`. Druga dopuszcza tylko etapy z jednoznacznym `known(true)` bez konfliktu; trzecia dodatkowo wymaga weryfikacji terenowej w ustalonym oknie. Brak lub stary/niedostateczny dowód nie jest spełnieniem wymagania. Nazwy w UI muszą wyjaśniać tę różnicę.

`avoidKnownSteps=true` usuwa krawędzie zapisane jako schody, ale nie daje gwarancji trasy bez schodów w niekompletnych danych. Nie nazywamy tej opcji "trasa bez schodów". Potwierdzone bieżące zamknięcie i brak dostępu pieszego zawsze wykluczają krawędź.

### 8.2. Koszt addytywny

Dla dopuszczalnej krawędzi koszt jest sumą długości i nieujemnych kar wyrażonych w umownych metrach:

```text
cost(edge, profile) = lengthM
  + lengthM * separatedFootwayPenalty
  + lengthM * unknownSegmentFactsPenalty
  + sum(crossingStagePenalties assigned to this edge)
  + sum(other single-occurrence event penalties)
```

Kary zależne od odcinka są proporcjonalne do długości. Kary przejścia są liczone dokładnie raz na traversal danego etapu, niezależnie od liczby punktów geometrii. Dzielenie krawędzi nie zmienia całkowitego kosztu, metryk ani liczby ostrzeżeń. Nie stosujemy ujemnych nagród za udogodnienia, bo psują założenia i mogą premiować pętle.

Przykładowe kary **tylko do synthetic testu** dla profilu preferującego akustykę: 40 za etap z informacją o obecności, 300 za znany brak, 400 za brak wiedzy, 500 za konflikt. To parametry ilustracyjne, nie naukowa ocena ryzyka. Ich kalibrację ustalamy z użytkownikami. Krótsza trasa może nadal wygrać, gdy różnica cech jest niewielka.

| Synthetic wariant | Dystans | Etapy przejść | Akustyka | Koszt ilustracyjny |
| --- | ---: | ---: | --- | ---: |
| A | 740 m | 3 | 1 obecna, 1 brak, 1 niewiadoma | 740 + 40 + 300 + 400 = 1480 |
| B | 980 m | 3 | 3 obecne | 980 + 3 * 40 = 1100 |
| C | 1120 m | 1 | 1 obecna | 1120 + 40 = 1160 |

W tym konkretnym teście A jest najkrótsza, B rekomendowana według profilu, C ma mniej przejść. Nie są to dane o rzeczywistym Krakowie. Przy prędkości założonej 1,2 m/s różnica A-B to ok. 3,3 min samego marszu; nie znamy czasu czekania na światłach.

### Konfiguracja startowa dla implementacji P0/P1

Własny plik `packages/routing/src/policy/default.ts` ma zawierać wszystkie parametry. Poniższy `pilot-v1` jest **hipotezą do kalibracji**, nie modelem ryzyka. Synthetic fixture używa oddzielnej polityki `synthetic-acoustic-v1`, w której pozostałe kary są wyłączone; dlatego jego arytmetyka pozostaje dokładnie taka jak w tabeli A/B/C.

| Składnik profilu preferencji | Startowa kara w umownych metrach |
| --- | --- |
| Każdy etap przejścia | 40, niezależnie od liczby punktów geometrii. |
| Akustyka, gdy preferowana | Dodatkowo: obecna 0, zapisany brak 260, unknown 360, conflicting 460. |
| Dotyk, gdy preferowany | `yes` 0, `no` 40, `partial` 60, `incorrect` 100, unknown 60, conflicting 100. |
| Oddzielny ciąg pieszy, gdy preferowany | Dodatkowo 0,35 * metry dla znanego braku oddzielenia; 0,10 * metry dla unknown; 0 dla znanego oddzielenia. Nie zakładamy tej cechy na podstawie samej nazwy drogi. |
| Wiek znanego, używanego faktu przejścia | Dodatkowo 80 za stale albo 40 za unknown freshness; nie naliczaj tej samej niewiadomej ponownie, jeżeli cały fakt ma stan unknown/conflicting. |

Profil wyszukiwania **najkrótszego** używa wyłącznie długości po odrzuceniu krawędzi niedopuszczalnych. Dodatkowy profil generowania **lepiej udokumentowanych** kandydatów używa długości + 400 za istotny fakt przejścia unknown + 600 za conflicting + 120 za znany stale + 60 za znany fakt bez daty obserwacji + 0,20 * metry odcinka bez danych o oddzieleniu. Nie dodaje automatycznie wszystkich kar profilu preferencji. Istotne fakty to akustyka/dotyk włączone przez preferencje oraz fakty wymagane twardo.

Finalna rekomendacja wynika z kosztu **profilu preferencji** wśród znalezionych dopuszczalnych tras, nie z samej kompletności danych. Parametry muszą być identyczne w obliczeniu, wyjaśnieniu i testach. Zmiana wagi wymaga nowej `policyVersion` i regresji synthetic oraz real pilot; nie zmieniamy jej po cichu, aby wybrana trasa wyglądała lepiej na prezentacji.

### 8.3. Procedura wyszukiwania

1. Waliduj obszar, endpointy, preferencje i dostępny snapshot. Przypnij `graphVersion`, `evidenceVersion`, `policyVersion` oraz jeden `asOf` dla całego obliczenia.
2. Usuń krawędzie niedopuszczalne. Policz Dijkstrą najkrótszą trasę w **tym samym grafie spełniającym twarde ograniczenia**. To punkt odniesienia dla objazdu, nie uniwersalnie najkrótsza droga w mieście.
3. Policz minima dla kosztu preferencji i kosztu niekompletności. Dodaj ograniczoną liczbę bezpętlowych kandydatów (np. Yen, do 12 łącznie) z deterministycznym rozstrzyganiem remisów przez ID krawędzi.
4. Sprawdź każdego kandydata ponownie: topologia, kierunek, dostęp, twarde wymagania, maksymalny objazd. `maxDetourRatio` domyślnie 1,6 ogranicza alternatywy względem najkrótszej dopuszczalnej; nie luzuje wymagań.
5. Usuń duplikaty sekwencji traversal edges oraz praktycznie identyczne warianty. Podobieństwo licz po wspólnej długości fizycznych segmentów, nie liczbie punktów geometrii. Wstępny próg 85% jest parametrem do testów, nie powodem do ukrycia istotnej różnicy przejścia.
6. Zwróć do trzech opcji. Przy limicie co najmniej dwóch opcji zachowaj najkrótszą dopuszczalną i najlepszy znaleziony koszt profilu; trzecią wybierz z niedominowanych, istotnie innych kompromisów. Dla `maxAlternatives=1` zwróć rekomendację. Odpowiedź zawsze zawiera osobny `baseline` najkrótszej dopuszczalnej trasy, nawet gdy nie jest ona pokazana. Jedna trasa może mieć kilka etykiet. Nie wypełniaj trzech kart kopiami tej samej drogi.
7. Uzasadnij wynik liczbami i referencjami do faktów: +240 m, mniej etapów o nieznanej akustyce, określone udogodnienia. "Lepiej udokumentowana" nie oznacza "bardziej dostępna".

Generowanie ograniczonej liczby kandydatów nie gwarantuje globalnie najlepszego wariantu we wszystkich kryteriach. UI mówi "najlepiej dopasowana spośród znalezionych". Wyczerpanie budżetu obliczeń nie jest dowodem, że trasa nie istnieje. Po znalezieniu poprawnej trasy można zwrócić wynik częściowy z ostrzeżeniem; przed jej znalezieniem zwracamy `SEARCH_LIMIT_REACHED`. Dokładne znaczenie błędów określa kontrakt.

### 8.4. Czas i testowalność

`walkingDurationSec = distanceM / assumedWalkingSpeedMps` opisuje tylko model marszu. Brak danych o oczekiwaniu daje `crossingWaitDurationSec=null`. Nie obiecujemy precyzyjnego czasu przybycia. Koszt routingu nie jest czasem i nie może być wyświetlany jako ETA.

Cel wydajności P0: p95 odpowiedzi poniżej 1 s na ustalonym grafie testowym po wczytaniu do pamięci; budżet wyszukiwania 2 s. To kryteria odbioru do zmierzenia. Przy przekroczeniu oddzielamy obliczenia do worker thread lub ograniczamy obszar, zamiast blokować event loop i ukrywać timeouty.

## 9. Import i publikacja danych

Podstawą P0 jest publiczny, ograniczony przestrzennie snapshot OSM, nie niezweryfikowana obietnica miejskiego API. OSM ma tagi dotyczące akustyki i oznaczeń dotykowych, ale ich istnienie w modelu nie dowodzi kompletności w Krakowie [S11, S12]. Rejestr źródeł i wzór pobrania: `docs/data-sources.md`.

Pipeline: pobierz -> zapisz raw/checksum/licencję -> znormalizuj -> zbuduj graf -> rozwiąż fakty -> testy integralności i pokrycia -> publikacja transakcyjna. Klient dostaje jeden spójny zestaw wersji; bieżąca sesja nie miesza nowych faktów ze starymi offsetami geometrii.

Importy są idempotentne po źródle, identyfikatorze i wersji. Błąd/429/timeout uruchamia ograniczone ponowienia z backoffem, nie serię żądań do kolejnych serwerów. Zachowujemy ostatni dobry snapshot. Bez niego `SOURCE_UNAVAILABLE`, bez automatycznego przełączenia na demo. Zmiana znacznej liczby krawędzi lub gwałtowny spadek pokrycia blokuje publikację do przeglądu.

P0: import na żądanie przed prezentacją. P1: proponowany harmonogram dobowy małego obszaru, po sprawdzeniu zasad wybranego endpointu i obciążenia [S13]. Status dostawcy, wiek snapshotu i wiek obserwacji to trzy osobne informacje.

## 10. UX i komunikaty

Główny przebieg: **start/cel -> preferencje -> porównanie tras -> szczegółowy plan -> odsłuch/symulacja -> P1 prowadzenie foreground**. Każdy ekran ma loading, empty, error, stale i synthetic tam, gdzie to dotyczy.

Karta trasy odczytuje kolejno: wyróżnik, długość, orientacyjny czas samego marszu, istotne różnice, niewiadome i akcje. Szczegóły mają listę odcinków i zdarzeń, a przy każdym fakcie przycisk "Źródło i aktualność". Mapa nie zawiera unikalnej informacji niedostępnej tekstowo.

Dwie warstwy treści: krótki komunikat w ruchu i pełne wyjaśnienie na żądanie. Przykład: "Zbliżasz się do przejścia. W danych zapisano sygnalizację dźwiękową. Aplikacja nie zna aktualnego stanu świateł." Dla braku: "Brak informacji o sygnalizacji dźwiękowej przy tym przejściu." Dla konfliktu: "Informacje o sygnalizacji są sprzeczne. Sprawdź szczegóły."

Wskazanie odległości podczas prowadzenia jest przybliżeniem. Kierunek początkowy bez wiarygodnej orientacji telefonu pozostaje nieustalony. Nie używamy poleceń "trzy kroki w lewo" z GPS ani "przejdź teraz".

### Jeden koordynator mowy

Wykrywamy czytnik przez `AccessibilityInfo` i reagujemy na zmianę stanu [S09]. Przy aktywnym czytniku własny TTS domyślnie nie mówi równolegle; komunikaty idą przez uzgodniony adapter dostępności. Bez czytnika używamy `expo-speech`. Platformy mają różne zachowania kolejkowania, dlatego potrzebne są testy urządzeń. Na fizycznym iPhonie `expo-speech` nie emituje dźwięku w trybie cichym [S05].

Kolejka ma priorytety, deduplikację przez `eventId` i akcje "Powtórz", "Pauza", "Wycisz", "Pokaż szczegóły". Nie zapychamy jej powtarzanymi pozycjami GPS. Haptics oznaczają zdarzenie interfejsu, nie pozwolenie na wejście na przejście. Brak głosu pl-PL skutkuje jawną informacją i pełnym tekstem, nie cichą awarią.

### Dostępność od pierwszego ekranu

Cel rozwoju: WCAG 2.2 AA zgodnie z briefem. Podstawowe wymagania to czytnik, klawiatura, kontrast i alternatywa tekstowa [B01, s. 3-5]. W3C definiuje m.in. kontrast zwykłego tekstu 4,5:1 i powiększanie tekstu do 200% [S10]. Dla aplikacji przyjmujemy dodatkowo wygodne cele dotyku co najmniej 48 jednostek interfejsu; to decyzja UX, nie twierdzenie, że WCAG AA wymaga dokładnie 48.

Expo Web obsługuje ten sam główny scenariusz tekstowy i pozwala wykonać test klawiatury. `Map.web.tsx` nie importuje natywnego modułu. Przejście testu web nie zastępuje VoiceOver/TalkBack na telefonie. Nie deklarujemy zgodności WCAG bez audytu.

## 11. Lokalny kontroler nawigacji P1

```text
idle -> positioning -> preview -> guiding
                     |          |  |  |
                     |          |  |  +-> off_route -> replan_offer
                     |          |  +----> uncertain_position
                     |          +-------> paused
                     +------------------> ended
```

`LocationProvider` emituje timestamp, współrzędne, `accuracy` i opcjonalny heading. `RouteProgressTracker` dopasowuje do bieżącego i kilku następnych odcinków, z uwzględnieniem poprzedniego postępu. Nie przeskakuje na drugą stronę ulicy lub pętli tylko dlatego, że geometria jest blisko. `NarrationScheduler` zmienia zdarzenia w komunikaty. Całość jest testowalna przy użyciu zarejestrowanych, syntetycznych pozycji i wstrzykiwanego zegara.

Parametry do kalibracji, nie gwarancje: pozycja starsza niż 10 s lub deklarowana dokładność gorsza niż 25 m zawiesza precyzyjne komunikaty; kilka kolejnych zgodnych próbek jest wymaganych do wznowienia. Rozważana dewiacja od trasy: ponad `max(25 m, 2 * accuracy)` przez co najmniej 3 próbki i 10 s, wyłącznie przy dostatecznej jakości pozycji. GPS nie potwierdza strony chodnika i nie potwierdza ukończenia przejścia.

Przy przecięciu jezdni nie wyzwalamy automatycznego "przechodź". W okolicy przejścia odczytujemy informacje, nie zgodę na ruch. Wątpliwość zatrzymuje instrukcje zależne od pozycji. Wyjście z trasy daje ofertę ponownego obliczenia, a nie automatyczny zwrot w potencjalnie niewłaściwym miejscu. Powrót do aplikacji wymaga ponownego ustalenia pozycji.

Zmiana `AppState` na nieaktywny zatrzymuje sesję w prototypie. Nie obiecujemy, że komunikat ostrzegający zdąży zostać odtworzony przy blokowaniu telefonu: ograniczenie musi być wyjaśnione **przed** startem. `watchPositionAsync` służy aktualizacjom foreground; konfiguracja tła jest innym zakresem [S04]. Ostatni plan można przeglądać bez sieci, ale nie jest to offline rerouting.

## 12. Awaria, cache i wersje

Nie cache'ujemy na backendzie pełnych tras z prywatnymi punktami startu. Cache w RAM obejmuje graf/fakty i publiczny katalog miejsc. `POST /v1/routes` zwraca `Cache-Control: no-store`. Aktywna sesja przechowuje odpowiedź lokalnie, jawnie z czasem i wersją.

Awaria sieci: zachowaj otwarty plan, pokaż wiek i ograniczenia, nie odświeżaj fikcyjnie obserwacji. Brak danych o nowej przeszkodzie nie oznacza braku przeszkody. Nowej trasy offline nie wyznaczamy. Awaria dostawcy przy dostępnym snapshotcie: wynik z ostrzeżeniem o stanie źródła; bez snapshotu: kontrolowany błąd. Stary snapshot może pozostać w podglądzie, ale dopuszczenie do trybu P1 określa oddzielna, jawna polityka wieku.

Zmiana wersji danych nie zmienia geometrii pod użytkownikiem. Po wykryciu nowej wersji aplikacja proponuje odświeżenie planu; zgoda prowadzi do nowego obliczenia. W P0/P1 nie oferujemy gwarantowanych ostrzeżeń live ani push o każdej zmianie infrastruktury.

## 13. Prywatność i bezpieczeństwo techniczne

Profil preferencji nie zawiera diagnozy. Planowanie bez konta. GPS przetwarzany lokalnie; do API trafiają tylko dane konieczne do obliczenia nowej trasy, nie strumień pozycji. Produkcyjne połączenia przez HTTPS. Origin/cel w treści POST, nie w URL logowanym przez proxy. Wyłączamy logowanie body oraz sanitujemy błędy, telemetrykę i proxy access logs.

Zgłoszenia P1: maks. 500 znaków, kategoria i obiekt, bez zdjęć na starcie. Brak danych kontaktowych w publicznym wyniku. Rate limiting i walidacja zakresu; przykładowe limity startowe to 30 tras/min i 3 zgłoszenia/10 min na kontrolowany identyfikator ograniczający nadużycia. Nie traktujemy publicznego tokenu aplikacji jako zabezpieczenia administratora.

Moderacja przez CLI/operatora; osobne uprawnienia, audyt decyzji, brak sekretu w buildzie. SQL parametryzowany. Zewnętrzne URL źródeł nie są dowolnie pobierane na żądanie klienta: allowlist adapterów i limity odpowiedzi chronią przed SSRF. Komentarze są zwykłym tekstem, nie HTML/instrukcjami.

Proponowana retencja do uzgodnienia przed publicznym pilotażem: 7 dni zredagowanych logów technicznych, 90 dni nieprzydatnych zgłoszeń, osobna polityka dowodów weryfikacji. To decyzja operacyjna do przeglądu, nie deklaracja spełnienia wszystkich obowiązków prawnych. Usuń/wyeksportuj zapisany lokalnie plan na żądanie. Nie używaj danych o trasach do reklam.

## 14. Hosting i operacje

P0 może działać na laptopie i telefonach. Pokaz zdalny: jeden backend HTTPS i Postgres/PostGIS poza infrastrukturą UMK. P1: kontener API, osobny proces zadania importu, baza z backupem, harmonogram i proste metryki. Właścicielem hostingu/aktualizacji/moderacji jest zespół/operator produktu; nazwane role w `docs/workflow.md`.

Migracje są wersjonowane i testowane na pustej oraz poprzedniej bazie. Przed migracją produkcyjną backup i jawna zgoda człowieka; rollback aplikacji nie zakłada automatycznego rollbacku danych. Codzienna kopia bazy, test odtworzenia przed publicznym pilotażem. Surowe snapshoty zachowują checksum i warunki wykorzystania.

Metryki bez śledzenia osób: p95 czasu routingu, liczba błędów wg kodu, wiek ostatniego udanego importu, odsetek niejednoznacznych dopasowań, rozmiar i spójność grafu. Liveness sprawdza proces; readiness bazę i aktywny graf. Logi nie zawierają pełnych odpowiedzi tras.

Budżet nie jest ofertą cenową: na wczesny pilot przyjmujemy do weryfikacji kopertę 200-500 PLN/miesiąc na mały hosting, bazę, backup i monitoring, bez pracy ludzi i ewentualnych płatnych map. Zespół ma wybrać dostawcę i przeliczyć faktyczne taryfy przed zakupem. Moderacja, audyt danych i wsparcie wymagają osobnego budżetu czasu.

## 15. Skalowanie i model produktu

Nowe miasto to konfiguracja obszaru i źródeł, audyt praw/atrybucji, pomiar pokrycia, test grafu, lokalna walidacja i publikacja nowej wersji. Nie wystarczy zmienić nazwy w UI. Silnik routingu można wymienić za interfejsem, a pozyskiwanie danych przenieść do wydajniejszego procesu bez zmiany aplikacji.

Propozycja biznesowa zgodna z kierunkami briefu: bezpłatny podstawowy użytek indywidualny, odpłatne plany dojścia/widget dla hoteli, wydarzeń i obiektów oraz usługa audytu/aktualizacji danych. Partner płaci za narzędzie lub pracę, nie za wyższe miejsce na liście tras. Danych pochodnych OSM nie traktujemy jako własności wolnej od warunków ODbL; model komercyjny i licencje podlegają przeglądowi [S14, B01].

## 16. Decyzje do zamknięcia przed P1

Wymagają sprawdzenia: rzeczywiste pokrycie danych w wybranym obszarze, obie docelowe platformy i wersje Expo Go, partnerzy do testów, parametry preferencji, rozumienie komunikatów i obowiązki operatora. Żadna z tych niewiadomych nie blokuje implementacji synthetic testów i pionowego scenariusza P0; blokuje natomiast obietnice nawigacji terenowej i skalowania na całe miasto.
