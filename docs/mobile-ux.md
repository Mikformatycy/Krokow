# Plan UX i wymagania frontendu do F-02

> **Dokument historyczny — odczytuj w kontekście opisanej iteracji.**
> Aktualny stan: [README](../README.md), [odbiór](testing.md) i [status](status.md).
> Integracja wyszukiwania/API jest zakończona; ostatnia pełna kontrola miała
> 620 testów PASS, a pięć prób iPhone/VoiceOver potwierdził użytkownik.
> Nowe podsumowanie i pozostałe próby urządzenia są otwarte. Dawne A/B,
> NOT TESTED, „do integracji” i listy przyszłych modułów niżej nie opisują
> automatycznie stanu obecnego. Aktualne materiały PDF/film są do wykonania.

> **Aktualizacja A / Claude Code, 2026-10-04:** zaimplementowany przepływ to kreator „Skąd idziesz?” → „Dokąd idziesz?” → „Twoja trasa” (+ „Ustawienia trasy”) → „Twój plan”, z wyszukiwarką i maks. 5 propozycjami zamiast pełnych list. Opis, uzasadnienie i wyniki testów: [ui-a11y-report.md](ui-a11y-report.md). Tabele poniżej pozostają wymaganiami treści i stanów.

Status: propozycja osoby A / Codexa, 2026-10-03. Zadanie: wkład frontendu do F-02 przed implementacją F-03. Dokument nie oznacza odbioru kontraktu ani działającej aplikacji.

Podstawa: [prompt startowy](../codex-start.md), [plan](../plan.md), [architektura](../architecture.md) i [kontrakt 1.0.0-draft.1](../contracts.md). Kontrakt opisowy znajduje się obecnie w katalogu głównym. Niniejszy dokument opisuje potrzeby UI; nie tworzy drugiej definicji schematów API.

## 1. Zakres i kryteria tej iteracji

Przygotować przepływ ekranów, reakcje na stany danych i błędy, wymagania dostępności oraz listę braków kontraktu dla osoby B. Założenie: F-01/F-02 nie mają w tym checkoutcie artefaktów implementacji ani potwierdzonego odbioru. Nie są znane telefony zespołu ani uzgodniona wersja Expo Go.

Kryteria przeglądu dokumentu:

- Każdy ekran ma cel, dane wejściowe, akcje i zachowanie fokusu.
- Każdy kod błędu z kontraktu ma reakcję UI; nieznana odpowiedź nie staje się sukcesem.
- Brak danych, zapisany brak infrastruktury, konflikt i nieaktualność są rozróżnione.
- Lista potrzeb F-02 wskazuje konkretne decyzje i przypadki testowe.
- Testy planowane są oddzielone od wykonanych; brak deklaracji odbioru F-02/F-03/M-01/M-02.

Pierwszy implementowany przebieg po fundamencie obejmie katalog fikcyjnych punktów, preferencje, odpowiedź z MockRouteApi, porównanie i szczegóły. F-03, M-01 i M-02 pozostają osobnymi iteracjami. Odsłuch aplikacji należy do M-03, symulacja do M-04. Obsługa czytnika jest wymagana od pierwszego ekranu.

## 2. Plan ekranów

Kolejność: **start i cel → preferencje → porównanie → plan trasy → źródło i aktualność**. Powrót zachowuje formularz i wybraną trasę w bieżącej sesji. Poniższe identyfikatory są nazwami ekranów w projekcie UX, nie endpointami API.

