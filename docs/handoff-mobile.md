# Handoff A — M-04, 2026-10-03

> **Dokument historyczny — odczytuj w kontekście opisanej iteracji.**
> Aktualny stan: [README](../README.md), [odbiór](testing.md) i [status](status.md).
> Integracja wyszukiwania/API jest zakończona; ostatnia pełna kontrola miała
> 620 testów PASS, a pięć prób iPhone/VoiceOver potwierdził użytkownik.
> Nowe podsumowanie i pozostałe próby urządzenia są otwarte. Dawne A/B,
> NOT TESTED, „do integracji” i listy przyszłych modułów niżej nie opisują
> automatycznie stanu obecnego. Aktualne materiały PDF/film są do wykonania.

> Cały projekt przejmuje jeden Codex, 2026-10-04. Aktualny punkt wejścia:
> [handoff-codex.md](handoff-codex.md). Poniższe raporty A/B są historią;
> nie oznaczają dalszej równoległej pracy Claude'a nad UI.

> Aktualizacja integracyjna B na nowe polecenie użytkownika, 2026-10-04:
> podłączono `/v1/place-search` do istniejącego kreatora oraz dane obiektów
> tras do rozwijanych szczegółów. Zachowano projekt UI, symulację i mowę A.
> Wyniki i dokładny zakres B: [handoff-backend.md](handoff-backend.md).
> Raporty A poniżej pozostawiono bez zmian. Pozostaje test nowych wyników
> wyszukiwania i informacji o odcinkach na iPhonie z VoiceOver.

## Claude Code — przebudowa UI (kreator, duże kontrolki, mniej tekstu), 2026-10-04 — GOTOWE DO INTEGRACJI

Polecenie użytkownika: UI schludne i przystępne dla osób niewidomych, duże
przyciski, mało tekstu, możliwość mówienia, bez długiej listy przy wyborze trasy.
Użytkownik zgłosił też z iPhone'a (VoiceOver): escape ma chować klawiaturę; z
„Opcji demonstracji” nie dało się wyjść gestami. Opis zmian, uzasadnienie i wyniki:
[ui-a11y-report.md — iteracja 2](ui-a11y-report.md).

Pliki A: nowe `apps/mobile/src/components/{ToggleRow,ChoiceGroup}.tsx`,
`apps/mobile/src/features/planning/{PlaceStep,OptionsStep}.tsx`; usunięte (zastąpione)
`features/planning/{PlacePicker,SpeechPlayer}.tsx`; zmienione `components/{theme.ts,ActionButton,ActionLink,Screen,Details,SectionHeading,SectionHeading.web}.tsx`,
`adapters/accessibility/ScreenHeading{,.web}.tsx`, `features/planning/{PlanningScreen,RouteResults}.tsx`,
`features/planning/{routeText,styles}.ts`, `features/simulation/SimulationPanel.tsx`,
`features/welcome/{WelcomeScreen,AboutDataScreen}.tsx`; testy `test/{ui-helpers,planning,progressive-ui,speech,welcome,http-planning,simulation-ui,reader-a11y}.spec.ts`
oraz `test/pilot/pilot.e2e.ts`. Lokalna konfiguracja podglądu `.claude/launch.json`
(port A 8085 → API 3003). Dokumenty: raport, notka w `docs/mobile-ux.md`, ten wpis, wpis A w statusie.
Bez zmian API, kontraktów, rankingu, zależności, manifestów i lockfile.

**Przekazanie B:** przejrzeć i zatwierdzić zmiany A (commit). Dla jednoprzyciskowego
rozpoznawania mowy potrzebna byłaby decyzja użytkownika o development buildzie
(moduł natywny poza Expo Go); obecnie działa dyktowanie z klawiatury systemowej, a „Szukaj” chowa klawiaturę.

## Claude Code przejmuje A — blokery czytnika ekranu — GOTOWE DO INTEGRACJI

Na polecenie użytkownika rolę A (UI/UX, dostępność) prowadzi Claude Code.
Wymagania: [claude-ui-instructions.md](claude-ui-instructions.md); audyt, wyniki
i instrukcja testów manualnych: [ui-a11y-report.md](ui-a11y-report.md).
Zakres: blokery głównego scenariusza bez patrzenia — symulacja i „Powtórz
komunikat” słyszalne przez VoiceOver/TalkBack (jeden kanał na zdarzenie),
ogłaszane błędy, wybór punktu z nazwą i bez utraty fokusu, liczba wyników po
ustabilizowaniu zapytania, jawne ponowienie katalogu, fokus przez
`sendAccessibilityEvent`, słowne wartości dowodów, stan zajętości.
Bez zmian API, kontraktów, rankingu, zależności, manifestów i lockfile.

