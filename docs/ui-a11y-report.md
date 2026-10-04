# Raport UI i dostępności — rola A / Claude Code

> **Dokument historyczny — odczytuj w kontekście opisanej iteracji.**
> Aktualny stan: [README](../README.md), [odbiór](testing.md) i [status](status.md).
> Integracja wyszukiwania/API jest zakończona; ostatnia pełna kontrola miała
> 620 testów PASS, a pięć prób iPhone/VoiceOver potwierdził użytkownik.
> Nowe podsumowanie i pozostałe próby urządzenia są otwarte. Dawne A/B,
> NOT TESTED, „do integracji” i listy przyszłych modułów niżej nie opisują
> automatycznie stanu obecnego. Aktualne materiały PDF/film są do wykonania.

Wymagania iteracji: [claude-ui-instructions.md](claude-ui-instructions.md)
(dokument wskazuje docelową nazwę `docs/ui-accessibility.md`; plik pozostawiono
w miejscu, w którym umieścił go użytkownik). Raport nie jest deklaracją zgodności
z WCAG 2.2 AA ani potwierdzeniem działania VoiceOver/TalkBack.

## Iteracja 2 — przebudowa UI: kreator, duże kontrolki, mniej tekstu, 2026-10-04

Polecenie użytkownika: UI schludne i estetyczne, przede wszystkim przystępne dla
osób niewidomych — duże przyciski, mało tekstu, możliwość mówienia; obecna lista
przy wyborze trasy była „okropnie długa”. Uwagi z próby na iPhonie z VoiceOver:
escape ma chować klawiaturę; z „Opcji demonstracji” nie dało się wyjść gestami
w lewo/prawo.

### Problem → wpływ → zmiana

| Problem | Wpływ | Zmiana |
| --- | --- | --- |
| Jedna strona planowania: 2 listy po 10 punktów (pilot 30 punktów), 27 kontrolek przed „Oblicz trasy”. | Z czytnikiem kilkadziesiąt przesunięć; wzrokowo długa, chaotyczna strona. | Kreator: „Skąd idziesz?” → „Dokąd idziesz?” → „Twoja trasa” → „Twój plan”. Jedno zadanie na ekran, fokus na nagłówku kroku, każdy krok od góry. Krok 1: 8 kontrolek. |
| Pełna lista punktów pod każdym polem. | Szum, długie przewijanie. | Wyszukiwarka + maks. 5 propozycji, „Więcej propozycji (N)” jako przełącznik (fokus zostaje). Cel nie pokazuje wybranego startu. Nazwa w dwóch liniach („Rynek Główny” / „punkt na ciągu pieszym”), czytnik dostaje pełną nazwę. |
| Brak sposobu mówienia. | Wpisywanie z czytnikiem jest wolne. | Dyktowanie systemowe z mikrofonu klawiatury; końcowa interpunkcja z dyktowania jest pomijana w wyszukiwaniu. Przycisk „Podyktuj” (tylko otwierał klawiaturę z instrukcją) usunięto na prośbę użytkownika. |
| Ustawienia jako długi formularz z polem „mnożnik 1–2”. | Pole liczbowe trudne bez wzroku; błędy walidacji. | Osobny ekran „Ustawienia trasy”: przełączniki (rola switch, „Wł./Wył.” i pozycja suwaka), wybory jednokrotne (rola radio) dla akustyki, wydłużenia (20/40/60%/2×) i liczby wariantów. Podsumowanie ustawień i twarde wymaganie widoczne na ekranie „Twoja trasa”. |
| Wynik: wiele akapitów i rozwinięć naraz. | Trudno znaleźć najważniejsze. | Jedna karta wybranej trasy (dystans dużą czcionką, czas, kompromis „O 240 m dłuższa”, przejścia, stan danych o sygnalizacji), na natywnych platformach czytana jako jeden element. Pod nią „Odsłuchaj plan”, potem rozwijane: przebieg, inne warianty (radio), porównanie/źródła/daty, ustawienia głosu, oraz „Nowa trasa”. |
| Gest escape VoiceOver nie chował klawiatury; otwarta klawiatura dokłada klawisze do kolejności przesuwania. | Uczucie „uwięzienia” fokusu. | Klawisz „Szukaj” (Enter) chowa klawiaturę, wyszukuje od razu i przenosi fokus na pierwszy wynik (podpowiedź pola to mówi). Escape chowa klawiaturę, gdy fokus jest na polu, a bez klawiatury cofa o krok. Druga próba użytkownika: gest „Z” z fokusem na klawiszach klawiatury nie działa — trafia do systemowej klawiatury, nie do aplikacji. Przyciski, przełączniki i wybory chowają klawiaturę. Web: Esc zwalnia pole. |
| „Opcje demonstracji” — rozwijana sekcja z zagnieżdżoną grupą na końcu ekranu. | Na iPhonie z VoiceOver nie dało się z niej wyjść gestami (zgłoszenie użytkownika; przyczyny nie odtworzono na web). | Jeden zwykły przycisk „Przełącz na przykłady bez API / na obliczanie przez API” z opisem bieżącego trybu — bez rozwijanej sekcji. |
| Brak spójnego systemu wizualnego; obramowania 1,8:1. | Niskie rozróżnienie kontrolek. | Tokeny: tekst ≥ 6,4:1 (główny ≥ 13:1), obramowania 3,5–4:1, przyciski główne min. 72, pozostałe 64, „Wstecz” 48. Pasek u góry: „‹ Wstecz” i etykieta danych („Demo: dane fikcyjne” / „Dane OSM: tylko podgląd”) na każdym kroku. |
| Wstecz tylko na dole strony. | Długa droga powrotu. | „Wstecz” zawsze u góry; Android: przycisk systemowy cofa o krok; iOS: gest przesunięcia od krawędzi tylko na pierwszym kroku (dalej cofa „Wstecz”/escape). |

