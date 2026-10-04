# Przekazanie projektu — jeden wykonawca

Stan aktualny: 2026-10-04. Reguły: [AGENTS](../AGENTS.md).
Jeden Codex odpowiada za mobile, API, dane, routing, testy, dokumentację
i operacje. Nie czeka na Claude'a ani historyczne role A/B.

## Bieżąca wersja

- Gałąź main, wiele lokalnych zmian, archiwów i plików untracked. HEAD nie
  zawiera całego prototypu. Nie resetować, nie usuwać cudzej pracy ani
  przywracać usuniętych starych materiałów.
- Bez nowych worktrees, zmiany gałęzi i subagentów. Przejęcie Git nie
  znosi zakazu commitów/pushów bez nowego polecenia.
- Wyszukiwanie/API/UI są zintegrowane. Kreator, źródła, daty, odsłuch,
  unknown i twarde wymagania mają testy. Nie odtwarzać gotowych modułów.
- 96 556 wpisów wyszukiwania; 30 końców tras w pięciu grupach.
  Graf: 6043 węzły, 12554 skierowane krawędzie, 479 etapów.
  Akustyka unknown 479; wszystkie 8344 rekordy bez weryfikacji terenowej.
- evidenceCatalog dotyczy obiektów wszystkich wariantów. Przypisanie
  pojedynczego rekordu do pozycji wybranego wariantu to przyszły kontrakt.
- Brak GPS, mapy, kont, zgłoszeń, regularnego harmonogramu i ORS.
  Baza nie jest potrzebna do obecnych tras w RAM.

## Wyniki odbioru

Ostatnia pełna kontrola: lint, typecheck, check:generated (31 plików)
i **620 testów PASS** — infra 14, contracts 132, routing 87, ingestion 88,
API 115, mobile/web 170, pilot 14. Szczegóły: [status](status.md).

Użytkownik potwierdził pięć prób iPhone/VoiceOver: Nowa Huta/powrót,
Pawia 5/Szukaj/gest Z, główna para i szczegóły, twarde wymaganie,
odsłuch/zatrzymanie bez równoległej mowy.
Nowsze podsumowanie trasy, duży tekst, awarie/opóźnienia i pozostałe
próby opisuje [testing](testing.md). Nie deklarować terenu ani pełnego WCAG.

## Następny zakres

Audyt requirements.md został wykonany. Dokumentacja została ujednolicona
na polecenie użytkownika; [operations](operations.md) opisuje proponowany
model utrzymania/przenoszenia/skalowania, [dependencies](dependencies.md)
— licencje odczytane z bezpośrednich zależności.
Nie utożsamiać opisania modelu z odebraniem wdrożenia lub wyborem operatora.

Priorytet kolejnego zadania: [P-06](demo-delivery.md), aktualny film około
2 minut i PDF do 10 slajdów. Stare binaria deliverables/ usunięto.
[Scenariusz](demo-script.md), [odpowiedzi do formularza](submission.md).
Zgodnie z informacją użytkownika wszystkie prace nad projektem wykonano
podczas wydarzenia; przed wydarzeniem nie prowadzono prac. Odpowiedzi do
formularza są po polsku, neutralne, bez podpisów i przypisania zespołowi
roli operatora.

## Start i procesy

[README](../README.md) zawiera najkrótszy start web i wrapper Node 24.21.0 /
pnpm 10.34.6. [Telefon](phone-tunnel.md): API → gateway → ngrok → Metro.
Adres tunelu jest zmienny; nie kopiować historycznej domeny ani tokenów.

Na używanym komputerze podgląd zajmował API 3001, pilot testowy 3003,
Metro 8081, gateway 8082. Sprawdź aktualne porty/PID/command line przed
restartem; numery historyczne nie upoważniają do zatrzymania procesu.

test:mobile uruchamia własne API synthetic 3002 i Metro 8085.
Runner test/pilot.config.ts potrzebuje istniejącego API pilot 3003
i uruchamia Metro 8085. Nie uruchamiać obu zestawów równocześnie.
Zmiana samej dokumentacji nie wymaga powtarzania całej regresji.

## Dokumenty referencyjne

- [Aktualny backend](prototype-backend.md), [wyszukiwanie](place-search.md)
- [Audyt danych](data-audit-report.md), [źródła](data-sources.md)
- [Kontrakt](contracts.md), [plan](../plan.md), [architektura](../architecture.md)
- Historyczne [handoff backend](handoff-backend.md) i [handoff mobile](handoff-mobile.md)
