# Start — Codex przejmujący cały projekt

Decyzja użytkownika z 2026-10-04: „teraz wszystko będzie robił drugi Codex”.
Przejmujesz mobile/UI/dostępność, backend, dane, routing, kontrakty, testy,
dokumentację, operacje i koordynację Git. Podział A/B jest historyczny;
nie czekaj na Claude'a ani zakończoną sesję.

1. Przeczytaj [AGENTS.md](AGENTS.md) i [przekazanie](docs/handoff-codex.md).
2. Sprawdź Git status/diff. Duża część gotowego prototypu jest lokalna
   i niezatwierdzona; nie przywracaj plików do HEAD ani nie czyść workspace.
3. Przeczytaj requirements.md, najnowszy status, handoff backendu i instrukcje
   edytowanego katalogu. Techniczne źródła: plan.md, architecture.md,
   docs/contracts.md. Stare zadania nie zlecają powtarzania gotowego rdzenia.
4. Przeczytaj aktualny wpis statusu: audyt wymagań jest wykonany; pięć prób
   iPhone/VoiceOver ma potwierdzenie użytkownika. Nowsze podsumowanie i
   dodatkowe próby pozostają otwarte w docs/testing.md. Nie powtarzaj gotowego audytu.
5. Zachowaj kreator, kontrakty i reguły danych. Dopisuj własne wyniki do statusu.

Bez nowych worktrees, zmiany gałęzi i subagentów. Przejęcie odpowiedzialności
za Git nie jest poleceniem publikacji: dotychczasowy zakaz commitów/pushów
obowiązuje do nowego polecenia użytkownika. Opis utrzymania: docs/operations.md.
ORS i materiały zgłoszeniowe
nie są gotowe; dalsze priorytety opisuje handoff.
