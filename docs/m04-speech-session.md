# M-04 — sesja symulacji i wspólny odsłuch

> **Dokument historyczny — odczytuj w kontekście opisanej iteracji.**
> Aktualny stan: [README](../README.md), [odbiór](testing.md) i [status](status.md).
> Integracja wyszukiwania/API jest zakończona; ostatnia pełna kontrola miała
> 620 testów PASS, a pięć prób iPhone/VoiceOver potwierdził użytkownik.
> Nowe podsumowanie i pozostałe próby urządzenia są otwarte. Dawne A/B,
> NOT TESTED, „do integracji” i listy przyszłych modułów niżej nie opisują
> automatycznie stanu obecnego. Aktualne materiały PDF/film są do wykonania.

Zakres A, 2026-10-03: połączenie rdzenia symulacji z istniejącym SpeechCoordinator, nadal wyłącznie w worktree `slepa-genia-simulation`. B prowadzi próbę telefonu w głównym checkoutcie. Nie zmieniamy jego ekranów, środowiska, manifestów ani serwerów.

Kryteria przed implementacją: jedna kolejka mowy przy napływających zdarzeniach; istniejące play nadal zastępuje plan; enqueue dopisuje do tej samej kolejki także podczas wyszukiwania głosu. Stop, pauza, zmiana wariantu, tło i włączenie czytnika usuwają zaległe wypowiedzi. Zdarzenia pozostają tekstowe i uporządkowane; głos wymaga jawnego włączenia i potwierdzenia nieaktywnego czytnika. Brak automatycznego nadrabiania wypowiedzi po powrocie. Testy korzystają z rzeczywistego koordynatora i atrap tylko portu urządzenia/zegara.

Sesja przyjmuje jeden koordynator od właściciela ekranu. Podczas jej używania ekran nie steruje bezpośrednio drugą instancją ani dotychczasowym odtwarzaczem. Przejęcie/oddanie koordynatora wymaga zatrzymania; końcowe dispose koordynatora należy do właściciela ekranu. Sesja nie instaluje timerów ani natywnych listenerów. Adapter React/AppState pozostaje kolejną częścią integracji.

Tekst zdarzenia oznacza symulację i używa istniejących szablonów faktów. Nie tworzy nowych komunikatów pozwalających na przejście. Dzielenie wypowiedzi do 500 jednostek UTF-16 jest wspólne dla play/enqueue; nie rozcina par surogatów. Błąd/brak głosu ma status koordynatora, nie fikcyjny sukces.

Testy: dedykowany `test/simulation.config.ts` bez Metro/API/przeglądarki, wraz z wcześniejszymi testami koordynatora; lint, typecheck i kontrakty. Telefon i realny dźwięk pozostają osobnym odbiorem. Zmiany istniejącego koordynatora trzeba później scalić z ewentualnymi poprawkami B, nie zastępować całego pliku starszą kopią.

## Rezultat i użycie przy integracji

`SimulationSession` przyjmuje odpowiedź, wariant, zegar i istniejący koordynator. Głos jest początkowo wyłączony, stan czytnika nieznany. Dopiero `setReader(false)` oraz jawne `setSpeechEnabled(true)` pozwalają mówić; same te operacje nie odtwarzają zaległości. `text` przechowuje ostatni opis pozycji symulacji również po błędzie syntezatora lub zatrzymaniu mowy. `state.lastItem` i zwracane zdarzenia zachowują oryginalne fakty; pełny plan i katalog dowodów nadal należą do widoku trasy.

Ekran przekazuje start/tick/pause/resume/repeat/reset do sesji. Przed zmianą wariantu, odpowiedzi lub odmontowaniem wywołuje `invalidate`. Stara zamknięta sesja nie może następnie sterować koordynatorem nowej sesji. `setActive(false)` usuwa kolejkę, a powrót wymaga ręcznego wznowienia. Przekazanie koordynatora z powrotem do zwykłego odsłuchu wymaga ustawienia jego blokady zgodnie z bieżącym stanem czytnika i aktywnością ekranu.

