# Claude — UI/UX i dostępność „Kroków”

> Aktualizacja 2026-10-04: cały projekt przejmuje jeden Codex,
> patrz [handoff-codex.md](handoff-codex.md). Nazwa pliku jest historyczna;
> wskazówki dostępności pozostają referencją dla obecnego wykonawcy,
> nie zlecają kolejnego redesignu, włączania GPS ani wdrażania ORS.
> Wyszukiwarka i informacje są podłączone. Pięć prób iPhone/VoiceOver ma
> potwierdzenie użytkownika; nowsze podsumowanie i dodatkowe próby są otwarte
> w [testing.md](testing.md). Podstawa: [requirements.md](../requirements.md).

Data przygotowania: 2026-10-03\
Lokalizacja w repozytorium: `docs/claude-ui-instructions.md`\
Zakres: istniejąca aplikacja React Native / Expo; UI, interakcje, czytniki ekranu i komunikaty.

## 1. Twoja rola i pierwsze kroki

Przejmujesz utrzymanie istniejącego interfejsu aplikacji. Nie zaczynasz projektu od nowa.
Masz poprawić istniejące rozwiązanie, zachować działające funkcje oraz doprowadzić główny
scenariusz do używalności bez patrzenia na ekran.

Po poleceniu rozpoczęcia realizacji:
1. Sprawdź `git status`, lokalne zmiany i instrukcje obowiązujące w katalogach.
2. Przeczytaj `AGENTS.md`, `CLAUDE.md`, `docs/status.md`, odpowiednie części
   `architecture.md`, `docs/contracts.md` oraz istniejące opisy dostępności i testów.
   Dokumenty mogą opisywać wcześniejszy etap; stan implementacji ustal z kodu.
3. Sprawdź manifesty, lockfile, wersje Expo/React Native, router, bibliotekę map,
   aktualne komponenty, motyw, testy, źródło danych i obsługę mowy.
4. Jeden Codex odpowiada za UI oraz backend; nie oczekuj na dawną rolę A/B.
   Zachowaj wspólne reguły bezpieczeństwa, kontraktów i danych.
5. Sprawdź istniejący kreator i wybierz mały zakres P-04/P-05, zgodnie z aktualnym planem; nie rozpoczynaj nowego redesignu.

Nie nadpisuj niezatwierdzonej pracy drugiej osoby. Nie wykonuj resetu repozytorium,
zmiany frameworka, masowej migracji zależności lub wymiany design systemu bez potrzeby.
Nie modyfikuj API i algorytmu rankingu wyłącznie dla wygody komponentów.
Brakujący element kontraktu opisz; tymczasowy adapter nie może wymyślać faktów.

Ta instrukcja opisuje wymagania UX; bieżącą odpowiedzialność ustala AGENTS.md.

## 2. Kryterium nadrzędne

Użytkownik ma móc samodzielnie:
**wybrać początek i cel → ustawić preferencje → porównać trasy → poznać przeszkody,
udogodnienia i braki danych → uruchomić dostępny tryb demonstracji lub prowadzenia
→ powtórzyć komunikat → wstrzymać i zakończyć działanie.**

Cały ten scenariusz musi być dostępny bez użycia mapy, przez VoiceOver na iOS
i TalkBack na Androidzie. Mapa jest dodatkowym sposobem prezentacji, nie warunkiem
wykonania zadania. To kontynuacja zasad produktu z `AGENTS.md`.

Nie twórz osobnej, zubożonej aplikacji „dla niewidomych”. Jeden interfejs ma działać
z czytnikiem, dużym tekstem, dotykiem oraz bez dźwięku. Nie wymagaj ujawniania diagnozy
ani zaznaczania „jestem niewidomy”, żeby korzystać z dostępności.

Wytyczne Apple dotyczą zarówno zachowania, jak i prezentacji. Nie sprowadzaj ich
do zaokrąglonych kart, przezroczystości czy imitacji aplikacji Apple. [S1–S5]

## 3. Natywne zachowanie i czytelny wygląd

Poniższe wymiary oznaczone „standard projektu” to nasze decyzje, a nie cytaty
z Apple HIG. Priorytetem jest czytelność i obsługa w ruchu.

### Układ i kontrolki

