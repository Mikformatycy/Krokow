# Współpraca dwóch osób i agentów

## Własność

Osoba A jest właścicielem doświadczenia użytkownika, dostępności, komunikatów i testów telefonu. Osoba B jest właścicielem API, grafu, importu, infrastruktury i operacji. Wspólnie zatwierdzają kontrakt, interpretację danych, wagi i komunikaty dotyczące przejść. Agent nie jest operatorem produktu i nie zastępuje recenzji człowieka.

Początkowo B pełni też rolę integratora: scala root manifesty, lockfile, migracje i kontrakty. A przygotowuje zmiany zależności mobile w swoim branchu; B odtwarza poprawny lockfile po merge'u, bez ręcznego łączenia jego sekcji. Tylko jeden package manager.

## Branche i małe PR

Nazwy: `feat/F-02-contracts`, `feat/M-02-route-details`, `feat/B-05-pilot-graph`. Jeden branch/oddzielny checkout na zadanie. Nie uruchamiaj dwóch agentów zapisujących jednocześnie do tego samego katalogu roboczego. Gdy pracują lokalnie na jednym komputerze, użyj osobnych worktrees lub klonów.

PR podaje: cel, granicę zmian, testy, ograniczenia, wpływ na drugą osobę, dane i migracje. Niewielki uzgodniony zakres ma pierwszeństwo przed "przepisaniem architektury przy okazji". Nie scalać do main, jeżeli kontrakt nie zgadza się z fixtures albo główny przebieg czytnika ma regresję.

## Contract-first

Najpierw propozycja pola/stanu wraz z przykładem i reakcją UI. Następnie wspólna akceptacja, schemat i walidacja, dopiero potem backend i frontend. Mock nie jest niezależnym API: konsumuje te same fixture'y. Nowy enum wymaga reakcji po obu stronach. Breaking change nie trafia niejawnie do `/v1`.

Nie blokuj pracy A oczekiwaniem na import OSM. Nie odblokowuj pracy A przez fikcyjne pola bez oznaczenia synthetic. Wspólnym minimalnym celem jest pionowy scenariusz od requestu do dostępnej karty z prawdziwą semantyką danych.

## Dzienny rytm

Na początku krótkie uzgodnienie: co jest gotowe, co blokuje, jaki kontrakt dotykamy. Każdy bierze jedno zadanie implementacyjne. W połowie dnia sprawdzenie integracyjne na tych samych fixtures; na koniec merge małego zakresu i aktualizacja własnego wpisu statusu. Nie wykonujemy wielogodzinnych równoległych refaktorów wspólnego katalogu.

## Handoff

```text
Zadanie i branch/commit:
Co już działa:
Co NIE zostało zaimplementowane:
Zmiana kontraktu / wersji / migracji:
Jak uruchomić i odtworzyć (sprawdzone komendy):
Testy wykonane i wynik:
Testy niewykonane i powód:
Ryzyko dla drugiej strony:
Jedno następne zadanie dla odbiorcy:
```

## Operator po hackathonie

Przed publicznym pilotażem wpisz rzeczywiste osoby/organizację do `docs/decisions.md`: właściciel produktu, hostingu i kosztów, moderator danych, odpowiedzialny za bezpieczeństwo oraz kontakt do zgłoszeń. W zespole dwuosobowym jedna osoba może mieć kilka ról, ale muszą być jawne. UMK nie jest domyślnym operatorem ani ręcznym opiekunem bazy.

B ma odpowiedzialność operacyjną za backup, import i klucze; A za triage problemów dostępności i treść komunikatów. Obie osoby umieją zatrzymać publikację wadliwego grafu. Zmiana potencjalnie mylącej instrukcji terenowej ma priorytet nad rozbudową funkcji.