`SpeechCoordinator.enqueue` dopisuje teksty także podczas oczekiwania na głos. `play` zachowuje dotychczasową funkcję zastąpienia całego odsłuchu. Błąd, brak polskiego głosu i stop czyszczą zaległości; jawna kolejna próba może utworzyć świeżą kolejkę. Testy używają rzeczywistego koordynatora, kontrolera i sesji, zastępując tylko zegar oraz sprzętowy port mowy.

## Pliki do przeniesienia

Oprócz pięciu plików [pierwszej iteracji](m04-simulation.md) dochodzą:

- nowe `apps/mobile/src/features/simulation/{session,text}.ts`;
- nowy `apps/mobile/src/adapters/speech/chunks.ts`;
- nowy `apps/mobile/test/simulation-speech.spec.ts`;
- ten dokument.

Zmodyfikowano `apps/mobile/src/adapters/speech/coordinator.ts`, konfigurację `apps/mobile/test/simulation.config.ts` oraz dodano odnośnik w poprzednim dokumencie. Jedynym zmienionym plikiem spośród 171 plików bazowego snapshotu jest koordynator; manifesty, lockfile i kontrakt pozostały identyczne według SHA-256. Status A aktualizowany jest osobno w głównym checkoutcie.

Po przekazaniu telefonu scalić tylko te zmiany z aktualnymi źródłami B i ponownie sprawdzić je na wspólnej bazie. Nie kopiować całego worktree. Rozbieżność kolejności przy równych dystansach w istniejącym `speechText.ts` nadal czeka na uzgodnienie przy integracji; nowa sesja stosuje kolejność kontraktu przez kontroler.

## Weryfikacja tej iteracji

Polecenia w worktree `slepa-genia-simulation`, przez wrapper `npm.cmd exec --yes --package=node@24.21.0 --package=pnpm@10.34.6 --call "…"`:

| Polecenie | Wynik |
| --- | --- |
| `pnpm --filter @krok/mobile exec playwright test --config test/simulation.config.ts` | **29 PASS**: 15 rdzenia, 9 nowych integracji sesji/kolejki, 5 regresji wcześniejszego koordynatora. Bez przeglądarki i serwerów. |
| `pnpm lint` | PASS, bez błędów i ostrzeżeń ESLint. |
| `pnpm typecheck` | PASS, wszystkie pięć pakietów workspace. |
| `pnpm test:contracts` | **121 PASS**. |
| `pnpm check:generated` | **29 plików zgodnych**. |
| `git diff --check` | PASS; tylko ostrzeżenia przyszłej konwersji LF/CRLF w bazowych dokumentach. |

Nowe testy obejmują dopisywanie podczas szukania głosu i odtwarzania, zastąpienie kolejki, limit tekstu/pary UTF-16, domyślny brak mowy, jawne powtórzenie, duży skok czasu, pauzę, tło, czytnik, zmianę sesji i brak głosu/błędy urządzenia. Wywołania portu są atrapą: nie potwierdzają faktycznego działania syntezatora.

Nie uruchamiano web UI, eksportu, natywnych listenerów ani pełnego runnera uruchamiającego Metro/API. Nie zmieniano ekranów i środowiska testu B. iPhone/VoiceOver, Android/TalkBack oraz rzeczywisty dźwięk/tryb cichy: **nieprzetestowane na urządzeniu**. M-04 nadal wymaga podłączenia do ekranu, testów web i urządzenia; nie jest odebrane jako całość.

Przekazanie B: po zakończeniu próby telefonu zapisać wynik i listę zmienionych plików mobile, następnie przekazać je A do scalenia powyższego zakresu i integracji ekranu. Ten zapis nie oznacza wysłania wiadomości do drugiej instancji.
