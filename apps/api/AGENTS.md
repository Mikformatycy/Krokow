# Backend — rola B / Codex

Obowiązują główne AGENTS.md i kontrakty z `@krok/contracts`.
Serwer HTTP waliduje wejścia i wyjścia. Nie kopiuj schematów DTO do API.
Budowa instancji Fastify nie otwiera portu ani połączenia z bazą; runtime jest
w `src/main.ts`. Zegar, katalog i planner są zależnościami testowalnymi.

Nie loguj request/response body, URL z query, nagłówków klienta, błędów
sterownika ani wyjątków zawierających dane wejściowe. Log zdarzenia zawiera
wyłącznie ID wygenerowane przez serwer, szablon endpointu, metodę i status.

B-01 nie implementuje algorytmu B-02. Brak aktywnego grafu daje readiness 503
i SOURCE_UNAVAILABLE, a nie fixture sukcesu ani NO_PATH. Synthetic jest jawnie
wybierane w konfiguracji i zawsze preview_only. Zmiany kontraktu wymagają
regeneracji, testu i wpisu o wersji/statusie przeglądu.