Bez zmian: API, kontrakty, ranking, logika symulacji i koordynatora mowy, zależności.
Rozpoznawanie mowy jednym przyciskiem wymagałoby natywnego modułu (development
build, poza Expo Go); zewnętrzne STT w przeglądarce wysyłałoby nagrania poza
urządzenie — wymagania iteracji tego zabraniają. Wariant dla Expo Go: dyktowanie z klawiatury systemowej.

### Klawiatura i dyktowanie iOS — analiza (2026-10-04)

- Jedna funkcja `dismissInput()` w `PlaceStep` (`inputRef.current?.blur()` + `Keyboard.dismiss()`) dla: „Szukaj” (`onSubmitEditing`, `submitBehavior="blurAndSubmit"`), escape na polu (`onAccessibilityEscape`), Esc na web, przycisku „Schowaj klawiaturę” i wyboru wyniku. W kodzie nie ma `autoFocus` ani `focus()` na polu; `focusControl` przenosi tylko fokus czytnika na przycisk wyniku.
- `onAccessibilityEscape` na polu (obok `dismissInput()`): użytkownik potwierdził na iPhonie, że gest „Z” chowa teraz klawiaturę. Tymczasowy przycisk „Schowaj klawiaturę” usunięto na jego prośbę.
- Etykieta danych („Dane OSM: tylko podgląd” / „Demo: dane fikcyjne”) była czytana po „Wstecz” przy każdym przesunięciu. Wizualnie zostaje w prawym górnym rogu, ale jest tam ukryta przed czytnikiem; ta sama informacja jest ostatnim elementem treści każdego ekranu. iOS porządkuje VoiceOver według położenia, więc samo przesunięcie w drzewie by nie wystarczyło.
- Dyktowanie systemowe wstawia tekst przez `UITextInput`; nie naciska klawisza powrotu, więc **nie wywołuje `onSubmitEditing`**. React Native 0.86 nie udostępnia zdarzenia początku ani końca dyktowania (`TextInput` ma tylko onChange/onChangeText/onKeyPress/onSelectionChange/onEndEditing/onSubmitEditing/onFocus/onBlur). Wiarygodny sygnał istnieje tylko natywnie: opcjonalne metody `UITextInput` (`dictationRecordingDidEnd`, `insertDictationResult:`, `dictationRecognitionFailed`) wywoływane na polu tekstowym. Wymagają własnego natywnego pola (Swift/Objective-C), czyli development buildu zamiast Expo Go — decyzja użytkownika; nie wdrożono. Nie stosujemy obejść na timerach ani długości tekstu.

