# Plan demonstracji — termin za około 18 godzin

**Nowsza decyzja użytkownika:** pozostało siedem sesji po pięć godzin.
Teraz uruchamiamy aplikację **Kroków** na iPhonie w Expo Go, potem kontynuujemy
rozwój. Film i prezentacja są odłożone. Poniższy harmonogram i zalecenie
zamrożenia funkcji są historyczne; nie blokują dalszych zmian.

Stan 2026-10-03 po realizacji: HTTP, porównanie i minimalny odsłuch mają
testy lokalne; osiem slajdów PDF oraz film 143,52 s są w
[pakiecie materiałów](../deliverables/README.md). Kolejny krok to przegląd
przez prezentującego, próba wystąpienia i test telefonu, jeżeli jest dostępny.
Pełna symulacja, resolver B-03 i OSM pozostają poza zakresem oddania.
Szczegółowe wyniki i brak testów urządzeń: [status](status.md).

## Aktualizacja terminu — nadrzędna wobec podziału limitów

Użytkownik doprecyzował termin: około 18 godzin od wiadomości, z przerwą na sen.
Możliwe dodatkowe dwa limity rano są wyłącznie rezerwą na poprawki; plan
nie zakłada ich dostępności. Pięciogodzinne okna limitu nie są blokami harmonogramu.
Poniższe przedziały są budżetem czasu od tej decyzji, nie gwarancją ukończenia.

| Czas od decyzji | Priorytet i punkt odcięcia |
| --- | --- |
| 0–5 h | Domknięcie formularza → HTTP → porównanie tras, uzasadnienie, źródło i unknown. Równolegle z pracą nad ekranami spisanie scenariusza i treści slajdów, bez uruchamiania dodatkowych agentów. |
| 5–8 h | Minimalny odsłuch, krytyczne testy i próbne nagranie. Koniec nowych funkcji po 8 h; pełna symulacja jest opcjonalna i wypada jako pierwsza przy opóźnieniu. |
| 8–12 h | Finalizacja prezentacji i nagranie/montaż filmu na ustabilizowanej wersji. Materiały pokazują wyłącznie sprawdzone funkcje. |
| 12–15 h | Eksport PDF/filmu, odtworzenie plików, kontrola treści i przygotowanie pakietu do oddania. Cel: komplet gotowy minimum 3 h przed terminem. |
| 15–18 h | Wyłącznie poprawki blokujące oddanie i próba wystąpienia. Poranne dodatkowe limity, jeżeli się pojawią, służą temu zakresowi. |

Wersja minimalna do oddania: obliczone A/B/C, zmiana rekomendacji po zmianie
akustyki, porównanie długości i uzasadnienie, źródło/niewiadoma, jawne synthetic,
prezentacja i film. Odsłuch ma wysoki priorytet, ale brak testu telefonu nie
może zostać przedstawiony jako potwierdzona dostępność. Jeśli urządzenie
pozostanie niedostępne, film może pokazywać przetestowaną wersję web z napisami;
nie nazywamy tego testem VoiceOver/TalkBack. Realne nagranie użytkownika i próba
na jego telefonie wymagają krótkiego udziału przed snem albo rano. Nie uzależniamy
powstania materiałów od nagrania jego głosu.

Zasada przy opóźnieniu: redukujemy symulację, animacje i kosmetykę, chronimy
czas na materiały oraz eksport. Nie odkładamy pierwszej wersji filmu na rano.
Sesje pracy trzeba rzeczywiście uruchamiać; ten plan nie ustanawia automatycznej
pracy w tle ani zaplanowanego wznowienia po resecie limitu.

## Podział zasobów — pierwotna rezerwa ośmiu limitów

Plan roboczy z 2026-10-03 po B-02. Użytkownik zgłosił osiem pozostałych
pięciogodzinnych limitów Codexa oraz obowiązek przygotowania prezentacji i filmu.
Okna rozliczamy ukończonymi rezultatami, bez założenia, że każde zapewni pięć
godzin ciągłej implementacji. Wcześniejsze szacunki osobogodzin nie są miarą
zużycia limitu narzędzia. Termin doprecyzowano powyżej; język materiałów pozostaje
niepotwierdzony. Przy braku odpowiedzi roboczy język to polski, z ponownym
sprawdzeniem wymagań w dostarczonych PDF-ach przed finalnym eksportem.

