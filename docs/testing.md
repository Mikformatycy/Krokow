# Odbiór prototypu P-05 / T-01

Stan iteracji: 2026-10-04. Kryteria pochodzą z [briefu](../requirements.md),
[planu](../plan.md) i [przekazania](handoff-codex.md). Ten raport uzupełnia
[historię testów UI](ui-a11y-report.md); nie zastępuje testu telefonu ani
weryfikacji infrastruktury w terenie. Bieżące wyniki komend: [status](status.md).

## Aktualizacja po audycie i uporządkowaniu dokumentacji

Ostatni pełny przebieg: **620 PASS** (606 workspace, w tym 170 mobile/web,
oraz 14 pilot), lint/typecheck i 31 generowanych plików PASS. Poniższe
164/164 odnoszą się do wcześniejszej próby P-05. Edycja dokumentów nie jest
nowym testem aplikacji ani urządzenia.

Po audycie dodano [model utrzymania, przenoszenia i skalowania](operations.md),
[31 bezpośrednich zależności i ich licencje](dependencies.md), aktualny start
w README, rejestr archiwów i scenariusz demonstracji. Poprawiono dokumenty
bieżące, a dawne raporty oznaczono jako historyczne. Wiersze audytu poniżej
opisują stan **sprzed** tej korekty dokumentacji; jego ustalenia zachowano.

Utrzymanie/przenoszenie/skalowanie ma teraz konkretny opis: role operatora,
budżet infrastruktury i pracy, aktualizacje/korekty, backup/odtworzenie,
przeniesienie API/web i zmiany kodu potrzebne do dodania miasta/kategorii.
To nadal propozycja, nie odebrane wdrożenie. Pozostają decyzje człowieka
o podmiocie i kontakcie operatora oraz licencji własnego kodu; inwentaryzacja
bezpośrednich pakietów nie jest pełnym audytem zależności przechodnich.
PDF/film oraz pozostały odbiór urządzenia są nadal otwarte.

## Zakres odbioru lokalnego

| Kryterium | Weryfikacja | Granica wyniku |
| --- | --- | --- |
| Wyszukanie miejsca poza grafem | Pilot: Nowa Huta, przyczyna braku tras, zero żądań routingu, powrót do propozycji | Wyszukiwarka Krakowa nie oznacza pokrycia trasami całego miasta. |
| Adres i konkretne wejście | Pilot: „Pawia 5” → pełna nazwa wejścia i adres w etykiecie, następnie „High5ive” | Wybór wejścia ma jawne wiązanie do grafu; punkt adresowy nie zastępuje wejścia. |
| Rzeczywista trasa i informacje | Pilot: Galeria Pawia → High5ive zachodnie, geometria, nieznana akustyka, nawierzchnia, źródła i oddzielne daty | Podgląd; rekordy opisują obiekty wszystkich zwróconych wariantów, nie całą długość wybranej trasy. |
| Twarde wymaganie | Pilot: ta sama para z wymaganą opisaną akustyką; NO_MATCHING_ROUTE, ustawienie zachowane | Brak automatycznej zmiany preferencji. |
| Rozłączny graf | Pilot: Rynek Główny → Galeria Pawia; HTTP 422 / NO_PATH, osobny komunikat UI | Brak połączenia w danych, nie dowód braku rzeczywistej drogi. |
| Awaria źródła wyszukiwania | Przerwanie żądania HTTP, jawny błąd, ponowienie i ponowny powrót do propozycji | Bez cichego użycia starego katalogu lub mocka. |
| Klawiatura i fokus | Web: kreator, Enter, powrót/ponowienie, pisanie podczas opóźnionej odpowiedzi, rozwijanie szczegółów | Chromium desktop i szerokość 390 px; nie jest to VoiceOver/TalkBack. |
| Brak i konflikt danych | Synthetic: rozróżnienie obecności/braku/unknown/conflicting, dowody i daty | Dane fikcyjne są oznaczone; nie trafiają do pilota. |
| Tekst i mowa | Web: tekstowy przebieg, jawna symulacja synthetic, kolejka mowy, zatrzymanie i brak GPS w pilocie | Automatyczny test adapterów nie potwierdza fizycznego dźwięku ani czytnika. |
| Kontrast i duży tekst | Kontrola palety oraz istniejące próby web z powiększeniem 200% | Nie jest to pełny audyt WCAG; tekst systemowy telefonu pozostaje otwarty. |

