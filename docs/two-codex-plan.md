# Kroków — ponowny podział pracy dwóch instancji

Stan i propozycja osoby A, 2026-10-03. Użytkownik przywrócił pracę dwóch Codexów; B obecnie pomaga uruchomić aplikację na iPhonie. Ten dokument ustala kolejność i granice kolejnych zadań. Nie jest raportem ich wykonania. Film i prezentacja pozostają odłożone zgodnie z nowszą decyzją użytkownika.

## Punkt wyjścia

| Obszar | Co już istnieje | Co pozostaje |
| --- | --- | --- |
| Fundament i kontrakt | Workspace, Expo SDK 57, Zod draft.2, wspólne fixtures i generowane OpenAPI. | Formalny przegląd kontraktu, zapisany punkt integracji w Git, zdalne CI. |
| Backend | B-01/B-02: HTTP i rzeczywiste obliczenia na grafie synthetic, zmiana rekomendacji wraz z akustyką, twarde wymagania i wersje. | B-03 resolver, B-04 import, B-05 graf realnego obszaru, B-06 weryfikacja na tym grafie. |
| Mobile | Formularz, jawny mock/HTTP, porównanie, rozwijany opis i dowody, minimalny odsłuch z zatrzymaniem/powtórzeniem. | Odbiór telefonu i czytnika, poprawki M-02/M-03, M-04 symulacja. Nie implementować ponownie istniejących ekranów. |
| Dane realne | Schematy przewidują tryb pilot. | Runtime korzysta z synthetic. HttpRouteApi jawnie odrzuca pilot, a UI ma teksty właściwe demonstracji. Import danych sam nie odblokuje klienta. |
| Testy | Według ostatniego wpisu B: 121 contracts, 40 routing, 86 API i 60 wykonań mobile — PASS. | To wcześniejsze wyniki; w tej iteracji nie uruchamiano ich ponownie. Telefon i rzeczywisty dźwięk nadal bez potwierdzonego wyniku w statusie. |

HTTP na synthetic nie oznacza odbioru całego I-01: plan wymaga w nim również rzeczywistego obszaru. M-03 ma obecnie stop/powtórzenie, nie pełną pauzę/wznowienie i kolejkę zdarzeń nawigacyjnych.

## Teraz — bez zakłócania próby telefonu

**B ma wyłączność na bieżącą sesję telefonu:** procesy Metro/API, porty 8081/3001, konfigurację LAN, Expo i API URL oraz niezbędne poprawki uruchomienia. Także adaptery mowy, fokus i ekrany, jeśli błąd telefonu wymaga ich edycji. A nie restartuje tych procesów ani nie zmienia plików ładowanych przez aktywne Metro.

**A przygotowuje M-04:** specyfikację stanów i zdarzeń, przypadki testowe oraz przegląd istniejących DTO i koordynatora mowy. Kod czystego kontrolera i jego testów może powstawać dopiero w aktualnym, oddzielnym checkoutcie. Włączenie go do ekranów i mowy nastąpi po przekazaniu wyniku telefonu przez B. B nie zaczyna równolegle drugiej implementacji symulacji.

Odbiór pracy B: zapis iOS/Expo Go, połączenie telefonu z API, formularz → wynik → szczegóły, zmiana akustyki → inna rekomendacja, twardy wymóg → brak dopasowania, TTS/stop/powtórzenie, tryb cichy, VoiceOver bez równoległego TTS oraz zachowanie po ukryciu aplikacji. Przy blokerze: dokładny błąd i wynik odtworzenia zamiast deklaracji zaliczenia. Udany start nie oznacza zaliczenia wszystkich tych prób.

## Po próbie telefonu — stały podział

| Tor | Właściciel | Najbliższe zadanie | Granica plików | Mierzalny rezultat |
| --- | --- | --- | --- | --- |
| Mobile, UX i dostępność | A — ta rozmowa | M-04: jawna symulacja przejścia; wcześniej naprawa krytycznych problemów M-02/M-03 przekazanych z telefonu. | `apps/mobile/**`, testy UI/symulacji, dokumentacja UX. | Deterministyczny replay istniejącej RouteResponse, ustalona kolejność kroków i zdarzeń, deduplikacja po ID, start/pauza/wznowienie/reset; zmiana wariantu lub danych i ukrycie aplikacji zatrzymują sesję; zero GPS i brak możliwości uruchomienia prowadzenia terenowego. |
| Fakty, API i graf | B — druga rozmowa | B-03: EvidenceResolver, po przekazaniu poprawek telefonu A. | `packages/routing/**` (wydzielony resolver), `apps/api/**`; później `packages/ingestion/**` i `infra/**`. | Czyste funkcje z wstrzykiwanym czasem; rozdzielenie unknown/known(false)/conflicting; zakres obiekt/cecha/strona/kierunek/poziom; deduplikacja pochodzenia; ponowny import nie odmładza obserwacji; jawny audyt zastępowania dowodów. |

Pauza symulacji dotyczy odtwarzania zdarzeń. Nie obiecuje natywnego wznawiania TTS w połowie wypowiedzi. A wykorzystuje jeden istniejący koordynator mowy, bez tworzenia drugiej konkurencyjnej kolejki.

