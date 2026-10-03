# Status prac

## Osoba B / Codex — prawdziwy pilot Krakowa, 2026-10-03

- Na nowe polecenie użytkownika priorytetem jest realny przepływ w aplikacji. Pozyskano kompletny eksport OSM, zachowano raw gzip/checksum/licencję i datę. Zbudowano graf tylko z jawnej topologii pieszej oraz katalog pięciu rzeczywistych wejść Galerii Krakowskiej/High5ive. Zakres, reguły, źródła i ograniczenia: [real-pilot](real-pilot.md), [archiwum](../packages/ingestion/data/krakow/README.md).
- Backend obsługuje jawne `API_DATA_MODE=pilot`, istniejący draft.2 i PILOT_POLICY bez zmiany wag. Geometry pochodzi z OSM; fakty bez danych pozostają unknown; oba tryby nadal preview_only. Nie ma pobierania z sieci podczas obliczeń ani zastąpienia błędu fixture. Graf ma 605 węzłów, 1214 skierowanych krawędzi i 39 prostych przejść. Niedostępne/niejednoznaczne topologie pozostają wyłączone.
- Pliki: nowe extract/graph/krakow/audit i testy w `packages/ingestion`, raw oraz raport w `data/krakow`; rozszerzone typy/walidacja/present w `packages/routing`; konfiguracja, loader/services i testy HTTP w `apps/api`; README API/importera, dokumenty B/status/źródeł oraz root skrypt i lockfile (jedna wewnętrzna zależność API→ingestion). B nie edytuje mobile A.
- Wyniki B: ingestion **71 PASS**, routing **87 PASS**, API **92 PASS** (w tym wszystkie 20 skierowanych par realnego katalogu), contracts **121 PASS**; lint backendu, typecheck ingestion/API i `check:generated` **29 zgodnych** PASS. Instalacja offline PASS. Audyt 10 nieskierowanych par PASS. Pierwsze nowe testy poprawiono po wykryciu oczekiwania pustego grafu zamiast błędu i pomylenia obrysu peronu z torami; końcowe wyniki po poprawkach.
- Uruchomiono oddzielne API pilot na **127.0.0.1:3003**. Rzeczywisty POST HTTP po końcowych poprawkach: mode=pilot, graphVersion=osm-walk-v1-094d1973843a04d0f642b245, **420,217 m**, jeden etap, 18 punktów LineString, akustyka unknown. Identyfikatory i komendy przekazano w [handoffie B](handoff-backend.md).
- A przekazała uproszczony UX i obsługę pilot jako **gotowe do integracji**; [pełny raport i lista plików](handoff-mobile.md). Istniejący kontrakt sprawdzony przez obie strony, bez zmiany DTO/rankingu. A: realny HTTP/UI **6 PASS**, rdzeń sesji **31 PASS**, eksport web/iOS PASS. B przejrzała przekazane pliki i wykonała pełną regresję mobile **136 PASS** po końcowych poprawkach A.
- B przełączyła publiczne API **3001 na pilot**. Ten sam ngrok i gateway udostępniają rzeczywiste dane. Kontrola publicznego HTTPS i przeglądarki w widoku 390 px: wybór Galerii/High5ive → POST → wynik **420,217 m**, OSM, unknown, brak synthetic-only symulacji — **PASS**, bez błędów strony. Zrzut lokalny `.expo/b-pilot-public.png`. Manifest iOS Kroków SDK 57.0.0 i końcowy bundle **HTTP 200, 6 890 869 bajtów**, zawierający obsługę pilot.
- Kontrola publicznego web ujawniła stronę ostrzegawczą ngrok zamiast JSON. B po handoffie dodała nagłówek wyłącznie dla domen darmowego ngrok w `HttpRouteApi` i dopuściła go w CORS API (bez rozszerzenia listy originów/cookies), wraz z testami adaptera/preflight. Po poprawce: **10 testów adaptera PASS**, **92 API PASS**, cały lint/typecheck **PASS**, powyższy test publicznego UI PASS. Metro odświeżono dla tej poprawki; gateway/ngrok pozostawiono uruchomione. Instrukcje README i tunelu zaktualizowane.
- Końcowe `pnpm build:web` po poprawce tunelu: **PASS, 5 stron**. Użytkownik po przeładowaniu Expo Go na iPhonie potwierdził: **„Tak, widzę prawdziwe punkty i trasę”**, odpowiadając na próbę Galeria od Pawiej → High5ive zachodnie, ok. 420 m. To potwierdzenie wyboru punktów i wyniku, bez deklaracji testu VoiceOver/odsłuchu nowego pilota.
- **Nieprzetestowane na urządzeniu:** odsłuch realnego pilota, VoiceOver, teren i pełna macierz nowego UX. Brak lokalnego PostGIS tej iteracji; status zdalnego CI niepotwierdzony (publiczny GitHub API zwrócił limit odczytów, nie ponawiano). B-05/B-06 nie są w pełni odebrane; prowadzenie GPS pozostaje wyłączone. Dane obejmują pięć wejść, nie wyszukiwanie wszystkich adresów miasta.
- **Przekazanie A:** wybór realnych punktów i wynik na iPhonie potwierdzone; następnie sprawdzić odsłuch rzeczywistego planu i VoiceOver na nowym UX. Przy restarcie zachować `API_DATA_MODE=pilot`; stary ignorowany launcher A nadal wpisuje synthetic dla roli Api — szczegóły w handoffie B.

## Osoba B / Codex — B-04, adapter lokalnego snapshotu, 2026-10-03

- Dodano `packages/ingestion/**`: parser OSM, normalizację do istniejącego kontraktu, audyt resolverem B-03, ograniczone pobieranie, niezmienne snapshoty/checksum, atomowy wskaźnik ostatniego poprawnego stagingu i CLI. Brak tagu nie generuje false, pobranie/edycja nie generują dat obserwacji. Zakres i wynik: [B-04](b04-ingestion.md); komendy: [README pakietu](../packages/ingestion/README.md).
- Pliki poza pakietem: root `package.json` i `pnpm-lock.yaml` (tylko nowy importer workspace, istniejące przypięte tsx/Vitest), README, `docs/data-sources.md`, dokument B-04, handoff B i ten wpis. Kontrakt, fixtures, wagi, API i mobile bez zmian. Nie uruchomiono migracji ani publikacji realnego grafu.
- Node 24.21.0 / pnpm 10.34.6: instalacja offline PASS; lint/typecheck całego repo PASS; ingestion **42 PASS**, routing **87 PASS**, contracts **121 PASS**, API **86 PASS**, `check:generated` **29 plików zgodnych**. Pierwszy typecheck ujawnił błędną nazwę importu schematu, a lint typ chunku streamu i atrapy async; poprawiono i ponowiono wszystkie powyższe kontrole. Testy mobilne/web wykonano wcześniej w tej iteracji przy integracji A (wpis poniżej); nie powtarzano ich dla niezależnego adaptera.
- Próba `pnpm import:osm` NIEUDANA: obie próby do jednego Overpass zakończyły się network_or_timeout. Wcześniejszy POST PowerShell również timeout; DNS działa, osobna próba połączenia HTTPS timeout. Zapisano lokalny raport awarii, brak surowego wyniku i statystyk realnego pokrycia. Nie podmieniono ich fixtures. **B-04 pozostaje nieodebrane do udanego pobrania i audytu realnego snapshotu.**
- Ograniczenia: staging plikowy, nie PostGIS ani graf; bez testu utraty zasilania. Nie testowano telefonu/bazy. `current.json` dotyczy tylko importera, nie danych serwowanych aplikacji. Historia rewizji nie jest automatycznym rozstrzygnięciem konfliktów. Wykryto nowe dopiski A w `docs/handoff-mobile.md` o podglądzie telefonu; pozostawiono je i procesy A bez zmian, poza commitem B-04.
- **Przekazanie A:** kontynuować próbę iPhone/VoiceOver i zapisać faktyczne wyniki w handoffie mobile; import OSM nie wymaga zmian aplikacji. Kolejny krok B: pozyskać realny snapshot, przejrzeć pokrycie i dopiero wtedy budować graf B-05.

## Osoba B / Codex — integracja handoffu A, 2026-10-03

