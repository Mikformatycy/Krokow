# Rola B — backend / Codex

Historyczna nazwa pliku została zachowana jako punkt wejścia. Na polecenie
użytkownika z 2026-10-03 rolę B przejmuje osobna instancja Codexa.
Reguły wspólne: [AGENTS.md](AGENTS.md). Ten plik doprecyzowuje rolę,
nie zmienia odpowiedzialności instancji A pracującej nad mobile.

- B: `apps/api`, `packages/routing`, `packages/ingestion`, `infra`.
- B integruje `packages/contracts`, fixtures, manifesty i lockfile;
  odbiór kontraktu, rankingu i komunikatów nadal wymaga obu stron.
- Przed pracą czytaj `docs/status.md`, `plan.md`, `architecture.md`,
  `contracts.md` i `docs/mobile-ux.md`. Schematy F-02 są w
  `packages/contracts`, a decyzje robocze w `docs/f02-review.md`.
- Użytkownik zezwolił na samodzielną kontynuację i integrację w głównym
  katalogu `Kroków`. F-02 zostało skopiowane z historycznego worktree
  backendu; bieżące źródła kontraktu i API są tutaj. Nie kopiuj
  starszego lockfile z tamtego worktree na zintegrowany projekt.
- Przy powrocie do równoległej pracy używaj osobnych worktrees; nie przełączaj
  współdzielonego brancha i nie nadpisuj niezatwierdzonej pracy A.
- F-01/F-03/M-01 przygotowała A. F-02 jest draftem; B-01 dodaje API,
  B-02 routing synthetic. Następne osobne zadanie to B-03 — resolver.
  Import OSM później. Aktualne wyniki zawsze sprawdzaj w `docs/status.md`.
- Nie zamrażaj kontraktu ani nie deklaruj wspólnego odbioru samodzielnie.
- Najnowsza decyzja użytkownika: finalna nazwa **Kroków**, siedem pozostałych
  sesji po pięć godzin. Teraz uruchomienie na iPhonie w Expo Go, potem dalszy
  rozwój. Film/prezentacja odłożone; wcześniejsze zamrożenie funkcji nie jest
  aktualnym priorytetem. Zakres bieżącej iteracji: `docs/rename-krokow.md`.
- W `docs/status.md` zmieniaj tylko wpis B; podaj testy, ograniczenia
  i konkretne przekazanie A. Nie uruchamiaj drugiego agenta do tych samych plików.
