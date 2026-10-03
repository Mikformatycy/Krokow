# M-01 — formularz demonstracji

Osoba A, 2026-10-03. Zakres: wybór startu/celu z katalogu synthetic, wyszukiwanie, zamiana punktów, preferencje, walidacja i MockRouteApi oparty na zintegrowanych fixtures. Wynik M-01 jest krótkim potwierdzeniem otrzymania wariantów; porównanie, źródła i pełny przebieg należą do M-02.

Przegląd C-01–C-08: draft.2 dostarcza potrzebne schematy katalogu, kroków, uzasadnień, błędów, faktów i polityki oraz importowalne fixtures. Strict walidacja i expectedVersions nadają się do roboczej integracji mobile. A przyjmuje tę granicę do implementacji M-01; nie oznacza to formalnego odbioru produktu ani zatwierdzenia progów świeżości. Nie zmieniamy kontraktu, rankingu i komunikatów o przejściach. Ustawienia początkowe są jawnie profilem przykładu A/B/C, nie nowymi domyślnymi preferencjami produktu. Offline i teksty szczegółów pozostają do dalszego przeglądu.

Mock porównuje całe zwalidowane żądanie z konkretnym przykładem. Nieobsługiwana para/preferencje ma lokalny stan „Brak przygotowanego przykładu”; nie wolno udawać NO_PATH ani zwracać tej samej trasy. Przykład NO_MATCHING_ROUTE nie rozluźnia wymagań. Synthetic nie obsługuje współrzędnych: GPS nie jest potrzebny, nie prosimy o uprawnienia. HTTP, GPS dla pilotażu i nawigacja terenowa nie są częścią tej iteracji.

Kryteria: obsługa bez mapy i klawiaturą; wymagane/identyczne punkty i limit objazdu odrzucane przed wywołaniem mocka; zachowanie formularza po błędzie; zmiana pola unieważnia wynik i spóźnione odpowiedzi; wejścia/wyjścia przechodzą wspólne schematy. Testy adaptera, UI i kontraktów, lint, typecheck oraz eksport web/iOS. Test telefonu zapisany osobno, bez deklaracji VoiceOver na podstawie przeglądarki.

Do manifestu mobile dochodzi tylko `@krok/contracts: workspace:*`. Lockfile jest regenerowany przez pnpm na już zintegrowanej wersji B; nie przenosimy go ze starego worktree.