W tej iteracji: **164/164 mobile/web PASS**, **14/14 pilot PASS**,
**132 contracts PASS**, lint/typecheck i zgodność 31 generowanych plików
PASS. Komendy i pozostałe kontrole są zapisane w statusie. Przed poprawką
testy odtworzyły cztery usterki fokusu/powrotu; końcowe przebiegi przeszły
bez ponowień. Historyczne wyniki z handoffu nie są nowym odbiorem.

Pomiar palety z `apps/mobile/src/components/theme.ts` (luminancja sRGB,
stosunek `(L jaśniejsza + 0,05) / (L ciemniejsza + 0,05)`): tekst główny
13,36:1 na tle / 15,10:1 na bieli; tekst pomocniczy 6,81:1 / 7,69:1;
biały tekst przycisku 8,19:1; tekst ostrzeżenia 9,88:1; obramowania
3,53:1 / 3,99:1; wskaźnik fokusu 5,70:1 / 6,44:1. Wynik dotyczy tych
par kolorów, nie wszystkich stanów renderowania i ustawień systemowych.

## Odbiór urządzenia — potwierdzenie użytkownika

2026-10-04, po przekazaniu pięciu kroków próby w Expo Go na iPhonie
z VoiceOver, użytkownik odpowiedział: **„wszystko dziala”**. Zapisujemy
PASS zgłoszone przez użytkownika dla poniższego zakresu, nie bezpośrednią
obserwację agenta. Model telefonu i aktualne wersje iOS/Expo Go nie zostały
podane przy tym potwierdzeniu.

| Krok przekazanej próby | Wynik użytkownika |
| --- | --- |
| Nowa Huta → przyczyna braku tras → powrót do propozycji z fokusem | PASS |
| Pawia 5 → Szukaj, schowanie klawiatury, fokus wyniku i gest Z | PASS |
| Galeria Pawia → High5ive zachodnie, plan około 420 m, odczyt informacji o odcinkach, źródła i dat | PASS |
| Wymagana opisana akustyka → odmowa, zachowane ustawienie | PASS |
| Uruchomienie i zatrzymanie odsłuchu bez VoiceOver; brak równoległego głosu aplikacji z VoiceOver | PASS |

Główny scenariusz iPhone/VoiceOver ma potwierdzenie użytkownika. Wcześniejszy
wybór pracy bez telefonu opisuje stan sprzed tej próby.

## Pozostały odbiór urządzenia

Dla wyszukiwania numerów słownie osobną próbą pozostaje dyktowanie „pawia
pięć” systemową klawiaturą iPhone'a, odczyt wyniku „Galeria Krakowska —
wejście od Pawiej. Pawia 5” i przejście do wyboru celu. Wpisanie tego samego
tekstu w teście przeglądarkowym nie potwierdza działania mikrofonu/dyktowania.
Użytkownik następnie zgłosił wyszarzenie wszystkich wyników. Odtworzono
blokadę przez powtórzenie zdarzenia z identycznym tekstem po otrzymaniu
odpowiedzi: UI ustawiało `loading` bez kolejnego żądania. Poprawka wiąże
ten stan z efektem wyszukiwania, a wynik z bieżącym zapytaniem. Ponowny
odbiór dyktowania na urządzeniu po tej zmianie pozostaje do wykonania.

Po zmianie ekranu głównego (2026-10-04) osobnego sprawdzenia na telefonie
wymaga nowe hasło „To mały krok dla człowieka, ale wielki krok dla Krakowa”,
układ logo pod przyciskami oraz jego opis dla czytnika. Dotychczasowe
potwierdzenie pięciu scenariuszy nie obejmuje tej zmiany.

Poniższych przypadków nie było w pięciu krokach przesłanych użytkownikowi;
pozostają **nieprzetestowane na urządzeniu**:

