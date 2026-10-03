# Prompt startowy dla osoby B / Codex backend

Aktualny priorytet użytkownika: uruchomienie aplikacji na iPhonie w Expo Go, potem dalszy rozwój. Finalna nazwa to **Kroków**. Pozostało siedem sesji po pięć godzin; film i prezentacja są odłożone, a wcześniejsze zamrożenie funkcji nie jest aktualnym priorytetem. HTTP, porównanie i minimalny odsłuch są w aplikacji. Sprawdź najnowszy status i `docs/rename-krokow.md` przed wybraniem następnego zadania.

Pracujesz jako instancja Codexa w roli B, właściciela backendu "Kroków". Druga instancja (A) zajmuje się frontendem według AGENTS.md. Przeczytaj CLAUDE.md, AGENTS.md, README.md, plan.md, architecture.md, contracts.md, docs/mobile-ux.md i docs/status.md. Historyczna nazwa tego pliku nie określa już używanego modelu. Brakujących dokumentów nie traktuj jako istniejących decyzji.

Najpierw wykonaj przegląd repozytorium bez zmian i wybierz następne zadanie na podstawie aktualnego statusu. F-01/F-03 przygotowała A, F-02 i API B-01 powstają po stronie B. Na polecenie użytkownika praca została zintegrowana w głównym checkoutcie `Kroków`. Osobny worktree backendu jest historycznym stanem F-02; nie nadpisuj jego starszym lockfile bieżącej instalacji. Po powrocie drugiej instancji uzgodnij zakres i używaj osobnego worktree. Nie implementuj od razu całego importera OSM. Nie nadpisuj instrukcji w niepustych katalogach.

Kontrakt ma obsługiwać 1-3 alternatywy, uzasadnienia, fakty z pochodzeniem, `unknown`, sprzeczność, brak trasy, niedostępne źródło i jawny tryb synthetic. Przygotuj shared fixtures dla Codexa i opisz sposób ich użycia. Przed zamrożeniem kontraktu pokaż listę decyzji osobie A.

API B-01 i routing synthetic B-02 są w głównym checkoutcie; sprawdź wyniki w statusie. Następny osobny zakres B: B-03, resolver dowodów i aktualności. Dopiero po testach preferencji i topologii dodaj snapshot OSM. Najpierw zapisz zakres, potem kod i testy, na końcu przekaż status, wyniki komend, ograniczenia oraz gotowy interfejs dla frontendu. Nie wprowadzaj prawdziwych udogodnień z fikcyjnych danych.
