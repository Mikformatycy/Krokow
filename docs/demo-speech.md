# Minimalny odsłuch demonstracji

Zakres B / Codex, 2026-10-03: odsłuch planu na żądanie, zatrzymanie i powtórzenie,
jedna kolejka dla wszystkich wariantów. To ograniczona część M-03 na potrzeby
terminu oddania, bez pozycji GPS, mowy w tle i pełnej symulacji M-04.

Zainstalowane Expo SDK 57 wskazuje w `bundledNativeModules.json` zgodne
`expo-speech ~57.0.3`. Przed instalacją sprawdzono to lokalnie. Native używa
expo-speech; web ma osobny adapter Web Speech, aby jawnie obsłużyć ładowanie
głosów i ich brak. Nie instalujemy osobnej wersji React Native.

Kryteria: brak automatycznego odczytu, wybór polskiego głosu, jawny brak
głosu, jedna wypowiedź naraz, wymiana trasy zatrzymuje poprzednią kolejkę,
stare callbacki nie rozpoczynają kolejnych wypowiedzi. Zatrzymanie przy zmianie
formularza/ekranu i ukryciu aplikacji. Wykryty czytnik native wyłącza własny
TTS; web udostępnia jawny przełącznik korzystania z czytnika, ponieważ nie
deklarujemy niezawodnego wykrywania czytnika w przeglądarce. Tekst pozostaje
dostępny niezależnie od dźwięku. Nie odczytujemy automatycznie długich tras
przez AccessibilityInfo. Pauza/wznowienie w środku zdania nie wchodzi w zakres;
przycisk zatrzymuje odsłuch, a powtórzenie zaczyna plan od początku.

Testy: koordynator z wstrzykiwanym adapterem (zmiany wariantu, wyścigi,
zatrzymanie i błędy), UI ze sterowanym Web Speech, brak polskiego głosu,
przełącznik czytnika, regresja HTTP, typecheck/lint, eksport web/iOS i Expo
install --check. Symulacja API mowy nie potwierdza rzeczywistego dźwięku ani
VoiceOver/TalkBack. Bez telefonu: nieprzetestowane na urządzeniu.

Ogólne ograniczenie trybu cichego iOS i brak pause/resume na Androidzie są
opisane w [dokumentacji Expo Speech](https://docs.expo.dev/versions/v56.0.0/sdk/speech/).
Wersję zależności dobrano według lokalnego manifestu SDK 57, a sygnatury
sprawdzono w zainstalowanym `expo-speech` 57.0.3. Nie kopiowano wersji
pakietu z dokumentacji SDK 56.
