# Odpowiedzi do formularza — Kroków

Stan: 2026-10-04. Opis dotyczy aktualnego lokalnego prototypu. Zgodnie z przekazaną informacją przed wydarzeniem nie prowadzono prac nad projektem; całość powstała podczas wydarzenia.

## 1. Dlaczego powstał projekt?

Kroków powstał, aby ułatwić osobom niewidomym przygotowanie do pieszego przejścia. Sama długość trasy lub ogólna etykieta „dostępne” nie wyjaśnia, czy istnieją informacje o sygnalizacji dźwiękowej, oznaczeniach dotykowych albo nawierzchni. Równie istotne jest pokazanie, których informacji brakuje.

Według [Światowej Organizacji Zdrowia](https://www.who.int/news-room/fact-sheets/detail/blindness-and-visual-impairment) co najmniej 2,2 miliarda ludzi na świecie ma zaburzenia widzenia do bliży lub dali. To szerszy kontekst problemu, a nie liczba osób niewidomych ani odbiorców prototypu. Lokalny audyt danych również pokazał lukę informacyjną: dla wszystkich 479 etapów przejść przez jezdnię w obecnym grafie tras nie udało się ustalić informacji o sygnalizacji dźwiękowej. Wynika to z dostępnych danych i zasad ich przypisywania, nie oznacza fizycznego braku sygnalizacji. Projekt pozwala zobaczyć takie braki przed wyruszeniem.

## 2. Na czym polega rozwiązanie i jakie daje korzyści?

Kroków to prototyp aplikacji mobilnej i internetowej do planowania pieszych tras przez osoby niewidome. Użytkownik wybiera początek, cel oraz preferencje dotyczące infrastruktury. Otrzymuje tekstowy przebieg trasy z możliwością odsłuchu, informacjami o odcinkach, źródłach, datach i brakach danych. Twarde wymagania pozostają wiążące: jeśli nie da się wyznaczyć spełniającej je trasy, aplikacja wyświetla odpowiedni komunikat.

Korzyścią jest możliwość wcześniejszego zapoznania się z trasą i samodzielnej oceny dostępnych informacji. Aktualny prototyp przeszukuje 96 556 wpisów z Krakowa, a wyznaczanie tras obejmuje 30 wybranych punktów w centrum, podzielonych na pięć grup połączeń. Znalezienie miejsca nie oznacza, że można do niego wyznaczyć trasę. Aplikacja nie prowadzi na żywo przez GPS ani nie potwierdza bezpieczeństwa przejścia.

Dalszy rozwój może objąć inne miasta oraz opisy dojścia dla hoteli, obiektów i wydarzeń. Proponowany model biznesowy zakłada bezpłatne podstawowe planowanie indywidualne oraz płatne integracje, widgety i aktualizacje informacji dla odbiorców instytucjonalnych. Jest to kierunek rozwoju, nie uruchomiona oferta.

## 3. Co wykonano przed wydarzeniem i podczas niego?

Przed wydarzeniem nie prowadzono żadnych prac nad projektem. Cały dotychczasowy projekt powstał podczas wydarzenia: aplikacja mobilna i internetowa, API, wspólne schematy danych, import i archiwa OpenStreetMap, wyszukiwarka miejsc, silnik wyznaczania tras oraz tekstowa i głosowa prezentacja wyników.

Podczas wydarzenia wykonano także audyt danych, dokumentację i testy. Ostatnia pełna kontrola zakończyła się wynikiem 620 testów PASS; potwierdzono również pięć scenariuszy na iPhonie z VoiceOver. Nowsze podsumowanie trasy i pozostałe próby urządzenia nadal wymagają odbioru. Nie przeprowadzono weryfikacji terenowej.

Do zakończenia prac demonstracyjnych zaplanowano aktualny film i prezentację PDF oraz uzupełnienie pozostałych prób dostępności w dostępnym czasie. Plan utrzymania, przenoszenia i skalowania został opisany w dokumentacji.

## 4. Jak uruchomić projekt?

Potrzebny jest kompletny katalog projektu, w tym archiwa `packages/ingestion/data/krakow-prototype` i `packages/ingestion/data/krakow-search`, Node.js 24.21.0 oraz pnpm 10.34.6. Repozytorium zdalne może jeszcze nie zawierać wszystkich aktualnych zmian lokalnych.

W katalogu głównym zainstalować zależności:

```sh
pnpm install --frozen-lockfile
```

W pierwszym terminalu PowerShell uruchomić API:

```powershell
$env:API_DATA_MODE = 'pilot'
$env:API_HOST = '127.0.0.1'
$env:API_PORT = '3001'
$env:API_ALLOWED_ORIGINS = 'http://localhost:8081,http://localhost:8085'
pnpm start:api
```

W drugim terminalu PowerShell, również w katalogu głównym:

```powershell
$env:EXPO_PUBLIC_API_URL = 'http://127.0.0.1:3001'
pnpm --filter @krok/mobile exec expo start --web --localhost --port 8081 --max-workers 2
```

Otworzyć **http://localhost:8081** i pozostawić oba terminale uruchomione. Demonstracja w przeglądarce nie wymaga Dockera, bazy danych, kluczy do API map ani kont Expo/ngrok. Pierwsza instalacja zależności wymaga internetu; wyznaczanie tras korzysta z dołączonych archiwów.

Przykład: wybrać „Zaplanuj trasę”, wyszukać „Pawia 5” i wskazać „Galeria Krakowska — wejście od Pawiej”. Następnie wyszukać „High5ive” i wybrać „High5ive, budynek 1 — wejście zachodnie”. Wyznaczyć trasę i sprawdzić „Przebieg trasy” oraz „Informacje o odcinkach”. Oczekiwany wynik to około 420 metrów, z jawnym brakiem informacji o sygnalizacji dźwiękowej. Odsłuch wymaga polskiego głosu; treść jest również dostępna tekstowo.

Warianty dla macOS/Linux, uruchomienie z przypiętymi wersjami narzędzi i rozwiązywanie problemów opisuje [README](../README.md). Instrukcja uruchomienia na fizycznym iPhonie znajduje się w [phone-tunnel.md](phone-tunnel.md).
