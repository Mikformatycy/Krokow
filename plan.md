# Plan realizacji — bieżący backlog

Stan: 2026-10-04. Jeden Codex odpowiada za wszystkie moduły; nie czeka na dawnych wykonawców A/B. Podstawa: [requirements.md](requirements.md), wyniki: [status](docs/status.md).

## Bieżące zadania

| Etap | Stan | Następny warunek |
| --- | --- | --- |
| P-01 Audyt archiwum | Wykonany | Nie powtarzać bez zmiany danych; raport w docs/data-audit-report.md |
| P-02 Rzeczywiste przykłady | Wykonany | Główna para Galeria Pawia → High5ive zachodnie; dwa dodatkowe przykłady |
| P-03 Fakty przy trasach | Zintegrowane | Katalog dowodów wspólny dla wariantów; pozycja rekordu na wybranej trasie wymaga przyszłego kontraktu |
| P-04 Wyszukiwanie i UI | Zintegrowane | 96 556 wpisów wyszukiwania, 30 końców tras, kreator i odsłuch |
| P-05 Odbiór | 620 testów PASS w ostatnim audycie; pięć prób iPhone/VoiceOver potwierdzone | Nowe podsumowanie i pozostałe próby urządzenia z docs/testing.md; brak audytu terenu/WCAG |
| Dokumentacja | Ujednolicona po audycie wymagań | Aktualny start, opis utrzymania/przenoszenia/skalowania, licencje i polskie odpowiedzi do formularza |
| P-06 Materiały | Do wykonania | PDF do 10 slajdów, film do 3 minut i otwarty link po poleceniu publikacji |

Priorytet po dokumentacji: P-06 zgodnie z ostatnim poleceniem użytkownika.
Testy urządzenia pozostają jawnie otwarte; nie przedstawiać ich jako wykonanych
ani odtwarzać całej aplikacji przed nagraniem. [Scenariusz](docs/demo-script.md).

## Dalszy rozwój

[Model utrzymania](docs/operations.md) opisuje proponowane odpowiedzialności,
role, budżet, aktualizacje, zgłoszenia, kopie i migrację. Nie jest uruchomioną
usługą. Dodanie miasta wymaga loadera/konfiguracji API, usunięcia stałych
cityId w mobile, audytu i testów. Nie wystarczy zmiana nazwy.

Przed publicznym pilotem: wskazany operator i kontakt, decyzja o licencji
własnego kodu, hosting HTTPS, ograniczenia nadużyć i logów proxy, odtworzenie
danych oraz odbiór dostępności. Konta, zgłoszenia i PostGIS wymagają osobnej
implementacji. GPS/teren, nowe źródła i ORS są oddzielnymi zakresami; nie
stanowią automatycznego następnego kroku ani wymogu demonstracji briefu.

Bez nowych worktrees, zmiany gałęzi i subagentów. Commit/push/publikacja
wymagają nowego polecenia użytkownika.

## Historyczny plan P0/P1

Poniżej zachowano pierwotne budżety i kryteria, w tym dawny podział A/B.
To historia projektu, nie aktualne przydziały ani lista niezrobionych modułów.
Dla stanów wykonania obowiązuje tabela powyżej i docs/status.md.

## 1. Co ma zobaczyć użytkownik

Użytkownik wskazuje punkt A i B. Dostaje do trzech tras z konkretnym porównaniem: długość, szacowany czas samego marszu, liczba etapów przejść, informacje o akustyce/oznaczeniach dotykowych, brakujące dane oraz daty i źródła. Wybiera trasę na podstawie tych informacji, odsłuchuje plan i może zobaczyć każdy odcinek w kolejności.

Przykład wyłącznie synthetic: "Wariant B jest dłuższy o 240 metrów. We wszystkich trzech etapach przejść są dane o sygnalizacji dźwiękowej. Na krótszej trasie przy jednym etapie brakuje tej informacji." Nie mówimy "o 32% bezpieczniej" ani "możesz przejść".

### Ekrany P0

