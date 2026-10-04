# Plan domknięcia prototypu: audyt danych i informacje przy trasie

> Aktualizacja organizacyjna: całość przejmuje jeden Codex — [handoff](handoff-codex.md).
> Oznaczenia A/B poniżej opisują pierwotny podział obszarów. Jeden wykonawca
> weryfikuje obecnie oba końce integracji; nie oczekuje na nieaktywne sesje.

Data: 2026-10-04. **P-01–P-04 zrealizowane; P-05 częściowo odebrane; P-06 otwarte.**
Użytkownik zakończył etap UI i zlecił implementację brakującej funkcjonalności.
Zakres zapisano przed edycją w [prototype-completion.md](prototype-completion.md).
P-01 wykonano dla bieżącego archiwum tras; P-02 wybrano trzy rzeczywiste pary
w [data-audit-report.md](data-audit-report.md). P-03/P-04 zaimplementowano
z zachowaniem kontraktów i kreatora. P-05: 620 testów PASS w ostatniej
pełnej kontroli oraz pięć prób iPhone/VoiceOver potwierdzonych przez użytkownika.
Pozostały zakres w [testing.md](testing.md). P-06 nadal planowane.
ORS, nowe importy i zmiany topologii nie weszły w zakres tej realizacji.

## Historyczny plan wykonania audytu

Poniższy tekst zachowuje zakres zapisany przed implementacją. Dawne
„planowane”, „nieutworzone”, „sam plan” i przydziały A/B odnoszą się do tamtej
iteracji; nie są aktualną blokadą pracy. Obecny backlog: [plan.md](../plan.md).

## Cel i podstawa

Spełnić [requirements.md](../requirements.md), szczególnie sekcje 3, 5 i 6:
wyszukać miejsce lub trasę, przedstawić konkretne informacje o barierach lub
udogodnieniach dla osoby niewidomej, ich źródła, daty i wiarygodność oraz
pokazać przypadek brakujących/sprzecznych danych albo awarii źródła.
Sama liczba miejsc i zwykły przebieg pieszy nie stanowią tego odbioru.

Rozwiązanie działa bez wewnętrznych systemów UMK/MJO i bez ręcznego
utrzymywania bazy przez Miasto. Nie uzależniać demonstracji od uzyskania
ewidencji ZDMK, odpowiedzi urzędu ani przyszłej współpracy terenowej.
Publiczne zbiory miejskie można rozważyć dopiero po wskazaniu konkretnego
zasobu, warunków wykorzystania i sposobu aktualizacji. Zgłoszenia i własna
weryfikacja nie są zakazane przez brief, ale nie należą do najbliższej iteracji.

## Baza do wykorzystania, nie do odtworzenia

Według [statusu](status.md) istnieją: importer i archiwa OSM, resolver faktów,
graf i planner, wspólne kontrakty, API, wyszukiwarka miasta, kreator UI oraz
koordynator mowy. Backend raportował 96 556 wpisów i 30 końców tras; nie jest
to dowód ogólnomiejskiego pokrycia routingu ani audyt udogodnień tych tras.
A raportuje, że podłączenie `/v1/place-search` do UI pozostaje do wykonania.
Ustalić aktualny stan z kodu i handoffów przed przyszłą implementacją.

Nie odtwarzać M-04, B-03, bootstrapu, indeksu ani silnika. Istniejące audyty
topologii, HTTP i wydajności wykorzystać jako wejście; nie nazywać ich
potwierdzeniem terenowym ani pełnym audytem informacji o dostępności.

## Kolejność i właściciele

| Etap | Właściciel | Zależność | Wynik i warunek zakończenia |
| --- | --- | --- | --- |
| P-01 Audyt lokalnych danych | B / Codex | Polecenie rozpoczęcia | Odtwarzalny raport pokrycia i przypisań; także poprawny wynik „brak danych”. Bez zmiany danych serwowanych. |
| P-02 Wybór demonstracji i granicy API | A+B | P-01 | Wybrane rzeczywiste miejsce/trasa, lista faktów i luk, reakcja UI; ewentualna propozycja kontraktu z przykładem. |
| P-03 Informacje w API | B / Codex | P-02; wspólny odbiór zmiany kontraktu, jeśli potrzebna | Fakty przy właściwych obiektach/etapach, źródła i daty, testy regresji. Bez zmiany wag i twardych wymagań. |
| P-04 Wyszukiwanie, opis i odsłuch | A / Claude | Istniejący odebrany kontrakt wyszukiwania; dla nowych faktów P-02/P-03 | Dostępny przebieg wyszukanie → wybór → plan → informacje/odsłuch, zachowujący prosty kreator. |
| P-05 Odbiór funkcjonalny | A+B | P-03/P-04 | Zapisane wyniki trzech scenariuszy, kontrola klawiatury, czytnika, kontrastu i tekstu; niewykonane próby jawne. |
| P-06 Materiały oddania | A+B | P-05 i zlecenie przygotowania materiałów | PDF do 10 slajdów, film do 3 min, źródła, ograniczenia, model utrzymania/biznesowy. Teraz tylko pozycja planu. |