### Wyniki iteracji 2

Te same narzędzia co w iteracji 1 (Node 24.21.0 / pnpm 10.34.6, Playwright, Chromium desktop i 390 px).

| Sprawdzenie | Wynik |
| --- | --- |
| `pnpm --filter @krok/mobile typecheck`, `eslint apps/mobile` | **PASS** |
| Rdzeń symulacji/mowy (`test/simulation.config.ts`) | **PASS** — 33/33 |
| `pnpm test:mobile`, przebieg 1 | **FAIL** — 152/156: atrapa katalogu w teście miała 12 miejsc, a schemat dopuszcza 10 (klient słusznie odrzucił odpowiedź); `Shift+Tab` w teście trafiał najpierw w fokusowalny przewijany obszar Chrome. Poprawiono testy, nie UI. |
| `pnpm test:mobile`, przebieg końcowy | **PASS** — 156/156 |
| Runner pilot na prawdziwym API 3003 (Galeria → High5ive, brak trasy przy twardym wymaganiu) | **PASS** — 6/6 |
| `pnpm build:web` | **PASS** — 5 stron |
| `git diff --check` | **PASS** |
| Przegląd w przeglądarce (375 × 812, dane pilot i demo) | Krok 1: 8 kontrolek (wcześniej 27; po usunięciu „Podyktuj”); wyszukiwanie „galeria” → 3 wyniki i jedno ogłoszenie; fokus na nagłówku każdego kroku; podsumowanie mieści się na jednym ekranie. |
| iPhone/VoiceOver: gest „Z” chowa klawiaturę (po `onAccessibilityEscape` i `dismissInput()` na polu) | **PASS** — potwierdzenie użytkownika na iPhonie, 2026-10-04 (wcześniej FAIL). |
| iPhone/VoiceOver: etykieta danych czytana na końcu; „Szukaj” i fokus wyników; przycisk źródła danych | **NOT TESTED** po zmianie — wymaga ponownej próby użytkownika. |
| Android/TalkBack, największy tekst systemowy, dyktowanie na urządzeniu | **NOT TESTED** |

## Iteracja 1 — przejęcie UI i blokery czytnika, 2026-10-03

### Środowisko i wersja

| Pozycja | Wartość |
| --- | --- |
| Baza kodu | `main` @ `dc580b0` + niezatwierdzone zmiany tej iteracji (commit wykonuje B) |
| Stos | Expo SDK 57.0.26, React Native 0.86.3, React 19.2.3, expo-router 57.0.24, expo-speech 57.0.3, react-native-web 0.21 |
| Narzędzia testów | Windows 11, Node 24.21.0 / pnpm 10.34.6 (wrapper `npm.cmd exec`), Playwright 1.63, Chromium desktop i widok 390 × 844 |
| Dane testów web | API synthetic na 127.0.0.1:3002 i fixtures `@krok/contracts`; brak danych pilot w tej iteracji |
| Ustawienia dostępności | Brak — testy web nie uruchamiają czytnika, dużego tekstu systemowego ani trybu ciemnego |
| Mapa | W aplikacji nie ma mapy ani biblioteki map; cały scenariusz jest tekstowy |

### Audyt: problem → wpływ → poprawka

Priorytet według sekcji 9 wymagań: najpierw blokery głównego scenariusza bez patrzenia.