Preferuj sprawdzone komponenty dostępne w zainstalowanym stosie: nawigację stosową,
systemowe pola, przełączniki, przyciski i okna modalne. Nie odwzorowuj HTML-owego
dashboardu wewnątrz aplikacji mobilnej. Nie kopiuj wyglądu iOS kosztem poprawnego
zachowania Androida.

Stosuj czytelną hierarchię: tytuł ekranu, krótki kontekst, najważniejsza treść,
główna akcja. Na danym etapie wyróżniaj jedną akcję podstawową, ale pozostaw łatwo
dostępne „Wstecz”, „Anuluj”, „Powtórz” i „Zakończ”, kiedy mają zastosowanie.

Szanuj safe area, klawiaturę i przewijanie. Przyciski przyklejone do dołu nie mogą
zasłaniać treści ani elementu z fokusem. Przy dużym tekście dopuść przewijanie całego
układu zamiast ściskać zawartość. Nie wymuszaj poziomego przewijania tekstu.

Apple zaleca dla przycisków obszar trafienia co najmniej 44 × 44 pt. [S4]
Standard projektu: celuj w co najmniej 48 × 48 jednostek logicznych dla własnych
kontrolek i `minHeight: 56` dla głównych przycisków. To minimum, nie stała wysokość.
Pozwól przyciskowi urosnąć przy dłuższym napisie. Nie traktuj jednostek jako pikseli
fizycznego ekranu. `hitSlop` nie zastępuje czytelnego układu i nie może tworzyć
nakładających się obszarów dotyku.

Standard projektu: podstawowe odstępy 8/16/24, margines treści zwykle 16–24.
Dostosuj je do istniejącego design systemu; nie przebudowuj poprawnego UI tylko po
to, żeby wyrównać liczby. Zapewnij widoczny stan naciśnięcia, wybrania i zajętości.

Żadna ważna akcja nie może istnieć wyłącznie jako swipe, drag, long press,
przeciągnięcie panelu albo gest na mapie. Zapewnij przycisk lub inną prostą,
dostępną alternatywę. [S1]

### Typografia

Używaj systemowej czcionki, o ile projekt nie ma już uzasadnionego, dostępnego wyboru.
Apple podaje 17 pt jako domyślny rozmiar tekstu dla iOS/iPadOS. [S3]
Standard projektu: zasadnicze opisy 17–18, pomocnicze informacje zwykle nie mniej
niż 15; krytycznych ostrzeżeń nie chowaj w małym przypisie.

Obsługuj systemowe skalowanie tekstu, w tym największe rozmiary dostępności.
W React Native zweryfikuj `allowFontScaling` i dziedziczenie ograniczeń skali.
Nie ustawiaj globalnie `allowFontScaling={false}` ani arbitralnego
`maxFontSizeMultiplier`, żeby „naprawić” układ. [S9]

Nie maskuj problemów przez `adjustsFontSizeToFit`, stałą wysokość kart lub obcinanie
kluczowej treści `numberOfLines={1}`. Tytuły tras, nazwy ulic, statusy danych,
komunikaty błędów i etykiety akcji muszą być możliwe do odczytania w całości.
Przy dużym tekście zmieniaj układ z poziomego na pionowy.

### Kolory, materiały i ruch

Respektuj systemowy jasny i ciemny wygląd. Używaj semantycznych tokenów koloru;
nie rozrzucaj przypadkowych wartości po ekranach. Sprawdź tekst pomocniczy,
placeholdery, linki, wybrane opcje i błędy w obu wariantach. [S5]

Jako standard projektu przyjmij kontrast co najmniej 4,5:1 dla tekstu,
także tam, gdzie WCAG dopuszczałoby wyjątek dla dużego tekstu.
Dla istotnych ikon i wizualnych wskaźników kontrolek/stanu sprawdzaj co najmniej
3:1 względem przyległego tła. Dla kluczowych instrukcji dąż do 7:1.
Są to cele projektowe oparte na kryteriach kontrastu WCAG; same nie oznaczają
zgodności całej aplikacji z WCAG 2.2 AA. [S12–S13]

Nie komunikuj znaczenia wyłącznie kolorem, ikoną, pozycją lub animacją.
„Brak danych” ma być tekstem i informacją dla czytnika, nie tylko żółtą kropką.
Nie nadawaj statusowi „unknown” koloru i symbolu sugerujących potwierdzenie.

