# B — B-03 EvidenceResolver

Status: **IMPLEMENTACJA I TESTY GOTOWE — do przeglądu przed podłączeniem do API**,
2026-10-03. Właściciel: dotychczasowa rozmowa B.

Zakres: czysty moduł w packages/routing, eksport, testy oraz dokumentacja.
Bez edycji mobile, kontraktów/fixtures, zależności, rankingu i działającego API.
A może niezależnie pracować nad M-04 i używać obecnego synthetic HTTP.

## Założenia przed implementacją

- Wejście: obecne Evidence/PublicSource plus wewnętrzna informacja o dopuszczeniu
  publikacji i opcjonalnym wspólnym pochodzeniu kopii. Czas UTC wstrzykiwany.
  Wewnętrzny audyt nie jest nowym formatem API.
- Dokładny zakres jest wymagany do rozstrzygnięcia. Nie rozszerzamy zakresu
  null/both na konkretną stronę/kierunek. Nakładający się, niedokładny zakres
  daje unknown/ambiguous_scope; rozłączny jest pomijany z powodem w audycie.
- Dopuszczenie raportu do publikacji nie daje field_verified. Kolejny fetch
  ani zmiana sourceModifiedAt nie ustalają świeżości. Daty i wiarygodność
  znanego faktu pochodzą z tego samego dowodu, bez łączenia starej weryfikacji
  z nową, nieweryfikowaną obserwacją w fikcyjnie świeże potwierdzenie.
- Trwała infrastruktura może pozostać stale. Wygaśnięty raport przeszkody
  nie staje się known(false); pozostaje w audycie, poza aktualnym faktem.
- Dwa różne stanowiska z niezależnych źródeł dają conflicting, niezależnie
  od większości, rangi źródła i wieku. Sprzeczne wersje jednego pochodzenia
  blokują known: unknown/unsupported_value plus jawny problem w audycie.
  **Ograniczenie draft.2:** publiczny conflicting wymaga niezależnych
  sourceId/sourceRecordId; nie zmieniamy kontraktu dla rewizji tego samego
  źródła. Przed podłączeniem do API potrzebny przegląd prezentacji tego
  przypadku. Nie jest to potwierdzenie zgodności takich danych.
- Konflikt można zamknąć wyłącznie jawną decyzją wskazującą opublikowany
  dowód field_verified, zastępowane obserwacje, datę przeglądu i uzasadnienie.
  Walidujemy zakres, chronologię i brak cyklu. Zachowujemy audyt i kopie
  pochodzenia; sam nowszy rekord nie zamyka konfliktu.
- Polityka wieku przekazywana jawnie, bez zmiany wag routingu. Progi są
  konfiguracją do późniejszej kalibracji; resolver nie potwierdza świateł live.

## Kryteria odbioru tej iteracji

Testy: known(false)/missing/unsupported, odrzucone i niedopuszczone raporty,
zakresy, duplikaty i kopie źródeł, konflikty i jawne zastąpienie, daty/future,
granice świeżości i wygaśnięcia, permutacje, niezmienność wejścia, zgodność
wyjścia z kontraktem. Lint/typecheck, contracts/routing/API i generated.

Pełne podłączenie importera/grafu i przegląd A pozostają osobnym krokiem.
Nie uruchamiać równolegle z A runnera mobile ani instalacji.

## Rezultat dla A

Eksport `resolveEvidence(request, clock)` w `@krok/routing`. Zwraca `fact`
zgodny z dotychczasowymi typami i wewnętrzny `audit`. Obecne API, fixtures,
DTO, zależności i wagi bez zmian. Dokumentacja: [B-03](b03-evidence.md).
A może kontynuować M-04; nie musi teraz podłączać tego modułu.

Do przeglądu przed realnymi danymi: sprzeczne rewizje jednego pochodzenia
nie mieszczą się w publicznym conflicting draft.2; obecnie unknown z jawnym
wewnętrznym problemem inconsistent_origin. Przypadek nie jest publikowany
przez nowe API. Udowodniony niezależny konflikt zachowuje conflicting nawet
w obecności dodatkowych błędnych/niejednoznacznych rekordów.

Pliki B: `packages/routing/src/evidence/{types,resolve}.ts`, eksport
`src/index.ts`, `test/evidence.test.ts`, README pakietu, `docs/b03-evidence.md`,
ten raport i własny wpis w centralnym statusie. Nie zmieniano plików A.

Kontrole przez Node 24.21.0 / pnpm 10.34.6:

| Polecenie | Wynik |
| --- | --- |
| pnpm lint / pnpm typecheck | PASS na stanie wspólnym w czasie kontroli. |
| pnpm test:routing | 87 PASS: 47 nowych resolvera/integracji + 40 wcześniejszych. |
| pnpm --filter @krok/routing typecheck | PASS po dodaniu testu pełnego grafu. |
| pnpm exec eslint packages/routing --max-warnings 0 | PASS po ostatniej zmianie testu. |
| pnpm test:contracts / pnpm test:api | 121 / 86 PASS. |
| pnpm check:generated | PASS, 29 artefaktów zgodnych. |
| git diff --check (zakres B) | PASS. |

Nie uruchamiano runnera mobile ani build:web — są po stronie A. Nie
uruchamiano nowego importu OSM, bazy ani testów terenowych/telefonu.
Resolver nie ustala autentyczności metadanych operatora: waliduje ich
spójność; pochodzenie musi zapewnić importer/moderacja. Nie zadeklarowano
wspólnego odbioru B-03 ani działania rzeczywistych tras.

Następny krok B: ograniczony audyt i adapter snapshotu OSM (B-04), z użyciem
resolvera; podłączenie do publikowanego grafu dopiero po przeglądzie danych
i oknie integracji. A kończy M-04 na dotychczasowym synthetic HTTP.
