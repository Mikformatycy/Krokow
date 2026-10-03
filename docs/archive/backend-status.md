# Status prac

## Osoba B / Codex — przeniesienie bieżącej pracy, 2026-10-03

Na polecenie użytkownika kontynuowano samodzielnie i zintegrowano F-02 z F-03
w głównym checkoutcie `C:/Users/rapma/Documents/GitHUb/slepa-genia`. Tam powstał
pakiet API B-01 i zregenerowany lockfile zachowujący zależności Expo.
Ten worktree zachowuje historyczny stan F-02. Nie kopiować jego starszych
manifestów/lockfile na bieżący projekt. Aktualny raport B-01:
[status głównego checkoutu](../../slepa-genia/docs/status.md).

## Osoba B / Codex backend — F-02, 2026-10-03

- Użytkownik przekazał rolę backendową Claude Code osobnej instancji Codexa. Instrukcje roli są w `CLAUDE.md` i `claude-start.md`; wspólne AGENTS.md oraz zakres A/mobile pozostają zachowane.
- Worktree: `C:/Users/rapma/Documents/GitHUb/slepa-genia-backend`, branch `feat/F-02-contracts`. Skopiowano istniejącą niezatwierdzoną implementację F-01 z checkoutu A, bez `.env` i `node_modules`. Zmiany B pozostają bez commita, merge'a i publikacji.
- Zakres wykonany technicznie: F-02 jako **draft do przeglądu, bez wspólnego odbioru**. Schematy Zod i inferowane typy, katalogi, request/response trasy, wszystkie 12 błędów, stany known/unknown/conflicting, kontrolowane klucze komunikatów, referencje dowodów/źródeł, metryki, wersje i blokada synthetic.
- Wersja wykonawcza: `1.0.0-draft.2`, Zod 4.6.5. Node 24.21.0, pnpm 10.34.6, TypeScript 5.9.3, Vitest 4.1.11 i tsx 4.23.15 z fundamentu. Opis wejściowy `contracts.md` (`1.0.0-draft.1`) nie został nadpisany. Propozycje C-01–C-08: [f02-review.md](f02-review.md).
- Pliki B: `CLAUDE.md`, `claude-start.md`, `packages/contracts/**` (schematy, fixtures, testy, generator, OpenAPI, manifest i instrukcja), `examples/**` (28 JSON i instrukcja), `docs/contracts.md`, `docs/f02-review.md`, własny wpis statusu, trzy skrypty w głównym `package.json`, wygenerowany `pnpm-lock.yaml`, krok kontroli generacji w `.github/workflows/ci.yml`, aktualizacja README w tym worktree. Pozostałe pliki F-01 są odziedziczone od A.
- W checkoutcie A zmieniono wyłącznie własny wpis B w statusie oraz punkty startowe B (`CLAUDE.md`, `claude-start.md`). Manifest, lockfile, README, AGENTS.md i mobile A nie były przez B edytowane.

### Wykonane kontrole B

Komendy pnpm uruchamiano z katalogu tego worktree przez przypięty wrapper:

```powershell
npm.cmd exec --yes --package=node@24.21.0 --package=pnpm@10.34.6 --call "pnpm lint && pnpm typecheck && pnpm test && pnpm check:generated"
```

Poniższe wyniki pochodzą z faktycznych uruchomień składowych komend; naprawiono błędy pierwszych przebiegów i ponowiono odpowiednie kontrole.

| Komenda / kontrola | Wynik końcowy |
| --- | --- |
| `pnpm install --network-concurrency=4 --child-concurrency=1` | PASS; zainstalowany pakiet kontraktu, jeden wygenerowany lockfile. |
| `pnpm lint` | PASS, zero ostrzeżeń. |
| `pnpm typecheck` | PASS, contracts i infra w strict. |
| `pnpm test:contracts` | PASS w przebiegu 117 testów; po dodaniu kolejnych czterech testów pełne `pnpm test` wykonało wszystkie 121 testów kontraktu. |
| `pnpm test` | PASS: 121 testów kontraktu + 14 testów istniejącej infrastruktury = 135. |
| `pnpm contracts:export` | PASS; walidacja i generacja 28 JSON oraz OpenAPI 3.1. |
| `pnpm check:generated` | PASS; wszystkie 29 artefaktów aktualne, brak niezarejestrowanych JSON. |
| Ponowne `pnpm contracts:export` i porównanie SHA-256 | PASS; wszystkie 29 plików identyczne bajtowo, lockfile bez zmiany. |
| `pnpm install --frozen-lockfile` | PASS w worktree backendu; bez zmiany lockfile. Nie jest to test nowego zdalnego checkoutu. |
| `git diff --check` i kontrola whitespace także plików untracked | PASS; Git informuje o normalizacji LF/CRLF dla Markdown, bez różnic merytorycznych w wspólnych dokumentach źródłowych. |

Testy obejmują m.in. odrębność known(false)/unknown/conflicting, brakujące i sprzeczne dowody, niezależność obserwacji, zakresy, nieodmładzanie potwierdzenia przy imporcie, błędne daty/liczby/wersje, nieznane klucze, liczniki, offsety, ukryty baseline, zero przejść oraz blokadę synthetic. Test regresji izoluje kopie fixtures, aby zmiana jednej nie zmieniała kolejnej. Sprawdzono brak importów Node w grafie zależności eksportów używanych przez mobile.

### Ograniczenia i przekazanie B

- Nie zaimplementowano serwera HTTP, algorytmu routingu, resolvera, migracji ani importu OSM. Fixtures są autorskimi przykładami DTO, nie wynikiem działającego silnika. Weryfikacja w stale fixture jest jawnie symulowana.
- Zod sprawdza kształt i relacje w odpowiedzi. Zgodność konkretnego requestu z wynikiem, topologia, twarde wymagania i rzeczywiste wyliczenie rankingu pozostają zadaniem B-01/B-02/B-03. OpenAPI nie wyraża wszystkich kontroli między polami; walidatory Zod są obowiązkowe po obu stronach.
- Niewykonane: zdalne CI, test API przez HTTP, test bazy w tej iteracji (infra bez zmian), integracja z równoległym Expo, web, VoiceOver/TalkBack i telefon: **nieprzetestowane na urządzeniu**. Nie ma deklaracji odbioru F-02 ani audytu dostępności.
- Ryzyka: draft wymaga przeglądu A+B; C-01–C-08, domyślne ustawienia i teksty pozostają propozycjami. Rozbieżność offline P0/P1 nie została rozstrzygnięta. Oba worktrees mają różne dodatki do niezatwierdzonego F-01 — integracja musi połączyć manifesty i zregenerować lockfile, zachowując zależności Expo A.
- **Jedno przekazanie A:** przejrzeć `docs/f02-review.md` i przykłady `@krok/contracts/fixtures`, zgłaszając zgodność lub uwagi do C-01–C-08 przed użyciem kontraktu w M-01/M-02. Instrukcja importu: [packages/contracts/README.md](../packages/contracts/README.md).
- Kolejne zadanie B po przeglądzie kontraktu: B-01 — Fastify, health/readiness, katalog, walidacja wejść/wyjść i kontrolowane błędy. Nie uruchamiano kolejnego zadania w tej iteracji.

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