| Ekran | Informacje i podstawowe akcje |
| --- | --- |
| Start i cel | Katalog punktów pilotażu, wyszukanie lokalne, zamiana A/B, granica obszaru, zgoda na opcjonalną lokalizację. |
| Preferencje | Akustyka, dotyk, oddzielne ciągi piesze, pomijanie znanych schodów, limit objazdu, jawny poziom wymagań danych. |
| Porównanie tras | 1-3 karty, różnice, rekomendacja z uzasadnieniem, stan niepełności, przejście do szczegółów. |
| Plan trasy | Tekstowe odcinki, przejścia, udogodnienia i ostrzeżenia, źródła, odczyt całości lub kolejnego elementu. |
| Podgląd/symulacja | Następne zdarzenie, powtórz, pauza, zakończ, stała etykieta demonstracji. |
| Informacje o danych | Pochodzenie, pobranie, potwierdzenie, konflikty, zakres, ograniczenia prototypu. |

Zgłoszenia, terenowe prowadzenie foreground i zapis ostatniego planu należą do P1. Mapa może powstać po scenariuszu tekstowym; nie jest zależnością routingu.

## 2. Zakresy i warunki przejścia

**P0 / demonstrator:** jedna dzielnica lub korytarz, 5-10 punktów, rzeczywiste obliczanie tras na małym grafie, dane OSM ze wskazaniem ograniczeń, alternatywy, źródła, odsłuch, podstawowe testy dostępności oraz tryb synthetic na przypadki błędne. Nie wymaga kont ani danych osobowych.

**P1 / pilotaż techniczny:** P0 po testach + kontrolowana nawigacja foreground, niepewność GPS, replan na żądanie, lokalny zapis planu, zgłoszenia z moderacją, deployment, audyt kilku rzeczywistych tras i testy z osobami niewidomymi/ekspertem orientacji przestrzennej. Odbiór P1 nie oznacza dopuszczenia samodzielnej, ogólnodostępnej nawigacji bez dalszej walidacji.

**P2 / produkt:** development build, praca w tle, większy graf, regularna weryfikacja danych, proces wsparcia i incydentów, wymagany przegląd bezpieczeństwa i prywatności. P2 ma oddzielny kosztorys i plan.

## 3. Najpierw zweryfikować założenia

Pierwszego dnia ustalamy dostępne telefony, wersję Expo Go i możliwość testów VoiceOver/TalkBack. Wybieramy obszar na podstawie topologii chodników, a nie atrakcyjności nazwy miejsca. Mierzymy obecność tagów akustyki i dotyku; brak danych raportujemy, nie uzupełniamy zgadywaniem.

Potrzebny jest partner do oceny zrozumiałości komunikatów. Bez takiego testu można zakończyć P0, lecz nie deklarować gotowości terenowej. Wagi routingu i progi GPS są początkowo hipotezami. Zespół ma zarezerwować czas na sprawdzenie, a nie tylko kodowanie.

## 4. Plan standardowy i budżet pracy

Proponowany harmonogram: **10-15 dni roboczych dla dwóch osób** z zależnościami i buforem. Szacunek backlogu poniżej to **128 osobogodzin**, nie pomiar wydajności modeli ani gwarancja terminu; dodatkowy bufor 20-30% daje ok. 154-166 osobogodzin. Czekanie na dostęp do urządzeń lub testy z użytkownikami może wydłużyć kalendarz.

| Etap | Okno orientacyjne | Rezultat i bramka |
| --- | --- | --- |
| Fundament | Dzień 1 | Monorepo, zgodne wersje, kontrakt, fixtures; obie osoby podpisują granicę API. |
| Równoległy pionowy scenariusz | Dni 2-3 | A: ekrany z mockiem. B: API i routing synthetic. Te same odpowiedzi po obu stronach. |
| Dane i wyjaśnienia | Dni 4-6 | OSM snapshot, normalizacja, graf, źródła; UI czytnika i mowa. |
| Integracja P0 | Dni 7-8 | Prawdziwy klient HTTP, test preferencji, błędy, demonstracja i ograniczenia. |
| P1 i utwardzenie | Dni 9-12 | GPS foreground, zapis, zgłoszenia, hosting, testy urządzeń i terenu. |
| Bufor i odbiór | Dni 13-15 | Poprawki po testach, odtworzenie wdrożenia, decyzja co wolno pokazać jako działające. |