| # | Problem (stan zastany) | Wpływ na użytkownika | Poprawka | Status |
| --- | --- | --- | --- | --- |
| 1 | Przy aktywnym czytniku własny głos symulacji był słusznie blokowany, ale zdarzenia nie trafiały do czytnika. „Powtórz komunikat” nie dawał żadnego dźwięku. | Z VoiceOver/TalkBack symulacja przebiegała w ciszy; krok „uruchom symulację → powtórz komunikat” był niewykonalny bez patrzenia. | `SimulationSession` ma port czytnika. Jeden kanał na zdarzenie: własny głos tylko przy potwierdzonym braku czytnika, w pozostałych przypadkach czytnik. Postęp — krótko i w kolejce; „Powtórz” — pełny tekst, z przerwaniem. | Zrobione |
| 2 | Błąd obliczenia trasy (np. brak trasy spełniającej wymagania) miał `accessibilityRole="alert"`, co w RN na iOS/Android nie ogłasza treści; fokus pozostawał na przycisku. | Osoba niewidoma nie dowiadywała się, że obliczenie się nie udało ani dlaczego. | Nowy `LiveMessage`: tekst pozostaje w treści, natywnie ogłaszany jednym adapterem, na web `role="alert"`. Dotyczy też błędu wczytania obszaru. | Zrobione |
| 3 | Po wybraniu punktu z przefiltrowanej listy lista była czyszczona i budowana od nowa. | Fokus (także czytnika) znikał z właśnie wybranego elementu — brak potwierdzenia wyboru i utrata miejsca. | Poprzednie wyniki pozostają do nadejścia nowych; stabilne klucze zachowują fokus na wybranym punkcie. | Zrobione, test regresji |
| 4 | Wybór opisany tylko tekstem „Wybrany punkt oznaczono znakiem ✓”. | Czytnik odczytywał odwołanie do znaku graficznego zamiast nazwy punktu. | „Wybrano: {nazwa}.” bezpośrednio pod polem, przed listą wyników. | Zrobione |
| 5 | Wyszukiwanie: brak informacji o liczbie wyników na iOS; na Androidzie region live ogłaszał „Wczytywanie…” przy każdym znaku. | Brak wiedzy, czy pod polem są wyniki; szum przy pisaniu. | Zapytanie wysyłane po 350 ms bez pisania; jedno ogłoszenie „Znaleziono N punktów dla „…”” lub brak wyników. | Zrobione |
| 6 | Błąd katalogu punktów kazał „zmienić wyszukiwanie, aby ponowić”. | Ukryta akcja naprawcza. | Alert i jawny przycisk „{Start/Cel}: ponów wczytywanie punktów”. | Zrobione |
| 7 | Fokus nagłówka i powrót fokusu używały `setAccessibilityFocus` z `findNodeHandle`, oznaczonego w RN 0.86 jako przestarzały (ścieżka legacy). | Ryzyko, że przeniesienie fokusu na nowy ekran/wynik nie działa w nowej architekturze. | `AccessibilityInfo.sendAccessibilityEvent(ref, 'focus')` w `ScreenHeading` i `focusControl`. | Zrobione, wymaga testu na telefonie |
| 8 | Dowody pokazywały surowe wartości `true`, `false`, `yes`, `partial`. | Czytnik odczytywał angielskie kody. | Słowa: „W rekordzie zapisano obecność/brak/częściowe oznaczenie…”. | Zrobione |
| 9 | Przycisk obliczania nie ujawniał stanu zajętości. | Czytnik nie informował, że trwa operacja. | `accessibilityState.busy` / `aria-busy` w `ActionButton`. | Zrobione |
| 10 | Tryb ciemny: `app.json` wymusza `userInterfaceStyle: "light"`, tokeny tylko jasne. | Brak zgodności z ustawieniem systemu; osoby ze słabym widzeniem mogą potrzebować ciemnego wyglądu. | Tokeny semantyczne dla obu wariantów i zmiana konfiguracji Expo — decyzja o `app.json` z B. | Następna iteracja |
| 11 | Obramowania kontrolek 1,8:1 względem tła (cel projektu ≥ 3:1). Niezaznaczony przełącznik nie ma widocznego pola. Tekst ≥ 5,9:1 — spełnia cel 4,5:1. | Słabo widoczne granice kontrolek dla osób słabowidzących. | Ciemniejsze obramowanie, wskaźnik pola wyboru niezależny od koloru. | Następna iteracja |
| 12 | Grupy jednokrotnego wyboru (akustyka, liczba alternatyw, źródło planu) mają rolę przycisku ze stanem `selected`. | Czytnik nie ogłasza „1 z 3”; semantyka mniej przewidywalna. | Rola radio w grupie, po sprawdzeniu zachowania RN 0.86 na obu platformach. | Następna iteracja |
| 13 | Nagłówek ekranu 38 pt skaluje się bez ograniczeń. | Przy największych rozmiarach dostępności możliwe łamanie słów. | Sprawdzić na urządzeniu; ewentualnie skalowanie zbliżone do Large Title, nie globalne wyłączenie. | Do testu |
| 14 | Brak przycisku wstecz u góry (nagłówek ukryty); powrót tylko na końcu ekranu. | Dłuższa droga powrotu; gest escape niezweryfikowany. | Sprawdzić gest escape VoiceOver i wstecz TalkBack; ewentualnie widoczna akcja u góry. | Do testu |
| 15 | Daty w formacie `2026-09-14 10:00:00 UTC`. | Czytnik odczytuje cyfry i skróty. | Formatowanie słowne w testowalnej funkcji. | Następna iteracja |

