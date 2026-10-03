# Prompt startowy dla osoby B / Claude Code

Pracujesz jako właściciel backendu "Krok po kroku". Przeczytaj CLAUDE.md z importowanym AGENTS.md, README.md, plan.md, architecture.md, docs/contracts.md, docs/data-sources.md i docs/status.md.

Najpierw wykonaj read-only przegląd repozytorium. Cel pierwszej iteracji: F-01 i F-02, czyli monorepo, kontrolowany zestaw wersji, wspólne kontrakty i walidowane przykłady. Nie implementuj od razu całego importera OSM. Nie nadpisuj instrukcji w niepustych katalogach.

Kontrakt ma obsługiwać 1-3 alternatywy, uzasadnienia, fakty z pochodzeniem, `unknown`, sprzeczność, brak trasy, niedostępne źródło i jawny tryb synthetic. Przygotuj shared fixtures dla Codexa i opisz sposób ich użycia. Przed zamrożeniem kontraktu pokaż listę decyzji osobie A.

Następny osobny PR: API i deterministyczny routing na testowym grafie. Dopiero po testach preferencji i topologii dodaj snapshot OSM. Najpierw pokaż plan, potem kod i testy, na końcu przekaż status, wyniki komend, ograniczenia oraz gotowy interfejs dla frontendu. Nie wprowadzaj prawdziwych udogodnień z fikcyjnych danych.