Zadania A+B podają łączne osobogodziny, nie czas każdej osoby. Właściciel zadania odpowiada za merge i odbiór; drugi może recenzować. B ma więcej logiki backendowej, A ma odpowiedzialność za dostępność i testy urządzeń. Nie oszczędzamy czasu przez usunięcie kontroli pochodzenia danych.

## 5. Backlog do przekazania agentom

### Fundament

| ID / właściciel / czas | Zależność | Zakres i mierzalny odbiór |
| --- | --- | --- |
| F-01 / B / 4 h | Brak | Root monorepo pnpm, TS strict, lint, runner testów, workspace scripts, lokalny PostGIS, `.env.example`, CI. Instalacja z czystego checkoutu działa; wersje zapisane; brak sekretów. |
| F-02 / A+B / 8 h | F-01 | Zod i API draft na podstawie `docs/contracts.md`, przykłady sukces/błąd, eksport OpenAPI. Każdy przykład przechodzi walidację; `unknown`/`conflicting` mają osobne testy; obie osoby zatwierdzają. |
| F-03 / A / 4 h | F-01, uzgodniony SDK | Expo Router, adaptery platformowe, ekran startowy mobile/web, runner testów UI. Uruchomienie na co najmniej jednym telefonie i w przeglądarce; drugi OS jawnie w statusie. |

### Backend / rola B

| ID / czas | Zależność | Zakres i mierzalny odbiór |
| --- | --- | --- |
| B-01 / 4 h | F-02 | Fastify, health/readiness, katalog punktów, walidacja request/response, kontrolowane błędy. Błędne współrzędne odrzucone; API nie loguje body. |
| B-02 / 6 h | F-02 | Graf synthetic, Dijkstra, profile kosztu, alternatywy i limity. Test A/B/C z architektury: zmiana preferencji zmienia rekomendację; brak duplikatów i ujemnych kosztów. |
| B-03 / 6 h | F-02 | `EvidenceResolver`, osobne daty, stany wiedzy, przypisanie strony i kierunku. Konflikt nie znika; ponowny import nie odświeża obserwacji; brak tagu nie daje `false`. |
| B-04 / 8 h | B-01, B-03 | Adapter ograniczonego snapshotu OSM, raw records, checksum, licencja, raport pokrycia. Idempotentny import; test 429/timeout zachowuje ostatni dobry snapshot. |
| B-05 / 8 h | B-02, B-04 | Graf realnego obszaru i katalog wejść, QA topologii. Każde przejście ma prawidłowe strony/etapy; brak teleportacji; przerwa w danych daje brak trasy. |
| B-06 / 4 h | B-03, B-05 | Wyjaśnienia i metryki tras, wersje, błędy, wydajność. API wyjaśnia każdą rekomendację danymi; pomiar p95; budget limit nie jest `NO_PATH`. |

### Frontend / rola A

| ID / czas | Zależność | Zakres i mierzalny odbiór |
| --- | --- | --- |
| M-01 / 4 h | F-02, F-03 | Start/cel i preferencje z MockRouteApi; zgoda na lokalizację dopiero na żądanie. Pełny przebieg bez mapy, walidacja identycznych punktów, klawiatura web. |
| M-02 / 6 h | M-01 | Karty, porównanie, lista odcinków, źródła. Widoczne synthetic, unknown, conflict, stale, brak trasy, niedostępne API. Czytnik odczytuje istotne różnice. |
| M-03 / 6 h | M-02 | Koordynator mowy, kolejka, czytnik/TTS, powtórz/pauza. Brak podwójnej mowy i powtórzeń zdarzeń; test trybu cichego i braku głosu; odnotowane wyniki telefonów. |
| M-04 / 4 h | M-02, M-03 | Symulacja pozycji/zdarzeń i kontroler stanów, nie fikcyjna nawigacja live. Deterministyczny replay; synthetic blokuje teren; symulacja nie wymaga zgody GPS. |

### Integracja i odbiór P0