1. Wznowienie pisania podczas opóźnionego wyszukiwania, bez utraty fokusu.
2. Awaria wyszukiwarki, ponowienie i ponowny powrót do propozycji po awarii.
3. Rynek → Galeria: odczyt odrębnego komunikatu NO_PATH.
4. Jawna symulacja synthetic: odczyt, pauza i zakończenie.
5. Duży tekst systemowy oraz Android/TalkBack.

Przy kolejnej próbie zapisać model telefonu, wersje systemu/Expo Go,
czytnik i wynik konkretnego przypadku. Weryfikacja terenowa i pełny audyt
WCAG pozostają poza potwierdzeniem użytkownika.

## Kompletność względem briefu

- Grupa docelowa, scenariusz, architektura, źródła i ograniczenia mają
  implementację oraz opis w przekazaniu i [raporcie danych](data-audit-report.md).
- Główny scenariusz z czytnikiem na iPhonie został potwierdzony przez
  użytkownika. P-05 pozostaje częściowo otwarte dla wymienionych wyżej
  dodatkowych prób urządzenia; nie jest to pełny audyt dostępności.
- Model utrzymania i komercjalizacji jest propozycją w `architecture.md`
  i `plan.md`. Wskazanie odpowiedzialnego operatora, prezentacja PDF do
  10 slajdów i film do 3 minut pozostają materiałami P-06 do przygotowania;
  ta iteracja ich nie dostarcza ani nie publikuje.
- Regularne aktualizacje źródeł, obsługa zgłoszeń, wdrożenie stałej usługi,
  ORS i teren nie są funkcjami odebranymi na podstawie tego raportu.

## Audyt wszystkich wymagań briefu — 2026-10-04

**Werdykt: prototyp realizuje główny scenariusz, ale projekt w obecnym
workspace nie spełnia jeszcze wszystkich wymagań oddania.** Brakuje PDF
i filmu; model operatora oraz dokumentacja przekazania wymagają domknięcia.
Przegląd obejmuje lokalny kod i dane, także niezatwierdzone zmiany. Nie jest
odbiorem wersji opublikowanej na GitHubie ani ponownym testem telefonu.
Nowe wyniki komend zapisano w [statusie](status.md).

Znaczenie ocen: **spełnione** oznacza dostępny dowód w zakresie prototypu;
**częściowo** — wykonany fragment z konkretną luką; **brak** — nie ma
wymaganego artefaktu w bieżącym workspace; **do prezentacji** — funkcja
lub opis istnieje, lecz przebieg wystąpienia nie został tu zaobserwowany.
Ocena planu rozwoju nie oznacza wykonania opisanych w nim funkcji.

### Funkcje i rezultat (§1–3)

