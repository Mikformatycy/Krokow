# Aplikacja mobilna — Codex przejmujący cały projekt

Od 2026-10-04 jeden Codex odpowiada również za mobile; podział A/B jest historyczny. Start: `docs/handoff-codex.md`. Zachowaj UI Claude'a i reguły głównego `AGENTS.md`. Ekrany Expo Router są w `src/app`, logika i prezentacja w `src/features`, adaptery platform w `src/adapters`, kontrolki w `src/components`.

- Aktualne polecenie (2026-10-04): po zakończeniu UI użytkownik wznowił implementację brakującej funkcjonalności. Codex podłączył wyszukiwanie miasta i informacje o odcinkach do istniejącego kreatora. Czytaj bieżący wpis B w `docs/status.md`; starszy plan nie jest już blokadą realizacji.
- Integracja `/v1/place-search` i informacji z audytu jest wykonana. Użytkownik potwierdził pięć prób iPhone/VoiceOver; pozostałe próby i nowe podsumowanie trasy są w `docs/testing.md`. Zachowaj kreator i duże przyciski. Nie odtwarzaj F-03/M-04 i nie kopiuj DTO do aplikacji.
- Wynik `routing.available` oznacza przypisanie do grafu, nie potwierdzoną dostępność. Obsłuż `poi` i `entrance`, unavailable, NO_PATH, NO_MATCHING_ROUTE oraz źródła i oddzielne daty. Nowe pola wymagają wspólnego kontraktu i testów klienta/serwera, nie oczekiwania na dawną rolę B.
- SDK 57 dobrano do zgłoszonego przez użytkownika iPhone'a z Expo Go 57.0.9 (obsługa SDK 57.0.0). Faktyczny test urządzenia pozostaje osobnym wynikiem.
- Biblioteki natywne dodawaj tylko w potrzebnym zakresie przez `expo install`, po sprawdzeniu zgodności SDK z Expo Go. Wersja React Native pochodzi z szablonu Expo; manifesty i lockfile koordynuje obecny Codex.
- Testy Playwright w `test/` sprawdzają Expo Web. Wąski viewport nie jest testem iPhone'a ani VoiceOver.
- Tekst oraz logiczny fokus mają pierwszeństwo. Nie dodawaj żądań lokalizacji ani prowadzenia terenowego do ekranu podglądu.
- Metro, testy UI, API i gateway/tunel obsługuje obecny Codex. Przed restartem sprawdź porty i command line; nie zatrzymuj podglądu użytkownika bez potrzeby. Samo przekazanie nie wymaga instalacji.
