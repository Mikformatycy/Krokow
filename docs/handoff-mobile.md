# Handoff A — M-04, 2026-10-03

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