| Ekran / zadanie | Zawartość i akcje | Stany i fokus |
| --- | --- | --- |
| Start i cel / M-01 | Stała etykieta trybu, tekstowy zakres katalogu, osobno opisane pola „Start” i „Cel”, wyniki z nazwami punktów, „Zamień start i cel”, „Dalej”. Wybór wyłącznie istniejącego ID z katalogu. | Ładowanie katalogu, brak punktów, brak wyników wyszukiwania, błąd z ponowieniem. Po wyborze wraca fokus do odpowiedniego pola. Identyczne punkty: komunikat przy celu i fokus na błędzie; brak żądania trasy. |
| Preferencje / M-01 | Trzy preferencje infrastruktury, opcja pomijania zapisanych schodów, oddzielna grupa wymagań akustyki, limit objazdu, „Porównaj trasy”. Wyjaśnienie wpływu wymagań przed wysłaniem. | Walidacja przy polu; zachowanie wpisanych wartości po błędzie. Podczas obliczenia jedno żądanie i status „Obliczanie tras”. Cofnięcie pozwala edytować punkty. |
| Porównanie / M-02 | Od jednej do trzech kart, uzasadnienie rekomendacji, ostrzeżenia, „Pokaż plan trasy”, „Zmień preferencje”, „Zmień punkty”. | Fokus na nagłówku wyniku; pojedyncze ogłoszenie liczby tras. Brak wyniku ma osobny ekran stanu. Powrót ze szczegółów przywraca fokus do wybranej karty. |
| Plan trasy / M-02 | Podsumowanie, uporządkowana lista odcinków i zdarzeń, stan faktów, „Źródło i aktualność” przy faktach, powrót do porównania. Wszystkie informacje czytelne bez mapy. | Brak geometrii w synthetic nie blokuje listy. Brak aktualnej odpowiedzi po ponownym otwarciu aplikacji prowadzi do formularza, bez odtwarzania fikcyjnej trasy. Fokus na nagłówku planu. |
| Źródło i aktualność / M-02 | Źródła i dowody przypisane do wybranego faktu, daty pobrania, obserwacji i potwierdzenia jako osobne informacje, zakres obserwacji, licencja i atrybucja. | Brak daty opisany słownie. Przy konflikcie widoczne sprzeczne dowody. Powrót do kontrolki, która otworzyła szczegóły. Nie ma obowiązkowej wizyty na zewnętrznej stronie. |
| Odsłuch / M-03 | Odczyt planu lub elementu, „Powtórz”, „Pauza”, „Wycisz”. Pełny tekst pozostaje widoczny. | Jeden koordynator mowy; aktywny czytnik domyślnie wyklucza równoległy TTS. Brak głosu ma komunikat i nie blokuje tekstu. |
| Symulacja / M-04 | Wyraźny tytuł „Symulacja”, bieżący element, następny element, powtórzenie, pauza i zakończenie. | Stała informacja o demonstracji, bez zgody GPS i bez przejścia do prowadzenia terenowego. |

W pierwszym demo nie ma przycisku pobierającego pozycję telefonu. Wybór fikcyjnych punktów nie wymaga zgody lokalizacyjnej. Opcjonalna lokalizacja P0 i współrzędne jako endpoint P1 wymagają osobnego zakresu oraz potwierdzonych capabilities.

### Preferencje: etykiety i znaczenie

| Pole kontraktu | Propozycja treści UI |
| --- | --- |
| `preferAudibleSignals` | „Preferuj przejścia z informacją o sygnalizacji dźwiękowej”. To preferencja rankingu, nie twarde wymaganie. |
| `preferTactilePaving` | „Preferuj oznaczenia dotykowe”. |
| `preferSeparatedFootways` | „Preferuj oddzielne ciągi piesze”. |
| `avoidKnownSteps` | „Pomijaj odcinki oznaczone jako schody”. Pomoc: „Niepełne dane mogą nie zawierać wszystkich schodów”. |
| `audibleRequirement=none` | „Bez obowiązkowego wymagania danych o akustyce”. Preferencja akustyki nadal może wpływać na ranking. |
| `audibleRequirement=documented` | „Wymagaj informacji o obecności akustyki na każdym etapie przejścia”. Wyjaśnij, że brak danych i konflikt nie spełniają wymagania. |
| `audibleRequirement=field_verified_recent` | „Wymagaj aktualnej weryfikacji terenowej akustyki”. Okno aktualności musi pochodzić z uzgodnionej polityki, nie z liczby zaszytej w UI. |
| `maxDetourRatio` | „Maksymalna długość względem najkrótszej dopuszczalnej trasy”. Zakres 1,0–2,0; startowo 1,6, czyli do 60% dłużej. Punkt odniesienia spełnia te same twarde wymagania. |

Propozycja do uzgodnienia w F-02: wszystkie cztery wartości boolean startowo `false`, wymaganie `none`, limit 1,6 i maksymalnie trzy alternatywy. Demo A/B/C jawnie włącza preferowanie akustyki. Nie traktować tej propozycji jako zaakceptowanych domyślnych ustawień produktu; kontrakt obecnie określa tylko domyślny limit objazdu.

