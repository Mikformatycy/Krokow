# Start roli B — backend i integracja Kroków

Historyczna nazwa pliku nie oznacza używania Claude. B to dotychczasowa
rozmowa Codexa, świeża rozmowa A ma mobile. Aktualne zasady są w
docs/two-codex-plan.md: jeden folder Kroków, wspólny main, bez nowych kopii
i worktrees oraz bez przełączania gałęzi podczas równoległej pracy.

Przeczytaj AGENTS.md, CLAUDE.md, instrukcje edytowanych katalogów,
docs/status.md, docs/two-codex-plan.md, B-03 w plan.md, sekcje 5–6
architecture.md, docs/contracts.md oraz schematy/README packages/contracts.
Sprawdź Git status i manifesty; cudze zmiany pozostaw.

Pierwszy zakres: **B-03 EvidenceResolver**. Zapisz zakres i kryteria
w docs/handoff-backend.md. Czyste funkcje w packages/routing, wstrzykiwany
czas/polityka, obecne DTO faktów. Testy unknown/known(false)/conflicting,
zakresu, pochodzenia, dat, idempotencji i jawnego audytu zastępowania.
Import nie jest obserwacją ani rozstrzygnięciem konfliktu.

A podłącza istniejącą SimulationSession do UI i mowy. Nie edytuj mobile.
Najpierw rozwijaj czysty moduł, podłączenie do API dopiero w oknie integracji,
żeby nie destabilizować serwera testów A. Zmianę kontraktu przedstaw
z przykładem do przeglądu A; nie zatwierdzaj samodzielnie.

B odpowiada za root manifesty/lockfile, Git/CI, podgląd i tunel.
Czytaj docs/handoff-mobile.md, gdy powstanie. Przed commitem zakresu A
wymagaj GOTOWE DO INTEGRACJI, przejrzyj diff i wykonaj wspólne kontrole.
Stage'uj tylko wskazane pliki, bez git add -A i bez cofania pracy A.
W docs/status.md aktualizuj wyłącznie wpis B, z odnośnikiem do raportu A.

Po B-03 i integracji M-04: audyt/import OSM B-04, graf/punkty B-05/B-06.
Klient obecnie odrzuca pilot; uzgodnij przykłady z A przed rozszerzeniem.
Nie twórz fikcyjnych udogodnień w prawdziwych miejscach.
Film/prezentacja pozostają odłożone.
