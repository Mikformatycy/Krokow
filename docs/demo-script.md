# Krok po kroku — szkic filmu i prezentacji

Roboczy język: polski. Film do 3 minut i PDF do 10 slajdów to limity obecnego
planu repozytorium, nie potwierdzone ponownie wymagania organizatora. PDF-y
Lumi dotyczą innego projektu. Ten plik jest scenariuszem, nie gotowym filmem
ani prezentacją. Przed nagraniem zweryfikować tekst z końcową wersją aplikacji.

## Film — około 2 min 40 s, z zapasem do 3 min

| Czas | Obraz | Komentarz / napisy |
| --- | --- | --- |
| 0:00–0:20 | Nazwa i ekran początkowy | „Najkrótsza trasa nie mówi wszystkiego. Osoba niewidoma potrzebuje informacji o przejściach, udogodnieniach i o tym, czego w danych brakuje. Krok po kroku pomaga te informacje porównać.” |
| 0:20–0:35 | Jawna etykieta fikcyjnych danych, formularz z punktami | „Pokazujemy demonstrację na fikcyjnym grafie. Algorytm naprawdę oblicza trasy, ale te punkty nie opisują realnych miejsc i nie służą do prowadzenia w terenie.” |
| 0:35–1:05 | Wynik 740/980/1120 m, rekomendacja 980 m | „Przy preferencji sygnałów dźwiękowych rekomendacja ma 980 metrów: o 240 więcej niż najkrótsza trasa. Na jej trzech etapach przejść zapisano obecność akustyki. Krótszy wariant zawiera także opisany brak i niewiadomą.” |
| 1:05–1:25 | Wyłączenie preferencji akustyki i ponowne obliczenie | „Zmiana preferencji zmienia wynik. Bez preferencji akustyki rekomendowane jest 740 metrów. To nowe obliczenie, a nie podmiana przygotowanego obrazka.” |
| 1:25–1:50 | Rozwinięty przebieg i dowody wariantu | „Każda informacja ma pochodzenie. Brak danych jest odróżniony od opisanego braku udogodnienia. Osobno pokazujemy datę pobrania, obserwacji i potwierdzenia. Ponowny import nie jest kontrolą w terenie.” |
| 1:50–2:10 | Wymóg weryfikacji terenowej i odpowiedź o braku pasującej trasy | „Twardych wymagań nie rozluźniamy automatycznie. Te fikcyjne deklaracje nie są weryfikacją terenową, dlatego aplikacja zgłasza brak pasującej trasy i zachowuje ustawienia.” |
| 2:10–2:30 | Odsłuch, jeżeli został ukończony i sprawdzony; w przeciwnym razie tekstowy przebieg | „Opis trasy jest dostępny w tekście.” Dodać informację o odsłuchu wyłącznie po jego sprawdzeniu; nie deklarować testu czytnika na podstawie nagrania przeglądarki. |
| 2:30–2:40 | Plansza ograniczeń i następnego etapu | „Kolejny etap to audyt danych realnego obszaru i testy z użytkownikami. Dziś pokazujemy obliczenia, wyjaśnienia i widoczne niewiadome.” |

Nie nagrywać wpisywania kodu, terminala ani konfiguracji. Nagrać działający
przebieg aplikacji i zachować etykietę synthetic. Napisy mają pozostać czytelne
po eksporcie 1080p. Użyć krótkich cięć między formularzem i wynikiem, zamiast
długiego przewijania formularza. Głos użytkownika jest opcjonalny; kompletne
napisy muszą działać samodzielnie. Nie dodawać podkładu wymagającego nieznanej licencji.

## Prezentacja — osiem slajdów

1. **Krok po kroku.** Informacje o trasie. Z miejscem na niewiadome.
2. **Problem.** Sama długość trasy nie pokazuje infrastruktury ani jakości danych.
   Bez wymyślonych wywiadów, statystyk i deklaracji skuteczności.
3. **Przebieg.** Punkty → preferencje → porównanie → tekstowy plan i źródła.
4. **Demo.** Zrzut obliczonych wariantów 740/980/1120 m i uzasadnienie rekomendacji.
   Duże oznaczenie: dane syntetyczne.
5. **Wiedza i niewiadome.** Obecność opisana, brak opisany, unknown, konflikt.
   Trzy osobne daty; twarde wymagania zachowane po błędzie.
6. **Jak działa.** Expo + wspólny kontrakt + API + deterministyczny graf.
   Bez LLM w routingu. Bez przesyłania historii GPS. Baza i import realnych danych
   pokazane jako osobne przyszłe etapy, nie element konieczny do obecnego demo RAM.
7. **Co sprawdziliśmy i czego jeszcze nie.** Wyniki z najnowszego docs/status.md,
   dokładnie rozdzielone testy przeglądarki, backendu i urządzeń. Ograniczenia polityki
   synthetic oraz brak dopuszczenia do prowadzenia terenowego.
8. **Następny etap i utrzymanie.** Audyt realnego obszaru, testy telefonu/czytnika
   i konsultacje z osobami niewidomymi. Proponowane role: opiekun źródeł,
   osoba odpowiedzialna za QA topologii oraz utrzymanie aplikacji. Nie wskazujemy
   nieuzgodnionego partnera ani nieobliczonego kosztu jako faktu.

## Kontrola przed oddaniem

- Zrzuty i nagranie pochodzą z finalnej sprawdzonej wersji.
- Liczby testów i deklaracje funkcji zgadzają się z aktualnym statusem.
- PDF otwiera się i zawiera polskie znaki; film odtwarza się z czytelnymi napisami.
- Film mieści się w 3 minutach; prezentacja ma najwyżej 10 slajdów.
- Nie deklarujemy rozpoznawania zielonego światła, bezpieczeństwa trasy,
  pełnego pokrycia miasta ani przeprowadzonych testów z ludźmi, których nie było.