Dla istotnej treści preferuj stabilne, nieprzezroczyste tło. Nie umieszczaj ostrzeżeń
na mapie pod szkłem lub rozmyciem bez kontroli kontrastu. Obsłuż Reduce Motion
i odpowiednie ustawienia kontrastu/przezroczystości w zakresie wspieranym przez
używany stos; niespełnione przypadki jawnie raportuj. Bez pulsowania, dekoracyjnego
parallaxu i obowiązkowych animowanych przejść. [S1, S5, S8]

## 4. Wymagania dla głównych ekranów

### Planowanie

Pola „Skąd” i „Dokąd” mają trwałe etykiety, nie tylko placeholdery.
„Użyj mojej lokalizacji” jest jawną akcją; brak zgody nie blokuje ręcznego wyboru
początku. Proś o uprawnienie w kontekście użycia funkcji, nie na zapas.

Wyniki wyszukiwania są listą tekstową. Nie wymagaj wskazania pinezki.
Nie gub wpisanej treści przy błędzie lub powrocie. Liczbę nowych wyników ogłaszaj
po ustabilizowaniu zapytania, bez przechwytywania fokusu i bez komunikatu po każdym
znaku. Pokaż stan ładowania, brak wyników, brak sieci i błąd jako różne sytuacje.

Preferencje opisuj językiem potrzeb: „Preferuj przejścia z sygnalizacją dźwiękową”,
„Ogranicz liczbę przejść”, „Preferuj lepiej udokumentowane odcinki”.
Nie zastępuj twardych ograniczeń miękkimi preferencjami i nie zmieniaj ich bez zgody.
Interfejs musi zachować rozróżnienie ustalone w kontrakcie.

### Porównanie tras

Prezentuj warianty w pionowej liście, nie wyłącznie w przesuwanej karuzeli.
Zachowaj istniejący kontrakt liczby wariantów; nie generuj sztucznych alternatyw.

Każda trasa ma mieć: nazwę/charakter wariantu, dystans i ewentualny szacowany czas,
uzasadnienie dopasowania, istotne przejścia i udogodnienia oraz jawne braki danych.
Pokazuj kompromis, np. dodatkowy dystans w zamian za więcej informacji lub mniej
przejść. Nie licz na froncie nowego „wyniku bezpieczeństwa”.

Przykład tekstu projektowego, tylko dla zgodnych danych testowych:
> Trasa lepiej udokumentowana. 980 metrów, o 240 metrów dłuższa od najkrótszej.
> W danych zapisano sygnalizację dźwiękową przy trzech etapach przejść.
> Brak informacji o aktualnym działaniu urządzeń.

Nie stosuj etykiet „bezpieczna”, „100% dostępna”, „bez przeszkód”.
„Lepiej udokumentowana” nie oznacza „sprawdzona teraz”.

Karta nie może być jednym ogromnym elementem dostępności ukrywającym wewnętrzne
przyciski. Wybierz jednoznaczny wzorzec: osobne podsumowanie oraz osobne akcje,
albo pojedynczy przycisk otwierający szczegóły, jeśli karta ma tylko tę jedną akcję.
Stan wyboru udostępnij semantycznie.

### Szczegóły trasy

Zapewnij listę kolejnych odcinków/manewrów i punktów infrastruktury.
Opisy powstają z danych i szablonów, nie z dopowiedzeń modelu językowego.

Informacja o przejściu może obejmować jego złożoność, zapisane oznaczenia dotykowe,
akustykę, powierzchnię czy zgłoszenie — wyłącznie w zakresie danych przypisanych
do właściwego miejsca, kierunku i poziomu.

Odróżniaj obecność, zapisany brak, brak informacji, konflikt i nieaktualność.
Pokazuj źródło oraz datę obserwacji/potwierdzenia, jeśli istnieje. Data pobrania nie
jest datą weryfikacji w terenie. Nie interpretuj `unknown` jako `false`.

Źródła i szczegóły mogą być rozwijane, ale kluczowe ograniczenie danych musi być
dostępne przed wyborem trasy, nie tylko pod ikoną „i”.

### Symulacja i aktywne prowadzenie

Nie rozszerzaj etapu produktu. Jeżeli działa jedynie symulacja, przycisk ma mówić
„Uruchom symulację”, a nie „Rozpocznij nawigację”. Dane syntetyczne muszą być
oznaczone i nie mogą uruchamiać prowadzenia terenowego.