B-03 powinno produkować istniejące DTO faktów; potrzebne metadane audytu mogą pozostać wewnętrzne. Jeśli istniejący kontrakt nie wystarcza, B przedstawia konkretną zmianę z przykładem, A ustala reakcję UI, a dopiero potem B zmienia wersję i generuje artefakty. Nie dopowiadać semantyki zamykania konfliktu samą nowszą datą.

## Kolejność integracji i dalszy zakres

1. **Telefon i wspólny punkt startowy.** B zapisuje wyniki i przekazuje zmienione pliki. Zabezpieczyć aktualny, zintegrowany stan w Git; dopiero z tego stanu tworzyć branche i worktrees kolejnych zadań.
2. **Równolegle M-04 / B-03.** A testuje symulację na obecnych fixtures, B resolver niezależnie od UI. Istniejący synthetic HTTP nadal jest scenariuszem regresyjnym obu stron.
3. **Wspólny przegląd i odbiór synthetic.** Testy kontraktowe, mobilne, routing/API, wygenerowane pliki i powtórka scenariusza telefonu. Naprawy krytyczne mają pierwszeństwo przed nowym zakresem.
4. **Następna para zadań: B-04 / przygotowanie klienta do danych pilot.** B audytuje ograniczony snapshot OSM, licencję, checksum i pokrycie danych; A usuwa założenia „wyłącznie synthetic” w adapterze/prezentacji dopiero z uzgodnionymi przykładami pilot. Zachować blokadę prowadzenia w zakresie P0 i wszystkie etykiety pochodzenia. OSM nie jest warunkiem rozpoczęcia M-04.
5. **B-05/B-06 i pełne I-01 dopiero po audycie danych.** Konieczny jest wybrany mały obszar i dowody topologii. Braki mogą zakończyć się jawnym brakiem trasy; nie uzupełniać realnych miejsc fikcyjnymi udogodnieniami. A integruje tekst, dowody i błędy; B graf, spójność wersji i wydajność. Po tym T-01.

Siedem zgłoszonych sesji po pięć godzin traktujemy jako dostępność pracy, nie gwarancję ukończenia całego backlogu ani podwojenie budżetu przez dwie instancje. Cel najbliższej pary iteracji: telefon + symulacja + resolver. Import i realny graf są kolejnym zakresem zależnym od wyniku audytu, bez obietnicy zmieszczenia wszystkich etapów. Materiały D-01 pozostają odłożone. GPS P1, background navigation, konta, hosting produkcyjny i nowe usługi nie wchodzą do tego podziału.

## Zasady unikania konfliktów

- Aktualny główny checkout zawiera dużo niezatwierdzonej implementacji. Historyczny worktree backendu bazuje na starym stanie; nie zaczynać tam B-03 i nie kopiować z niego lockfile. Utworzenie worktree z obecnego HEAD bez zapisania nowych plików również da nieaktualny kod.
- Po zabezpieczeniu wspólnego stanu: osobne worktrees, np. A `feat/M-04-simulation`, B `feat/B-03-evidence-resolver`. Nie przełączać brancha w katalogu, z którego działa test telefonu. W tej iteracji planowania nie tworzono branchy, commitów ani worktrees.
- B jest jedynym integratorem root manifestów, lockfile, kontraktów i generowanych przykładów. A przekazuje potrzebną zmianę zależności; obie strony przeglądają zmianę semantyki. Nie wykonywać jednocześnie dwóch instalacji pnpm w tym samym checkoutcie.
- README i wspólne instrukcje aktualizuje integrator B na podstawie przekazania A. Każdy prowadzi własny wpis statusu; przy scalaniu zachować oba. Niniejszy plan jest propozycją A do przekazania B, nie potwierdzeniem, że druga rozmowa już go przeczytała.
- Testy A i B używają różnych checkoutów/portów oraz istniejących skryptów. Uzgodnić porty przed równoległym uruchomieniem: obecne Playwright używa 8085 i 3002. Nie zatrzymywać cudzych serwerów; na wspólnym hoście nie uruchamiać jednocześnie dwóch ciężkich eksportów.
- Każde przekazanie: commit/stan źródeł, zmienione pliki, wyniki testów, niewykonane testy, zmiana kontraktu/zależności i jedno zadanie dla drugiej strony. „Zaimplementowane” i „odebrane na urządzeniu” pozostają osobnymi stanami.

## Krótki komunikat do drugiej instancji

> Wracamy do dwóch Codexów. Dokończ obecną próbę iPhone/Expo Go i poprawki uruchomienia, mowy oraz czytnika; zapisz wynik i listę plików do przekazania A. A przygotowuje M-04 i nie zmienia aktywnego środowiska telefonu. Po zabezpieczeniu aktualnego wspólnego stanu rozdzielamy worktrees: A bierze mobile/M-04, Ty B-03 EvidenceResolver, następnie B-04 po wspólnym przeglądzie. Zachowujesz integrację kontraktów, manifestów i lockfile. Nie korzystaj ze starego worktree jako bieżącej bazy. Szczegóły: docs/two-codex-plan.md. Film i prezentacja pozostają odłożone.