### Ograniczenia i ryzyka nowego kanału czytnika

- iOS: ogłoszenia w kolejce (`queue: true`) nie przerywają czytanej kontrolki,
  ale nie można ich anulować po pauzie/zakończeniu. Przy tempie 16× zapowiedzi
  mogą nie nadążać za symulacją. Do decyzji UX: wolniejsze tempo przy czytniku.
- Android: `announceForAccessibility` jest oznaczone jako przestarzałe od API 36,
  choć RN 0.86 nadal z niego korzysta. Wymaga testu na TalkBack.
- Nieustalony stan czytnika (`null`) kieruje komunikaty do kanału czytnika;
  bez czytnika natywne ogłoszenie nie daje dźwięku, a tekst pozostaje na ekranie.
- Web nie wykrywa czytnika; obowiązuje jawny przełącznik „Korzystam z czytnika”.
  Komunikaty trafiają do ukrytego regionu `aria-live` (`#krokow-announcer`).
- Na Androidzie wynik nadal ma region live („Obliczono N warianty”), a nagłówek
  „Twój plan” dostaje fokus — możliwe dwa kolejne komunikaty. Do sprawdzenia.

### Testy

Wyniki uzupełniono po uruchomieniu — sekcja „Wyniki” niżej.

Testy manualne do wykonania (status: **NOT TESTED** — brak urządzeń w tej sesji):

1. **iPhone, VoiceOver, Expo Go SDK 57**, kurtyna ekranu, w pomieszczeniu:
   start → „Zaplanuj trasę” → wpisz fragment nazwy startu (oczekiwane jedno
   ogłoszenie liczby wyników) → wybierz punkt (fokus zostaje, „Wybrano: …”) →
   cel → „Ustawienia trasy” (stany zaznaczenia) → „Oblicz trasy” (zajętość,
   potem fokus na „Twój plan”) → „Porównaj trasy i sprawdź źródła” →
   przebieg i dowody wariantu → w trybie synthetic „Rozpocznij symulację”
   (ogłoszenia zdarzeń, brak głosu aplikacji) → „Pauza symulacji” →
   „Powtórz komunikat” (pełny tekst) → „Zakończ symulację” (fokus wraca na
   przycisk główny). Wymusić błąd (np. wymaganie akustyki bez pasującej trasy)
   i sprawdzić odczyt komunikatu.
