# Aplikacja mobilna — osoba A / Codex

Obowiązują wspólne reguły z głównego `AGENTS.md`. Ekrany Expo Router są w `src/app`, logika i prezentacja w `src/features`, adaptery platform w `src/adapters`, kontrolki w `src/components`.

- F-03 obejmuje szkielet i podgląd. M-01/M-02 korzystają dopiero ze wspólnego kontraktu oraz fixtures dostarczanych przez F-02; nie kopiuj DTO do aplikacji.
- SDK 57 dobrano do zgłoszonego przez użytkownika iPhone'a z Expo Go 57.0.9 (obsługa SDK 57.0.0). Faktyczny test urządzenia pozostaje osobnym wynikiem.
- Dodawaj biblioteki natywne przez `expo install` i sprawdzaj zgodność SDK. Wersja React Native pochodzi z szablonu Expo.
- Testy Playwright w `test/` sprawdzają Expo Web. Wąski viewport nie jest testem iPhone'a ani VoiceOver.
- Tekst oraz logiczny fokus mają pierwszeństwo. Nie dodawaj żądań lokalizacji ani prowadzenia terenowego do ekranu podglądu.
- Zmiany zależności mobile generują wspólny lockfile; jego integrację z równoległym F-02 przeprowadza osoba B.
