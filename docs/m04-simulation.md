# M-04 — niezależny rdzeń symulacji

Ten dokument zapisuje pierwszą iterację rdzenia. Kolejna iteracja dodaje [sesję i kolejkę mowy](m04-speech-session.md); tam znajduje się uzupełnienie zakresu integracji i aktualna lista zmian.

Osoba A, 2026-10-03. B prowadzi próbę telefonu. Zakres tej iteracji: walidowany plan zdarzeń i deterministyczny kontroler, bez podłączania ekranów, GPS i dźwięku. Kod powstaje w `slepa-genia-simulation` / `feat/M-04-simulation`. Na bazę HEAD nałożono kopię 171 bieżących plików źródłowych (bez `.env`, node_modules i materiałów binarnych); dla każdego sprawdzono SHA-256 źródła przed/po kopiowaniu i kopii. To lokalny snapshot niezatwierdzonej pracy, nie wspólny commit integracyjny. Nie scalać całego worktree nad późniejszymi zmianami B.

## Założenia i kryteria

- Wejściem jest pełna odpowiedź walidowana przez wspólny RouteResponseSchema i istniejący routeId. Wyłącznie synthetic + preview_only. Wszystkie fakty, dowody, wersje i daty pozostają przypięte do skopiowanej odpowiedzi. Brak tworzenia geometrii.
- Kolejność: dystans, następnie przy remisie start → zdarzenia w kolejności tablicy → odcinek → koniec, według README kontraktów. Klucz zawiera routeId, rodzaj i ID, więc krok i zdarzenie o takim samym ID nie kolidują.
- Stany: ready, running, paused, completed, invalidated. Start z ready; wznowienie tylko ręczne z paused i przy aktywnej aplikacji. Po zakończeniu potrzebny jawny reset. Invalidated jest stanem końcowym starego wyniku/wariantu.
- Wstrzykiwany zegar monotoniczny i jawne tick; bez timerów wewnątrz, Date.now, GPS i API. Dystans zależy od czasu, prędkości z odpowiedzi i mnożnika odtwarzania. Tick pomijający kilka punktów emituje wszystkie w kolejności, każdy raz.
- Pauza/ukrycie zatrzymuje na ostatnim zatwierdzonym przez tick dystansie, bez nadrabiania czasu. Powrót na pierwszy plan nie wznawia. Niepoprawny/cofnięty zegar pauzuje. Reset, pauza, ukrycie, powtórzenie i unieważnienie zwracają polecenie zatrzymania mowy.
- Każda seria ma token; tokeny poprzedniej serii lub innej instancji są odrzucane. Powtórzenie jest jawne, nie przesuwa pozycji i nie powtarza automatycznie minionych zdarzeń po wznowieniu.
- Kryteria techniczne: testy kolejności, dużego skoku czasu, drobnych ticków, pauzy, tła, końca/resetu, spóźnionych tokenów, niewłaściwego wejścia i niezmienności danych; lint/typecheck i testy kontraktowe. Bez nowych zależności i zmian kontraktu/lockfile.

## Integracja po przekazaniu telefonu

1. Tworzyć nową instancję dla konkretnego wyniku i wariantu. Przed zmianą wyniku/wariantu wywołać invalidate z odpowiednią przyczyną; na wyjściu z ekranu również invalidate. Nowe dane nie są doklejane do starej sesji.
2. Adapter ekranu obsługuje foreground/tick; stan jawnie nazywa się symulacją. Tekst jest zawsze dostępny. Ukrycie aplikacji wywołuje setActive(false), zatrzymuje zewnętrzny timer oraz mowę; powrót tylko setActive(true), bez resume.
3. Najpierw wykonać cancelSpeech z wyniku przejścia, potem obsłużyć emissions z jego tokenem. Każdy opóźniony callback sprawdza isCurrent(token). Jedyny właściciel dźwięku to istniejący SpeechCoordinator; nie tworzyć drugiego odtwarzacza. Kolejkowanie zdarzeń do niego pozostaje osobną częścią integracji.
4. Powtórzenie zatrzymuje starą wypowiedź i emituje ostatnią informację od początku. Nie obiecuje pauzy TTS wewnątrz zdania. Wykryty czytnik nadal blokuje własny TTS.

Rozbieżność do uzgodnienia przy integracji: obecny `speechText.ts` sortuje przy remisie kroki przed zdarzeniami, podczas gdy kontrakt wymaga start → zdarzenie → odcinek → koniec. Rdzeń stosuje kontrakt. Nie zmieniono istniejącego odsłuchu w czasie próby telefonu; docelowo oba widoki powinny korzystać ze wspólnej kolejności.

## Uruchomienie testów bez serwerów

Z katalogu głównego worktree, przypięte Node/pnpm jak w README:

```sh
pnpm --filter @krok/mobile exec playwright test --config test/simulation.config.ts
pnpm lint
pnpm typecheck
pnpm test:contracts
pnpm check:generated
```

Konfiguracja testów symulacji nie uruchamia Metro, API ani przeglądarki. Dotychczasowy runner mobile również wykrywa plik `simulation.spec.ts`, więc po integracji wejdzie on do istniejącego CI. Nie uruchamiamy teraz pełnego runnera z serwerami podczas próby B.

Pełne M-04 pozostaje nieodebrane do integracji UI/mowy i testów urządzenia. Ten rdzeń nie zmienia aplikacji uruchomionej na telefonie.

## Wyniki tej iteracji

- `pnpm install --offline --frozen-lockfile --network-concurrency=2 --child-concurrency=1`: PASS w osobnym worktree; pakiety z cache, bez zmiany manifestów i lockfile.
- Dedykowany Playwright: **15 testów PASS**, bez serwerów i przeglądarki. Oprócz scenariuszy granicznych wykonano replay wszystkich wariantów ze wszystkich wspólnych routeScenarios. Fakty i dowody zachowały treść.
- `pnpm lint` i `pnpm typecheck`: PASS, cały skopiowany workspace, w tym nowy kontroler i testy.
- `pnpm test:contracts`: **121 testów PASS**. `pnpm check:generated`: **29 artefaktów zgodnych**.
- Porównanie SHA-256 z manifestem snapshotu: wszystkie 171 skopiowanych plików bazowych bez zmian podczas implementacji. Doszło pięć plików wymienionych poniżej. Nowe pliki bez trailing whitespace.
- Nie uruchamiano testów UI, eksportów ani natywnych modułów — brak integracji z ekranem i odsłuchem. iPhone/VoiceOver, Android/TalkBack: **nieprzetestowane na urządzeniu**. Sygnał cancelSpeech jest przetestowany jako wynik kontrolera, nie jako rzeczywiste zatrzymanie dźwięku.

Do przeniesienia po próbie telefonu wyłącznie:

1. `apps/mobile/src/features/simulation/plan.ts`
2. `apps/mobile/src/features/simulation/controller.ts`
3. `apps/mobile/test/simulation.spec.ts`
4. `apps/mobile/test/simulation.config.ts`
5. `docs/m04-simulation.md`

Nie kopiować reszty źródeł, manifestów ani lockfile z tego snapshotu do nowszej pracy B. Po przeniesieniu wykonać dedykowane testy i typecheck na aktualnym wspólnym stanie. Podłączenie ekranu, cyklu AppState i jednego koordynatora mowy to następna iteracja M-04, po przekazaniu poprawek telefonu.