### Kolejność informacji na karcie

1. Nazwa wariantu i etykiety, np. „Najlepiej dopasowana spośród znalezionych”.
2. Dystans oraz przybliżony czas samego marszu. Przy nieznanym oczekiwaniu: „Czas oczekiwania na przejściach nie jest znany”.
3. Różnica względem `baseline`, także gdy najkrótsza opcja nie jest widoczna.
4. Liczba przejść i etapów przejść; wyjaśnienie, że jedno przejście może składać się z kilku etapów.
5. Akustyka: liczba etapów z informacją o obecności, zapisanym brakiem, brakiem danych i konfliktem. Zera nie dają etykiety „wszystko potwierdzone”.
6. Uzasadnienia i ostrzeżenia, następnie przycisk otwarcia planu z nazwą wariantu w etykiecie dostępności.

UI prezentuje kolejność i rekomendację z kontraktu. Nie przelicza rankingu ani wag. `walkingDurationSec` nie jest czasem przybycia; `crossingWaitDurationSec=null` i `unknownSegmentLengthM=null` nie są zerem.

## 3. Tryb danych i komunikaty

Propozycje tekstów do wspólnego przeglądu A+B; komunikaty dotyczące przejść nie są jeszcze zatwierdzone. Odnoszą się do planu i wiedzy w danych, bez sugerowania bieżącej pozycji użytkownika.

| Stan | Widoczny tekst / zachowanie |
| --- | --- |
| `synthetic` | „Tryb demonstracyjny. Fikcyjne punkty i dane. Tylko podgląd”. Stała etykieta na każdym ekranie przebiegu. |
| `known(true)` dla akustyki | „W danych zapisano sygnalizację dźwiękową. Aplikacja nie zna aktualnego stanu świateł”. |
| `known(false)` dla akustyki | „W danych zapisano brak sygnalizacji dźwiękowej”. |
| `unknown` dla akustyki | „Brak informacji o sygnalizacji dźwiękowej przy tym przejściu”. W szczegółach osobno przyczyna: brak danych, niejasny zakres albo nierozpoznana wartość. |
| `conflicting` dla akustyki | „Informacje o sygnalizacji są sprzeczne. Sprawdź szczegóły”. Bez wybrania wygodniejszej obserwacji. |
| Znane oznaczenia dotykowe | Oddzielne opisy dla `yes`, `no`, `partial`, `incorrect`: zapisano obecność, brak, częściowe oznaczenia albo nieprawidłowe oznaczenia. Nie wnioskować o ciągłej ścieżce prowadzącej. |
| `freshness=stale` | Dodatkowa etykieta „Dane oznaczone jako nieaktualne”. Stan wiedzy i pochodzenie nadal widoczne. |
| `freshness=unknown` lub brak daty | „Aktualność nieustalona”, „Brak daty obserwacji” lub „Brak daty potwierdzenia”, zgodnie z konkretnym polem. |
| `SOURCE_DEGRADED` | Wynik pozostaje widoczny z informacją o problemie źródła i dacie użytego snapshotu. |
| `SNAPSHOT_STALE` | Ostrzeżenie o wieku zbioru; nie zastępuje informacji o wieku pojedynczych faktów. |
| `budget_limited` | „Pokazano znalezione trasy. Limit obliczeń ograniczył wyszukiwanie alternatyw”. |

Kontrola klienta: `synthetic` wymaga `preview_only`. Sprzeczna para wartości, obcy stan faktu albo niepoprawna odpowiedź kończą się kontrolowanym błędem danych. Nie wystarczy ukryć przycisku prowadzenia: późniejszy kontroler sesji również musi odrzucać synthetic. W P0 prowadzenie terenowe pozostaje niedostępne także dla danych pilot.

## 4. Błędy i zachowanie sesji