| Wymaganie | Ocena | Dowód i ograniczenie |
| --- | --- | --- |
| Wybór jednej grupy użytkowników | Spełnione | Osoby niewidome; preferencje akustyki, oznaczeń dotykowych, ciągów pieszych i schodów, tekst oraz odsłuch. `architecture.md` §1, `OptionsStep.tsx`. Grupy wózkowe w briefie są przykładami. |
| Ocena wybranego miejsca **lub** trasy według potrzeb | Spełnione w ograniczonym obszarze | Kreator → wyszukiwarka → rzeczywiste obliczenie → informacje. `apps/api/test/prototype.test.ts` i `apps/mobile/test/pilot/pilot.e2e.ts`. Wyszukanie dowolnego adresu nie gwarantuje trasy ani danych o dostępności budynku. |
| Konkretne informacje zamiast etykiety dostępne/niedostępne | Spełnione w zakresie dostępnych danych | Nawierzchnia konkretnych obiektów OSM, fakty/unknown etapów i dowody. `RouteResults.tsx`, `data-audit-report.md`. Katalog dowodów jest wspólny dla wariantów; nie wskazuje położenia każdego rekordu na wybranej trasie. |
| Jak najaktualniejsze informacje, jawna wiarygodność | Częściowo | Snapshot grafu pozyskano 2026-10-03; daty pobrania, edycji, obserwacji i potwierdzenia są oddzielne. 8344 rekordy są niezweryfikowane w terenie, akustyka wszystkich 479 etapów jest unknown. Nie ma dowodu bieżącego stanu infrastruktury ani działającej regularnej aktualizacji. Import na żądanie jest przewidziany dla P0. |
| Źródło, data i status informacji | Spełnione | Wspólny kontrakt Evidence/Fact, resolver, szczegóły źródeł i obiektów w UI. Ponowny import nie staje się potwierdzeniem. |
| Publiczne źródła, bez ręcznej bazy Miasta i systemów UMK/MJO | Spełnione w bieżącej implementacji | Archiwa OSM, lokalny graf i indeks. `apps/api/src/main.ts` ładuje pliki; żądanie trasy nie odpytuje miejskich systemów. Własny operator importu nie jest pracownikiem Miasta utrzymującym bazę. |
| Prostota użytkowania | Częściowo potwierdzone | Kreator, duże kontrolki, testy klawiatury; użytkownik potwierdził pięć prób iPhone/VoiceOver. Brak szerszej walidacji użyteczności; ostatnie podsumowanie trasy zmieniono po próbie telefonu. |
| Łatwość wdrożenia u odbiorców | Częściowo | Są manifesty, lockfile, archiwa i instrukcje lokalnego uruchomienia. Brak odbioru wdrożenia przez niezależny podmiot; README zawiera starsze, sprzeczne instrukcje. |
| Potencjał rozwoju, komercjalizacji i skalowania | Spełnione jako propozycja | `architecture.md` §15 i `plan.md` §9: bezpłatny użytek indywidualny, płatny widget/plany dojścia i aktualizacje dla hoteli/organizatorów. Nie jest to potwierdzenie popytu ani gotowy produkt B2B. |

### Materiały formalne (§4)

| Wymaganie | Ocena | Dowód i ograniczenie |
| --- | --- | --- |
| Opis problemu i rozwiązania | Spełnione | README, `architecture.md` §1 i `plan.md`. |
| Prototyp lub demonstracja działania | Spełnione lokalnie | Kod aplikacji/API, wspólne kontrakty, rzeczywisty i syntetyczny scenariusz oraz testy. |
| Grupa docelowa i sposób wykorzystania | Spełnione | Osoby niewidome, planowanie przed wyruszeniem, bez prowadzenia w terenie. |
| Opis źródeł, aktualności i wiarygodności | Spełnione, opis rozproszony | Rejestr źródeł, README archiwów `krakow-prototype`/`krakow-search`, capture.json, raport audytu i resolver B-03. Główny rejestr opisuje starszy pilot; wymaga scalenia opisu aktualnych archiwów. |
| Propozycja modelu biznesowego i rozwoju | Spełnione jako propozycja | `architecture.md` §15, `plan.md` §9; walidacja rynku nie jest wymagana do samego przedstawienia propozycji. |
| PDF, maksymalnie 10 slajdów | Brak | `deliverables/Kroków-prezentacja.pdf` jest usunięty w bieżącym workspace. Wcześniejszy wpis o ośmiu slajdach jest historyczny. |
| Film do 3 minut w dostępnym, otwartym repozytorium | Brak lokalnego aktualnego filmu; publikacja niepotwierdzona | `deliverables/Krok-po-kroku-demo.mp4` jest usunięty. Nie sprawdzano dostępności dawnego filmu na zdalnym repozytorium; nie potwierdzałby on automatycznie obecnej wersji prototypu. |

### Technika, organizacja i źródła (§5 i §7)