2. To samo na **Androidzie z TalkBack**; dodatkowo sprawdzić, czy wynik nie jest
   ogłaszany dwukrotnie.
3. Największy rozmiar tekstu dostępności, pogrubienie, Reduce Motion, Increase
   Contrast; tryb cichy iPhone'a przy głosie aplikacji (bez czytnika).
4. Utrata sieci podczas wyszukiwania (ponowienie) i podczas obliczania.

### Wyniki

Komendy przez `npm.cmd exec --yes --package=node@24.21.0 --package=pnpm@10.34.6 --call "…"`.
Testy wykonano na drzewie roboczym zawierającym równoległe, niezatwierdzone zmiany B
(m.in. kontrakt `place-search`); API testów: synthetic na 127.0.0.1:3002.

| Sprawdzenie | Wynik |
| --- | --- |
| `pnpm --filter @krok/mobile typecheck` | **PASS** |
| `pnpm exec eslint apps/mobile --max-warnings 0` | **PASS** |
| `playwright test --config test/simulation.config.ts` (rdzeń, bez przeglądarki) | **PASS** — 33/33, w tym 2 nowe testy kanału czytnika |
| `pnpm test:mobile`, przebieg 1 | **FAIL** — 146/150; 4 asercje `getByText` trafiały także w ukryty region ogłoszeń (błąd selektora testu, nie UI) |
| Poprawka selektorów (`app()` = `#root`), ponowienie `planning.spec.ts` + `reader-a11y.spec.ts` | **PASS** — 12/12 |
| `pnpm test:mobile`, przebieg końcowy | **PASS** — 150/150 (desktop i 390 px) |
| `pnpm build:web` | **PASS** — 5 stron; `dist/plan.html` zawiera `#krokow-announcer` |
| `git diff --check` | **PASS** |
| Runner pilot (`test/pilot.config.ts`, API 3003 B) | **NOT TESTED** — poza zakresem zmian, API 3003 nie nasłuchiwało |
| Lint/typecheck całego repo, kontrakty | **NOT TESTED** w tej iteracji — A nie zmieniała kontraktów; backend jest w trakcie pracy B |

Macierz odbioru (sekcja 8 wymagań):

| Obszar | Wynik | Uwagi |
| --- | --- | --- |
| Niezależność od mapy | **PASS (web)** | Brak mapy w aplikacji; scenariusz web przechodzi tekstowo i klawiaturą. Telefon: NOT TESTED. |
| Semantyka | **NOT TESTED** na urządzeniu | Web: role, nazwy, `aria-pressed/checked/expanded/busy` sprawdzane w testach. Grupy radio — iteracja 2. |
| Fokus | **NOT TESTED** na urządzeniu | Web: fokus nagłówka wyniku, powrót po zakończeniu symulacji, brak utraty fokusu po wyborze punktu — PASS. |
| Tekst i układ | **NOT TESTED** | Web: zoom 200% bez poziomego przewijania (istniejący test) PASS; systemowy duży tekst iOS/Android nie sprawdzony. |
| Wiarygodność | **PASS (web)** | unknown/conflict/known(false) rozróżnione; wartości dowodów słowne; brak zakazanych sformułowań w ogłoszeniach (test). |
| Audio | **NOT TESTED** na urządzeniu | Web/rdzeń: jeden kanał na zdarzenie, brak głosu aplikacji przy czytniku, „Powtórz” z przerwaniem — PASS. |
| Degradacja | **PASS (web)** | Awaria katalogu z ponowieniem, błędy API jako alert. Brak GPS w zakresie (nie dotyczy). |
| Środowisko | **NOT TESTED** | Expo Go SDK 57 na iPhonie/Androidzie nie uruchomiono w tej iteracji. |

Accessibility Inspector (macOS/Xcode): **NOT TESTED** — brak środowiska.
Walidacja z osobami niewidomymi: **NOT TESTED**.