| Kod / sytuacja | Komunikat i dalsza akcja |
| --- | --- |
| `VALIDATION_ERROR` | „Sprawdź wskazane pola”. Powiązać błędy z kontrolkami, zachować formularz, skierować fokus do pierwszego błędu. |
| `SAME_ENDPOINT` | „Wybierz inny punkt docelowy”. Zachować start i preferencje. |
| `OUTSIDE_COVERAGE` | „Punkt jest poza obszarem pilotażu”. Pokazać tekstowy zakres i wybór z katalogu. |
| `UNRESOLVED_ENDPOINT` | „Nie udało się powiązać punktu z trasą pieszą”. Zaproponować punkt katalogowy. |
| `NO_PATH` | „Brak znanej trasy w tym zbiorze”. Edycja punktów; bez twierdzenia, że dojście w rzeczywistości jest niemożliwe. |
| `NO_MATCHING_ROUTE` | „Brak trasy spełniającej wybrane wymagania”. Wyświetlić wymagania wskazane przez API i akcję „Zmień preferencje”. Dopiero edycja użytkownika oraz ponowne wysłanie zmieniają zapytanie. |
| `DATA_VERSION_CHANGED` | „Wersja danych nie jest już dostępna”. Zaproponować ponowne obliczenie; zachować otwarty plan z jego wersją. |
| `FEATURE_NOT_ENABLED` | „Ta funkcja nie jest dostępna w tym trybie”. Dla współrzędnych zaproponować katalog. |
| `SOURCE_UNAVAILABLE` | „Dane do obliczenia trasy są niedostępne”. Ponowienie zgodne z `retryable`; zachowanie już otwartego planu, jeżeli istnieje. |
| `SEARCH_LIMIT_REACHED` | „Nie ukończono obliczenia trasy”. Możliwość ponowienia; nie przedstawiać tego jako brak połączenia. |
| `RATE_LIMITED` | „Wysłano zbyt wiele zapytań”. Honorować `Retry-After`; brak pętli automatycznych ponowień. |
| `INTERNAL_ERROR` | „Nie udało się obliczyć trasy”. Pokazać request ID, bez surowych szczegółów serwera. |
| Brak sieci / timeout transportu | „Nie udało się połączyć z usługą”. Zachować formularz i otwarty plan z informacją, że nie został odświeżony. |
| Nieznany kod, wersja, klucz instrukcji lub niepoprawna odpowiedź | „Nie można wyświetlić otrzymanych danych”. Zachować formularz, nie odczytywać niezweryfikowanych instrukcji, nie traktować odpowiedzi jako sukcesu. Polityka kompatybilności do potwierdzenia w F-02. |

Brak katalogowych wyników wyszukiwania jest zwykłym stanem pustej listy. Puste `routes` w odpowiedzi sukcesu jest naruszeniem kontraktu. Żadna awaria HTTP nie przełącza aplikacji na mock.

Zmiana formularza unieważnia wynik jako odpowiedź na nowe parametry. Spóźniona odpowiedź poprzedniego żądania nie może zastąpić nowszego wyniku. Otwarty plan zachowuje dane i wersje swojego obliczenia; ponowienie nie zmienia dat obserwacji. Trwały zapis na urządzeniu pozostaje otwartym punktem zakresu opisanym niżej.

## 5. Dostępność i granice komponentów

Każdy ekran ma nagłówek, logiczną kolejność odczytu i widoczny fokus web. Kontrolki mają etykietę, rolę, wartość oraz stan; placeholder nie zastępuje etykiety. Ostrzeżenia mają tekst, a nie tylko kolor. Karta nie może być jednym przyciskiem zawierającym inne aktywne przyciski.

Zgodnie z założeniami architektury projektować cele dotyku co najmniej 48 jednostek, kontrast zwykłego tekstu co najmniej 4,5:1 i układ działający przy powiększeniu tekstu do 200%. To wymagania do sprawdzenia, nie deklaracja zgodności WCAG. Zmiana loading → wynik jest ogłaszana raz; nie odczytywać automatycznie całego planu. Wysłanie formularza nie uruchamia TTS.

Planowany podział w `apps/mobile`: cienkie ekrany w `src/app`, logika formularza i prezentacji w `src/features`, adapter API w `src/adapters`, wspólne kontrolki w `src/components`. Import typów i walidatorów wyłącznie z `packages/contracts`. MockRouteApi ma wybierać uzgodnione scenariusze wspólnych fixtures, respektować ich wejścia i nie zwracać tego samego sukcesu dla dowolnych wymagań. W demo nie obiecuje obsługi nieprzygotowanych par punktów.