| ID / właściciel / czas | Zależność | Zakres i mierzalny odbiór |
| --- | --- | --- |
| I-01 / A+B / 6 h | B-06, M-04 | Przełączenie mock/HTTP jawne; realna trasa od A do B. Nie ma ręcznego przepisywania typów; UI i backend używają zgodnych wersji kontraktu. |
| T-01 / A+B / 8 h | I-01 | Macierz P0 z `docs/testing.md`: graf, dane, czytnik, klawiatura, kontrast, awaria źródła. Zapisane wyniki i ograniczenia, nie tylko checkboxy. |
| D-01 / A+B / 4 h | T-01 | Nagranie do 3 min, plan prezentacji PDF do 10 slajdów, opis modelu utrzymania. Demo zawiera alternatywę, źródło i niewiadomą; plan i rzeczywiste funkcje rozdzielone. |

### Rozszerzenie P1

| ID / właściciel / czas | Zależność | Zakres i mierzalny odbiór |
| --- | --- | --- |
| M-05 / A / 8 h | T-01 | GPS foreground, ostrożny map matching, AppState, utrata dokładności, replan na żądanie. Brak komunikatu "przejdź teraz"; pauza przy niepewności; test powrotu po blokadzie ekranu. |
| B-07 / B / 6 h | B-03, T-01 | Raporty, limity nadużyć, CLI moderacji i audyt. Zgłoszenie nie staje się automatycznie potwierdzonym faktem; sekret operatora nie występuje w mobile. |
| I-02 / A+B / 6 h | M-05 | Lokalny zapis planu, offline preview, zmiana wersji, ponowne obliczenie. Brak automatycznej zmiany geometrii w sesji i brak fikcyjnego offline routingu. |
| T-02 / A+B / 12 h | M-05, B-07, I-02 | Audyt kilku tras, testy z osobami niewidomymi/ekspertem, oba czytniki i zgody. Uczestnik może przerwać test; zapisana lista problemów i decyzja o ograniczeniach pilotażu. |
| O-01 / B / 6 h | T-01; przed publicznym P1 | Hosting HTTPS, migracje, backup i odtworzenie, monitoring, redakcja logów. Druga osoba odtwarza wdrożenie z instrukcji; rzeczywisty koszt i odpowiedzialność zapisane. |

### Jak rozumieć Definition of Done

Kod spełnia kryterium zadania, ma testy logiki i kontraktu, nie psuje wspólnego przebiegu oraz posiada uczciwy wpis w statusie. Zmiana danych/routingu ma wyjaśnienie i test regresji. Zmiana UI ma przejście przez scenariusz czytnika albo jawnie zapisaną blokadę odbioru na urządzeniu. Agent nie może sam zadeklarować wykonanego testu terenowego.

## 6. Zależności i krytyczna ścieżka

```text
F-01 -> F-02 -> B-01/B-02/B-03 -> B-04 -> B-05 -> B-06 --+
       F-03 -> M-01 -> M-02 -> M-03/M-04 ----------------+-> I-01 -> T-01 -> D-01
                                                                  |
                                                        M-05/B-07/O-01
                                                                  |
                                                             I-02 -> T-02
```

B-03 może powstawać równolegle z B-02 w osobnych modułach, ale dla jednej osoby B jest to sekwencyjny budżet pracy. Nie mylimy równoległości agentów z dodatkową przepustowością człowieka recenzującego. Osoba A nie czeka na realne OSM: implementuje kontrakt na fixtures i przeprowadza testy czytnika.

## 7. Wariant na 48 godzin

To **osobny zakres redukowany**, nie zobowiązanie wykonania 128 godzin w weekend. Przy łącznym budżecie ok. 32-40 osobogodzin priorytetem są: uzgodniony kontrakt, dwie lub trzy trasy na małym grafie, tekstowy przebieg, etykiety danych, jeden odsłuch i scenariusz awarii. Rezygnujemy z mapy, swobodnego geocodingu, zgłoszeń, zapisu offline, GPS live i rozbudowanego deploymentu.

| Okno | Osoba A | Osoba B |
| --- | --- | --- |
| 0-3 h | Ekrany i rozmowa o kontrakcie, test telefonu | Szkielet monorepo, schematy i fixtures |
| 3-10 h | UI tekstowe na mockach, stany, czytnik | Routing małego grafu, API, źródła |
| 10-16 h | Szczegóły i odsłuch, integracja | Ograniczony import/QA lub jasno oznaczony synthetic fallback |
| 16-20 h pracy rozłożonej w 2 dni | Wspólny test, poprawki, nagranie i prezentacja | Wspólny test, poprawki, nagranie i prezentacja |