| Wymaganie | Ocena | Dowód i ograniczenie |
| --- | --- | --- |
| Demonstracja głównego scenariusza w dowolnej formie technicznej | Spełnione lokalnie | Expo/mobile/web oraz Fastify; przykład Galeria Pawia → High5ive zachodnie, około 420 m, informacje o nawierzchni i brakach danych. |
| Oddzielenie pozyskiwania/aktualizacji od prezentacji | Spełnione | `packages/ingestion`, `packages/routing`, `packages/contracts`, `apps/api`, `apps/mobile`; opis przepływu w architekturze. |
| Sposób dodawania źródeł, kategorii i obszarów | Częściowo | Granice adapterów i model danych są opisane, podobnie audyt nowego miasta. Runtime nadal wybiera Kraków w `main.ts`, a `searchCatalog.ts` ma stałe identyfikatory miasta. Nowe miasto/kategoria wymagają zmian kodu i testów, nie samej konfiguracji; brakuje praktycznej instrukcji rozszerzenia. |
| Pochodzenie i warunki użytych danych | Udokumentowane; bez pełnego audytu licencyjnego | OSM/ODbL i atrybucja w UI, źródłowe URL, daty, zapytania/checksumy w archiwach. Graf z BBBike, katalog miasta z Overpass. Nie sprawdzano ponownie zewnętrznych warunków dostawców. Nie korzystamy z danych miejskich wymagających opisu API UMK. |
| Aktualizacje i zachowanie podczas awarii | Spełnione jako mechanizm prototypu i plan | Importer ma ograniczone ponowienia, zachowuje ostatni dobry staging, runtime czyta archiwa. P0 import na żądanie, P1 proponowany harmonogram. Publikacja nowego archiwum wymaga audytu; brak uruchomionego automatycznego procesu nie jest sam w sobie zakazanym stanem prototypu. |
| Odróżnienie danych niezweryfikowanych od potwierdzonych | Spełnione | `verificationStatus`, `reliability`, oddzielne daty, etykiety unverified w UI; resolver odrzuca pending/rejected. |
| Przewidziany sposób poprawiania błędnych/starych danych | Spełnione na poziomie projektu i rdzenia | Moderacja i zastąpienie obserwacji z uzasadnieniem/audytem w `architecture.md` §6 i `docs/b03-evidence.md`; implementacja supersession w resolverze. Brak formularza zgłoszeń i CLI operatora nie przekreśla wymogu „przewidywać sposób”, ale operacyjny kontakt/procedura pozostają do ustalenia. |
| WCAG 2.2 AA jako cel, klawiatura, czytnik, kontrast, tekst | Częściowo potwierdzone | Cel zapisany, kontrola palety i klawiatury, pełny tekst, historyczny PASS użytkownika iPhone/VoiceOver. Nowe podsumowanie, duży tekst telefonu i pozostałe próby urządzenia otwarte. Brak deklaracji pełnej zgodności WCAG. |
| Wykaz działających funkcji i dalszych prac | Spełnione | Status, niniejszy raport i handoff; starsze części README wymagają uporządkowania. |
| Utrzymanie poza UMK: podmiot, hosting, aktualizacje, bezpieczeństwo, zgłoszenia, koszty | Częściowo | `architecture.md` §13–14 i `plan.md` §9 opisują model i roboczą kopertę 200–500 PLN/mies., bez pracy ludzi. Operator występuje jako ogólny „zespół/operator”; brak nazwanego podmiotu i podziału odpowiedzialności. Koszty moderacji/weryfikacji/wsparcia nie są oszacowane. Stała usługa nie jest wymagana. |
| Zasady prywatności i bezpiecznych połączeń; brak diagnozy | Spełnione jako opis i lokalne zabezpieczenia | Planowanie bez konta/diagnozy, walidacja wejść/wyjść, brak body/współrzędnych/preferencji w logach API, no-store; testy prywatności. HTTPS przewidziane dla dostępu zdalnego, tunel opisany. Brak nowego audytu tunelu, proxy i produkcyjnego TLS; lokalne HTTP jest konfiguracją developerską. |
| Zależności od dostawców i licencje komponentów | Częściowo | Stack, OSM/ODbL, Overpass, BBBike oraz Expo/ngrok są wskazane w różnych dokumentach. Brak zestawienia licencji bibliotek/komponentów i jasno wybranej licencji własnego kodu w repozytorium. Lockfile jest listą wersji, nie kompletnym opisem zasad dalszego wykorzystania. |
| Przeniesienie na inną infrastrukturę i kolejne miasto | Częściowo | Rozdzielone moduły i lokalne archiwa umożliwiają przenoszenie; plan nowego miasta opisany. Brak odebranego przeniesienia i instrukcji dla innego operatora. Stałe Krakowa oraz konfiguracja lokalnego PostGIS wymagają uwzględnienia. |

