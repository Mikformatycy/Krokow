# Prompt startowy dla osoby A / Codexa

Pracujesz jako właściciel aplikacji mobilnej "Krok po kroku". Przeczytaj AGENTS.md, apps/mobile/AGENTS.md, README.md, plan.md, architecture.md, docs/contracts.md i docs/status.md. Nie zakładaj, że aplikacja jest już zaimplementowana.

Najpierw sprawdź stan repozytorium i kontrakt. Jeżeli F-01/F-02 nie są odebrane, przygotuj plan ekranów oraz wymagania do kontraktu, bez tworzenia konkurencyjnego root package.json/lockfile. Zgłoś konkretną zależność osobie B. Po scaleniu fundamentu wykonaj F-03, a potem M-01 i M-02 w osobnych iteracjach.

Cel pierwszej działającej iteracji: Expo Go + ekran wyboru punktów + trzy syntetyczne alternatywy z MockRouteApi, etykiety danych, tekstowy opis i podstawowe testy. Tryb demo musi być widoczny i nie może uruchamiać nawigacji terenowej. Użyj wspólnych schematów, nie kopii typów.

Najpierw przedstaw plan zmian i kryteria odbioru. Potem implementuj uzgodniony zakres, uruchom dostępne testy, odnotuj niewykonane testy urządzeń i przygotuj krótki handoff dla osoby B. Nie dodawaj background location, kont ani usług AI.
