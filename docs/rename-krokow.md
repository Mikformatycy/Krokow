# Nazwa „Kroków” i uruchomienie na iPhonie

> **Dokument historyczny — odczytuj w kontekście opisanej iteracji.**
> Aktualny stan: [README](../README.md), [odbiór](testing.md) i [status](status.md).
> Integracja wyszukiwania/API jest zakończona; ostatnia pełna kontrola miała
> 620 testów PASS, a pięć prób iPhone/VoiceOver potwierdził użytkownik.
> Nowe podsumowanie i pozostałe próby urządzenia są otwarte. Dawne A/B,
> NOT TESTED, „do integracji” i listy przyszłych modułów niżej nie opisują
> automatycznie stanu obecnego. Aktualne materiały PDF/film są do wykonania.

## Aktualna iteracja — nazwa i wspólne repozytorium

Obowiązująca pisownia: **Kroków**. Adres repozytorium to
<https://github.com/Mikformatycy/Krokow>. Identyfikatory techniczne pozostają
w ASCII: `Krokow` na GitHubie oraz `krokow` w npm/Expo.

Użytkownik zlecił zebranie pracy z trzech katalogów w jednym repozytorium
i publikację kodu. Zakres: nazwa UI/metadanych/atrybucji, regeneracja
artefaktów, integracja 11 plików symulacji i kolejki mowy, zachowanie
aktualnych manifestów, kontraktów i poprawek telefonu. Historyczny status
backendu zachowano w `archive/backend-status.md`; jego kod jest już
w aktualnej integracji. Symulacja nadal wymaga podłączenia do ekranu.

Kryteria: lint, typecheck, kontrakty, routing, API, testy mobile i sesji;
zgodność generowanych plików, sprawdzony diff przed publikacją oraz
ten sam commit na lokalnym i zdalnym `main`. Bez sekretów, `.env`,
node_modules i lokalnych logów w repozytorium.

Windows odrzucił próbę zmiany nazwy głównego katalogu, bo korzystają
z niego procesy. Utworzono docelowy checkout `Kroków` z opublikowanego
repozytorium, zainstalowano zależności i uruchomiono z niego podgląd.
Po jawnym zezwoleniu użytkownika zakończono blokującą starą sesję Codexa.
Archiwizacja jest zakończona: główny dawny checkout i oba worktrees są
w `%LOCALAPPDATA%/Krokow/archive/2026-10-03/{main,backend,simulation}`.
Powiązania Git zostały naprawione i sprawdzone. Jedynym bieżącym folderem
projektu w `Documents/GitHUb` jest **Kroków**.
Wcześniejsze ścieżki we wpisach historycznych opisują miejsce powstania
zmian, a nie dodatkowe repozytoria na GitHubie.

Użytkownik potwierdził uruchomienie aplikacji na fizycznym iPhonie.
Odsłuch i VoiceOver/TalkBack pozostają bez potwierdzonego testu urządzenia.

## Wcześniejszy zakres uruchomienia

Decyzja użytkownika 2026-10-03: finalna nazwa produktu to **Kroków**
(wielkie „K”, z „ó”; korekta wcześniejszej pisowni). Pozostało siedem sesji po pięć godzin; na teraz
priorytetem jest uruchomienie aplikacji na iPhonie w Expo Go, potem dalszy
rozwój. Film i prezentacja są odłożone. Wcześniejsze polecenie zamrożenia
funkcji nie określa już bieżącego priorytetu.

Zakres iteracji: nazwa w UI, metadanych Expo, głównym manifeście,
atrybucji własnych danych demonstracyjnych i tytule generowanego OpenAPI.
Techniczny slug/scheme i nazwa root pakietu: `krokow`.
Istniejące scope pakietów `@krok/*`, identyfikatory tras i wersje kontraktu
nie zmieniają się. Regenerujemy artefakty kontraktu ze źródła.
Wcześniejsze binarne materiały pozostają historyczną wersją roboczą.

Kryteria: aplikacja pokazuje „Kroków”, manifest Expo podaje nową nazwę,
API synthetic odpowiada pod adresem LAN, Metro udostępnia manifest iOS,
kontrole lint/typecheck/testy zmienionych pakietów oraz kontraktów przechodzą.
Połączenie z fizycznego iPhone'a i odsłuch wymagają potwierdzenia użytkownika.
Bez tego zapisujemy „nieprzetestowane na urządzeniu”.

Aktualizacja: użytkownik nie mógł połączyć się przez LAN i jawnie poprosił
o ngrok. Uruchamiamy tymczasowy tunel dla Metro oraz API synthetic razem.
Lokalny gateway 8082 przekazuje `/v1/*`, health/readiness i OpenAPI do 3001,
pozostałe HTTP i WebSocket do Metro 8081. Expo dostaje publiczny adres API
i `EXPO_PACKAGER_PROXY_URL`. To pomoc developerska do próby telefonu,
bez wdrożenia produkcyjnego i bez zmiany zasad danych/routingu.
