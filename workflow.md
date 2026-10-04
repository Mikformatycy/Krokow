# Sposób pracy po przekazaniu jednemu Codexowi

Od 2026-10-04 jeden wykonawca odpowiada za cały projekt.
Reguły: [AGENTS.md](AGENTS.md); start:
[docs/handoff-codex.md](docs/handoff-codex.md). Podział A/B jest historyczny.

1. Sprawdź status/diff, wymagania, instrukcje katalogowe i manifesty.
   Zachowaj wcześniejszą niezatwierdzoną pracę.
2. Wybierz konkretny brak, zapisz zakres i kryteria odbioru. Nie powtarzaj
   ukończonego audytu/integracji tylko dlatego, że istnieje stary plan.
3. Zmiana kontraktu: przykład i reakcja klienta, wspólny schemat, wersja,
   fixtures, regeneracja OpenAPI oraz testy obu końców. Nie czekaj na
   nieaktywnego agenta; nie zmieniaj wymagań produktu niejawnie.
4. Implementuj i testuj odpowiedni zakres. Przy zmianie UI test web
   i osobny wynik urządzenia; test przeglądarki nie jest testem VoiceOver.
5. Dopisz własny status i handoff: pliki, komendy, wyniki, niewykonane testy,
   ograniczenia. Dawne PASS nie są nowym testem.

Pracuj w bieżącym folderze i gałęzi, bez worktrees, resetów, kasowania
nieśledzonych plików i subagentów. Dotychczasowy zakaz commitów/pushów
obowiązuje do nowego polecenia użytkownika. Przy przyszłej integracji Git
przejrzyj zakres, dane i sekrety; nie wykonuj bezrefleksyjnie `git add .`.

Procesy API/Metro/gateway/tunel obsługuje ten sam wykonawca. Sprawdź stan
przed restartem; komendy są w README i handoffie. Nie zatrzymuj podglądu
telefonu tylko dlatego, że sesja się kończy.

Przed publicznym pilotażem potrzebne są jawne role operatora produktu,
hostingu, kosztów, moderacji i kontaktu do zgłoszeń. Nie zakładaj, że pełni
je UMK. Przejęcie repo przez agenta nie zastępuje tych decyzji.

Proponowany zakres odpowiedzialności, budżetu, aktualizacji i przeniesienia:
[docs/operations.md](docs/operations.md). Dokumentacja nie jest przyjęciem
zobowiązania operatora ani uruchomieniem usług. Stan formularza wydarzenia:
[docs/submission.md](docs/submission.md). Użytkownik potwierdził, że przed
wydarzeniem nie prowadzono prac; cały projekt powstał podczas wydarzenia.
Opisy do formularza są po polsku, bez podpisów i wskazania zespołu jako operatora.