### Walidacja i prezentacja (§6)

| Wymaganie | Ocena | Dowód i ograniczenie |
| --- | --- | --- |
| Pokazać co najmniej jedno miejsce/trasę i konkretne bariery/udogodnienia | Funkcja dostępna; do prezentacji | Realny plan pokazuje nawierzchnię i luki. Syntetyczny scenariusz pokazuje obecność/brak akustyki i wpływ preferencji. Nie wolno twierdzić, że realny plan ma potwierdzoną akustykę. |
| Pokazać źródła, daty, niepełne/stare/niezweryfikowane dane i etykietę przykładów | Funkcja dostępna; do prezentacji | Szczegóły UI, synthetic/preview_only oraz przypadki stale/unknown/conflicting w testach i fixtures. |
| Sprawdzić co najmniej jeden przypadek konfliktu, braków albo awarii | Spełnione w testach | Resolver, kontrakty, API i scenariusze web obejmują wszystkie trzy; awaria nie przełącza automatycznie na mock, unknown nie daje potwierdzenia. |
| Podstawowa kontrola dostępności i zapis ograniczeń/planu | Częściowo dla najnowszej wersji | Testy klawiatury/tekstu, kontrola kontrastu i historyczny odczyt VoiceOver są zapisane. Potrzebny krótki ponowny odbiór nowego podsumowania; pozostałe ograniczenia urządzenia wymieniono wyżej. |
| Plan przejścia do usługi przedstawiony w prezentacji | Częściowo | Propozycja w architekturze/planu; PDF nie istnieje, operator nie został nazwany. |

§8 podaje wagi oceny, a §9 akcentuje komercjalizację; nie są dodatkową
listą funkcji. Model biznesowy i wdrożenie mają łącznie 40% wagi, dlatego
ich opis powinien trafić do materiałów. Nie przyznaję procentu zgodności
ani przewidywanej punktacji jury. §10 zawiera kontakty, bez kryterium odbioru.
Repozytorium kodu, zrzuty i publiczny link do aplikacji są w §4 opcjonalne.

### Rozbieżności i następny zakres

1. Materiały `deliverables/` są usunięte, a README i `demo-budget.md` nadal
   odsyłają do nich jak do istniejących plików. `demo-delivery.md` twierdzi,
   że brief nie jest dostępny, chociaż obecne requirements.md zawiera limity.
2. Dolne sekcje README opisują stary interfejs, niegotowy realny graf i brak
   próby telefonu; kolidują z kodem i nowszym statusem. Architektura odsyła
   do nieistniejącego `docs/workflow.md`; obecny plik to `workflow.md` i nie
   wskazuje operatora. Nie zmieniano tych dokumentów podczas audytu.
3. Dane obejmują 30 końców tras w pięciu grupach i 96 556 wpisów wyszukiwania.
   Nie dowodzą dostępności całego miasta. Informacja o nawierzchni konkretnych
   obiektów nie jest oceną całej trasy. Brak akustyki w modelu nie oznacza
   braku urządzeń w terenie.
4. Najbliższe konkretne zadanie P-06: przygotować aktualny film do 3 minut
   i PDF do 10 slajdów, zawierające działający scenariusz, źródła, niewiadome,
   model biznesowy i plan utrzymania. Równocześnie domknąć wskazanie operatora,
   opis licencji i spójny start dla innego wykonawcy. Publikacja filmu wymaga
   odrębnego polecenia; ten audyt nie znosi zakazu pushów.

Do pełnego briefu nie trzeba automatycznie dodawać GPS, mapy, ORS, wszystkich
przykładowych rodzajów udogodnień, wszystkich grup użytkowników, stałego
hostingu ani ogólnomiejskiego routingu. Ograniczony prototyp i oznaczone
dane przykładowe są dopuszczone. Próby terenowe i pełny audyt WCAG to odrębne
zakresy, których nie zastępuje zgodność dokumentacji lub wynik testów kodu.
