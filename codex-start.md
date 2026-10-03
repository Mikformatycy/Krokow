# Start świeżej instancji A — aplikacja Kroków

Jesteś **A: mobile/UX**. Dotychczasowa rozmowa to **B: backend, dane i
integracja**. Pracuj w `C:/Users/rapma/Documents/GitHUb/Kroków`.
Nie twórz kopii/worktree, nie przełączaj gałęzi. Obowiązuje aktualny podział
w `docs/two-codex-plan.md`.

Przeczytaj AGENTS.md, apps/mobile/AGENTS.md, docs/status.md,
docs/two-codex-plan.md, M-03/M-04 w plan.md, odpowiednie sekcje architecture.md,
docs/contracts.md i packages/contracts/README.md. Potem dokumenty
docs/m04-simulation.md, docs/m04-speech-session.md oraz kod
features/simulation, adapters/speech, features/planning/SpeechPlayer.tsx
i speechText.ts w apps/mobile/src. Sprawdź Git status i manifesty.

**Pierwsze zadanie: podłącz istniejącą symulację do UI i wspólnej mowy.**
Rdzeń, sesja i kolejka są scalone. Nie kopiuj starych worktrees i nie pisz
ich od nowa. Formularz, HTTP, porównanie i odsłuch również już istnieją.
Historyczne instrukcje bootstrapu/czekania na przeniesienie M-04 są nieaktualne.

Zapisz zakres/kryteria w docs/handoff-mobile.md, potem implementuj:

- Jawna symulacja: start/pauza/wznowienie/powtórzenie/reset/zakończenie,
  tekst zdarzenia i postępu. Bez GPS i prowadzenia terenowego.
- Jeden koordynator dla planu i sesji. Czytnik blokuje własny TTS.
  Tło, wyjście, zmiana formularza/wariantu/odpowiedzi zatrzymują starą sesję.
  Powrót nie uruchamia jej automatycznie.
- Popraw speechText.ts według obecnego kontraktu: sortowanie po dystansie,
  przy remisie start → zdarzenia → odcinek → koniec. Nie zmieniaj kontraktu
  ani semantyki komunikatów o przejściach.
- Testy UI i regresji. Bez testu urządzenia zapisz to wprost.

Zapisuj wyłącznie apps/mobile/** i docs/handoff-mobile.md. Backend, kontrakty,
fixtures, root manifesty, lockfile, docs/status.md i instrukcje należą w tej
iteracji do B. Nie wykonuj operacji zapisujących Git, pull/switch/checkout/
reset/merge/rebase. B integruje i publikuje pliki z Twojego raportu.
Nie cofaj cudzej pracy. Wspólne zależności opisuj w handoffie, kontynuując
niezależny zakres. Nie instaluj pakietów równolegle z B.

Uruchom lint/typecheck, kontrakty, dedykowany runner symulacji, test:mobile
i build:web. Użyj skryptów z manifestów; przykład wrappera dla Windows:

```powershell
npm.cmd exec --yes --package=node@24.21.0 --package=pnpm@10.34.6 --call "pnpm test:mobile"
```

Porty testowe 8085/3002 należą do Ciebie. Nie restartuj podglądu B na
8081/3001/8082 ani nie uruchamiaj drugiego tunelu. Ngrok po porządkowaniu
jest zatrzymany; test telefonu organizujemy po przygotowaniu UI.

Na końcu uzupełnij docs/handoff-mobile.md: pliki, komendy i rzeczywiste
wyniki, ograniczenia, testy telefonu oraz zależności dla B.
Oznacz **GOTOWE DO INTEGRACJI**, przestań edytować przekazany zakres
i podaj raport użytkownikowi. Nie zaczynaj importu, trybu pilot, mapy, GPS,
kont, filmu/prezentacji ani dodatkowych subagentów.
