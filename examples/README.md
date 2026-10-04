# Przykłady synthetic

Wszystkie pliki JSON generuje `pnpm contracts:export` ze wspólnego modułu
`@krok/contracts/fixtures`. Nie opisują rzeczywistych miejsc ani udogodnień.
Nawigacja terenowa jest zablokowana. Weryfikacja: `pnpm test:contracts` oraz
`pnpm check:generated`. Celowo niepoprawne odpowiedzi powstają tylko w testach.

Fixtures i ich powiązanie z requestami: [instrukcja pakietu](../packages/contracts/README.md).
Zmiana schematów, wersji i przykładów wymaga kontroli integracji klienta
i serwera przez obecnego wykonawcę, zgodnie z AGENTS.md.