Gdy prowadzenie jest rzeczywiście dostępne, centralną treścią jest bieżąca
instrukcja oraz informacja o jakości lokalizacji. Udostępnij „Powtórz komunikat”,
„Co dalej”, „Wstrzymaj prowadzenie” / „Wznów” i „Zakończ”.
„Zatrzymaj odczyt” nie jest tym samym co „Wstrzymaj prowadzenie” — nazwa i działanie
muszą się zgadzać.

Aktualizacja odległości nie może przestawiać przycisków, zmieniać kolejności
elementów ani odbierać fokusu. Nie ogłaszaj każdej zmiany GPS.

Nie mów „możesz teraz przejść”, „jest zielone” ani „droga jest wolna”.
Zapis o sygnalizatorze nie daje wiedzy o aktualnej fazie lub sprawności urządzenia.
Przy niepewnym GPS nie prezentuj pozornej dokładności ani nowych pewnych manewrów.
Stan może brzmieć: „Lokalizacja jest niedokładna. Wskazówki chwilowo wstrzymane”.
Nie wydawaj automatycznego polecenia fizycznego zatrzymania się niezależnie od
sytuacji, np. gdy osoba może być w trakcie przechodzenia.

Brak trasy, niespełnione ograniczenia, niedostępny obszar i awaria źródła/API mają
różne opisy i działania naprawcze. Nie przedstawiaj wszystkich jako pustej listy.
Nie przedstawiaj zapisanej kopii jako świeżo obliczonej trasy.

## 5. VoiceOver i TalkBack: semantyka, kolejność, fokus

Apple zaleca znaczące etykiety, nagłówki, logiczne grupowanie i pomijanie dekoracji.
React Native udostępnia odpowiednie właściwości, ale ich działanie różni się
między platformami. [S2, S7]

Dla każdej kontrolki ustal: dostępną nazwę, rolę, wartość i stan.
W używanej wersji stosuj odpowiednio `accessibilityLabel`, `accessibilityRole`,
`accessibilityState`, `accessibilityValue` i, gdy potrzebne, `accessibilityHint`.
Dla zwykłego tekstowego przycisku poprawna nazwa może wynikać z jego tekstu —
nie duplikuj jej bez powodu. [S7]

Przykład: widoczny tekst i etykieta „Powtórz komunikat”, rola `button`.
Nie pisz „Przycisk powtórz komunikat, kliknij dwa razy” — rolę i sposób aktywacji
obsługuje czytnik. Dostępna nazwa ma zachowywać widoczną nazwę, także dla Voice Control.
Nie umieszczaj jedynego ważnego ostrzeżenia w `accessibilityHint`.

Zasady implementacji projektu:
- Przełącznik ogłasza włączony/wyłączony, opcja wybrana/niewybrana, panel
  rozwinięty/zwinięty, operacja stan zajętości; nie zastępuj tego samą zmianą koloru.
- Nagłówki mają właściwą semantykę i pozwalają poruszać się po sekcjach.
- Porządek drzewa odpowiada logicznemu porządkowi czytania. Nie naprawiaj chaosu
  eksperymentalnymi API porządku fokusu.
- Nie ustawiaj `accessible={true}` na całym ekranie lub kontenerze z niezależnymi
  akcjami. Nie ukrywaj aktywnego dziecka przez grupowanie rodzica.
- Ikony dekoracyjne ukryj, lecz tylko wtedy, gdy ich znaczenie jest już dostępne
  w tekście. Nie usuwaj jedynej dostępnej reprezentacji informacji.
- Nadaj listom stabilne klucze. Aktualizacja danych nie powinna remountować ekranu
  lub elementu, który użytkownik właśnie czyta.
- Najpierw sprawdź zachowanie nawigatora. Po zmianie ekranu zapewnij orientację,
  ale nie dodawaj drugiego ogłoszenia i wymuszenia fokusu, jeśli robi to już router.
- Po otwarciu modala fokus trafia do jego treści, tło nie jest osiągalne, a po
  zamknięciu wraca do elementu wywołującego. Zapewnij przycisk „Zamknij” i właściwe
  działanie cofania/gestu escape.
- Nie rozwiązuj fokusu arbitralnym timeoutem 100/500 ms. Wiąż operację z cyklem
  życia widoku i końcem przejścia nawigacji, z kontrolą aktualnego ekranu.
- Ważne błędy pozostają w treści i dają działanie naprawcze. Toast nie jest ich
  jedyną reprezentacją. Nie przesuwaj fokusu przy rutynowym odświeżeniu.