Pliki A: `apps/mobile/src/adapters/accessibility/{announce.ts,announce.web.ts,ScreenHeading.tsx,focusControl.ts}`,
`apps/mobile/src/components/{LiveMessage.tsx,ActionButton.tsx}`, `apps/mobile/src/app/+html.tsx`,
`apps/mobile/src/features/planning/{PlacePicker.tsx,PlanningScreen.tsx,RouteResults.tsx,routeText.ts,useRoutePlayback.ts}`,
`apps/mobile/src/features/simulation/{session.ts,SimulationPanel.tsx}`,
`apps/mobile/test/{reader-a11y.spec.ts,simulation-speech.spec.ts,simulation-ui.spec.ts,planning.spec.ts,ui-helpers.ts}`,
`apps/mobile/AGENTS.md`. Instrukcje ról (na polecenie użytkownika): `AGENTS.md`,
`agent.md`, `README.md`, `architecture.md`, `plan.md`, `codex-start.md`,
`claude-start.md`. Dokumenty: `docs/ui-a11y-report.md`, ten wpis, wpis A w `docs/status.md`.
`CLAUDE.md` i `docs/claude-ui-instructions.md` to niezatwierdzone zmiany użytkownika —
A ich nie edytowała.

Wyniki komend: [raport, sekcja Wyniki](ui-a11y-report.md#wyniki).
iPhone/VoiceOver, Android/TalkBack, duży tekst systemowy: **NOT TESTED**.

**Przekazanie B:** przejrzeć diff powyższych plików, wykonać wspólne kontrole
i commit (A nie wykonuje operacji Git). Decyzja potrzebna przed iteracją 2:
czy A może zmienić `apps/mobile/app.json` (`userInterfaceStyle: "automatic"`)
dla trybu ciemnego, czy zmiana należy do B jako konfiguracja/manifest.

## Bieżąca integracja UX i pilot — GOTOWE DO INTEGRACJI

A przeczytała pilne przekazanie B o API pilot na 3003. Zakres rozszerzenia:
HTTP przyjmuje istniejące pilot/preview_only, UI pokazuje nazwę obszaru,
prawdziwe źródła i braki danych, odsłuch ma prawidłową etykietę, a sesja
symulacji pozostaje wyłącznie synthetic. Bez zmiany kontraktów, GPS i B.
Kryteria: test rzeczywistego HTTP na 3003, wybór realnych punktów, twardy
warunek bez rozluźniania, brak przycisku symulacji i fikcyjnego oznaczenia.
Publiczne 3001 pozostaje w gestii B; A odświeży własny Metro po kontroli UI.
**Wynik integracji pilot:** 6/6 testów desktop/wąski web PASS na rzeczywistym
API 3003: wyszukiwanie Galerii, trasa do High5ive, źródło OSM, unknown,
blokada synthetic-only symulacji i zachowanie twardych wymagań przy braku
trasy. Test odrzuca także pilot z foreground_experimental, obcy mode,
brak geometrii i odpowiedź łamiącą wymaganie akustyki. Mobile lint/typecheck,
121 contracts i 31 testów rdzenia PASS. Finalna regresja i export iOS
zakończone; dokładne wyniki poniżej. B może przełączyć 3001 na pilot;
klient obsługuje oba tryby. Wspólny lint początkowo zgłosił map-extract.ts:10
w pracy B; ponowne lint/typecheck całego repo przeszły. A nie zmieniała B.

### Rezultat UX i pliki

- Kontrolki `ActionButton`, `ActionLink`: co najmniej 64 jednostki wysokości,
  większy tekst i pełna szerokość. `Screen`, `SectionHeading` i planning/styles
  mają ciaśniejsze marginesy, także dla wąskiego widoku przy powiększeniu 200%.
- Nowe `components/Details.tsx`: dodatkowa treść domyślnie niewyrenderowana,
  stan rozwinięcia dostępny czytnikowi. `WelcomeScreen` ma dwie główne akcje.
- `PlanningScreen`, `PlacePicker`: ustawienia na żądanie, twardy warunek
  zawsze widoczny; po obliczeniu formularz zastępuje wynik. Edycja zachowuje
  ustawienia i unieważnia sesję. Zmiana źródła czyści punkty poprzedniego
  katalogu, ale nie rozluźnia wymagań. Błędne ukryte pole otwiera ustawienia.
- `RouteResults`, `SpeechPlayer`, `SimulationPanel`: krótki wybrany plan,
  jeden stały przycisk Start/Pauza/Wznów, powtórzenie, rozwijana historia,
  porównanie/źródła i pomoc. `focusControl.ts` przywraca fokus po końcu/reset.
- `routeText.ts`, nowe `simulation/summary.ts`: krótszy tekst wizualny
  zachowuje unknown, conflicting, known(false), wiarygodność i aktualność.
  Daty nadal w pełnych szczegółach. Treść mowy synthetic bez zmiany.
- `HttpRouteApi`, `speechText`, `useRoutePlayback`: pilot/preview_only,
  prawidłowa zapowiedź rzeczywistych danych, brak symulacji dla pilot;
  walidacja schematu i twardych wymagań zachowana. Nie zmieniono rdzenia
  SimulationSession, koordynatora mowy, DTO, rankingu ani zależności.
- Testy: zaktualizowane planning/http-planning/speech/simulation-ui/welcome,
  nowe progressive-ui/simulation-summary/ui-helpers oraz
  `test/pilot.config.ts` i `test/pilot/pilot.e2e.ts`. Runner pilot korzysta
  z rzeczywistego API B na 3003, bez kopiowania jego danych lub uruchamiania API.

### Komendy i wyniki końcowe

Uruchamiane wrapperem Node 24.21.0 / pnpm 10.34.6:
`npm.cmd exec --yes --package=node@24.21.0 --package=pnpm@10.34.6 --call "…"`.

| Komenda | Wynik |
| --- | --- |
| `pnpm lint` / `pnpm typecheck` | PASS całego repo po aktualizacji równoległej pracy B. |
| `pnpm exec eslint apps/mobile --max-warnings 0` / `pnpm --filter @krok/mobile typecheck` | PASS zakresu A, również po korekcie testu przełączania katalogu. |
| `pnpm test:contracts` | 121 PASS. |
| `pnpm --filter @krok/mobile exec playwright test --config test/simulation.config.ts` | 31 PASS. |
| `pnpm test:mobile` | Po UX 136 PASS; po dodaniu pilot 134 PASS i 2 nieaktualne oczekiwania testu przełączania katalogu. Poprawiono test: po zmianie źródła wybiera punkty jawnie. |
| `pnpm --filter @krok/mobile exec playwright test test/simulation-ui.spec.ts --grep HTTP --output .expo/ux-recheck` | Oba powyższe przypadki PASS (2/2). |
| `pnpm --filter @krok/mobile exec playwright test test/progressive-ui.spec.ts --output .expo/ux-layout-check` | 6/6 PASS po końcowej korekcie odstępów; obejmuje fokus, ukrywanie ustawień, wysokość przycisków i 200%. |
| `pnpm --filter @krok/mobile exec playwright test --config test/pilot.config.ts` | 6/6 PASS z realnym API na 3003. |
| `pnpm --filter @krok/mobile build:web` | PASS, 5 stron. |
| `pnpm --filter @krok/mobile exec expo export --platform ios --output-dir .expo/ux-pilot-ios --max-workers 2` | PASS, Hermes 3,2 MB. |
| `git diff --check -- apps/mobile docs/handoff-mobile.md` | PASS. |

Pierwsza próba UX wykryła rywalizujące dwa nagłówki o fokus; usunięto
drugi autofocus i ponowiono testy. Skrypt pilot początkowo wymagał poprawy
katalogu roboczego; końcowy runner podaje go jawnie. Screenshot wąski 200%
obejrzany po korekcie: etykiety przycisków mieszczą całe słowa, bez poziomego
przewijania. Nie jest to audyt WCAG ani wynik VoiceOver.

### Telefon, ograniczenia i przekazanie B

Użytkownik potwierdził uruchomienie wcześniejszej symulacji i mowę na iPhonie.
Nowy UX, VoiceOver, powrót z tła i TalkBack **nieprzetestowane na urządzeniu**.
Odsłuch pełnego planu nadal może być długi; szczegółów infrastruktury nie
usuwano z mowy. Rzeczywisty pilot jest podglądem małego obszaru i nie ma
prowadzenia ani potwierdzenia warunków na miejscu.

**B: przełącz publiczne API 3001 na zweryfikowany pilot, pozostaw gateway
8082/ngrok i Metro 8081, następnie zintegruj pliki A bez zmian kontraktu.**
Metro A zostało odświeżone pod dotychczasowym adresem Expo Go; aplikacja
po przeładowaniu odczyta aktualny coverage. Nie trzeba zmieniać jej API URL.
Końcowa kontrola tunelu: manifest iOS SDK 57.0.0, bundle HTTP 200,
6 889 116 bajtów; zawiera nowe rozwijane sekcje, sterowanie i mniejsze
odstępy. W chwili kontroli publiczny coverage nadal synthetic/preview_only.
Metro słucha na 8081 jako PID 7932 (launcher 29216); logi
`.expo/phone-Metro-ux.out.log` i `.expo/phone-Metro-ux.err.log`.
Gateway/API/ngrok bez restartu ze strony A w tej iteracji.
Brak commitów/pushów/checkoutów/worktrees. A zapisywała wyłącznie mobile
i ten raport. Centralny status i Git pozostają po stronie B.

---

## Poprzedni handoff M-04 (przed uproszczeniem UX)

Stan: **GOTOWE DO INTEGRACJI**. Zakres zapisany przed implementacją.
Po zakończeniu poniższych kontroli A przestaje edytować przekazane pliki.
To gotowość integracji UI, nie pełny odbiór M-03/M-04 na telefonie.

## Zakres i założenia

Podłączenie istniejącej SimulationSession do wyniku i wybranego wariantu,
z jednym SpeechCoordinator dla odsłuchu planu i symulacji. Bez przebudowy
rdzenia, GPS, nowych zależności i zmian kontraktu. Jawna symulacja synthetic /
preview_only; tekst zdarzeń i postępu, start/pauza/wznowienie/powtórzenie/reset/
zakończenie. Korekta speechText według kontraktu: dystans, przy remisie
start → zdarzenia → odcinek → koniec; szablony faktów pozostają istniejące.

Zapis wyłącznie apps/mobile/** i ten raport. B obsługuje Git, backend,
kontrakty, manifesty główne, lockfile i docs/status.md. Stan Git na starcie
czysty; brak obu raportów handoff. Nie używam worktrees ani subagentów.

## Kryteria

- Sterowanie dostępne tekstowo i klawiaturą w web; symulacja bez zgody GPS.
- Jeden właściciel mowy; czytnik blokuje TTS, domyślnie symulacja bez głosu.
- Zmiana formularza/wariantu/odpowiedzi i wyjście zatrzymują starą sesję;
  tło pauzuje i kasuje mowę, powrót nie wznawia automatycznie.
- Regresje kolejności, braku zdublowanych zdarzeń i starych callbacków.
- lint, typecheck, test:contracts, dedykowany runner symulacji,
  test:mobile (porty 8085/3002), build:web oraz kontrola diffu.
- iPhone/VoiceOver, Android/TalkBack, rzeczywisty dźwięk i tryb cichy:
  nieprzetestowane na urządzeniu. Pełny odbiór M-03/M-04 wymaga telefonu.

## Implementacja i pliki A do integracji

1. `apps/mobile/src/features/planning/useRoutePlayback.ts` — właściciel jednego
   koordynatora, wybór wariantu, przekazanie mowy między planem i istniejącą
   sesją, timer 250 ms z zegarem monotonicznym, focus i cykl życia odpowiedzi.
2. `apps/mobile/src/features/planning/SpeechPlayer.tsx` — wspólny wybór wariantu,
   sterowanie odsłuchem i osadzenie symulacji; status głosu zależy od trybu.
3. `apps/mobile/src/features/simulation/SimulationPanel.tsx` — jawne tempo 16×,
   postęp, ostatni komunikat i wszystkie dotychczasowe zdarzenia (także kilka
   przypadających na ten sam tick), sześć akcji i jawne włączenie głosu.
4. `apps/mobile/src/adapters/speech/platform.ts` — stan początkowy AppState,
   powiadomienia zarówno o ukryciu, jak i powrocie.
5. `apps/mobile/src/adapters/speech/platform.web.ts` — visibilitychange,
   pagehide/pageshow; zachowana ręczna deklaracja czytnika na web.
6. `apps/mobile/src/features/planning/speechText.ts` — poprawiona kolejność
   remisów i użycie istniejącego speechChunks zamiast drugiego dzielnika.
7. `apps/mobile/test/speech-coordinator.spec.ts` — regresja kolejności tekstu
   przy remisach i pierwszeństwa dystansu nad rodzajem elementu.
8. `apps/mobile/test/simulation-ui.spec.ts` — dziewięć scenariuszy UI:
   klawiatura/sterowanie/reset/koniec, pojedyncza kolejka i stare callbacki,
   czytnik, tło/powrót, zmiana wariantu/formularza/wyniku, wyjście, brak głosu,
   deterministyczny pełny replay, wynik prawdziwego synthetic HTTP, błąd mowy.
9. `docs/handoff-mobile.md` — zakres, wyniki i przekazanie.

Gotowe `plan/controller/session/text` i `SpeechCoordinator` bez zmian.
Reset zeruje postęp i historię, start jest nadal ręczny. Powtórzenie nie
dopisuje drugi raz zdarzenia do historii. Zakończenie unieważnia sesję;
kolejny start tworzy świeżą. Zmiana wariantu wyłącza głos symulacji.
Zatrzymanie odsłuchu wyłącza także głos dalszych zdarzeń symulacji;
ponowne włączenie nie odtwarza zaległości. Tło pauzuje sesję, a wyjście
z ekranu ją unieważnia również wtedy, gdy nawigator zachowa ekran w stosie.

## Kontrole

Polecenia z katalogu głównego przez uzgodniony wrapper:

```powershell
npm.cmd exec --yes --package=node@24.21.0 --package=pnpm@10.34.6 --call "<polecenie z tabeli>"
```

| Polecenie | Wynik |
| --- | --- |
| `pnpm lint` | PASS, również po ostatnich zmianach kodu i testów. |
| `pnpm typecheck` | PASS, wszystkie pięć pakietów workspace. |
| `pnpm --filter @krok/mobile exec playwright test --config test/simulation.config.ts` | 30 PASS, bez serwerów i przeglądarki. |
| `pnpm test:contracts` | 121 PASS. |
| `pnpm --filter @krok/mobile exec playwright test test/simulation-ui.spec.ts test/speech.spec.ts --project=desktop-chromium` | Pierwszy przebieg: 8 PASS / 3 FAIL. Błędy nowych testów: innerText wobec textContent, oczekiwanie braku nowego zdarzenia po przekroczeniu 100 m, wpisanie wartości identycznej z aktualną zamiast edycji. Poprawiono testy; kolejne wyniki poniżej. |
| `pnpm test:mobile` | **128 PASS** w 2,4 min: 64 scenariusze w desktop-chromium i narrow-chromium, w tym wszystkie 9 nowych scenariuszy UI w obu widokach. |
| `pnpm build:web` | PASS, eksport 5 stron do apps/mobile/dist. |
| `git diff --check -- apps/mobile docs/handoff-mobile.md` | PASS; Git informuje o przyszłej konwersji LF/CRLF w SpeechPlayer. Osobna kontrola dziewięciu plików handoff potwierdziła brak trailing whitespace także w nowych plikach. |

Testy UI używają rzeczywistej sesji/koordynatora i atrapy portu syntezatora
oraz zegara. API/Metro uruchamia tylko runner na 3002/8085. Porty B i tunel
pozostały nietknięte. Ostrzeżenia NO_COLOR/FORCE_COLOR i brak lokalnego .env
runnera nie blokowały testów. Nie instalowano zależności.
Przejrzano zrzuty symulacji desktop i 390 px: tekst i kontrolki mieszczą się
w widoku, dłuższy opis zawija się. Runner zakończył serwery 8085/3002.
Eksport dist i test-results są artefaktami lokalnymi, nie częścią listy do Git.

## Ograniczenia, ryzyka i przekazanie B

- iPhone/Expo Go/VoiceOver, Android/TalkBack, rzeczywisty dźwięk, tryb cichy
  i natywne przejścia AppState: **nieprzetestowane na urządzeniu**.
  Chromium w szerokim/wąskim widoku nie zastępuje tych kontroli ani audytu WCAG.
- Odbiór całego M-03/M-04 pozostaje otwarty do próby telefonu. Na telefonie
  sprawdzić głos pl-PL/tryb cichy, włączanie czytnika w trakcie wypowiedzi,
  tło/blokadę ekranu/powrót bez auto-wznowienia i zmianę wariantu/wyjście.
- Tempo 16× dotyczy tylko demonstracji. Kolejka może mówić dłużej niż trwa
  symulowany marsz; postęp jest tekstowo niezależny od zakończenia mowy.
  Pauza, reset, zakończenie i zatrzymanie odsłuchu kasują zaległą kolejkę.
- Brak zmiany schematów, fixtures, szablonów faktów o przejściach, rankingu,
  manifestów i lockfile. Brak zależności od nowego resolvera B-03/importu.
- B równolegle edytuje routing i własny handoff; te pliki nie należą do
  powyższej listy. A nie wykonywała operacji zapisujących Git ani aktualizacji
  centralnego statusu.
- Raport B odczytano ponownie na końcu: B-03 nadal W TRAKCIE, bez podłączenia
  do API. Opisane ograniczenie conflicting dla rewizji jednego źródła wymaga
  późniejszego przeglądu; nie blokuje symulacji obecnych walidowanych fixtures.
- Konkretne przekazanie B: przejrzeć i zintegrować wyłącznie dziewięć
  wymienionych plików A, wykonać wspólne kontrole oraz dopisać wynik/link
  do tego raportu w swoim wpisie docs/status.md; następnie zorganizować
  osobny odbiór telefonu. Git/publikacja zgodnie z upoważnieniem użytkownika
  pozostają po stronie B.

## Kontynuacja A — przegląd przekazania B-03

2026-10-03, na polecenie użytkownika po udostępnieniu końcowego raportu B.
Zakres przed realizacją: przegląd prezentacji unknown/unsupported_value dla
sprzecznych rewizji jednego pochodzenia, walidatora DTO i istniejących szablonów
tekstu/mowy; weryfikacja odpowiednich testów oraz konkretny plan odbioru telefonu.
Kod M-04 przekazany wyżej pozostaje zamrożony do integracji B. Nie podłączam
resolvera do mobile/API, nie zmieniam kontraktu ani semantyki komunikatów.
Zapis tej kontynuacji: wyłącznie niniejszy raport. Kryterium zakończenia:
udokumentować, co obecny klient potrafi odróżnić, czego brakuje na granicy API
i jakie warunki musi spełnić publikacja realnych danych. Wynik przeglądu
nie jest odbiorem B-03 jako całości ani testem telefonu.

Użytkownik potwierdził dostępność iPhone'a do próby. A przygotowuje również
lokalny eksport iOS (artefakt w ignorowanym apps/mobile/.expo), bez uruchamiania
podglądu/tunelu B. Eksport sprawdza budowanie natywnego bundla, nie urządzenie.

### Wynik przeglądu prezentacji B-03

**Przegląd A zakończony: bez blokady integracji obecnego M-04, z blokadą
odbioru prezentacji inconsistent_origin przed publikacją realnych danych.**
Nie jest to akceptacja całego resolvera ani decyzja o nowym kontrakcie.

1. `packages/routing/src/evidence/resolve.ts:143–159` odróżnia w audycie
   inconsistent_origin od unsupported_observation, ale obie przyczyny
   sprowadza do identycznego publicznego `unknown/unsupported_value` z pustym
   evidenceIds. Zachowuje niezależnie udowodniony conflicting. To poprawnie
   blokuje znaną wartość, lecz nie przekazuje przyczyny braku rozstrzygnięcia.
2. `packages/contracts/src/evidence.ts:14` dopuszcza missing, ambiguous_scope,
   unsupported_value. Nie ma inconsistent_origin ani pola audytu. Walidator
   `validate-routes.ts:55–59` wymaga niezależnych par źródło/rekord dla
   conflicting; nie wolno zmieniać stanu na conflicting tylko w kliencie.
3. `apps/mobile/src/features/planning/routeText.ts:15` przedstawia wszystkie
   unknown identycznie jako „Brak danych”. Ten formatter jest wspólny dla
   szczegółów, odsłuchu i symulacji. Karta sumuje unknown jako „brak danych”,
   a kontrakt wymaga MISSING_FEATURE_DATA dla wszystkich powodów unknown.
   Samo poprawienie jednego zdania nie ujawni więc niespójności w całym UI.
4. `RouteResults.tsx:16` pokazuje źródła faktu wyłącznie z evidenceIds.
   Przy pustej liście nie ma źródła/dat do pokazania przy takim fakcie.
   Globalny katalog źródeł nie określa, które rewizje są sprzeczne.
   Klient nie powinien wyprowadzać tej relacji z nazw lub note ani ponownie
   rozstrzygać dowodów. Schemat unknown dopuszcza referencje, ale zakres
   i zasady ich publikowania musi ustalić B; nie należy zwracać wszystkich
   odrzuconych lub niedopasowanych dowodów bez selekcji.
5. Obecny HttpRouteApi nadal odrzuca pilot i akceptuje synthetic/preview_only.
   B-03 nie jest podłączone do API. Powyższa luka nie zmienia wyniku ani
   odbioru testów obecnego demo; stanie się istotna przy publikowaniu danych.

**Przekazanie do B przed publikacją:** zachować blokadę publikacji przypadków
inconsistent_origin do wspólnego uzgodnienia publicznego oznaczenia problemu,
powiązanych dowodów i szablonów. Nie wystarczy uznać faktu za zgodny ze schematem.
Przyszły odbiór powinien objąć osobno: zwykły brak, niejednoznaczny zakres,
nieobsługiwaną wartość i sprzeczne rewizje; te same informacje w karcie,
szczegółach, ostrzeżeniach, odsłuchu i symulacji. Każda zmiana kontraktu wymaga
wersji, fixture i testów obu stron. A nie zmienia samodzielnie tych reguł.

### Kontrole tej kontynuacji

- `pnpm --filter @krok/routing test test/evidence.test.ts`: **47 PASS**,
  również test przeciwstawnych rewizji jednego pochodzenia i pełnego grafu.
- `pnpm --filter @krok/mobile exec playwright test --config test/simulation.config.ts`:
  **30 PASS** na aktualnym stanie. Oba polecenia przez Node 24.21.0/pnpm 10.34.6.
- Nie powtarzano pełnego web/lint/typecheck: brak nowych zmian kodu;
  wyniki wcześniejszej implementacji pozostają zapisane wyżej.
- `pnpm --filter @krok/mobile exec expo export --platform ios --output-dir .expo/m04-ios-review --max-workers 2`:
  **PASS**, 1241 modułów, bundle Hermes iOS 3,2 MB i 23 zasoby.
  Składnię sprawdzono wcześniej przez `expo export --help`. Artefakty
  pozostają lokalnie w ignorowanym katalogu, co potwierdza `git check-ignore`.
  To nie instalacja na iPhonie ani potwierdzenie działania VoiceOver/TTS.
- `git diff --check -- apps/mobile docs/handoff-mobile.md`: PASS.
  Jedyna wersjonowana zmiana tej kontynuacji to uzupełnienie handoff-mobile.md;
  kod wcześniejszej implementacji pozostał bez zmian. Bez commitów/pushów.

### Próba iPhone'a — przygotowanie

Użytkownik zadeklarował gotowość do testu, ale nie przekazał jeszcze żadnego
wyniku urządzenia. Odczyt portów: 8081/3001/8082/4040 nie nasłuchują.
`docs/phone-tunnel.md` odnotowuje wcześniejszy problem z LAN, więc starego QR
ani historycznego adresu tunelu nie oznaczamy jako działających.

**Do B (operatora podglądu):** po integracji plików A uruchomić aktualne Metro,
synthetic API, gateway i jeden tunel; potwierdzić manifest/bundle iOS oraz
health/API. Przekazać bieżący link Expo Go. Nie jest to polecenie zmiany
realnych danych, instalacji zależności ani wdrożenia produkcyjnego.

Gdy użytkownik otworzy aktualny projekt, próba przebiega etapami:

1. Zapisać model telefonu, iOS i wersję Expo Go. Otworzyć planowanie,
   przywrócić przykład, obliczyć trasy; potwierdzić sekcję „Symulacja wybranego
   wariantu” i etykietę 16×. Brak tej sekcji oznacza stary bundle.
2. Bez VoiceOver, przy wyłączonym trybie cichym i słyszalnej głośności:
   odsłuch planu → włączenie głosu symulacji → start. Oczekiwane zatrzymanie
   planu, pojedynczy głos i tekst zdarzeń. Pauza zatrzymuje postęp i mowę;
   powtórzenie mówi ostatnie zdarzenie, pozostawiając pauzę; wznowienie jest ręczne.
3. Podczas symulacji przejść do ekranu początkowego iPhone'a na 10 s.
   Po powrocie oczekiwana pauza, bez nadrabiania dystansu i automatycznej mowy.
   Osobno sprawdzić blokadę/odblokowanie telefonu. Nie oczekiwać komunikatu
   dźwiękowego w chwili przejścia do tła.
4. Włączyć VoiceOver podczas wypowiedzi: własny TTS ma się zatrzymać.
   Sprawdzić etykiety/stany przycisków, postęp, tekst zdarzenia, historię oraz
   logiczną kolejność fokusu. Wyłączenie VoiceOver nie odtwarza zaległej mowy.
5. Zmienić wariant, formularz i wyjść z ekranu: stara sesja nie wraca.
   Reset wymaga ponownego startu; zakończenie zatrzymuje także kolejkę.
6. Osobno tryb cichy i ewentualny brak polskiego głosu: zapisać rzeczywisty
   wynik, widoczność tekstu i komunikatu. Nie deklarować przetestowania braku
   głosu, jeżeli na urządzeniu był on dostępny.

Do czasu zwrotu wyników: iPhone/VoiceOver i rzeczywisty dźwięk nadal
**nieprzetestowane na urządzeniu**; Android/TalkBack również bez testu.

### Podgląd telefonu uruchomiony na polecenie użytkownika

Użytkownik uruchomił ngrok i polecił A wystawić projekt w Expo Go. To jawne
upoważnienie do uruchomienia podglądu w tej próbie, poza wcześniejszym
podziałem obsługi serwerów. Ngrok zastany na 4040 kieruje do 127.0.0.1:8082;
A nie uruchamiała drugiego tunelu ani nie odczytywała tokenu.

- Publiczny origin: `https://chaos-virtuous-mumble.ngrok-free.dev`.
- Expo Go: `exps://chaos-virtuous-mumble.ngrok-free.dev`.
- Przy wolnych portach uruchomiono synthetic API na 3001, istniejący gateway
  na 8082 (KROK_GATEWAY_ONLY=1) i Expo Go/Metro na 8081. Procesy działają
  w tle bez widocznych terminali; ngrok użytkownika pozostaje uruchomiony.
- Metro korzysta z tego samego publicznego origin dla API i packager proxy.
  Nie ustawiono REACT_NATIVE_PACKAGER_HOSTNAME. Tryb CI wyłącza automatyczne
  przeładowania, dlatego po przyszłych poprawkach potrzebny restart Metro.
- Kontrole publicznego adresu: health=ok; coverage synthetic/preview_only;
  manifest iOS SDK 57.0.0, launchAsset przez ten sam HTTPS; pobranie bundla
  HTTP 200, 6 882 966 bajtów. CLI zalogowane jako teodorsoprano.
- QR: `apps/mobile/.expo/phone-expo-go-qr.png`. Lokalne skrypty uruchomienia,
  logi, manifest i pobrany bundle znajdują się w ignorowanym `.expo`.
  Nie zmieniono kodu aplikacji, API, manifestów ani lockfile.
- Przekazanie B: pozostawić te procesy na czas próby iPhone'a; nie uruchamiać
  drugiej kopii na tych portach. Wynik rzeczywistego dźwięku/VoiceOver nadal
  wymaga odpowiedzi użytkownika. Aktualne uruchomienie nie oznacza testu telefonu.

## Iteracja UX po próbie telefonu — zakres zapisany przed implementacją

Użytkownik potwierdził, że symulacja uruchamia się na iPhonie i odtwarza mowę.
Nie potwierdził VoiceOver, zachowania tła ani pełnej macierzy odbioru.
Nowe polecenie: prostszy interfejs, duże przyciski, łatwe wybory i dodatkowy
tekst wyłącznie na żądanie. Zakres M-02/M-04: uproszczenie ekranów startu,
planowania, wyniku i sterowania symulacją; rozwijane szczegóły z jawnym stanem,
bez usuwania faktów, źródeł ani zmiany twardych wymagań. Rdzeń, kontrakt,
ranking i tekst wypowiadany przez TTS synthetic pozostają bez zmian.

Kryteria: cele dotykowe co najmniej 64 px, główna akcja przed dodatkowymi
opisami, schowane sekcje poza kolejnością czytnika/klawiatury, brak ukrywania
braków danych i konfliktów, dostępne źródła i tekst pełnego komunikatu,
stabilny fokus przy pauzie/wznowieniu, zachowanie ustawień po zwinięciu.
Testy: lint/typecheck, kontrakty, runner symulacji, web desktop/narrow i 200%,
build web/iOS. Po kontrolach A odświeży własny proces Metro tej próby pod
tym samym adresem ngrok; nie zmieni tunelu/API B. Nowy UX wymaga ponownej
oceny użytkownika na telefonie. Zapis wyłącznie mobile i ten handoff; bez Git.