Po uruchomieniu realizacji A może niezależnie domykać integrację istniejącej
wyszukiwarki i scenariusze testowe. Nie wymyśla nowych DTO/faktów w oczekiwaniu
na B. P-01 jest rozwinięciem B-04/B-06, P-03 B-06, P-04 M-02/I-01,
P-05 T-01, P-06 D-01 z [planu ogólnego](../plan.md), a nie restartem tych modułów.

## P-01 — jak wykonać audyt programowy

**Wejście:** istniejące archiwa `packages/ingestion/data/krakow/`,
`krakow-prototype/`, `krakow-search/`, ich capture/checksumy, aktualny graf,
normalizator i resolver. Katalog wyszukiwania sam w sobie nie jest grafem
ani kompletną bazą cech infrastruktury. Na tym etapie bez pobierania nowych
danych, modyfikacji raw, odświeżania dat i publikowania nowego snapshotu.

1. Zapisać wersje wejść, checksumy, obszar, daty pobrania, pochodzenie i
   licencję. Zaznaczyć braki metadanych i zakres każdego archiwum.
2. Zliczyć surowe oznaczenia akustyki, oznaczeń dotykowych, schodów oraz
   nawierzchni. Dla każdej cechy określić populację/mianownik (np. przejścia,
   węzły przy przejściach, odcinki); brak tagu mierzyć w tej populacji,
   nie we wszystkich budynkach i POI. Zachować wartości nieobsługiwane.
3. Osobno wykazać wynik obecnej normalizacji: znana wartość (w tym false),
   unknown z przyczyną i conflicting. Nie sprowadzać wielowartościowej
   nawierzchni/dotyku do boolean. Wartości częściowe, sygnał lokalizacyjny,
   aktywacja urządzenia i niejednoznaczny zakres wymagają osobnej informacji,
   nie automatycznej obietnicy pełnej akustyki przejścia.
4. Sprawdzić przypisanie po identyfikatorach OSM oraz udowodnionej topologii:
   obiekt, strona, kierunek, poziom, etap. Punkt przy przejściu nie opisuje
   automatycznie całego przejścia; bliskość nie dowodzi przypisania.
5. Porównać cztery poziomy: raw → znormalizowane fakty → graf → odpowiedź
   API dla istniejącej trasy. Raportować osobno brak w źródle, nieobsługiwaną
   wartość, niejednoznaczne przypisanie, wyłączenie topologii i fakt obecny
   w grafie, lecz nieprzekazywany do UI. To nie są te same luki.
6. Dla kilku tras z istniejącego katalogu policzyć unikalne przejścia/etapy,
   stany faktów i metry odcinków z brakami, z jawnym mianownikiem. Nie liczyć
   dwóch kierunków tej samej krawędzi jako dwóch niezależnych potwierdzeń.
   Brak przejść nie oznacza „100% potwierdzonej dostępności”.
7. Wybrać 2–3 kandydatów do demonstracji dopiero na podstawie raportu.
   Dla każdego podać endpointy, wersje, identyfikatory dowodów/obiektów,
   fakty do pokazania, luki i rzeczywistą komendę odtworzenia.

**Planowane artefakty, jeszcze nieutworzone:**
`docs/data-audit-report.md` oraz `packages/ingestion/data/audits/accessibility-audit.json`.
Raport ma mieć podsumowanie liczb, szczegóły odrzuceń i maszynowo czytelne
rekordy odsyłające do źródeł. Skrypt umieścić w istniejącym pakiecie ingestion,
wykorzystać istniejące funkcje. Raportowanie ma być deterministyczne dla
przypiętych wejść i jawnego czasu oceny, poza oddzielnym czasem wykonania.

**Jeżeli danych jest za mało:** zakończyć P-01 uczciwym raportem luk.
Nie dopisywać faktów, nie rozszerzać importu automatycznie i nie ogłaszać
spełnienia wymogu pokazania konkretnych udogodnień. Rozważyć istniejący,
udokumentowany fakt innego miejsca lub jawnie syntetyczny scenariusz
dopuszczony przez requirements.md §6. Nie mieszać synthetic z realnym miejscem.
Dodatkowe publiczne źródło lub teren to osobny opisany zakres, nie warunek
udawany jako już spełniony.