`accessibilityViewIsModal` i `accessibilityElementsHidden` dotyczą iOS;
Android wymaga właściwej obsługi własnego drzewa, np. `importantForAccessibility`.
`accessibilityLiveRegion` jest udokumentowane dla Androida — nie zakładaj, że
rozwiązuje ogłoszenia na iOS. Dobierz mechanizm do wersji i platformy. [S7]

## 6. Jeden koordynator mowy i komunikatów

Nie wywołuj `Speech.speak` ani ogłoszeń czytnika z dowolnych komponentów.
Wykorzystaj istniejący koordynator lub utwórz jedną testowalną warstwę
(np. `AnnouncementCoordinator`). Nazwa jest propozycją, nie wymogiem przebudowy.

Polityka projektu:
- Przy aktywnym czytniku podstawowe ogłoszenia aplikacji przechodzą przez jego
  kanał. Domyślnie nie uruchamiaj równolegle automatycznej mowy `expo-speech`.
- Bez czytnika własny TTS może realizować wybrany przez użytkownika odsłuch
  i komunikaty prowadzenia.
- Wykryj stan czytnika oraz reaguj na jego zmianę podczas działania aplikacji.
  Zmiana kanału ma zatrzymać nieaktualną kolejkę własnej mowy.
- Każdy komunikat ma identyfikator, priorytet, kontekst trasy i termin ważności.
  Po zmianie trasy/ekranu anuluj nieaktualne komunikaty.
- Nie dubluj ogłoszenia przez TTS, live region i ręczne ogłoszenie jednocześnie.
  Deduplikuj powtórzenia; „Powtórz” jest świadomym wyjątkiem.
- Rutynowe informacje nie przerywają czytania kontrolki. Stan blokujący prowadzenie
  może wymagać krótkiego ogłoszenia priorytetowego, lecz bez powtarzania go
  przy każdej próbce GPS.
- Zapewnij odczyt na żądanie, regulację szczegółowości i zatrzymanie własnego odczytu.
  Nie zmieniaj globalnej szybkości lub głośności VoiceOver.
- Każdy komunikat ma tekstowy odpowiednik. Haptyka jest dodatkiem, nie jedynym
  sposobem przekazania błędu czy instrukcji.

React Native udostępnia `AccessibilityInfo` do sprawdzania czytnika, subskrypcji
zmian i ogłoszeń; kolejka ogłoszeń z opcją `queue` jest funkcją iOS.
Nie zakładaj dostępu do uniwersalnej informacji „czy czytnik właśnie mówi”.
Nie obiecuj idealnej synchronizacji bez testu na urządzeniach. [S8]

Expo dokumentuje, że `expo-speech` nie odtwarza dźwięku na fizycznym urządzeniu iOS
w trybie cichym. Dodaj do testów tryb cichy, głośnik/słuchawki, przerwanie audio
oraz zmianę aktywności aplikacji. Nie obiecuj odczytu zawsze słyszalnego.
Funkcje pause/resume tej biblioteki nie są dostępne na Androidzie — nie kopiuj
logiki iOS bez sprawdzenia; rozważ zatrzymanie i świadome ponowienie komunikatu. [S10]

## 7. Granice techniczne

Dopasuj implementację do faktycznie zainstalowanych wersji, nie do dowolnego
przykładu z najnowszej dokumentacji. Nie aktualizuj Expo tylko dlatego, że przykład
API wymaga nowszego SDK. Nowe biblioteki natywne sprawdź pod kątem Expo Go. [S11]

Aktualna dokumentacja React Native oznacza `setAccessibilityFocus` jako przestarzałe
i kieruje do `sendAccessibilityEvent`. Starszy projekt może mieć inny zestaw API.
Wybierz udokumentowany mechanizm dla zainstalowanej wersji; nie zmieniaj nazwy
funkcji bez kontroli kompatybilności. [S8]

Kandydaci do wspólnego użycia — najpierw poszukaj istniejących odpowiedników:
`AppText`, `ActionButton`, `Screen`, `LabeledField`, `RouteSummary`,
`EvidenceStatus`, koordynator ogłoszeń i adapter ustawień dostępności.
Nie buduj ogólnego frameworka dla kilku ekranów.

