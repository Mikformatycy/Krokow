# Krok po kroku — notatki do wystąpienia

Wersja polska. Cel: około 3 minut mówienia. Można pokazać film zamiast
części demonstracyjnej; wtedy skrócić wypowiedź, aby nie dublować komentarza.

1. **Nazwa, 15 s.** „Krok po kroku pomaga porównać piesze trasy pod kątem
   opisanej infrastruktury i braków danych. Informacje o trasie, z miejscem
   na niewiadome.”
2. **Problem, 20 s.** „Sama długość trasy nie odpowiada na pytania o przejścia,
   sygnalizację dźwiękową i aktualność informacji. Projektujemy narzędzie
   przede wszystkim z myślą o osobach niewidomych. Skuteczność musimy jeszcze
   sprawdzić z użytkownikami.”
3. **Przebieg, 20 s.** „Wybieramy start, cel i preferencje. Aplikacja pyta API
   o warianty. Wynik ma uzasadnienie, tekstowy przebieg oraz pochodzenie faktów.
   Odsłuch uruchamia użytkownik, tekst pozostaje dostępny.”
4. **Demo, 35 s.** „To dane syntetyczne, ale rzeczywiste obliczenia. Wariant
   980 metrów jest o 240 metrów dłuższy od najkrótszego. Na jego trzech etapach
   przejść są deklaracje obecności akustyki. Krótszy wariant ma także opisany
   brak i niewiadomą. Po wyłączeniu preferencji akustyki wygrywa 740 metrów.”
5. **Dane, 25 s.** „Brak danych nie staje się potwierdzeniem. Konflikt pozostaje
   widoczny. Oddzielamy pobranie, obserwację i potwierdzenie. Wymaganie terenowej
   weryfikacji nie jest spełnione przez te fikcyjne deklaracje, więc aplikacja
   pokazuje brak pasującej trasy i zachowuje ustawienia.”
6. **Mechanizm, 20 s.** „Wspólny kontrakt łączy aplikację z API. Algorytm grafu
   i zasady kosztu są deterministyczne. Nie używamy modelu językowego do
   wyznaczania trasy ani do dopowiadania informacji o infrastrukturze.”
7. **Weryfikacja, 25 s.** „Sprawdziliśmy obliczenia, kontrakt, przepływ HTTP,
   awarie i interfejs w przeglądarce. Logikę mowy testujemy ze sterowanym
   adapterem. Nie deklarujemy jeszcze działania VoiceOver i TalkBack na
   urządzeniu ani dopuszczenia do nawigacji terenowej.”
8. **Dalej, 20 s.** „Następny etap to audyt małego realnego obszaru i testy
   z osobami niewidomymi. Przed pilotażem trzeba ustalić operatora, opiekuna
   danych i proces aktualizacji. Informacje o trasie. Z miejscem na niewiadome.”

## Krótkie odpowiedzi na pytania

- **Czy można dziś użyć tego na ulicy?** Nie. To jawna demonstracja synthetic,
  z blokadą prowadzenia terenowego.
- **Czy aplikacja wie, że świeci zielone?** Nie. Opis infrastruktury nie jest
  wiedzą o bieżącym świetle ani pozwoleniem na wejście na jezdnię.
- **Dlaczego bez mapy?** Główny przebieg ma pełną reprezentację tekstową.
  Mapa jest ewentualnym dodatkiem, nie warunkiem korzystania.
- **Czy dane są z OSM?** Obecny graf jest fikcyjny. Import OSM i audyt topologii
  pozostają następnym etapem.
- **Czy odsłuch był sprawdzony na telefonie?** Nie w tej iteracji. Są testy
  koordynatora i interfejsu oraz eksport iOS; to nie zastępuje odsłuchu urządzenia.
- **Kto utrzyma rozwiązanie?** Proponujemy wskazanie operatora oraz opiekunów
  źródeł i jakości grafu. Partnerzy, harmonogram i koszty nie są jeszcze uzgodnione.

Przed wystąpieniem przejrzeć `docs/status.md`, obejrzeć cały MP4 i otworzyć PDF.
Nie dopisywać testów z ludźmi, których nie przeprowadzono. Materiały nie zostały
opublikowane ani wysłane organizatorowi.