Zakres do dostarczenia: kompletna demonstracja synthetic, z prawdziwymi
obliczeniami grafu, porównaniem tras, źródłami i brakami danych, odsłuchem oraz
jawną blokadą nawigacji terenowej. To zakres redukowany opisany w plan.md,
nie odbiór całego P0 z realnym obszarem OSM. Dotychczasowy backlog pozostaje.

| Okno | Priorytet | Rezultat umożliwiający przejście dalej |
| --- | --- | --- |
| 1 | Formularz → HTTP → wynik | Aplikacja korzysta z istniejącego silnika; zmiana akustyki zmienia rekomendację, błąd nie usuwa wymogów. Wstępny scenariusz pokazu i przegląd dostarczonych PDF-ów Lumi pod kątem wymagań prezentacji. |
| 2 | Porównanie i szczegóły | Długości, uzasadnienie, przebieg tekstowy, źródła i unknown są czytelne. Pierwsze uruchomienie na telefonie z pomocą użytkownika. Szkic slajdów zgodny z faktycznymi funkcjami. |
| 3 | Odsłuch i dostępność | Odsłuch, zatrzymanie/powtórzenie, sprawdzenie współpracy z czytnikiem na urządzeniu i poprawki. Bez telefonu wynik pozostaje jawnie nieprzetestowany. |
| 4 | Pełny scenariusz demonstracji | Jawna symulacja, przypadek braku pasującej trasy i niedostępnego API; próbne przejście całego pokazu oraz próbne nagranie. Jeżeli wcześniejsze funkcje wymagają napraw, rozbudowaną symulację redukujemy. |
| 5 | Stabilizacja i zamknięcie funkcji | Testy integracyjne, regresja, poprawki istotnych problemów, powtarzalne uruchomienie i zachowany stan do nagrania. Od tego momentu dodajemy wyłącznie niezbędne poprawki. |
| 6 | Prezentacja | Gotowy PDF do 10 slajdów według obecnego planu, źródła, opis ograniczeń i modelu utrzymania, notatki do wypowiedzi. Zrzuty z rzeczywistego prototypu. |
| 7 | Film | Gotowy film do 3 minut według obecnego planu: działający scenariusz, zrozumiały komentarz/napisy, kontrola obrazu i dźwięku oraz odtworzenie wyeksportowanego pliku. Nagrania głosu/telefonu użytkownika wymagają jego udziału. |
| 8 | Rezerwa i przekazanie | Błędy urządzenia, montażu lub eksportu, kontrola kompletności i zgodności materiałów z aplikacją, próba wystąpienia. Nie planujemy tutaj nowej funkcji. |

Jeżeli rezultat powstanie wcześniej, przechodzimy do kolejnego; nie zużywamy
reszty okna na rozszerzenia. Nie deklarujemy, że zadanie na pewno zmieści się
w jednym limicie. Po każdej iteracji zapisujemy wynik testów i następne zadanie.
Pozostałe limity ustalamy na podstawie informacji użytkownika, bez zgadywania
stanu konta.

Przed oddaniem odkładamy import OSM, graf realnej dzielnicy, pełny resolver B-03,
GPS live, mapę, konta, zgłoszenia i publiczny deployment. B-03 wraca jako następne
zadanie backendowe po demonstracji; teraz pierwszeństwo ma domknięcie scenariusza.
Nie dopisujemy fikcyjnych udogodnień do realnych miejsc.

Scenariusz filmu: krótki problem użytkownika → wybór punktów → rekomendacja
980 m zamiast 740 m z uzasadnieniem → pokaz źródła i niewiadomej → odsłuch →
twarde wymaganie bez pasującej trasy → ograniczenia i następny etap.
Finalny scenariusz dostosujemy do rzeczywiście ukończonych funkcji.

Kryterium zamknięcia tej iteracji planistycznej: zapisany podział ośmiu okien,
osobny budżet materiałów i rezerwy, jawnie ograniczony zakres. Nie zmieniamy
kodu ani nie ogłaszamy nowych wyników testów aplikacji.