- Po zgłoszeniu przez użytkownika gotowości A przejrzano i zintegrowano dziewięć plików z [handoffu mobile](handoff-mobile.md). Symulacja jest teraz podłączona do wyniku trasy, ze wspólną kolejką mowy, sterowaniem, historią tekstową i obsługą tła/wyjścia. Nadal synthetic/preview_only, bez GPS. Kontrakt i zależności bez zmian.
- Kontrole integracji B: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm check:generated`, `pnpm build:web` — PASS. Testy: contracts 121, infra 14, routing 87, mobile 128 wykonań (desktop/narrow), API 86. Zgodne 29 artefaktów generowanych; eksport pięciu stron. Przegląd kodu obejmował unieważnianie sesji, współdzielenie koordynatora, fokus i kolejność zdarzeń. Pełna lista plików w raporcie A.
- iPhone/VoiceOver, Android/TalkBack i rzeczywisty dźwięk: **nieprzetestowane na urządzeniu** w tej integracji; M-03/M-04 nie są w pełni odebrane. Tempo demonstracji 16× może wyprzedzać kolejkę głosu. B kontynuuje B-04 osobno, bez publikowania realnego grafu.
- **Przekazanie A:** przejrzeć B-03 i przygotować scenariusz odbioru na iPhonie z handoffu mobile; nie zmieniać teraz kontraktu ani włączać trybu pilot. Integracja kodu A nie wymaga ponownego kopiowania plików.

## Osoba B / Codex — B-03, resolver dowodów, 2026-10-03

- Zrealizowano pierwszy zakres nowego podziału: czysty `resolveEvidence` w packages/routing, z obowiązkowym wstrzykiwanym zegarem, jawną polityką i wewnętrznym audytem. Zakres zapisano przed implementacją w [handoffie B](handoff-backend.md); pełne reguły i ograniczenia: [B-03](b03-evidence.md). Bez zmian API/kontraktów/fixtures/rankingu, zależności i plików A.
- Obsługa unknown/known(false)/conflicting, dokładnego zakresu, publikacji i deduplikacji pochodzenia. Fetch nie odmładza danych; daty/wiarygodność pochodzą z jednego dowodu. Wygaśnięta lub niedatowana obserwacja przeszkody nie staje się potwierdzeniem jej usunięcia. Jawne zastąpienie wymaga opublikowanej weryfikacji terenowej, chronologii, uzasadnienia i audytu; cykle oraz niejednoznaczne decyzje są odrzucane.
- Ograniczenie aktualnego kontraktu: przeciwne rewizje jednego pochodzenia nie spełniają definicji niezależnego conflicting. Resolver blokuje known i zwraca unknown/unsupported_value z wewnętrznym inconsistent_origin. Wymaga przeglądu prezentacji przez A przed podłączeniem realnych danych; nie zmieniono samodzielnie kontraktu. Już wykazany konflikt niezależnych obserwacji nie znika wskutek dodatkowego błędnego rekordu.
- Pliki: `packages/routing/src/evidence/{types,resolve}.ts`, eksport `src/index.ts`, `test/evidence.test.ts`, README pakietu, `docs/b03-evidence.md`, raport B i ten wpis. Źródła korzystają z istniejących schematów; nie powstała druga definicja API.
- Node 24.21.0 / pnpm 10.34.6: lint/typecheck PASS; routing **87 PASS (47 nowych + 40 wcześniejszych)**, contracts **121 PASS**, API **86 PASS**, generated **29 plików zgodnych**. Po ostatnim dodanym teście ponowiono routing/typecheck pakietu i lint pakietu — PASS. Próba integracyjna odtworzyła fakty pełnego grafu synthetic identycznie z oryginałem, przeszła rzeczywisty planner i RouteResponseSchema, zachowała 740/980/1120 oraz rekomendację 980 m i brak dopasowania przy field_verified_recent. Diff zakresu B bez błędów whitespace.
- Nie uruchamiano test:mobile/build:web (A pracuje na swoich portach), bazy, importu ani urządzenia. To implementacja modułu gotowa do przeglądu i przyszłego importera, nie odbiór realnego pilotażu ani automatyczne podłączenie do działającego API. Pozostawiono wszystkie niezatwierdzone pliki A bez zmian.
- **Przekazanie A:** kontynuować M-04 na obecnym HTTP, następnie przejrzeć opis unknown dla rewizji jednego pochodzenia w handoffie B. Nie trzeba zmieniać aplikacji dla tej iteracji resolvera. B następnie przygotowuje ograniczony B-04; wspólna publikacja nowych danych wymaga osobnego okna integracji.

## Osoba B / Codex — nowy podział dwóch rozmów, 2026-10-03

- Na prośbę użytkownika ustalono nowy podział po konsolidacji: **B (dotychczasowa rozmowa) — B-03 resolver, potem dane OSM/graf; A (świeża rozmowa) — podłączenie istniejącego M-04 do UI i jednej kolejki mowy**. Zakres, kryteria i granice zapisu: [bieżący plan dwóch rozmów](two-codex-plan.md). To plan kolejnej implementacji, nie deklaracja jej wykonania.
- Wybrano jeden folder Kroków i wspólny main z rozdzielonymi ścieżkami. Git, instalacje, kontrakty/lockfile i publikacja po stronie B; A nie zmienia gałęzi ani nie wykonuje operacji zapisujących Git. Osobne raporty handoff-mobile/handoff-backend powstaną przy rozpoczęciu zadań. W czasie równoległej pracy centralny status aktualizuje B wyłącznie swoim wpisem, linkując raport A. Zmieniono wcześniejsze zalecenie osobnych worktrees w instrukcjach B.
- Uaktualniono `codex-start.md`, `claude-start.md`, `CLAUDE.md`, `docs/two-codex-plan.md` i ten wpis B. Nowy prompt A zaczyna od istniejących Session/Controller/SpeechCoordinator; nie kieruje do ponownego bootstrapu ani kopiowania archiwum. Wskazano rzeczywistą rozbieżność kolejności w speechText i blokadę pilot w HttpRouteApi.
- Kontrole: czysty Git na starcie, przegląd planu/architektury/kontraktów i wymienionych źródeł, manifestów oraz instrukcji; sprawdzenie ścieżek dokumentów i `git diff --check`. Nie uruchamiano testów aplikacji — zmiany wyłącznie organizacyjne. Wcześniejsze wyniki CI nie są wynikami tej iteracji. Wspólny checkout wymaga przestrzegania granic, zatrzymania edycji A po handoffie i jednego operatora Git/testowych portów.
- **Przekazanie świeżej A:** otworzyć ten sam folder i wykonać `codex-start.md`, zaczynając od zakresu w `docs/handoff-mobile.md`. Dokończyć M-04 na obecnych fixtures, bez zależności od przyszłego importu. Film/prezentacja nadal odłożone. Nie uruchomiono dodatkowych agentów ani nie wysłano wiadomości do innej rozmowy.

## Osoba B / Codex — porządkowanie katalogów zakończone, 2026-10-03

- Użytkownik jawnie nadał porządkowaniu priorytet i zezwolił na zakończenie blokujących procesów. Microsoft Sysinternals Handle wskazał uchwyty starego katalogu w launcherze Node (PID 9924) i starej sesji Codexa (PID 20252). Po zakończeniu zweryfikowanego launchera sesja również zakończyła działanie. Pozostałe procesy nie wymagały zatrzymania.
- Główny stary checkout przeniesiono do `%LOCALAPPDATA%/Krokow/archive/2026-10-03/main`; wcześniejsze worktrees `backend` i `simulation` są obok. `git worktree repair` naprawił ich odnośniki do przeniesionego `.git`. Sprawdzenie `rev-parse --show-toplevel` we wszystkich trzech katalogach PASS. Wszystkie źródła i niezatwierdzone historyczne snapshoty zachowano, bez usuwania plików.
- W `C:/Users/rapma/Documents/GitHUb` jedynym folderem projektu jest teraz **Kroków**. Kontrola skryptu zakończyła się `success: true`: stary katalog nie istnieje, docelowy checkout był czysty i jego HEAD zgodny z GitHub `main`. Raport lokalny: `%LOCALAPPDATA%/Krokow/cleanup-result.json`; log: `cleanup.log` w tym samym katalogu.
- Końcowe `git fsck --connectivity-only --no-dangling` w bieżącym repo i archiwalnym głównym repo: oba exit 0. Skrypty jednorazowego porządkowania przeniesiono do archiwum `cleanup-scripts`, aby nie zostawiać ich obok projektu. API lokalne `/healthz` nadal odpowiada `ok`, Metro/gateway nasłuchują na 8081/8082. Po zamknięciu starej sesji agent ngrok nie jest już uruchomiony (brak portu 4040, próba publicznego połączenia nieudana); telefon przez tunel wymaga ponownego uruchomienia ngrok. Nie deklarujemy aktualnego działania publicznego QR.
- Przed archiwizacją wykryto dodatkową zmianę nazwy PDF. Porównanie SHA-256 potwierdziło identyczną treść; zachowano `deliverables/Kroków-prezentacja.pdf`, poprawiono linki i nazwę wyjściową eksportera. Commit `aba750f` opublikowany na `main`. `node --check apps/mobile/scripts/export-slides.mjs` oraz `git diff --check` PASS. Nie regenerowano historycznej prezentacji i nie powtarzano testów aplikacji dla operacji na katalogach.
- **Przekazanie A:** dalszą pracę prowadzić wyłącznie w `C:/Users/rapma/Documents/GitHUb/Kroków` na aktualnym `main`. Archiwum służy odzyskaniu historii; nie kopiować go nad aktualnym kodem. Podłączenie M-04 do UI i testy czytnika/odsłuchu pozostają następnym zadaniem.

## Osoba B / Codex — Kroków, integracja i publikacja, 2026-10-03

- Na polecenie użytkownika poprawiono markę na **Kroków** i przemianowano istniejące repozytorium GitHub na `Mikformatycy/Krokow`, zachowując jego tożsamość i historię. Zaktualizowano `origin`; techniczne npm/Expo pozostają `krokow`. Zmiany obejmują UI, metadane, atrybucje, tytuł OpenAPI, regenerowane fixtures i dokumentację. Zakres: [nazwa i konsolidacja](rename-krokow.md).
- Zebrano pracę w jednym `main`. Porównanie plików wykazało brak dodatkowego kodu wyłącznie w historycznym worktree backendu; jego wcześniejszy status zachowano w [archiwum](archive/backend-status.md). Z worktree A przeniesiono 10 nowych plików rdzenia/sesji/testów/dokumentacji M-04 oraz przejrzaną zmianę `adapters/speech/coordinator.ts`. Zachowano nowsze ekrany, konfigurację telefonu, kontrakt i lockfile. Kopiowanie kontrolowano bajtowo przed/po. **Symulacja nadal niepodłączona do ekranu.**
- Potwierdzenie użytkownika: aplikacja otwiera się na fizycznym iPhonie przez ngrok po zalogowaniu Expo CLI. Nie potwierdzono odsłuchu, VoiceOver/TalkBack ani nawigacji terenowej. Dane nadal wyłącznie synthetic/preview_only.
- Kontrole wspólnej integracji przez Node 24.21.0 / pnpm 10.34.6: `pnpm lint`, `pnpm typecheck`, `pnpm contracts:export`, `pnpm check:generated` PASS (29 artefaktów); `pnpm test` PASS: infra 14, kontrakty 121, routing 40, API 86, mobile 108 wykonań w dwóch konfiguracjach Chromium. Osobny runner symulacji/mowy: 29 PASS. `pnpm build:web` PASS (5 stron). `git diff --cached --check` PASS. Przegląd plików do publikacji: brak dopasowań sprawdzanych wzorców tokenów/kluczy prywatnych; `.env`, `.expo`, node_modules i logi ignorowane. Archiwum ZIP zawiera tylko film, PDF i teksty prezentacji.
- Ograniczenia: lokalny PostGIS/Docker i zdalne CI nie są wynikiem powyższych testów. Materiały binarne pozostają archiwalnym szkicem ze starą marką. Windows zablokował przeniesienie otwartego głównego folderu; docelowy checkout `Kroków` zostanie utworzony z opublikowanego repozytorium. Stare foldery mają pozostać zachowane do zamknięcia procesów, bez usuwania pracy.
- **Jedno przekazanie A:** kontynuować z opublikowanego `main` w docelowym checkoutcie `Kroków`, nie kopiować całego starego worktree. Następny zakres mobile: podłączenie zintegrowanej sesji M-04 do UI i rozstrzygnięcie kolejności przy remisach w dotychczasowym `speechText.ts` według kontraktu; test odsłuchu/VoiceOver nadal wymagany.

### Wynik publikacji i nowego checkoutu

- Commit integracji `8b9e576` jest na zdalnym `main`. [GitHub Actions](https://github.com/Mikformatycy/Krokow/actions/runs/37140473996) zakończył się **success**: instalacja, lint/typecheck, testy, generowane artefakty, eksport web oraz konfiguracja/uruchomienie/kontrola/testy PostGIS na runnerze Ubuntu. To dodatkowy wynik zdalny; nie jest testem lokalnego Dockera ani telefonu.
- Z GitHuba utworzono niezależny, kompletny checkout `C:/Users/rapma/Documents/GitHUb/Kroków`. Instalacja `pnpm install --offline --frozen-lockfile` PASS, 736 pakietów z cache, bez zmiany lockfile. W tym folderze działają już API, Metro i gateway. Ten sam ngrok odpowiada health 200, manifestem iOS **Kroków** i bundlem iOS 200 (6 858 310 bajtów). Publiczny QR jest zachowany; nie potwierdzano ponownie odsłuchu na urządzeniu.
- Dwa dawne worktrees przeniesiono poleceniem `git worktree move` do `%LOCALAPPDATA%/Krokow/archive/2026-10-03/{backend,simulation}`. Zachowano wszystkie pliki i powiązania Git. Główny dawny checkout czeka na zwolnienie blokady procesów. Lokalny skrypt `../Porzadkuj-Krokow.ps1` archiwizuje go bez usuwania plików i naprawia powiązania; parser i tryb `-CheckOnly` PASS. Sprawdza też, czy przed archiwizacją nie doszły nowe niezatwierdzone zmiany.
- W trakcie porządkowania w głównym starym folderze pojawił się nowy `logo.png`; zachowano go w repozytorium i dodano podgląd w README. Końcowy commit dokumentacji/logo nie zmienia przetestowanego kodu aplikacji. Źródłem dalszej pracy jest wyłącznie checkout **Kroków**.

## Osoba A / Codex — M-04, sesja symulacji i kolejka mowy, 2026-10-03

- Kontynuacja wyłącznie w `slepa-genia-simulation` / `feat/M-04-simulation` podczas prac B nad telefonem. Zakres, pliki i instrukcja integracji: [sesja M-04 w worktree A](../../slepa-genia-simulation/docs/m04-speech-session.md). W głównym checkoutcie zmieniono tylko ten wpis A; bez zmian ekranów, serwerów i konfiguracji telefonu.
- Dodano `SimulationSession` łączącą kontroler z istniejącym `SpeechCoordinator`. Jedna kolejka przyjmuje zdarzenia również podczas szukania głosu; pauza, tło, czytnik i unieważnienie usuwają zaległości. Domyślnie głos wyłączony, nieznany stan czytnika blokuje mowę. Tekst pozostaje dostępny. Stara sesja i spóźnione callbacki nie przerywają nowej. Wyłącznie synthetic/preview_only, bez GPS.
- Nowe pliki w worktree: `apps/mobile/src/features/simulation/{session,text}.ts`, `apps/mobile/src/adapters/speech/chunks.ts`, `apps/mobile/test/simulation-speech.spec.ts`, `docs/m04-speech-session.md`. Zmiany: `apps/mobile/src/adapters/speech/coordinator.ts`, `apps/mobile/test/simulation.config.ts`, odnośnik w `docs/m04-simulation.md`. Spośród 171 bazowych plików zmienił się tylko koordynator; kontrola SHA-256 potwierdziła brak zmian manifestów, lockfile i kontraktu.
- Polecenia przez Node 24.21.0 / pnpm 10.34.6: `pnpm --filter @krok/mobile exec playwright test --config test/simulation.config.ts` **29 PASS** (15 rdzenia, 9 nowych integracji, 5 regresji koordynatora); `pnpm lint` i `pnpm typecheck` PASS; `pnpm test:contracts` **121 PASS**; `pnpm check:generated` **29 plików zgodnych**; `git diff --check` PASS. Testy sesji korzystają z rzeczywistego koordynatora i atrap portu mowy/zegara, bez serwerów i przeglądarki.
- Ograniczenia: **M-04 nadal niepodłączone do ekranu i nieodebrane jako całość**. Nie uruchamiano web UI ani eksportu; AppState, iPhone/VoiceOver, Android/TalkBack, dźwięk i tryb cichy **nieprzetestowane na urządzeniu**. Wyniki dotyczą snapshotu A. Przy integracji trzeba zachować poprawki B i uzgodnić wcześniej zgłoszoną kolejność przy remisach w `speechText.ts`.
- **Jedno przekazanie B:** po zakończeniu próby telefonu zapisać wynik i listę zmienionych plików mobile, następnie przekazać zakres A do scalenia i podłączenia symulacji. Aktualna lista obejmuje rdzeń oraz sesję/kolejkę z powyższego dokumentu; nie kopiować całego worktree nad nowszym projektem. Nie wysyłano wiadomości do drugiej instancji.

## Osoba A / Codex — M-04, rdzeń symulacji poza środowiskiem telefonu, 2026-10-03

- Na polecenie użytkownika kontynuowano niezależną pracę podczas próby telefonu prowadzonej przez B. Utworzono osobny worktree `C:/Users/rapma/Documents/GitHUb/slepa-genia-simulation`, branch `feat/M-04-simulation`. Na HEAD nałożono kopię 171 bieżących plików źródłowych z kontrolą SHA-256; bez `.env`, materiałów binarnych i node_modules. To snapshot niezatwierdzonej integracji, nie nowy wspólny commit. W głównym checkoutcie A zmienia wyłącznie ten wpis.
- Zakres i kryteria przed implementacją: [M-04 w worktree A](../../slepa-genia-simulation/docs/m04-simulation.md). Rezultat: walidowany, niemutowalny plan zdarzeń oraz kontroler ready/running/paused/completed/invalidated z wstrzykiwanym zegarem. Deduplikacja, pauza/wznowienie/reset/powtórzenie, brak nadrabiania czasu tła, unieważnianie przy zmianie wyniku/wariantu, ochrona przed spóźnionymi callbackami i błędnym zegarem. Wyłącznie synthetic/preview_only, bez GPS i prowadzenia terenowego.
- Pięć nowych plików wyłącznie w worktree A: `apps/mobile/src/features/simulation/{plan,controller}.ts`, `apps/mobile/test/{simulation.spec,simulation.config}.ts`, `docs/m04-simulation.md`. Nie zmieniono skopiowanych 171 plików bazowych, kontraktu, manifestów i lockfile; potwierdzono SHA-256. Główny branch, procesy Metro/API i aktywna aplikacja telefonu pozostają pod kontrolą B.
- Kontrole w worktree A przez przypięte Node 24.21.0 / pnpm 10.34.6: instalacja `--offline --frozen-lockfile` PASS; `pnpm --filter @krok/mobile exec playwright test --config test/simulation.config.ts` **15 testów PASS**, bez serwerów/przeglądarki; `pnpm lint` i `pnpm typecheck` PASS; `pnpm test:contracts` **121 PASS**; `pnpm check:generated` **29 plików zgodnych**. Nowe pliki bez trailing whitespace. Wyniki dotyczą snapshotu A, nie ewentualnych późniejszych poprawek B.
- Ograniczenia: **M-04 nie jest włączone do aplikacji i nie jest w pełni odebrane**. Brak testu UI, rzeczywistego zatrzymania mowy, AppState na urządzeniu i eksportu tej integracji. iPhone/VoiceOver i Android/TalkBack: **nieprzetestowane na urządzeniu**. Zwracane efekty wymagają obsługi przez przyszły adapter ekranu i istniejący SpeechCoordinator.
- Znaleziona rozbieżność: obecny `speechText.ts` przy równym dystansie umieszcza kroki przed zdarzeniami; kontrakt wymaga start → zdarzenia → odcinek → koniec. Nowy plan stosuje kontrakt. Istniejącego odsłuchu nie zmieniano podczas próby telefonu; uzgodnić wspólną kolejność przy integracji.
- **Jedno przekazanie B:** po zakończeniu próby telefonu przekazać A wynik i listę poprawek, aby A mogła dołączyć tylko pięć nowych plików i podłączyć symulację. Nie scalać całego snapshotu/worktree A ani jego lockfile nad bieżącym projektem. Pełna lista i komendy integracyjne są w dokumencie M-04.

## Osoba A / Codex — ponowny podział pracy, 2026-10-03

- Na prośbę użytkownika przygotowano [podział dwóch instancji](two-codex-plan.md) na podstawie bieżącego kodu, statusu i zależności planu. B nadal prowadzi próbę telefonu. Propozycja: A przygotowuje M-04, po przekazaniu telefonu odpowiada za mobile; B wraca do B-03 i później importu. Kontrakty i lockfile integruje B.
- Potwierdzono w źródłach obecność routingu synthetic, HTTP mobile, porównania/dowodów i koordynatora mowy. HttpRouteApi nadal jawnie wymaga synthetic; realny pilot wymaga osobnej integracji klienta. Nie traktujemy częściowego M-03 ani HTTP synthetic jako pełnego odbioru M-03/I-01.
- Zmienione pliki tej iteracji: `docs/two-codex-plan.md` i ten wpis A. Bez zmian kodu, konfiguracji, serwerów, branchy i zależności podczas aktywnego testu telefonu. Nie tworzono dodatkowej instancji agenta ani nie wysyłano wiadomości poza tą rozmową.
- Kontrole: Git status/worktrees, odczyt aktualnych instrukcji, statusu, planu, architektury, kontraktu i właściwych źródeł; przegląd linków nowego dokumentu i `git diff --check`. Testów aplikacji nie powtarzano — to iteracja planowania; wcześniejsze wyniki B są w dokumencie wyraźnie opisane jako wcześniejsze.
- Ryzyko organizacyjne: duża część projektu jest nadal niezatwierdzona; historyczny worktree backend nie zawiera aktualnej integracji. Przed równoległą implementacją potrzebny aktualny wspólny punkt w Git i odrębne worktrees. Telefon/VoiceOver/TalkBack pozostają bez potwierdzonego odbioru w odczytanym statusie.
- **Jedno przekazanie B:** dokończyć test telefonu, zapisać wyniki i pliki poprawek, następnie przekazać mobile A i rozpocząć B-03 z aktualnej wspólnej bazy. Gotowy tekst do drugiej rozmowy jest na końcu dokumentu; jego zapis nie oznacza doręczenia B.

## Osoba B / Codex — „kroków” i uruchomienie Expo Go, 2026-10-03

- Najnowsza decyzja użytkownika: finalna nazwa **kroków**, jeszcze siedem sesji po pięć godzin. Obecny priorytet to uruchomienie na iPhonie w Expo Go, potem dalszy rozwój. Film i prezentacja odłożone; wcześniejsze zamrożenie funkcji nie jest aktualnym poleceniem. Zakres i kryteria: [rename-krokow.md](rename-krokow.md).
- Zmieniono nazwę w nagłówku UI, tytułach ekranów, opisie HTML i metadanych Expo. Root pakiet, slug i scheme: `krokow`. Zmieniono tytuł OpenAPI oraz atrybucję własnych danych synthetic; artefakty i fixtures zregenerowano ze źródła. Wersja/semantyka kontraktu, identyfikatory tras i scope `@krok/*` bez zmian.
- Pliki: `apps/mobile/app.json`, `src/components/Screen.tsx`, `src/app/{_layout,+html}.tsx`, tytuł w `scripts/capture-demo.mjs`; root `package.json`; `packages/contracts/src/{fixtures,openapi}.ts`, generowane `packages/contracts/openapi.json` i `examples/**`; `packages/routing/src/synthetic.ts`; README, główne instrukcje AGENTS/CLAUDE i startowe, tytuł `architecture.md`, dokumenty zakresu/budżetu, adnotacja archiwalności `deliverables/README.md`. Binarne materiały pozostają historyczne; wpisów A nie zmieniano.
- Uruchomiono API synthetic na `0.0.0.0:3001` i Expo Go LAN na porcie 8081, z `EXPO_PUBLIC_API_URL=http://10.250.193.184:3001`. Adres Expo: `exp://10.250.193.184:8081`. API i Metro pozostawiono uruchomione do próby telefonu. Poprzednie własne procesy API/static zatrzymano po weryfikacji PID i polecenia. Instrukcja dwóch terminali jest na początku README.
- Na prośbę użytkownika otwarto `apps/mobile/.expo/krokow-expo-qr.png` w Windows Zdjęcia; potwierdzono tytuł okna. QR wygenerowany lokalnie biblioteką używaną przez Expo, bez nowej zależności. Pliki QR/diagnostyki w ignorowanym `.expo/`.

### Kontrole nazwy i startu

Polecenia przez przypięty wrapper Node 24.21.0 / pnpm 10.34.6.

| Polecenie / kontrola | Wynik |
| --- | --- |
| `pnpm contracts:export` + `pnpm check:generated` | PASS: regeneracja i zgodność 29 artefaktów. |
| `pnpm install --frozen-lockfile --network-concurrency=4 --child-concurrency=1` | PASS; zmiana nazwy root nie wymagała zmiany lockfile. |
| `pnpm lint` + `pnpm typecheck` | PASS. |
| `pnpm test:contracts` / `pnpm test:routing` / `pnpm test:api` | PASS: odpowiednio 121 / 40 / 86 testów. |
| `pnpm test:mobile` | PASS: 60 wykonań w Chromium, desktop i 390 px. |
| Rzeczywisty LAN z komputera | `/healthz` = 200 i status ok. Manifest iOS: nazwa `kroków`, slug `krokow`, SDK 57.0.0, host `10.250.193.184:8081`. Pobranie bundla iOS = 200, 6 855 793 bajty. To nie test fizycznego iPhone'a. |
| Przeglądarka podłączona do uruchomionego API LAN | Odczyt coverage/places/routes = 200; wynik 740/980/1120 m, rekomendacja 980 m, nagłówek i atrybucja `kroków`. Pierwsza dodatkowa próba czekała bezskutecznie na wynik; diagnostyczny przebieg potwierdził działanie, bez zmiany logiki aplikacji. |
| `git diff --check` | PASS, tylko ostrzeżenia konwersji LF/CRLF. |

- Ograniczenia: telefon/VoiceOver/TalkBack i dźwięk nadal **nieprzetestowane na urządzeniu**, do potwierdzenia przez użytkownika. Sam dostęp przez adres LAN z komputera nie dowodzi łączności telefonu. Brak nowych eksportów prezentacji/filmu, testu Safari, PostGIS i zdalnego CI. Scheme zmieniono na `krokow`; dawne własne linki aplikacji wymagają nowej nazwy.
- **Przekazanie użytkownikowi / A:** zeskanować QR otwarty w Zdjęciach, uruchomić demo A/B/C na iPhonie i podać wynik lub dokładny komunikat błędu. Kolejne funkcje wybieramy po uruchomieniu aplikacji; nie wracamy teraz do materiałów prezentacyjnych.

### Aktualizacja po próbie LAN — ngrok

- Użytkownik zgłosił brak połączenia przez QR i poprosił o ngrok. Wspólny provider Expo odmówił połączenia z `ERR_NGROK_108` (limit 5000 agentów na współdzielonym koncie). Nie oznacza to wyczerpania limitu konta użytkownika. Użytkownik potwierdził własne konto ngrok.
- Przygotowano `apps/mobile/scripts/start-tunnel.mjs`: lokalny gateway 8082 dla API 3001 i Metro 8081, również WebSocket. Tryb `KROK_GATEWAY_ONLY=1` umożliwia podłączenie własnego agenta. Domyślny tryb używa integracji ngrok przypiętego Expo CLI i obecnie jest blokowany zewnętrznym limitem. Konfiguracja w [phone-tunnel.md](phone-tunnel.md).
- Zainstalowano globalnie narzędzie `@expo/ngrok 4.1.3`; zależności projektu bez zmian. Dla własnego konta pobrano oficjalny agent ngrok 3.39.11 do `%LOCALAPPDATA%/krokow-tools/ngrok/`. `connect-ngrok.ps1` pyta o token lokalnie, z ukrytym wpisywaniem, przekazuje go w środowisku procesu i nie zapisuje w repo ani argumentach. Przechwytywanie treści żądań agenta wyłączone.
- Kontrole: parser PowerShell i lint PASS. Gateway HTTP przekazał `/healthz` (200), POST tras (740/980/1120), manifest iOS i status Metro; połączenie WebSocket `/message` również PASS. Dodatkowa kontrola przeglądarkowa wykryła pusty tytuł karty: dodano `<Head>` Expo Router i tytuł HTML; następna kontrola potwierdziła `kroków` i wynik 980 m, lint/typecheck PASS.
- W chwili tego wpisu publiczny tunel własnego konta czeka na lokalne wpisanie tokenu przez użytkownika. Nie deklarujemy jeszcze publicznej łączności ani testu telefonu. Po uruchomieniu należy ustawić publiczny origin w Expo/API, zweryfikować manifest i bundle oraz otworzyć nowy QR w Zdjęciach. Stary kod LAN nie używa ngrok.

### Sprawdzenie zapisanego tokenu — 2026-10-03

- Na polecenie użytkownika sprawdzono standardowe konfiguracje, zmienne procesu/użytkownika/systemu oraz lokalizację aplikacji Microsoft Store. Wpis w `.expo/ngrok.yml` jest wspólnym tokenem Expo. Osobny zapis znaleziono w `%LOCALAPPDATA%/Packages/ngrok.ngrok_1g87z0zv29zzc/LocalCache/Local/ngrok/ngrok.yml`; wartości nie wypisywano.
- `ngrok config check --config ...`: PASS, składnia konfiguracji poprawna. Rzeczywista próba `ngrok http http://127.0.0.1:8082 --config ... --inspect=false`: odmowa uwierzytelnienia `ERR_NGROK_105`, zapisany authtoken nie ma poprawnego formatu według ngrok. Tunel nie został uruchomiony. Token zredagowano w komunikatach narzędzia i lokalnym logu błędu.
- API, Metro i gateway nadal nasłuchują na 3001/8081/8082. Potrzebny jest poprawny authtoken z panelu własnego konta, wpisany lokalnie przez istniejący `connect-ngrok.ps1`. Nie zmieniano zapisanej konfiguracji Store ani kodu aplikacji. Nie powtarzano testów aplikacji; to kontrola konfiguracji i rzeczywista próba uwierzytelnienia.
- Przekazanie A: próba telefonu nadal nieukończona z powodu autoryzacji tunelu; nie traktować tego jako błędu routingu ani potwierdzonego odbioru urządzenia.

### Własny ngrok uruchomiony — 2026-10-03

- Użytkownik uruchomił własny agent i zgłosił panel CLI. Odczyt lokalnego API ngrok potwierdził publiczny endpoint HTTPS kierujący do gatewaya 8082, bez odczytywania tokenu. Publiczny origin: `https://chaos-virtuous-mumble.ngrok-free.dev`.
- Zrestartowano wyłącznie własne procesy API/Metro po sprawdzeniu PID i komendy. API nasłuchuje na `127.0.0.1:3001`; CORS obejmuje publiczny origin. Metro na 8081 otrzymało publiczny `EXPO_PUBLIC_API_URL` i `EXPO_PACKAGER_PROXY_URL`; usunięto z jego środowiska wymuszenie hosta LAN. Gateway i uruchomiony przez użytkownika agent ngrok zachowano.
- Rzeczywiste żądania przez publiczny HTTPS: health 200, POST routes 200 z 740/980/1120 m, manifest iOS `kroków` / SDK 57.0.0 z publicznym adresem bundla, bundle iOS 200 (6 856 758 bajtów), WebSocket Metro `/message` połączony. To kontrole transportu i eksportowanego kodu, nie potwierdzenie działania fizycznego iPhone'a.
- Zapisano wyłącznie publiczne adresy do ignorowanego `.expo/tunnel.json`; wygenerowano i otwarto w Zdjęciach nowy `krokow-ngrok-qr.png` z `exps://chaos-virtuous-mumble.ngrok-free.dev`. Zmieniono dokumentację tunelu i ten wpis B; bez zmian kontraktu, logiki aplikacji, manifestów i zależności. Wpis A dotyczący podziału pracy zachowano.
- Przekazanie użytkownikowi/A: zeskanować nowy QR, otworzyć planowanie A/B/C i potwierdzić wynik na telefonie. VoiceOver/TalkBack i rzeczywisty odsłuch nadal **nieprzetestowane na urządzeniu** do czasu zgłoszenia wyniku. Panel ngrok należy pozostawić otwarty na czas próby; po jego zatrzymaniu adres nie będzie działał.

### Logowanie Expo — próba iPhone'a

- Użytkownik zeskanował nowy QR i zgłosił na iPhonie komunikat „You need to be signed in to Expo Go and Expo CLI”. CLI `expo whoami` potwierdziło brak logowania. Oficjalna dokumentacja wymaga tego samego konta na fizycznym iPhonie i w CLI; instrukcję i źródło dodano do `phone-tunnel.md`.
- `expo login --browser` nie otworzył przeglądarki z powodu błędu `cmd.exe /c start` w lokalnym Expo CLI. Próba automatycznego otwarcia przez PowerShell została odrzucona przez kontrolę narzędzia. W bezpiecznym wariancie ustawiono `BROWSER=none`; CLI czeka na przeglądarkowe logowanie, a użytkownik otrzymał link do ręcznego otwarcia na komputerze. Nie przesyłano haseł ani tokenów w czacie.
- Dodatkowa próba web z `localhost:8081` i API ngrok trafiła na blokadę CORS bez nagłówka allow-origin po stronie publicznego endpointu. Nie deklarujemy jej powodzenia. Kontrole publicznego API, manifestu, bundla i WebSocket pozostają PASS; fizyczne uruchomienie aplikacji nadal czeka na logowanie użytkownika. Kod i kontrakt bez zmian.
- Dodatkowa próba wejścia Chromium bezpośrednio przez publiczny `/plan` również nie osiągnęła formularza (timeout); nie jest zaliczona. Aktualny potwierdzony zakres tunelu obejmuje transport API, iOS i WebSocket. Priorytetem pozostaje zgłoszony błąd logowania na iPhonie; publiczny web wymaga osobnej diagnostyki po próbie urządzenia.
- Aktualizacja po działaniu użytkownika: zalogował CLI w drugim terminalu. `expo whoami` zwróciło **teodorsoprano**, zgodnie z kontem zgłoszonym w Expo Go. Potwierdzono ponownie publiczny manifest iOS `kroków`, publiczny adres bundla i health API `ok`. Zamknięto wyłącznie własny nieukończony proces logowania przeglądarkowego (po weryfikacji komendy i PID), pozostawiając ngrok/API/Metro/gateway. Do wykonania na telefonie: „Try Again” i obliczenie A/B/C; nie oznaczono jeszcze odbioru urządzenia.

## Osoba B / Codex — minimalny odsłuch i materiały demonstracji, 2026-10-03

- Zakres: ograniczona część M-03 oraz materiały D-01 według [demo-speech.md](demo-speech.md) i [demo-delivery.md](demo-delivery.md). Użytkownik upoważnił do samodzielnej kontynuacji także w mobile. Zachowano wcześniejszą pracę A, branch i brak commitów/publikacji. Pełne M-03/D-01 nie są oznaczone jako odebrane przez człowieka.
- Odsłuch: jeden koordynator, wybór wariantu i polskiego głosu, odczyt na żądanie, zatrzymanie i powtórzenie od początku. Zmiana wyniku/wariantu i ukrycie aplikacji zatrzymują kolejkę; spóźnione callbacki są ignorowane. Tekst opiera się na DTO i szablonach, zachowuje unknown, daty i ostrzeżenia. Wykryty czytnik native blokuje własny TTS; web ma ręczny przełącznik dla bieżącego wyniku i wymaga lokalnego polskiego głosu. Brak głosu zostawia pełny tekst.
- Dodano `expo-speech ~57.0.3` przez `expo install`, po sprawdzeniu lokalnego `expo/bundledNativeModules.json` SDK 57. Zmieniono manifest mobile i zregenerowano wspólny lockfile; wersja React Native bez zmian. Kontrakt i ranking bez zmian.
- Materiały: [PDF — osiem slajdów](../deliverables/Kroków-prezentacja.pdf), [MP4 — 143,52 s](../deliverables/Krok-po-kroku-demo.mp4), [notatki](../deliverables/notatki-prezentera.md), transkrypt i edytowalne HTML w `deliverables/`. Film ma napisy, bez ścieżki audio. To nagranie rzeczywistego web + HTTP synthetic, bez podstawiania odpowiedzi/głosów. Pokazuje 740/980/1120 m, zmianę rekomendacji, pochodzenie, niewiadomą, brak dopasowania oraz tekst odsłuchu. Nie jest dowodem odtworzenia dźwięku.
- Zmienione pliki: `apps/mobile/src/adapters/speech/{coordinator,platform,platform.web}.ts`, `src/features/planning/{SpeechPlayer.tsx,speechText.ts,RouteResults.tsx}`, testy `speech.spec.ts` i `speech-coordinator.spec.ts`; manifest mobile i `pnpm-lock.yaml`; skrypty `apps/mobile/scripts/{serve-demo,capture-demo,export-slides}.mjs`; `deliverables/**`, `.gitignore` (surowe materiały w `deliverables/work/`), README, instrukcje B, dokumenty zakresu i budżetu oraz ten wpis B.

### Kontrole odsłuchu i materiałów

Polecenia pnpm/node przez wrapper Node 24.21.0 / pnpm 10.34.6 z README.

| Polecenie / kontrola | Wynik |
| --- | --- |
| `pnpm lint` | PASS, bez ostrzeżeń ESLint. |
| `pnpm typecheck` | PASS, wszystkie pakiety. |
| `pnpm test:mobile` | PASS: 60 wykonań, 30 scenariuszy powtórzonych dla desktop i 390 px. Dziewięć nowych scenariuszy koordynatora/tekstu/UI; wcześniejsza regresja HTTP zachowana. |
| Koordynator i UI mowy | PASS: jedna kolejka, późne callbacki, stop podczas oczekiwania na głosy, blokada czytnika, brak głosu, błędy stop/speak, kolejne uruchomienia, zmiana wariantu, ponowienie, tekst unknown vs opisany brak. Adaptery testowe nie potwierdzają realnego dźwięku. |
| `pnpm test:contracts` | PASS: 121 testów. |
| `pnpm check:generated` | PASS: 29 plików zgodnych ze źródłem. |
| `pnpm build:web` | PASS, eksport statyczny użyty w filmie. |
| `pnpm --filter @krok/mobile exec expo export --platform ios --output-dir dist-ios --max-workers 2` | PASS, eksport Hermes. Nie jest testem urządzenia ani kompilacją binarium. |
| `pnpm --filter @krok/mobile exec expo install --check` | PASS, zgodne zależności. |
| `pnpm install --frozen-lockfile --network-concurrency=4 --child-concurrency=1` | PASS w bieżącym workspace. |
| `node apps/mobile/scripts/capture-demo.mjs` | PASS, rzeczywisty API 3001 i eksport web 8081; zero błędów JavaScript. Asercje sprawdzają wyniki i błąd twardego wymagania. |
| `node apps/mobile/scripts/export-slides.mjs` | PASS, osiem slajdów, wszystkie obrazy obecne i brak przepełnienia wymiarów. Powtórzony po doprecyzowaniu tekstu o ponownym obliczeniu. |
| PDF / pypdf i przegląd slajdów | PASS, 8 stron, polskie znaki zachowane; przejrzano obrazy wszystkich slajdów. |
| FFmpeg 7.1 / MP4 | PASS, H.264, 1280 × 720, 25 fps, 143,52 s; pełne dekodowanie `-v error -xerror ... -f null -` bez błędów. Wybrane klatki przejrzane pod kątem czytelności. |
| `git diff --check` | PASS; informacyjne ostrzeżenia o konwersji LF/CRLF. |

Pierwszy test Web Speech ujawnił ograniczenie natywnego settera `voice` w DOM
przy sztucznym obiekcie głosu; adapter testowy obejmuje teraz także konstruktor
wypowiedzi. Docelowy zestaw 60 wykonań przeszedł po poprawce. Narzędzie
`imageio-ffmpeg 0.6.0` zainstalowano do katalogu tymczasowego wyłącznie na potrzeby
kodowania; nie dodano go do zależności projektu.

### Ograniczenia i przekazanie odsłuchu / D-01

- iPhone/VoiceOver, Android/TalkBack i rzeczywisty dźwięk: **nieprzetestowane na urządzeniu**. Safari/WebKit, zdalne CI i pełny audyt WCAG niewykonane. Odsłuch to stop/powtórzenie, bez pauzy w środku zdania, mowy w tle i pełnej kolejki nawigacyjnej. Ręczny przełącznik czytnika web nie jest zapisywany między wynikami.
- Pełna symulacja M-04, resolver B-03, import OSM i graf realnego obszaru pozostają poza zakresem demonstracji. Backend i infra nie były zmieniane; ich testów nie powtarzano. Wcześniejsze wyniki w historycznych wpisach nie są nowym odbiorem.
- Film bez dźwięku ma osobny transkrypt; nie deklaruje skuteczności TTS. Zatwierdzenie treści, próba wystąpienia i kontrola zasad organizatora pozostają do wykonania przez prezentującego. Oryginalny `references/brief.pdf` nie jest dostępny; limity 10 slajdów / 3 min pochodzą z planu repozytorium. PDF-y Lumi dotyczą innego produktu.
- **Jedno konkretne przekazanie A / prezentującemu:** otworzyć PDF i cały MP4 z `deliverables/`, przećwiczyć wystąpienie z notatkami, a przy dostępnym telefonie sprawdzić odsłuch i wyłączenie TTS przy VoiceOver. Przed oddaniem poprawiać tylko wykryte blokery; nie rozpoczynać OSM ani nowych funkcji.

## Osoba B / Codex — integracja HTTP i porównanie demo, 2026-10-03

- Zrealizowano okno 1 i część porównania M-02 z planu ograniczonego do około 18 h. Zakres i kryteria zapisano w [demo-integration.md](demo-integration.md). Użytkownik upoważnił do samodzielnej pracy także nad mobile. Zachowano istniejący branch i wcześniejszą pracę A; bez commita, merge'a i publikacji.
- Formularz domyślnie korzysta z `HttpRouteApi`; mock wybiera się osobnym przyciskiem. Adapter waliduje wejścia, schematy, statusy HTTP, wersje, limity i wymogi akustyki. Ma timeout 8 s, pomija credentials i nie przełącza się automatycznie na fixtures. Błąd zachowuje ustawienia; zmiana formularza/trybu unieważnia oczekujący wynik. Niedostępny katalog ma przycisk ponowienia.
- Karty pokazują rekomendację, długości, baseline, czas marszu z założeniem prędkości i jawnym brakiem czasu oczekiwania, liczniki akustyki i niepełne dane odcinków. Rozwijany przebieg zawiera zdarzenia, stany faktów, dowody, źródła i osobne daty. Wszystkie teksty pochodzą z DTO i stałych szablonów. Synthetic, ograniczenia polityki i blokada prowadzenia terenowego są jawne.
- Przeczytano oba PDF-y Lumi: dotyczą innego produktu na HarmonyOS i nie są wymaganiami tego projektu. Zapisano własny [szkic filmu i ośmiu slajdów](demo-script.md), oparty na rzeczywistym scenariuszu Krok po kroku. To szkic, **film i finalny PDF nie są jeszcze wykonane**.
- Zmienione pliki: `apps/mobile/src/adapters/api/{HttpRouteApi,failureMessage}.ts`, `src/features/planning/{PlanningScreen,RouteResults,routeText,styles}`, `src/components/ActionButton.tsx`, testy `http-api.spec.ts`, `http-planning.spec.ts`, aktualizacja `planning.spec.ts` i `playwright.config.ts`; `.env.example`, README, instrukcje B oraz dokumentacja demo i ten wpis. Bez zmiany kontraktów, backendowego rankingu, manifestów, zależności natywnych i lockfile.

### Kontrole integracji demo

Polecenia przez wrapper Node 24.21.0 / pnpm 10.34.6 z README.

| Polecenie / kontrola | Wynik |
| --- | --- |
| `pnpm lint` | PASS, bez ostrzeżeń ESLint. |
| `pnpm typecheck` | PASS dla wszystkich pakietów. |
| `pnpm test:mobile` | PASS: 42 uruchomienia, 21 różnych scenariuszy w dwóch projektach Chromium (desktop i 390 px). 4 nowe scenariusze adaptera i 6 integracyjnych; dotychczasowe 11 zachowano. |
| Prawdziwy HTTP w przeglądarce | PASS: API na porcie 3002, Expo na 8085; 740/980/1120 m i rekomendacja 980 m, po zmianie akustyki 740 m, wymóg terenowy z błędem, wymóg documented z baseline 980 m i jedną opcją. Bez GPS. |
| Awarie i prezentacja | PASS: niedostępny katalog i ponowienie, awaria tras bez fallbacku, spóźniony wynik po zmianie preferencji, konflikt/limit budżetu z walidowanych fixtures, szczegóły przez klawiaturę, stan rozwinięcia, brak overflow przy 200%. Zrzuty obu szerokości przejrzane. |
| `pnpm test:contracts` | PASS: 121 testów. |
| `pnpm check:generated` | PASS: 29 artefaktów zgodnych ze źródłem. |
| `pnpm build:web` | PASS: statyczny eksport obejmujący `/plan`, `/`, `/about-data` i trasy techniczne. |
| `git diff --check` | PASS; tylko informacyjne ostrzeżenia o konwersji LF/CRLF. |

Pierwsze wykonanie zatrzymał pełny dysk C:; po zwolnieniu miejsca przez użytkownika
wznowiono zapis. Próba automatycznego usunięcia odtwarzalnych eksportów została
odrzucona przez kontrolę narzędzia i nie została wykonana. Pierwszy test przeglądarkowy
wykrył `Illegal invocation` dla `fetch` wywoływanego jako metoda adaptera. Poprawiono
kontekst wywołania; docelowy zestaw 42 testów i eksport przeszły po poprawce.

### Ograniczenia i przekazanie

- iPhone/VoiceOver i Android/TalkBack: **nieprzetestowane na urządzeniu**. Nie deklarujemy odbioru całego M-02 ani audytu WCAG. Odsłuch i symulacja nie są jeszcze zaimplementowane. Nie wykonano nowego eksportu iOS, Safari/WebKit, zdalnego CI ani testu PostGIS; backend i infra nie zmieniały się i ich zestawów nie powtarzano. Wyniki poprzednich iteracji pozostają historyczne.
- Telefon wymaga `EXPO_PUBLIC_API_URL` z adresem komputera w LAN i API nasłuchującego pod `API_HOST=0.0.0.0`. Bez konfiguracji native pokazuje jawną informację. Lokalny web używa domyślnie `http://localhost:3001`. Instrukcja w README; połączenie z fizycznego urządzenia pozostaje do sprawdzenia. Miejsca na dysku nadal jest niewiele, co ogranicza nagrania i eksporty.
- **Jedno przekazanie A / kolejnej iteracji:** dodać minimalny odsłuch wybranego tekstowego wariantu z zatrzymaniem/powtórzeniem i ochroną przed równoległą mową czytnika, następnie przejść do finalnych materiałów według `docs/demo-script.md`. Nie wracać teraz do B-03/OSM; chronić czas na prezentację i film.

## Osoba B / Codex — plan demonstracji i budżetu, 2026-10-03

- Aktualizacja użytkownika: oddanie za około 18 godzin, z przerwą na sen; ewentualne dwa dodatkowe limity rano wyłącznie na poprawki. Nadrzędny harmonogram w `docs/demo-budget.md`: zamknięcie funkcji po maksymalnie 8 h od decyzji, komplet materiałów do 15 h, ostatnie 3 h rezerwy. Symulacja i kosmetyka ustępują integracji, prezentacji i filmowi. To plan pracy, nie zadanie działające automatycznie w tle.
- Użytkownik zgłosił osiem pozostałych pięciogodzinnych limitów oraz potrzebę filmu i prezentacji. Zapisano [plan ośmiu okien](demo-budget.md): pięć na domknięcie/stabilizację demonstracji, jedno na prezentację, jedno na film i jedno rezerwowe. To plan rezultatów, nie gwarancja wydajności limitu.
- Priorytet bieżący: kompletna demonstracja synthetic od formularza przez HTTP do porównania i odsłuchu. Pełne P0/OSM i B-03 odłożone poza ten zakres; nie oznacza to ich wykonania ani odbioru. Telefon sprawdzamy wcześnie; zamknięcie funkcji najpóźniej po piątym oknie. Treść prezentacji i próbne nagranie zaczynają się przed końcowym montażem.
- Zmienione pliki tej iteracji: `docs/demo-budget.md` i ten wpis. Przejrzano status Git, aktualny status prac i odpowiednie etapy planu. Bez zmian aplikacji i nowych testów wykonawczych. W repozytorium zauważono dwa niezatwierdzone PDF-y Lumi; ich treść pozostaje do przeglądu przed przygotowaniem materiałów. Język materiałów pozostaje do ustalenia; roboczo polski.
- Przekazanie A / następnej instancji: rozpocząć okno 1 z planu budżetu — integrację mobile z istniejącym HTTP, zachowując walidację wspólnego kontraktu i jawny tryb synthetic. Poprzedni wpis B-02 opisuje techniczny stan backendu, nie aktualny priorytet dostarczenia demo.

## Osoba B / Codex backend — B-02, 2026-10-03

- Zadanie: rzeczywiste wyznaczanie tras na grafie synthetic, zgodnie z zakresem i kryteriami zapisanymi przed edycją w [b02-routing.md](b02-routing.md). Praca w głównym checkoutcie, na istniejącym `feat/F-03-mobile-bootstrap`, bez commita, merge'a i publikacji; zachowano niezatwierdzony M-01 oraz jego manifest.
- Rezultat: `@krok/routing`, jawny skierowany graf A/B/C z powrotami, Dijkstra, profile kosztów, ograniczone alternatywy Yen, deduplikacja długością wspólnych odcinków, metryki i uzasadnienia z danych. Osobne NO_PATH, NO_MATCHING_ROUTE, SEARCH_LIMIT_REACHED oraz poprawny wynik częściowy po udowodnieniu baseline. Twarde wymagania pozostają bez automatycznego rozluźniania.
- API w jawnym trybie synthetic oblicza trasy przez `src/routing.ts`. Katalog, graf i dowody używają jednego snapshotu `synthetic-graph-v2` / `synthetic-evidence-v2`; stare żądane wersje dają DATA_VERSION_CHANGED. DTO i fixtures draft.2 pozostają bez zmian. Wszystkie wyniki synthetic mają `preview_only`, ostrzeżenia i brak realnej geometrii.
- Potwierdzony scenariusz: A/B/C = 740/980/1120 m, koszty akustyki 1480/1100/1160, rekomendacja B. Bez preferencji akustyki rekomendacja A. Wymóg documented zmienia baseline na 980 m; wymóg aktualnej weryfikacji terenowej nie znajduje trasy. Przy jednej opcji odpowiedź zachowuje osobny baseline. Przy równych najkrótszych długościach rekomendacja reprezentuje baseline, zgodnie z identyfikowaniem go długością w draft.2.
- Zmienione/dodane pliki B: `packages/routing/**`; `apps/api/src/{routing,main,planner}.ts`, `apps/api/test/routing.test.ts`, manifest i README API; główny `package.json` i zregenerowany `pnpm-lock.yaml`; README, `CLAUDE.md`, `claude-start.md`, `docs/b02-routing.md` oraz ten wpis. Bez edycji mobile, kontraktów, fixtures, infra i wpisów A.

### Kontrole B-02

Komendy wykonano przez wrapper Node 24.21.0 / pnpm 10.34.6 z README.

| Polecenie / kontrola | Wynik |
| --- | --- |
| `pnpm lint` | PASS, bez ostrzeżeń ESLint. |
| `pnpm typecheck` | PASS dla pięciu pakietów workspace. |
| `pnpm test` | PASS: 40 routing + 86 API + 121 kontraktów + 14 infra + 22 uruchomienia Playwright = 283. Playwright powtarza 11 scenariuszy na dwóch szerokościach. |
| Routing | PASS: zmiana preferencji, baseline z tymi samymi wymogami, detour, 1–3 opcje, brak dopełniania, konflikty, daty, schody, odmowa/nieznany dostęp, zamknięcia, rozłączenie, kierunek, topologia poziomów, provenance, deterministyka i kopia snapshotu. |
| Niezmienniki algorytmu | PASS: Dijkstra i 12 alternatyw porównane z pełną enumeracją prostych ścieżek na 20 małych grafach cyklicznych; podział krawędzi zachowuje koszty obu polityk, metryki, zdarzenia i deduplikację fizyczną. Limity czasu/operacji sprawdzone z wstrzykiwanym zegarem. |
| API + routing | PASS: rzeczywiste obliczenia i walidacja Zod, wspólne wersje/dowody, zmiana preferencji, błędy 422/409/504, ograniczona opcja oraz niezależne kontrole bazy i grafu. Dotychczasowe testy prywatności HTTP również PASS. |
| `pnpm check:generated` | PASS, 29 artefaktów zgodnych ze źródłem. Nie zmieniano plików generowanych kontraktu. |
| `pnpm install --frozen-lockfile --network-concurrency=4 --child-concurrency=1` | PASS, lockfile aktualny, resolution pominięte. |
| `pnpm start:api` + rzeczywisty HTTP na `127.0.0.1:3001` | PASS: POST z przykładowym żądaniem daje 200, 740/980/1120 m i rekomendację 980 m; wyłączenie akustyki daje 740 m. `/readyz`: 503, database=false, graph=true, contract=true. Proces testowy zatrzymany po sprawdzeniu PID/komendy/portu. |
| `git diff --check` | PASS; ostrzeżenia Git dotyczą jedynie konwersji LF/CRLF. |

W trakcie implementacji poprawiono typ nieznanego faktu, zawężenia typów w adapterze/testach oraz błędny URL readiness w nowym teście. Wszystkie powyższe wyniki pochodzą z końcowego przebiegu po poprawkach. Ostrzeżenia NO_COLOR/FORCE_COLOR w testach web pochodzą z narzędzi.

### Ograniczenia i przekazanie B-02

- B-02 zaimplementowane i przetestowane lokalnie, **do przeglądu, bez wspólnego odbioru**. Kontrakt nadal draft.2. Polityka synthetic wyłącza miękkie kary dotyku, oddzielenia i wieku; wybór tych preferencji nie zmienia jej rankingu. Polityka pilota pozostaje hipotezą, bez kalibracji i bez uruchomienia na realnych danych.
- Obliczenia są synchroniczne w RAM; brak pomiaru p95 na grafie miasta, importu OSM, resolvera B-03, snapowania współrzędnych i prowadzenia terenowego. Limit kandydatów oznacza brak gwarancji globalnego optimum w ograniczeniu objazdu. Diagnostyka NO_MATCHING_ROUTE podaje aktywne twarde wymagania, nie minimalny zbiór przyczyn.
- Niewykonane: dodatni test prawdziwego PostGIS (bieżąca sonda database=false), zdalne CI, nowy eksport web/iOS i test czystego checkoutu. Mobile nadal używa MockRouteApi; brak integracji z HTTP. iPhone/VoiceOver i Android/TalkBack: **nieprzetestowane na urządzeniu**; brak deklaracji audytu WCAG. Poprzednie wyniki PostGIS i eksportów są historyczne.
- **Jedno przekazanie A:** wykonać M-02 na obecnych DTO i wspólnych fixtures; przy późniejszej integracji HTTP użyć granicy opisanej w [README API](../apps/api/README.md), obsłużyć wersję snapshotu v2, nie opierać UI na stałych ID A/B/C oraz jawnie pokazać ograniczenia polityki synthetic. Następne osobne zadanie B: B-03 — resolver dowodów, zakresów i aktualności.

## Osoba A / Codex — M-01, 2026-10-03

- Zadanie: formularz start/cel i preferencji z MockRouteApi. Zakres, założenia, przegląd C-01–C-08 i kryteria zapisano przed implementacją w [m01-mobile.md](m01-mobile.md). Praca na istniejącym `feat/F-03-mobile-bootstrap`, bez zmiany brancha, commita i merge'a; zachowano niezatwierdzoną pracę B.
- Przegląd A: zintegrowany draft.2 dostarcza granicę potrzebną do M-01; użyto wspólnego `@krok/contracts` i `@krok/contracts/fixtures`. Nie zmieniono schematów, wersji, fixtures ani rankingu. To robocza integracja, bez formalnego odbioru całego F-02 i bez zatwierdzenia ustawień produktu lub komunikatów o przejściach.
- Rezultat: ekran `/plan`, wyszukiwanie punktów, zamiana start/cel, cztery preferencje, trzy poziomy wymagania akustyki, mnożnik długości 1–2 i limit alternatyw. Błędy wymaganych/identycznych punktów i mnożnika kierują fokus do pola. Zmiana formularza usuwa poprzedni wynik; licznik generacji chroni przed zastosowaniem starszej odpowiedzi.
- Mock waliduje wejścia/wyjścia wspólnymi schematami, dopasowuje całe żądanie do przykładów `abc`/`single` lub błędu `NO_MATCHING_ROUTE`. Inne pary/ustawienia mają lokalny stan braku przygotowanego przykładu, bez udawania wyniku algorytmu. Twarde wymagania pozostają wybrane po błędzie. Przywrócenie przykładu wymaga osobnego przycisku.
- Wynik M-01 pokazuje wyłącznie krótką listę otrzymanych wariantów i długości. Porównanie, źródła i szczegóły odcinków należą do M-02. Tryb synthetic jest jawny; brak GPS, HTTP, mowy i nawigacji terenowej.
- Zmienione pliki A: `apps/mobile/src/adapters/api/MockRouteApi.ts`, `src/features/planning/{PlanningScreen,PlacePicker,form,styles}`, `src/components/ActionButton.tsx`, `src/app/plan.tsx`, layout, ekran startowy, `Screen.tsx`; testy `mock-api.spec.ts`, `planning.spec.ts`, aktualizacja `welcome.spec.ts`; manifest mobile, wygenerowany `pnpm-lock.yaml`, README, `docs/m01-mobile.md` i ten wpis. Jedyna nowa zależność mobile: `@krok/contracts: workspace:*`, bez nowej biblioteki natywnej. Zachowano zintegrowany root manifest B.

### Kontrole M-01

Komendy wykonano przez wrapper Node 24.21.0 / pnpm 10.34.6 z README.

| Polecenie / kontrola | Wynik |
| --- | --- |
| `pnpm lint` | PASS, bez ostrzeżeń ESLint. |
| `pnpm typecheck` | PASS dla wszystkich czterech pakietów. |
| `pnpm test:mobile` | PASS: 22 uruchomienia — po 5 scenariuszy adaptera/formularza oraz 6 UI w każdym z dwóch projektów Playwright. Łącznie 11 różnych scenariuszy; testy logiki są powtórzone dla obu projektów. |
| Nowe UI M-01 | PASS na desktop i 390 px: wybór punktów i wysłanie klawiaturą, brak GPS, wynik A/B/C, unieważnienie wyniku po zmianie, wyszukiwanie/empty, błędy punktów/mnożnika i fokus, zamiana punktów, brak przykładu, zachowanie twardego wymagania po NO_MATCHING_ROUTE, jawne przywrócenie, jeden wariant B, powiększenie CSS 200%. |
| Adapter / formularz | PASS: dokładne dopasowanie żądania, odrzucanie nieobsługiwanych punktów, preferencji i wersji; walidacja pól; błąd twardego wymagania; obca wersja/status, puste routes i synthetic z prowadzeniem terenowym odrzucone; katalog zwraca niezależne kopie. |
| `pnpm test:contracts` | PASS: 121 testów. |
| `pnpm check:generated` | PASS: 29 artefaktów zgodnych ze źródłem. Nie zmieniano plików generowanych kontraktu. |
| `pnpm build:web` | PASS, eksport statyczny obejmuje `/plan` i wcześniejsze ekrany. |
| `pnpm --filter @krok/mobile exec expo export --platform ios --output-dir dist-ios --max-workers 2` | PASS, pakiet Hermes; nie jest to uruchomienie na iPhonie. |
| `pnpm install --frozen-lockfile --network-concurrency=4 --child-concurrency=1` | PASS, SHA-256 lockfile przed/po identyczny. |
| `pnpm --filter @krok/mobile exec expo install --check` | PASS: Dependencies are up to date. |
| Zrzuty UI, `git diff --check`, whitespace nowych plików | PASS; przejrzano wąski ekran błędu oraz powiększenie. Artefakty testowe i eksporty pozostają ignorowane. |

Pierwszy przebieg ujawnił brak stanu zaznaczenia w DOM mimo poprawnego wyglądu. Kontrolka przekazuje teraz `aria-checked` dla checkboxów i `aria-pressed` dla przycisków wyboru na web oraz `accessibilityState` na native. Po poprawce wszystkie testy przeszły. Ostrzeżenia NO_COLOR/FORCE_COLOR pochodzą z narzędzi.

### Ograniczenia i przekazanie M-01

- iPhone / VoiceOver i Android / TalkBack: **nieprzetestowane na urządzeniu**. M-01 jest zaimplementowane i sprawdzone lokalnie, **bez pełnego odbioru**. F-03 nadal czeka na test telefonu. Brak audytu WCAG i testu Safari/WebKit.
- Nie wykonano zdalnego CI, testu czystego checkoutu ani integracji mobile z HTTP. API/infra nie zmieniano i nie powtarzano ich testów ani PostGIS. Ochrona przed starszą odpowiedzią jest w kodzie; test z opóźnionym transportem pozostaje do integracji HTTP. Brak żądania lokalizacji jest zamierzony: synthetic udostępnia tylko katalog, bez współrzędnych.
- Ryzyka: draft kontraktu nie jest zamrożony; przykład nie obsługuje dowolnych ustawień; wartości początkowe i próg 180 dni pochodzą z jawnego scenariusza, nie z zatwierdzonych preferencji produktu. Gotowy wynik nie jest nowym obliczeniem trasy.
- **Jedno przekazanie B:** M-01 importuje już draft.2 i potwierdza zgodność mobile ze wspólnymi fixtures; w B-02 zachować rozróżnienie NO_MATCHING_ROUTE/NO_PATH oraz dokładne respektowanie preferencji i limitu alternatyw. Brak przykładu pozostaje lokalnym stanem mocka, bez dodawania kodu do API. Następne zadanie A: M-02 na tych samych DTO.

## Osoba B / Codex backend — B-01 i integracja F-02/F-03, 2026-10-03

- Na polecenie użytkownika kontynuowano samodzielnie w głównym checkoutcie `C:/Users/rapma/Documents/GitHUb/slepa-genia`. Zachowano branch `feat/F-03-mobile-bootstrap` i niezatwierdzoną pracę A; bez commita, merge'a i publikacji. Worktree `slepa-genia-backend` jest historycznym stanem F-02, nie aktualnym miejscem rozwijania API.
- Zadanie: B-01. Zakres i kryteria zapisane przed implementacją w [b01-api.md](b01-api.md). Zintegrowano 48 nowych plików F-02 bez nadpisywania istniejących plików A, połączono skrypty workspace i zregenerowano jeden lockfile z zachowaniem manifestu mobile, lint i testów CI A. Draft `1.0.0-draft.2` jest roboczą granicą implementacji; nie deklarujemy formalnego odbioru A+B ani zatwierdzenia komunikatów przez użytkowników końcowych.
- Rezultat B-01: pakiet `@krok/api`, Fastify 5.12.5, CORS 11.3.0, konfiguracja lokalna, sondowanie PostGIS, health/readiness, katalog/search, źródła/dowody i OpenAPI. Request/response walidowane wspólnym Zod 4.6.5. Obsługa błędów JSON, złych współrzędnych, capability, punktów i żądanych wersji; ograniczenie body, no-store i serwerowe request ID. Logi nie zawierają body, URL z query, preferencji, pozycji, nagłówków ani szczegółów wyjątków.
- Interfejs `RoutePlanner` jest gotowy do B-02. Runtime nie ma plannera ani aktywnego grafu; prawidłowe żądania tras zwracają SOURCE_UNAVAILABLE, readiness sygnalizuje graph=false. Testowy planner występuje tylko w testach. Nie udostępniono fikcyjnego routingu dla dowolnych preferencji.
- Zmienione/dodane pliki B: `apps/api/**`, zintegrowane `packages/contracts/**` i `examples/**`, główny `package.json` i wygenerowany `pnpm-lock.yaml`, `.env.example`, krok `check:generated` w istniejącym CI, README, `CLAUDE.md`, `claude-start.md`, `docs/contracts.md`, `docs/f02-review.md`, `docs/b01-api.md` i ten wpis. Pakiet contracts otrzymał eksport `./openapi`; schemat wire i wersja nie zmieniły się. Kod i manifest `apps/mobile` oraz pliki infra pozostały bez zmian.

### Kontrole B-01

Komendy z katalogu głównego uruchamiano przez przypięty wrapper Node 24.21.0 / pnpm 10.34.6, np.:

```powershell
npm.cmd exec --yes --package=node@24.21.0 --package=pnpm@10.34.6 --call "pnpm lint && pnpm typecheck && pnpm test && pnpm check:generated"
```

| Kontrola | Wynik |
| --- | --- |
| `pnpm install --network-concurrency=4 --child-concurrency=1` | PASS, wspólny lockfile dla mobile, infra, contracts i api. Początkowo brakowało głównego node_modules/.bin/tsc; odtworzono zależności przez `pnpm install --force --frozen-lockfile --network-concurrency=4 --child-concurrency=1`. |
| `pnpm lint` | PASS, bez ostrzeżeń. |
| `pnpm typecheck` | PASS dla wszystkich czterech pakietów. |
| `pnpm test` | PASS: **80 API + 121 contracts + 14 infra + 6 Expo Web = 221 testów**. |
| HTTP/API | Testy Fastify inject i rzeczywisty nasłuch na losowym porcie loopback: katalog, wyszukiwanie, źródła, dowody, wersje, granice wejścia/wyjścia, błędy plannera, brak automatycznego mocka, readiness, timeout bazy, CORS i prywatność logów. |
| Regresja Expo Web | PASS: 6 istniejących scenariuszy Chromium desktop/wąski ekran; logi NO_COLOR/FORCE_COLOR są ostrzeżeniami narzędzi, nie błędami testów. |
| `pnpm check:generated` | PASS, 29 artefaktów F-02 zgodnych ze źródłem. |
| `pnpm contracts:export` i SHA-256 przed/po | PASS; regeneracja w głównym checkoutcie zachowała identyczną treść wszystkich 29 artefaktów. |
| `pnpm install --frozen-lockfile --network-concurrency=4 --child-concurrency=1` | PASS; SHA-256 zintegrowanego lockfile bez zmiany. |
| `pnpm --filter @krok/mobile exec expo install --check` | PASS: Dependencies are up to date. |
| `API_DATA_MODE=synthetic` i `pnpm start:api` | PASS: serwer wystartował na 127.0.0.1:3001. PowerShell HttpClient potwierdził health=200, coverage=200/synthetic/preview_only, readiness=503 i routes=503/SOURCE_UNAVAILABLE. Readiness: database=false, graph=false, contract=true. Proces uruchomiony na ten test zatrzymano po sprawdzeniu PID i nasłuchu. |
| `docker compose --env-file .env -f infra/compose.yaml ps --format json` | Niedostępne środowisko: Docker Desktop is unable to start. Nie potwierdzono połączenia z działającym PostGIS w tej iteracji. Nie uruchamiano migracji ani nie usuwano danych. |
| `git diff --check` | PASS; tylko informacja o normalizacji końców linii Markdown. |

### Ograniczenia i przekazanie B-01

- To lokalny fundament HTTP, bez algorytmu wyznaczania tras, importera, rzeczywistego grafu, limitera nadużyć ani deploymentu. `API_DATA_MODE=synthetic` wybiera tylko katalog; domyślnie dane są niedostępne. B-02 musi sprawdzać topologię, dostęp pieszy, schody i poprawność kosztów; walidacja DTO nie zastępuje tych kontroli.
- Niewykonane: dodatni test połączenia z prawdziwym PostGIS (Docker niedostępny), zdalne CI, ponowny eksport iOS, Safari/WebKit, integracja mobile z API i telefon/czytniki: **nieprzetestowane na urządzeniu**. Podgląd mobile zachowuje zakres F-03.
- Ryzyka: nadal niezamrożony kontrakt draft.2; brak działającego routingu; konfiguracja produkcyjna i operacje wymagają kolejnych zadań. Nieznane ścieżki HTTP mają neutralne tekstowe 404, bez dokładania kodu do kontraktu. `avoidKnownSteps` wymaga walidacji na grafie po stronie B-02.
- **Jedno przekazanie A:** użyć zintegrowanego `@krok/contracts` i `@krok/contracts/fixtures` do M-01, po przeglądzie C-01–C-08; instrukcja [pakietu kontraktów](../packages/contracts/README.md), adresy i zachowanie [API](../apps/api/README.md). Nie przenosić ponownie starszego lockfile z worktree B.
- Następne zadanie B: B-02 — deterministyczny graf synthetic i rzeczywiste wyznaczanie alternatyw, podłączone przez `apps/api/src/planner.ts`.

## Osoba B / Codex backend — F-02, 2026-10-03

Poniżej historyczny stan sprzed integracji B-01. Aktualne źródła F-02 są już w głównym checkoutcie.

- Na polecenie użytkownika rolę backendową po Claude Code przejęła osobna instancja Codexa. Rola A/mobile pozostaje bez zmian.
- Implementacja F-02 znajduje się w osobnym worktree `C:/Users/rapma/Documents/GitHUb/slepa-genia-backend`, branch `feat/F-02-contracts`, bez commita i merge'a. Skopiowano tam niezatwierdzony fundament F-01; manifesty/lockfile i mobile w checkoutcie A nie były zmieniane przez B.
- Rezultat techniczny: draft `1.0.0-draft.2`, pakiet `@krok/contracts`, schematy Zod 4.6.5, wspólne fixtures, walidacja referencji/metryk, 28 przykładów JSON i generowane OpenAPI. Zaktualizowane `CLAUDE.md` i `claude-start.md` opisują rolę Codexa B. **F-02 do przeglądu, bez wspólnego odbioru.**
- Wyniki B: `pnpm lint`, `pnpm typecheck`, `pnpm test` — PASS (121 testów kontraktu + 14 infra); `contracts:export`, `check:generated`, instalacja `--frozen-lockfile` — PASS. Ponowna generacja zachowała SHA-256 wszystkich 29 artefaktów. Pełny raport komend, plików i ograniczeń: [status worktree B](../../slepa-genia-backend/docs/status.md).
- Nie ma jeszcze serwera API, routingu ani importera. Nie wykonano zdalnego CI, integracji z Expo, testu HTTP ani telefonu; **nieprzetestowane na urządzeniu**. Testów PostGIS nie powtarzano, ponieważ infra nie zmieniano.
- Jedno przekazanie A: przejrzeć propozycje C-01–C-08 w [przeglądzie F-02](../../slepa-genia-backend/docs/f02-review.md) oraz fixtures zgodnie z [instrukcją pakietu](../../slepa-genia-backend/packages/contracts/README.md), przed użyciem ich w M-01/M-02. Przy integracji połączyć manifesty i zregenerować jeden lockfile, zachowując zależności Expo A; nie kopiować całego lockfile B. Kolejne zadanie B: B-01 po przeglądzie kontraktu.

## Osoba A / Codex — F-03, 2026-10-03

- Po potwierdzeniu przez użytkownika równoległej pracy drugiej instancji Codexa w `slepa-genia-backend` zadanie F-02 pozostaje po stronie B. Rozpoczęty tutaj szkic schematów został usunięty przed instalacją zależności; nie powstaje drugi kontrakt.
- Branch: `feat/F-03-mobile-bootstrap`, z zachowaniem wcześniejszych niezatwierdzonych zmian F-01 i UX.
- Zakres: Expo Router, ekran startowy i objaśnienia stanów danych, adapter fokusu web/native, testy UI w przeglądarce. Bez integracji API, formularza trasy, zgody GPS i prowadzenia terenowego.
- Kryteria: poprawne zależności Expo, lint/typecheck, uruchomienie i testy web, eksport web; test iPhone'a jako odrębny wynik. Implementacja przeszła kontrole lokalne; **F-03 nie jest odebrane — brakuje uruchomienia na telefonie**.
- Urządzenie wskazane przez użytkownika: iPhone, Expo Go client 57.0.9, supported SDK 57.0.0. Wybrano stabilny SDK 57. Test telefonu: **nieprzetestowane na urządzeniu**.
- Zmienione pliki: `apps/mobile/**` (konfiguracja Expo Router, ekrany, kontrolki, adapter fokusu, Playwright i instrukcje); root `package.json`, `pnpm-lock.yaml`, `.gitignore`, `eslint.config.mjs`, `.github/workflows/ci.yml`, `README.md`, `docs/decisions.md` i ten wpis. Wcześniejsze zmiany F-01/UX oraz instrukcje osoby B zachowane. Brak commita i merge'a.

### Kontrole F-03

Polecenia pnpm wykonywano przez wrapper Node 24.21.0 / pnpm 10.34.6 pokazany w README. Nie podmieniono globalnego Node.

| Polecenie / kontrola | Wynik |
| --- | --- |
| `pnpm lint` | PASS, bez ostrzeżeń ESLint. |
| `pnpm typecheck` | PASS, mobile i infra w trybie strict. |
| `pnpm test` | PASS, 14 testów infra i 6 testów UI w Chromium: desktop i szerokość 390 px. |
| `pnpm test:e2e:web` | PASS po poprawieniu stylów linku; końcowe 6 scenariuszy po zmianie układu wykonano ponownie przez `pnpm test`. |
| UI / Playwright | Polski język dokumentu, jawny podgląd, brak żądania lokalizacji, przejścia Tab/Enter i fokus nagłówków, widoczne obramowanie linku, 4 stany danych, bezpośrednie wejście na ekran i powiększenie CSS 200%. Dodatkowo kontrola rozdzielenia sekcji w małym oknie. |
| Przegląd zrzutów web | Poprawiono nakładanie sekcji na szerokości 390 px; po zmianie zrzut potwierdza odstęp. Zrzuty generują się w ignorowanym `apps/mobile/test-results/`. |
| `pnpm build:web` | PASS; eksport statyczny do `apps/mobile/dist`, w tym `/` i `/about-data`. `+html.tsx` ustawia `lang="pl"`. |
| `pnpm --filter @krok/mobile exec expo export --platform ios --output-dir dist-ios --max-workers 2` | PASS, pakiet Hermes iOS. To sprawdzenie bundlowania, nie test urządzenia ani kompilacja własnego binarium. |
| `pnpm --filter @krok/mobile exec expo install --check` | PASS: Dependencies are up to date, także po końcowej instalacji z lockfile. |
| `pnpm install --frozen-lockfile --network-concurrency=4 --child-concurrency=1` | PASS w bieżącym checkoutcie; SHA-256 lockfile przed/po identyczny. Nie jest to ponowny test czystego checkoutu całego F-03. |
| Metro dla iPhone'a + żądanie manifestu iOS | Serwer wystartował na porcie 8081; manifest zwrócił SDK 57.0.0 i adres bundla. Połączenie z fizycznego telefonu pozostaje do potwierdzenia. |
| `git diff --check` | PASS; Git zgłasza jedynie przewidywaną konwersję końców linii w Markdown. |

Pierwsza próba UI wskazała niezgodność adresu IPv4 z nasłuchem Metro po IPv6; konfiguracja używa teraz `localhost`. Następne próby wykryły sposób przekazywania stylów przez Router (`StyleSheet.flatten` dla `Link asChild`); poprawka i test fokusu są w kodzie. Eksport statyczny zastąpił `single`, aby szablon HTML z polskim językiem był używany także poza developmentem. Są to rozwiązane problemy, nie pominięte testy.

### Ograniczenia i przekazanie F-03

- iPhone / VoiceOver: **nieprzetestowane na urządzeniu**. Użytkownik otrzymał adres aktywnego Metro i scenariusz dwóch ekranów. Android / TalkBack: **nieprzetestowane na urządzeniu**. Nie znamy jeszcze wersji iOS. Nie deklarujemy audytu WCAG.
- Niewykonane: zdalne CI, test Safari/WebKit, test kontraktowy (F-02 nie jest zintegrowane), test HTTP i API. PostGIS nie był ponownie uruchamiany w F-03; jego kod się nie zmienił.
- Podgląd nie wyznacza tras, nie prosi o GPS, nie odtwarza mowy i nie korzysta z API. M-01/M-02 czekają na przegląd kontraktu i integrację. Błędy biblioteki/konfiguracji ujawnione przez testy zostały poprawione; ostrzeżenia narzędzi o `NO_COLOR`/`FORCE_COLOR` nie wpływały na wyniki.
- Konkretne przekazanie B: przy integracji F-02 zachować manifest `@krok/mobile`, skrypty web i testy CI z tego brancha; scalić root manifesty i zregenerować jeden lockfile przez pnpm. Nie zastępować lockfile A kopią B. A następnie przegląda C-01–C-08 i fixtures przed M-01.

## Osoba A / Codex — F-01, 2026-10-03

- Zadanie: kontynuacja od przygotowanego UX do fundamentu technicznego F-01. Zakres: workspace pnpm, TypeScript strict, lint, runner testów, lokalny PostGIS, `.env.example` i CI. Założenie: brak równoległej implementacji fundamentu w tym checkoutcie; istniejące niezatwierdzone dokumenty UX zachowane.
- Branch: `feat/F-01-foundation`. Zmiany pozostają bez commita i bez merge'a. Własność integracji manifestów i lockfile nadal po stronie B.
- Stan: implementacja F-01 przeszła opisane niżej kontrole lokalne; **do przeglądu, bez oznaczenia wspólnego odbioru**. CI na GitHubie nie było uruchomione. F-02/F-03/M-01/M-02 nie są wykonane.
- Wersje: Node 24.21.0, pnpm 10.34.6, TypeScript 5.9.3, ESLint 10.12.0, Vitest 4.1.11. Lokalna baza: PostgreSQL 17.5 i PostGIS 3.5.2. Pełne decyzje: [docs/decisions.md](decisions.md).
- Zmienione pliki F-01: `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `.npmrc`, `.node-version`, `.gitignore`, `.gitattributes`, `.env.example`, `tsconfig.base.json`, `eslint.config.mjs`, `.github/workflows/ci.yml`, pakiet i pliki testów w `infra/`, `README.md`, `docs/decisions.md`, ten wpis statusu. `docs/mobile-ux.md` pochodzi z poprzedniej iteracji i nie był zmieniany w F-01.

### Wykonane kontrole

Na hoście Node 22.17.1 nie był podmieniany globalnie. Polecenia pnpm uruchamiano przez sprawdzony wrapper PowerShell:

```powershell
npm.cmd exec --yes --package=node@24.21.0 --package=pnpm@10.34.6 --call "pnpm lint && pnpm typecheck && pnpm test"
```

| Polecenie / kontrola | Wynik |
| --- | --- |
| `pnpm install` | Utworzenie lockfile i instalacja workspace. Podczas zmiany wersji ESLint jedna próba przerwana brakiem pamięci; `pnpm install --network-concurrency=4 --child-concurrency=1` zakończyło się powodzeniem. |
| `pnpm lint` | PASS, bez ostrzeżeń. |
| `pnpm typecheck` | PASS, TypeScript strict dla `@krok/infra`. |
| `pnpm test` | PASS, 14 testów konfiguracji: port, wymagane zmienne, zachowanie znaków specjalnych w haśle i odrzucenie zdalnego hosta. |
| `pnpm db:config` | PASS, Compose poprawny; wartości środowiska nie są wypisywane. |
| `pnpm db:up` | PASS, kontener osiągnął stan healthy. Powtórzono po przypięciu obrazu digestem. |
| `pnpm db:check` | PASS, połączenie z bazą i zapytanie PostGIS. |
| `pnpm test:db` | PASS, 2 testy: obecność rozszerzenia i odległość 110–112 metrów między syntetycznymi punktami WGS84. Transakcja tylko do odczytu, bez seedowania danych. |
| `SELECT version(); SELECT PostGIS_Full_Version();` przez `docker compose exec` | Potwierdzono PostgreSQL 17.5 i PostGIS 3.5.2. |
| `pnpm install --frozen-lockfile` w osobnym pustym katalogu źródłowym | PASS. Skopiowano pliki repozytorium bez `.env`, `.git` i `node_modules`; skorzystano z cache pakietów. Następnie lint, typecheck i wszystkie 14 testów ponownie PASS. To test izolowanej kopii źródeł, nie zdalnego checkoutu z zatwierdzonego commita. |
| SHA-256 lockfile przed/po odtworzeniu | Identyczny; instalacja nie zmieniła wygenerowanego lockfile. |
| `git diff --check` i kontrola whitespace nowych plików w PowerShell | PASS. `git diff --no-index --check` na tym hoście zwraca 1 także dla nowego pliku bez komunikatu o whitespace, dlatego nowe pliki sprawdzono dodatkowo bezpośrednio. |
| `git check-ignore .env node_modules infra/node_modules` | Wszystkie wskazane pliki/katalogi ignorowane. Jedyny lockfile projektu: `pnpm-lock.yaml`. |
| `pnpm db:stop` | PASS; kontener zatrzymany po testach, wolumen z danymi zachowany. |

### Ograniczenia i przekazanie

- Brak aplikacji mobile/web, API, schematów Zod, kontraktowych fixtures, migracji i importera. Polecenia przyszłych etapów są w README jawnie oznaczone jako niezaimplementowane.
- Niewykonane: test zdalnego CI na GitHubie, test czystego checkoutu po commicie, testy aplikacji i kontraktu. VoiceOver/TalkBack oraz Expo Go: **nieprzetestowane na urządzeniu**. Brak deklaracji audytu WCAG.
- Kontrakt `1.0.0-draft.1`, semantyka danych i ranking bez zmian. Nie wprowadzono zależności natywnych, kont, usług płatnych ani migracji produkcyjnych. `.env.example` zawiera wyłącznie publiczne lokalne wartości przykładowe.
- Ryzyka: host ma ograniczoną pamięć; podczas rozwiązywania zależności może być potrzebne ograniczenie równoległości. Obraz bazy został sprawdzony na x86_64; inne architektury nie były testowane. CI jest skonfigurowane, ale jego wykonanie pozostaje do potwierdzenia po publikacji zmian.
- Konkretne przekazanie osobie B: przejrzeć fundament i wspólny lockfile, następnie wykonać F-02 na tym workspace, rozstrzygając C-01–C-08 z [planu UX](mobile-ux.md) i dostarczając walidowane wspólne fixtures. Kolejne zadanie A: F-03 po integracji fundamentu i uzgodnieniu SDK/telefonów.

## Osoba A / Codex — wcześniejsza iteracja UX, 2026-10-03

Poniższy wpis opisuje stan sprzed implementacji F-01.

- Zadanie: przygotowanie UX i wymagań frontendu do F-02 zgodnie z `codex-start.md`, przed implementacją F-03.
- Branch: `docs/F-02-mobile-ux`. Zmiany nie są jeszcze zatwierdzone commitem.
- Rezultat: [plan UX i wymagania kontraktu](mobile-ux.md), obejmujący ekrany, fokus, komunikaty, wszystkie kody błędów opisane w kontrakcie, zależności C-01–C-08 i planowane scenariusze odbioru UX-01–UX-15.
- Zmienione pliki: `docs/mobile-ux.md`, `docs/status.md` (oba nowe).
- Stan odbioru: dokument przygotowany do wspólnego przeglądu. F-02, F-03, M-01 i M-02 nie są oznaczone jako odebrane. Brak implementacji aplikacji, schematów, fixtures, manifestów i skryptów testowych w tym checkoutcie.
- Kontrakt: bez zmiany wersji `1.0.0-draft.1`; źródłowy opis pozostaje w `contracts.md`. Brak migracji i zmian zależności.
- Kontrole: przegląd `git status --short --branch`, `rg --files --hidden -g '!.git' -g '!node_modules' -g '!vendor'` i odczyt instrukcji oraz specyfikacji przez `Get-Content -Encoding UTF8`. Stan przed edycją czysty. `git switch -c docs/F-02-mobile-ux` zakończone powodzeniem.
- Wyniki kontroli dokumentacji: jednorazowy skrypt PowerShell (`Get-Content`, `[regex]::Matches`, `Test-Path`) potwierdził 5 istniejących lokalnych odnośników, osobną reakcję UI dla wszystkich 12 kodów błędów z `contracts.md` oraz 15 planowanych scenariuszy. `git diff --no-index --check -- NUL docs/mobile-ux.md` i analogiczna kontrola `docs/status.md`: bez błędów whitespace; Git zgłosił jedynie przyszłą konwersję LF do CRLF. To kontrola dokumentów, nie test aplikacji.
- Niewykonane: lint, typecheck, testy pakietu, kontraktowe i web — brak implementacji oraz runnerów. VoiceOver/TalkBack, Expo Go, odsłuch i GPS: **nieprzetestowane na urządzeniu**. Scenariusze w dokumencie są planem testów, nie wynikami.
- Ryzyka i decyzje: niepełne definicje odpowiedzi katalogu i instrukcji, brak mechanizmu żądania wersji dla `DATA_VERSION_CHANGED`, rozbieżność zakresu zapisu offline P0/P1, nieuzgodnione domyślne preferencje i teksty o przejściach. Brak ustalonego SDK i telefonów. Szczegóły w sekcji 6 planu UX.
- Przekazanie osobie B: przygotować F-02 na fundamencie F-01, domknąć C-01–C-08 i dostarczyć wspólne walidowane fixtures do recenzji obu stron. Nie jest potrzebny import OSM do uruchomienia przyszłego demo mobile.
- Następne zadanie A: F-03 po scaleniu fundamentu i uzgodnieniu SDK; M-01 i M-02 w osobnych iteracjach.