## P-02–P-04 — wykorzystanie wyników

- Najpierw sprawdzić istniejące DTO dowodów, zdarzeń, metryk i endpoint
  dowodów obiektu. Raport audytu nie staje się drugim kontraktem API.
- Przy nowym polu/stanie: potrzeba, przykład, wersja, test, odbiór obu stron,
  Zod jako jedno źródło, regeneracja OpenAPI/fixtures. Nie zmieniać drugiego
  modułu samodzielnie, żeby ominąć konflikt semantyki.
- Wynik użytkownika: konkretny fakt i jego zakres, źródło, data pozyskania,
  oddzielnie data obserwacji/potwierdzenia lub jej brak oraz wiarygodność.
  Przykład tekstu warunkowy: „Według OSM jest oznaczenie dotykowe po tej
  stronie przejścia; brak potwierdzenia terenowego” — tylko jeśli dane
  faktycznie opisują tę stronę. Brak informacji o stronie pozostaje jawny.
- A zachowuje duże przyciski i mało tekstu na ekranie głównym; szczegóły
  źródeł na żądanie. Brak danych i niespełniony twardy warunek nie mogą
  zniknąć wskutek uproszczenia ekranu lub skrócenia odczytu.
- `routing.available` w wyszukiwaniu oznacza przypisanie do grafu, nie
  dostępność infrastruktury. Dwa końce mogą dać NO_PATH. Punkt `poi` na
  ciągu pieszym nie staje się wejściem do budynku.

## ORS — opcja, nie przyjęta zmiana architektury

Nie implementować ORS w P-01 ani automatycznie po audycie. Wcześniejsza
rozmowa wskazała możliwość użycia, nie odbiór integracji. Ocena po P-01 ma
objąć warunki/licencje i limity konkretnej usługi, klucz wyłącznie na backendzie,
zakres danych wysyłanych do dostawcy, działanie przy awarii oraz koszt i hosting.
Nie tworzyć kont ani zamawiać usług w ramach tego planowania.

Zwykły routing pieszy nie potwierdza akustyki, dotyku ani właściwego wejścia.
Nie podłączać geometrii ORS do istniejącego DTO przez wymyślone edgeIds,
przejścia, dowody lub metryki. Nie używać go jako cichego fallbacku omijającego
twarde wymagania. Ewentualny osobny podgląd wymaga jawnej semantyki,
przykładów i wspólnego przeglądu; zmiana zakresu wymaga polecenia użytkownika.
Ocena kilku tras ORS nie gwarantuje znalezienia najlepszej dla danego profilu.

## Odbiór po implementacji, nie w tej iteracji dokumentacyjnej

1. Miejsce/trasa z rzeczywistym, przypisanym faktem o barierze lub udogodnieniu
   i jego pochodzeniem; jeżeli brak takich danych, jawny wariant demonstracyjny
   i opis ograniczenia zamiast fikcyjnego faktu w prawdziwym miejscu.
2. Brak, konflikt danych lub niedostępne źródło: brak informacji nie daje
   potwierdzenia, błąd źródła nie staje się pustym sukcesem ani NO_PATH.
3. Twarde wymaganie niespełnione: własny stan, bez automatycznej zmiany
   preferencji; oddzielnie sprawdzić rozłączenie grafu.

B: testy stanów/zakresów/dat/deduplikacji, zgodność raportu z raw, regresja
planera i API, kontrakty, lint/typecheck; check:generated przy wspólnych
artefaktach. A: walidacja HTTP, stany UI, fokus/mowa, web, kontrast i próba
telefonu/czytnika. Korzystać ze skryptów w aktualnych manifestach; nie
przypisywać dawnych PASS nowej iteracji. Bez urządzenia: NOT TESTED.

Każdy raport rozróżnia: audyt danych, walidację kodu, audyt dostępności UI
i obserwację terenową. P-01 nie potwierdza działania sygnalizatorów teraz.
Nie deklarować pełnego WCAG ani gotowości do prowadzenia terenowego.

## Granice tej iteracji planowania

Teraz wyłącznie pliki instrukcji, plan i własny wpis dokumentacyjny w statusie.
Bez zmian kodu, kontraktów, fixtures, danych, manifestów i lockfile, bez
uruchamiania importów, testów aplikacji, restartowania procesów, commitów,
pushów, nowych worktrees i przełączania gałęzi. Zachować cudze zmiany.
Nie rozpoczynać etapów z tabeli w tej samej iteracji.