## 6. Wymagania do wspólnego kontraktu F-02

Poniższe punkty są zależnościami do ustalenia z osobą B. Nazwy i formaty nieopisane w kontrakcie należy ustalić we wspólnych schematach, bez lokalnych zamienników w aplikacji.

| ID | Brak / potrzeba | Wymagany rezultat F-02 |
| --- | --- | --- |
| C-01 | `coverage` i `places` mają tylko opis endpointów. | Schematy odpowiedzi i fixtures: tryb, capabilities, tekstowy zakres obszaru, identyfikator i nazwa punktu, zasady powiązania punktów z miastem. Uzgodnić pusty katalog, puste zapytanie i zachowanie dla jednego znaku. Polygon nie jest jedyną reprezentacją zakresu. |
| C-02 | `RouteOption.steps` nie ma pełnego słownika kluczy i parametrów. | Zamknięty słownik `instructionKey`, schemat parametrów każdego klucza, kolejność prezentacji odcinków i zdarzeń przy jednakowym offsetcie. Fixtures muszą pozwalać odtworzyć pełny tekstowy plan bez dopowiadania kierunku. |
| C-03 | `RouteReason` i `Warning` mają niepełne definicje parametrów. | Schemat każdego kodu, parametrów i odniesienia do wariantu bazowego; treści polskie do wspólnej recenzji. Wszystkie istniejące kody ostrzeżeń mają widoczną reprezentację. |
| C-04 | `ApiError.details` jest opisany jako zależny od kodu, ale brak konkretnych struktur. | Schematy błędów pól oraz blokujących wymagań `NO_MATCHING_ROUTE`, wraz z przykładami i regułami `retryable`. UI nie ma zgadywać przyczyny. |
| C-05 | Fakty i katalogi dowodów wymagają pełnej walidacji referencji. | Rozłączne stany known/unknown/conflicting, jawne daty nullable, słowniki statusów źródeł, dozwolone wartości cech i zakresów. Fixtures także dla konfliktu, starego faktu oraz nieznanej daty. |
| C-06 | Potrzebne identyczne dane dla mocka, HTTP i testów. | Importowalne fixtures wraz z przypisanymi żądaniami, wynikiem walidacji oraz oddzielnymi przypadkami niepoprawnych odpowiedzi. Brak modułów Node-only w zależnościach importowanych przez mobile. |
| C-07 | Brakuje polityki obsługi nieznanych wersji i kluczy. | Uzgodnione zachowanie dla `schemaVersion`, enumów i dodatkowych pól. Obcy stan nigdy nie oznacza pozytywnego wyniku; przyjęta polityka musi mieć test klienta. |
| C-08 | UI ma wyjaśnić `field_verified_recent`, lecz request/response nie podaje okna polityki. | Uzgodnić źródło informacji o oknie aktualności, związek z `policyVersion` i przykład. Nie kopiować progu do komponentów. |

### Rozbieżności do decyzji A+B

- **Zapis offline:** tabela zakresów architektury wymienia zapis w P0, a plan przypisuje go do P1/I-02. Pierwszy przebieg nie wymaga trwałego zapisu; nie zmienia to żadnego z dokumentów źródłowych ani nie zamyka sporu o dalszy zakres.
- **Wersja żądana przez klienta:** `DATA_VERSION_CHANGED` dotyczy niedostępnej żądanej wersji, ale `RouteRequest` nie ma pola wersji ani opisanego nagłówka. Ustalić mechanizm przed implementacją tego scenariusza; nie dopisywać pola tylko po stronie mobile.
- **Akceptacja ustawień i komunikatów:** wartości startowe boolean oraz proponowane teksty o przejściach wymagają wspólnego przeglądu. Dokument nie jest zapisem akceptacji człowieka.
- **Niepełny pakiet dokumentacji:** brak instrukcji katalogowych mobile, dokumentów testów i decyzji oraz przykładów. Linki tego dokumentu prowadzą do istniejących plików; nie przenosimy kontraktu ani nie rekonstruujemy brakującego briefu.

## 7. Scenariusze odbioru przyszłej implementacji