Okna to kolejność prac, nie polecenie pracy bez przerwy. Jeżeli realny graf nie przejdzie audytu, demo pozostaje wprost synthetic. Pokazujemy działający algorytm i uczciwie opisujemy brak danych zamiast udawać kompletność Krakowa. Minimalnie warto pokazać osobno rzeczywisty, pobrany rekord OSM ze źródłem, lecz nie łączyć fikcyjnych udogodnień z prawdziwą trasą.

## 8. Testy z użytkownikami i kolejność ryzyka

Najpierw test siedzeniowy: czy osoba rozumie różnicę między brakiem infrastruktury, brakiem danych i potwierdzeniem? Następnie porównanie dwóch wariantów i sprawdzenie, czy potrafi wyjaśnić wybór bez patrzenia na mapę. Dopiero potem spacer na uprzednio sprawdzonej trasie, w towarzystwie i przy zachowaniu zwykłych pomocy w poruszaniu się. Prototyp nie jest jedynym źródłem orientacji.

Rekrutacja, zgoda na ewentualne nagranie i wynagrodzenie za konsultację wymagają ustalenia z ludźmi. Nie mamy jeszcze wyników takich testów. KPI pilotażu są celami: ukończenie scenariusza bez wzroku, poprawne odróżnienie niewiadomej od braku, brak sprzecznych komunikatów, odtworzenie błędów i akceptowalna liczba ogłoszeń.

## 9. Model wdrożenia i finansowania

Właściciel produktu poza UMK odpowiada za hosting, zgłoszenia, dane i aktualizacje. Przykładowy klient biznesowy to hotel lub organizator wydarzenia kupujący dostępny opis dojścia i jego aktualizację. Kierunki te odpowiadają briefowi; zainteresowanie klientów i przychód są dopiero hipotezą do rozmów.

Przed publicznym pilotażem: operator nazwany, koszty rzeczywistych dostawców przeliczone, licencje sprawdzone, zasady danych opisane, moderator i procedura reakcji wyznaczone. Nie obiecujemy utrzymania przez Miasto ani darmowych zasobów bez limitu. Płatność partnera nie może zmieniać rankingu tras.

## 10. Główne ryzyka i decyzje awaryjne

| Ryzyko | Wczesny sygnał | Reakcja |
| --- | --- | --- |
| Brak danych o akustyce | W audycie większość etapów ma `unknown` | Mniejszy obszar, dobrowolna weryfikacja zespołu, jawne unknown; nie fikcyjne dane. |
| Zła topologia | Trasa przecina jezdnię poza łącznikiem | Blokada publikacji grafu, test i przegląd; nie ukrywać problemu w UI. |
| GPS skacze między chodnikami | Niejednoznaczny map matching | Podgląd zamiast prowadzenia, wybór punktu, pauza i powtórna lokalizacja. |
| Czytnik i TTS mówią naraz | Test na telefonie | Jeden koordynator, domyślnie adapter czytnika, mniej automatycznych ogłoszeń. |
| Brak zgodnego Expo Go | Błąd uruchomienia na jednym OS | Zweryfikować SDK; development build jako osobna uzgodniona ścieżka; nie twierdzić, że działa. |
| Konflikty agentów | Różne DTO/lockfile | Jeden owner kontraktu, osobne branche, contract PR przed implementacją. |
| Brak czasu | Opóźniony graf lub testy | Zredukowany P0: tekst, algorytm, dane, odsłuch; odciąć dodatki, nie wiarygodność. |

## 11. Gotowe materiały a przyszłe zadania

Ten pakiet dostarcza dokumentację, syntetyczne przykłady i instrukcje agentów. Prezentacja PDF i film nie zostały tu utworzone; są zadaniem D-01, bo wymagają rzeczywiście działającego prototypu. Aktualnie dostarczony brief to `requirements.md`; `references/brief.pdf` nie występuje w workspace.
