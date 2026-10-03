# Krok po kroku
## Nawigacja piesza uwzględniająca infrastrukturę istotną dla osoby niewidomej

**Status: specyfikacja do implementacji, nie gotowa aplikacja.** Ten pakiet zawiera plan, architekturę, instrukcje dla agentów, kontrakt opisowy i syntetyczne przykłady. Nie zawiera jeszcze działającego backendu, projektu Expo, pobranych danych Krakowa ani wyników testów na telefonach. Nazwa jest robocza.

Produkt ma odpowiadać na pytanie: **"Którą trasę wybrać i co, według dostępnych danych, spotkam po drodze?"** Nie ocenia trasy jako bezwarunkowo bezpiecznej. Oddziela przydatność infrastruktury od tego, jak dobrze jest ona udokumentowana.

## Najpierw przeczytaj

| Plik | Przeznaczenie |
| --- | --- |
| [plan.md](plan.md) | Zakres, etapy, zadania z kryteriami odbioru i podział pracy dwóch osób. |
| [architecture.md](architecture.md) | Komponenty, graf, ranking tras, model faktów, nawigacja, prywatność i wdrożenie. |
| [AGENTS.md](AGENTS.md) | Wspólne instrukcje repozytorium, automatycznie odczytywane przez Codexa. |
| [CLAUDE.md](CLAUDE.md) | Instrukcje Claude Code i import wspólnych reguł; odpowiedzialność za backend. |
| [agent.md](agent.md) | Krótki punkt wejścia dla człowieka; nie zastępuje AGENTS.md. |
| [docs/contracts.md](docs/contracts.md) | Jeden kontrakt frontend-backend oraz znaczenie błędów i pól. |
| [docs/data-sources.md](docs/data-sources.md) | Rejestr źródeł, import, jakość danych i braki do zweryfikowania. |
| [docs/testing.md](docs/testing.md) | Testy algorytmu, czytników, klawiatury, GPS i awarii. |
| [docs/workflow.md](docs/workflow.md) | Własność plików, branche, zmiany kontraktu i przekazywanie pracy. |
| [docs/demo.md](docs/demo.md) | Scenariusz prezentacji oraz granica między demonstracją a użyciem w terenie. |
| [docs/brief-requirements.md](docs/brief-requirements.md) | Powiązanie wymagań załącznika z zadaniami i dowodami odbioru. |
| [docs/sources.md](docs/sources.md) | Źródła dokumentacji technicznej sprawdzone 2026-10-03. |

## Ustalony podział

**Osoba A + Codex:** Expo/React Native, ekrany, obsługa czytnika, tekstowy opis trasy, komunikaty, lokalny stan nawigacji, testy interfejsu. **Osoba B + Claude Code:** Fastify/TypeScript, PostgreSQL/PostGIS, import danych, model wiarygodności, graf, algorytm, API, deployment. Kontrakty i reguły wpływające na komunikaty o przejściach zatwierdzają obie osoby.

Nie jest to twierdzenie o przewadze jednego modelu. To organizacyjny podział ograniczający konflikty zmian. Człowiek odpowiada za odbiór, prawdziwość danych i testy terenowe.

## Jak rozpocząć

1. Umieść zawartość katalogu w nowym repozytorium Git. Nie zakładaj jeszcze kont u płatnych dostawców. Przeczytaj status w [docs/status.md](docs/status.md).
2. Obie osoby uzgadniają zakres P0, systemy telefonów i kontrakt. Osoba B wykonuje zadania F-01 i F-02; osoba A przygotowuje UX i audyt zależności Expo, a następnie F-03. Pierwsza zmiana integracyjna musi zawierać kontrakty i wspólny lockfile.
3. W osobnych branchach uruchom agentów z treścią [prompts/codex-start.md](prompts/codex-start.md) i [prompts/claude-start.md](prompts/claude-start.md). Pierwsza iteracja to szkielet i jeden pionowy scenariusz, nie cały backlog naraz.

### Właściwe nazwy plików instrukcji

Codex korzysta z `AGENTS.md`, nie z singularnego `agent.md` [S01]. Claude Code ma `CLAUDE.md`; tutaj importuje on wspólny plik przez `@AGENTS.md` [S02]. Nie twórz drugiego `claude.md`: na systemie plików ignorującym wielkość liter kolidowałby z `CLAUDE.md`.

## Stack i wersje

Decyzja projektowa: **React Native + Expo + Expo Router + TypeScript**, **Fastify + TypeScript**, **PostgreSQL + PostGIS**, monorepo **pnpm**, wspólne schematy **Zod**. Biblioteki natywne instaluj przez `expo install`, a nie dobieraj niezależnie wersji React Native. Expo wspiera monorepo, ale trzeba unikać zdublowanych pakietów natywnych [S03, S08].

W F-01/F-03 zapisz w `docs/decisions.md` rzeczywiście użyte wersje Node, pnpm, SDK Expo i telefonów. Kandydat dla Node: wspierana linia 24 LTS [S17]. SDK Expo: stabilna wersja **rzeczywiście zgodna z Expo Go na telefonach zespołu w dniu startu**. Nie kopiuj wersji z losowego tutoriala; nie używaj canary. Ten pakiet nie potwierdza działania konkretnej kombinacji urządzeń.

## Komendy, które ma dostarczyć bootstrap

**Poniższe skrypty są specyfikacją F-01/F-03. Obecnie nie istnieją.** Agent najpierw tworzy manifesty i potwierdza działanie, dopiero potem aktualizuje tę sekcję na instrukcję uruchomienia.

```bash
pnpm install --frozen-lockfile
pnpm dev:api
pnpm dev:mobile
pnpm dev:web
pnpm db:migrate
pnpm data:seed:demo
pnpm lint
pnpm typecheck
pnpm test
pnpm test:contracts
pnpm test:e2e:web
pnpm contracts:export
pnpm check:generated
```

Pierwsza instalacja utworzy lockfile przez `pnpm install`; `--frozen-lockfile` jest dla późniejszych instalacji i CI. Baza lokalna: usługa Docker Compose do utworzenia przez B. Na telefonie `localhost` oznacza telefon, nie laptop: `EXPO_PUBLIC_API_URL` ma wskazywać osiągalny adres backendu. Tunel Metro nie wystawia automatycznie API [S07]. Wspólny pokaz najlepiej obsłużyć przez testowy backend HTTPS.

Nie uruchamiaj scaffoldingu w niepustym `apps/mobile` z nadpisaniem instrukcji. Wygeneruj szablon w katalogu tymczasowym, scal go świadomie i zachowaj `AGENTS.md`.

## Granice prototypu

P0 to wyszukiwanie punktów w małym obszarze, rzeczywiste obliczanie alternatyw na grafie, opis danych i odsłuch oraz jawna symulacja przejścia. P1 dodaje eksperymentalne prowadzenie na pierwszym planie po przejściu testów. Działanie z zablokowanym ekranem, wykrywanie przeszkód i bieżącego stanu świateł nie należą do P0/P1. Expo Go nie jest docelową ścieżką produkcyjną; lokalizacja w tle wymaga odrębnej konfiguracji i odpowiedniego buildu [S04, S07].

Dane `synthetic` nie mogą uruchomić trybu terenowego. Wszystkie przykłady w `examples/` są fikcyjne i nie opisują rzeczywistych przejść w Krakowie.