Wszystkie poniższe scenariusze mają status **planowane, niewykonane**. F-02 dostarcza wspólne fixtures i ich walidację; M-01/M-02 dostarczają testy reakcji UI. Nie włączać celowo niepoprawnych odpowiedzi do kolekcji poprawnych przykładów kontraktu.

| ID / etap | Przypadek | Oczekiwany dowód |
| --- | --- | --- |
| UX-01 / F-03 | Uruchomienie Expo na web i telefonie. | Zapis rzeczywistych wersji oraz wynik startu; nieprzetestowany OS oznaczony w statusie. |
| UX-02 / M-01 | Przejście przez katalog i preferencje klawiaturą. | Poprawny wybór ID, zamiana A/B, zachowany formularz, fokus i brak żądania GPS. |
| UX-03 / M-01 | Identyczne punkty oraz niepoprawny limit objazdu. | Błąd przy polu; brak wysłania niepoprawnego żądania. |
| UX-04 / M-02 | Wspólny synthetic A/B/C: 740/980/1120 m, profil preferujący akustykę. | Trzy różne karty, rekomendacja B zgodna z fixture, +240 m względem A, widoczna etykieta demonstracji; brak przeliczania rankingu przez UI. |
| UX-05 / M-02 | Jedna alternatywa z baseline innym niż pokazana trasa. | Jedna karta, poprawna różnica względem baseline, brak sztucznego uzupełniania listy. |
| UX-06 / M-02 | Akustyka known(true), known(false), unknown i conflicting; dotyk partial/incorrect. | Odrębne teksty, dostęp do dowodów, brak sprowadzenia stanu do boolean. |
| UX-07 / M-02 | Stary fakt, brak dat, nowszy import tego samego dowodu. | Rozdzielone daty i aktualność; import nie zmienia daty obserwacji ani potwierdzenia. |
| UX-08 / M-02 | Każdy z 12 kodów błędów w sekcji 4. | Odpowiedni komunikat i akcja, zachowane wartości; `NO_MATCHING_ROUTE` nie rozluźnia wymagań. |
| UX-09 / M-02 | `budget_limited` z poprawną trasą oraz `SEARCH_LIMIT_REACHED` bez wyniku. | Wynik z ostrzeżeniem w pierwszym przypadku; osobny błąd w drugim. |
| UX-10 / M-02 | Brak sieci, timeout, spóźniona odpowiedź po zmianie formularza. | Brak automatycznego mocka, brak zastąpienia nowszego wyniku starszym; zachowany otwarty plan. |
| UX-11 / F-02, M-02 | Obcy stan, brak dowodu, puste routes, nieistniejąca rekomendacja, synthetic z foreground. | Odrzucenie odpowiedzi przez walidację; brak sukcesu i brak prowadzenia. |
| UX-12 / M-02 | Zero przejść, null czasu oczekiwania i null nieznanej długości. | Brak procentu potwierdzenia; null przedstawione jako niewiadome. |
| UX-13 / M-02 | `geometry=null` dla synthetic. | Cały plan, źródła i porównanie dostępne tekstowo. |
| UX-14 / M-02 | Web: klawiatura, fokus, tekst 200%, kontrast; telefon: czytnik. | Osobne wyniki testu web i VoiceOver/TalkBack, z urządzeniem i wersją; brak wniosku o telefonie na podstawie web. |
| UX-15 / M-03, M-04 | Odsłuch z czytnikiem, pauza i powtórzenie, symulacja. | Brak podwójnej mowy; deduplikacja przez route/event ID; symulacja bez zgody GPS i bez prowadzenia terenowego. |

## 8. Przekazanie osobie B

Następne zadanie odbiorcy: przygotować F-02 na fundamencie F-01, odnosząc się do C-01–C-08, dostarczyć wspólne walidowane fixtures i przedstawić decyzje do wspólnej akceptacji. To odblokuje korzystanie z MockRouteApi bez kopii typów. Najpierw potrzebne są katalog, request/response trasy oraz błędy; import OSM nie jest zależnością tej pracy.

Po stronie A następne zadanie implementacyjne to F-03 po scaleniu fundamentu i uzgodnieniu SDK z telefonami zespołu. Kryterium: działający start mobile/web, testy UI i zapisany wynik telefonu, a następnie osobno M-01 oraz M-02.