Trzymaj formatowanie jednostek, nazw, dat i komunikatów w testowalnych funkcjach.
Teksty użytkowe po polsku. Mowa powinna używać zrozumiałych jednostek zamiast
technicznych skrótów; statusów nie odczytuj jako `unknown` lub `SOURCE_UNAVAILABLE`.

Nie dodawaj background navigation, własnego modułu Swift, zewnętrznego STT
lub nowego SDK map jako części zwykłej poprawki UI. Potrzebę development buildu
opisz osobno, z dostępnym wariantem dla obecnego zakresu Expo Go.
Zmiana estetyki nie może ukrywać ograniczeń działania przy zablokowanym ekranie.

## 8. Testy i odbiór

Automatyczne sprawdzenie etykiet nie jest dowodem, że aplikacja działa z czytnikiem.
Apple wskazuje, że nawet usunięcie problemów znalezionych przez Accessibility
Inspector nie gwarantuje pełnej dostępności. [S6]

### Automatycznie

W istniejącym zestawie testów komponentów sprawdzaj elementy przez rolę, nazwę,
stan i wartość, nie tylko `testID`. Dodaj testy interakcji oraz stanów:
ładowanie, brak wyników, błąd, brak zgody na lokalizację, brak danych, konflikt,
dane syntetyczne, niepewna pozycja i przerwane działanie.

Przetestuj koordynator mowy: brak podwójnego odczytu, deduplikację, anulowanie
starej trasy, przełączenie czytnika oraz ponowienie na żądanie.
Test jednostkowy fokusu nie zastępuje testu kolejności czytania na telefonie.

Uruchom rzeczywiste skrypty lint/typecheck/test z repo. Nie zgaduj komend
i nie oznaczaj nieuruchomionych testów jako zaliczonych.

### Ręcznie — obowiązkowy scenariusz

Na fizycznym iPhonie z VoiceOver przejdź bez pomocy wzroku:
start → ręczny wybór celu → preferencje → porównanie wariantów →
wyjaśnienie braków danych → szczegóły → dostępna symulacja/prowadzenie →
powtórzenie → wstrzymanie → zakończenie.
Test z kurtyną ekranu wykonuj w kontrolowanych warunkach, nie podczas samodzielnego
przechodzenia przez ulicę.

Powtórz główny scenariusz na Androidzie z TalkBack. Dla każdego modala sprawdź
brak dostępu do tła i przywracanie fokusu. Sprawdź także przewijanie długich list,
powrót do wybranej trasy i aktualizację odległości podczas czytania.

Sprawdź największy rozmiar tekstu dostępności, pogrubienie tekstu, jasny/ciemny
wygląd, Reduce Motion, Increase Contrast i Reduce Transparency.
Apple zaleca testowanie z ustawieniami i technologiami asystującymi. [S14]
Dla głównego scenariusza sprawdź również Voice Control oraz Switch Control/
klawiaturę w zakresie wspieranych urządzeń. Jeśli projekt zawiera wersję web,
przetestuj ją osobno klawiaturą i czytnikiem; nie wyciągaj wniosków o iOS z webu.

Uruchom Accessibility Inspector na dostępnej konfiguracji macOS/Xcode.
Brak takiego środowiska odnotuj zamiast deklarować audyt. Docelowo zweryfikuj
główny scenariusz z osobami niewidomymi; test dewelopera nie zastępuje tej walidacji.

### Macierz odbioru

| Obszar | Warunek zaliczenia |
| --- | --- |
| Niezależność od mapy | Cały główny scenariusz da się ukończyć bez mapy. |
| Semantyka | Akcje mają zrozumiałe nazwy, role, wartości i rzeczywiste stany. |
| Fokus | Brak pułapek, skoków przy odświeżeniu i utraty miejsca po zamknięciu modala. |
| Tekst i układ | Największe rozmiary nie obcinają informacji i nie blokują akcji. |
| Wiarygodność | Brak/konflikt danych nie wygląda i nie brzmi jak potwierdzenie. |
| Audio | Brak podwójnych komunikatów, starych kolejek i niekontrolowanych przerwań. |
| Degradacja | Brak sieci, uprawnień i dobrego GPS ma uczciwy opis i dostępne wyjście. |
| Środowisko | Działanie sprawdzone w uzgodnionej wersji Expo; ograniczenia opisane. |

