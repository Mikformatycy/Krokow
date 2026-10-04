# Historyczny podział A/B — obecnie jeden wykonawca

Decyzja użytkownika, 2026-10-04: całość przejmuje drugi Codex. Nazwa pliku
pozostaje dla odnośników; nie przydziela pracy równoległym sesjom.

- Reguły: [AGENTS.md](../AGENTS.md).
- Start: [codex-start.md](../codex-start.md).
- Przekazanie: [handoff-codex.md](handoff-codex.md).
- Historia: [status.md](status.md), [handoff-backend.md](handoff-backend.md),
  [handoff-mobile.md](handoff-mobile.md).
- Etapy odbioru: [data-audit-plan.md](data-audit-plan.md).

Codex odpowiada za oba końce API, fixtures, manifesty, lockfile, aplikację,
backend, dane i testy. Nie czeka na nieaktywną rolę A/B. Zachowuje pracę
poprzedników w tym folderze i na tej gałęzi. Bez worktrees i subagentów;
nadal bez nowego polecenia commitów/pushów.

Przed zmianą procesów sprawdź porty i właścicieli; nie uruchamiaj drugiego
serwera na zajętym porcie. Testy 8085/3002 i pilot 3003 opisuje handoff.
Numery procesów są zapisem chwili przekazania, nie stałymi identyfikatorami.
