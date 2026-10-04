# Backend — Codex przejmujący cały projekt

Obowiązują główne AGENTS.md i kontrakty z `@krok/contracts`.
Aktualne polecenie (2026-10-04): użytkownik wznowił implementację prototypu.
Wyniki audytu P-01: `docs/data-audit-report.md`; zakres integracji i testów:
`docs/prototype-completion.md` oraz bieżący handoff B. Nie powtarzaj gotowego
audytu bez zmiany wejścia. Nowe importy i integracja ORS pozostają poza zakresem.
Wykorzystaj gotowy resolver, planner i audyty; nie implementuj ich ponownie.
P-03 zrealizowano w istniejącym DTO. Nowy wykonawca odpowiada też za klienta;
nie oczekuje na nieaktywną rolę A/B. Start: `docs/handoff-codex.md`.
Zapisuj nowe zakresy, wyniki i ograniczenia we własnym statusie i handoffie.
Serwer HTTP waliduje wejścia i wyjścia. Nie kopiuj schematów DTO do API.
Budowa instancji Fastify nie otwiera portu ani połączenia z bazą; runtime jest
w `src/main.ts`. Zegar, katalog i planner są zależnościami testowalnymi.

Nie loguj request/response body, URL z query, nagłówków klienta, błędów
sterownika ani wyjątków zawierających dane wejściowe. Log zdarzenia zawiera
wyłącznie ID wygenerowane przez serwer, szablon endpointu, metodę i status.

Algorytm tras pozostaje w `packages/routing`. Brak aktywnego grafu daje readiness 503
i SOURCE_UNAVAILABLE, a nie fixture sukcesu ani NO_PATH. Synthetic jest jawnie
wybierane w konfiguracji i zawsze preview_only. Zmiany kontraktu wymagają
regeneracji, testu i wpisu o wersji/statusie przeglądu.