Dla każdego wiersza użyj: **PASS**, **FAIL** albo **NOT TESTED**.
Gdy brak telefonu lub użytkownika testowego, oddaj kod wraz z instrukcją testu
i statusem NOT TESTED. Nie pisz „VoiceOver działa”, „w pełni dostępne”
lub „WCAG 2.2 AA” na podstawie samego kodu, screenshotu czy testów jednostkowych.

## 9. Kolejność realizacji i raport

Aktualna kolejność i wykonany zakres są w [handoff-codex.md](handoff-codex.md).
Wyszukiwarka i informacje przy trasie są podłączone; pozostaje odbiór tekstu,
fokusu, odczytu i błędów na urządzeniu. Wcześniejszą przebudowę komponentów
opisuje status; nie powtarzaj jej ani nie włączaj prowadzenia GPS.

Po poleceniu implementacji realizuj mały zakres P-04/P-05, zachowując istniejące
UI. Gdy zlecenie brzmi „sam plan”, zakończ na dokumentacji i nie wdrażaj poprawek.

W `docs/ui-a11y-report.md` zapisuj: commit/wersję aplikacji, środowisko testowe,
wersję systemu i Expo/RN, ustawienia dostępności, scenariusz, wynik,
konkretne problemy, obejścia oraz testy niewykonane.
Nie dopisuj fikcyjnych wyników. Aktualizuj swój status pracy.

Raport końcowy iteracji ma zawierać: zmienione pliki, widoczną korzyść dla
użytkownika, uruchomione testy i wyniki, ograniczenia oraz kolejny konkretny zakres.
Screenshot może pokazać wygląd, ale nie jest potwierdzeniem działania VoiceOver.

## 10. Źródła i zakres zastosowania

Sprawdzone przy przygotowaniu instrukcji: 2026-10-03. Dokumentacja online się
zmienia; w kodzie zawsze wybieraj opis odpowiadający wersjom z manifestu i lockfile.
Zasady produktu wynikają z projektu; dodatkowe progi i zachowania wskazane jako
„standard/polityka projektu” są zaleceniami dla tej aplikacji, nie wymogami Apple.

- **S1 — Apple HIG, Accessibility:** alternatywne sposoby interakcji, ustawienia,
  ruch i percepcja. `https://developer.apple.com/design/human-interface-guidelines/accessibility`
- **S2 — Apple HIG, VoiceOver:** opisy, nagłówki, grupowanie i dekoracje.
  `https://developer.apple.com/design/human-interface-guidelines/voiceover`
- **S3 — Apple HIG, Typography:** tekst i Dynamic Type.
  `https://developer.apple.com/design/human-interface-guidelines/typography`
- **S4 — Apple HIG, Buttons:** obszary trafienia i stany przycisków.
  `https://developer.apple.com/design/human-interface-guidelines/buttons`
- **S5 — Apple HIG, Color / Layout:** kolory semantyczne i struktura interfejsu.
  `https://developer.apple.com/design/human-interface-guidelines/color`
  `https://developer.apple.com/design/human-interface-guidelines/layout`
- **S6 — Apple, Performing accessibility audits for your app:** zakres audytu
  i jego ograniczenia.
  `https://developer.apple.com/documentation/accessibility/performing-accessibility-audits-for-your-app`
- **S7 — React Native, Accessibility:** role, etykiety, grupowanie, modale
  i różnice platform.
  `https://reactnative.dev/docs/accessibility`
- **S8 — React Native, AccessibilityInfo:** ustawienia, ogłoszenia i fokus.
  `https://reactnative.dev/docs/accessibilityinfo`
- **S9 — React Native, Text:** skalowanie i ograniczenia tekstu.
  `https://reactnative.dev/docs/text`
- **S10 — Expo, Speech:** synteza, kolejka oraz ograniczenia platform.
  `https://docs.expo.dev/versions/latest/sdk/speech/`
- **S11 — Expo, Development builds FAQ:** ograniczenia Expo Go i kodu natywnego.
  `https://docs.expo.dev/develop/development-builds/faq/`
- **S12 — W3C, WCAG 2.2, Contrast (Minimum):** kontrast tekstu.
  `https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum`
- **S13 — W3C, WCAG 2.2, Non-text Contrast:** istotne wskaźniki i grafika.
  `https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast`
- **S14 — Apple, Performing accessibility testing for your app:** scenariusze,
  urządzenia i ustawienia.
  `https://developer.apple.com/documentation/Accessibility/performing-accessibility-testing-for-your-app`
