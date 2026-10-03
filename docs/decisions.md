# Decyzje techniczne

## F-03 — Expo, 2026-10-03, osoba A / Codex

Użytkownik potwierdził iPhone'a z Expo Go client 57.0.9 i obsługą SDK 57.0.0 oraz równoległą pracę drugiej instancji Codexa nad backendem. A realizuje szkielet F-03, B zachowuje F-02 i integrację wspólnych manifestów/lockfile. Nie kopiujemy schematów ani zależności kontraktu z nieodebranego draftu do mobile.

| Element | Wersja / decyzja |
| --- | --- |
| Expo | Stabilne SDK 57, pakiet 57.0.26. |
| React / React Native | 19.2.3 / 0.86.3, zgodnie z oficjalnym szablonem `blank-typescript@57.0.28`, wygenerowanym poza repo przez `create-expo-app@5.0.0`. |
| Expo Router | 57.0.24; cienkie trasy w `src/app`, dwa ekrany bez API i planowania tras. |
| Biblioteki platformowe | Wersje dobrane przez `expo install`; wynik `expo install --check` zapisany w statusie. Worklets 0.10.1, Reanimated 4.5.1 i Metro config 0.86.3 przypięto jawnie, aby automatyczne peer dependencies nie wybierały nowszych niezgodnych wersji. |
| TypeScript | Wspólne 5.9.3, strict; wynik kompilacji kontrolowany osobno od bundlowania Metro. |
| Testy UI | Playwright 1.63.0, Chromium, jeden worker. Desktop oraz szerokość 390 px; to test web, nie emulacja urządzenia iOS. |
| Serwer testów | Metro `--localhost`, port 8085; URL `http://localhost:8085`, ponieważ na sprawdzonym Windowsie Metro nasłuchuje pod IPv6 `::1`. |
| Dostępność | Semantyczne nagłówki web, fokus po zmianie trasy, widoczny fokus linków, osobny adapter native oparty na `AccessibilityInfo`. Odbiór VoiceOver wymaga telefonu. |
| Dane | Wyłącznie objaśnienia pojęć, bez przykładowych faktów o realnych miejscach. Jawny podgląd, bez żądania lokalizacji i nawigacji terenowej. |

Zależności natywne instalowano według [instrukcji Expo Router](https://docs.expo.dev/router/installation/) i [dokumentacji monorepo Expo](https://docs.expo.dev/guides/monorepos/). Aktualna zgodność SDK i wynik uruchomienia na urządzeniu to odrębne kontrole. iOS/VoiceOver oraz Android/TalkBack: **nieprzetestowane na urządzeniu**. Eksport iOS sprawdza bundlowanie; nie jest kompilacją ani uruchomieniem natywnego binarium.

Komponent linku przekazuje `StyleSheet.flatten(...)` do dziecka `Link asChild`: Slot w tej wersji Routera nie obsługuje tablic stylów ani funkcji stylu Pressable. Test klawiatury kontroluje również widoczne obramowanie fokusu. Wyniki i ograniczenia: [status](status.md).

## F-01 — bootstrap, 2026-10-03, osoba A / Codex

Zakres roboczy po poleceniu kontynuacji: jeden fundament pnpm, konfiguracja TypeScript/lint/test, lokalny PostGIS i CI. W checkoutcie nie było manifestów, lockfile ani kodu osoby B. Własność integracji manifestów i kontraktu pozostaje po stronie B; ta implementacja jest do przeglądu i nie oznacza wspólnego odbioru.

Kryteria techniczne F-01: instalacja w czystym katalogu źródłowym z zamrożonego lockfile, lint bez ostrzeżeń, typecheck, testy konfiguracji, start lokalnej bazy i test PostGIS. Wersje i ograniczenia zapisane, brak rzeczywistych sekretów w plikach do Git. Wyniki kontroli: [status](status.md).

| Narzędzie | Przypięta wersja / decyzja |
| --- | --- |
| Node | 24.21.0; linia 24 zgodna z kierunkiem README. Host miał 22.17.1; użyto `npm.cmd exec` z pakietem node, bez podmiany globalnej instalacji. |
| pnpm | 10.34.6; `packageManager`, jeden lockfile, strict engines/peers. |
| TypeScript | 5.9.3; strict, kontrola indeksowania i dokładne optional properties. Wersja 7.0.2 widoczna w registry wykracza poza zakres peer dependency wybranego typescript-eslint. |
| ESLint / typescript-eslint | 10.12.0 / 8.71.0, flat config i reguły korzystające z typów. `@eslint/js` 10.0.1. |
| Vitest / tsx | 4.1.11 / 4.23.15. Testy jednostkowe nie wymagają Dockera; test PostGIS uruchamiany osobną komendą. |
| pg / @types/pg | 8.23.1 / 8.23.1; używane tylko przez lokalne narzędzia infrastruktury. |
| @types/node / globals | 24.19.1 / 17.13.0. Typy Node nie są włączone w bazowym tsconfig przyszłej aplikacji mobilnej. |
| PostgreSQL / PostGIS | Obraz `postgis/postgis:17-3.5`, przypięty digestem w Compose. Uruchomiony serwer: PostgreSQL 17.5, PostGIS 3.5.2; potwierdzone zapytaniami SQL i testem integracyjnym. |
| Docker / Compose na hoście | 29.5.2 / 5.1.4. Linux engine uruchomiony przez Docker Desktop. |
| Expo SDK, Expo Go, telefony | Nieustalone; F-03 wymaga weryfikacji na telefonach. Brak zależności natywnych w F-01. |

Struktura workspace obejmuje `apps/*`, `packages/*` i `infra`. Na tym etapie istnieje tylko pakiet `@krok/infra`; nie tworzymy pozornie gotowych paczek kontraktu i aplikacji. Każdy przyszły pakiet dostarcza własne `typecheck` i `test`. Bazowy tsconfig nie narzuca Node ani DOM; pakiet wybiera środowisko i sposób rozwiązywania modułów.

Lokalne narzędzie bazy korzysta z osobnych pól środowiska zamiast sklejania URL z hasłem. Akceptuje wyłącznie `127.0.0.1`, ustawia timeouty i nie wypisuje błędu sterownika ani poświadczeń. To ograniczenie narzędzia developerskiego, nie projekt konfiguracji produkcyjnego API. Test PostGIS korzysta z fikcyjnych punktów i nie zapisuje danych.

Compose udostępnia port tylko na loopback i zachowuje dane w nazwanym wolumenie. Skrypty nie zawierają usuwania wolumenów ani migracji. Obraz przygotowuje rozszerzenie PostGIS w bazie domyślnej. CI używa tego samego Compose co lokalne testy; akcje są przypięte SHA sprawdzonych tagów v4.

Kompatybilność sprawdzono w metadanych registry (`npm view`) i dokumentacji: [pnpm](https://pnpm.io/installation), [typescript-eslint](https://typescript-eslint.io/getting-started/), [PostGIS Docker](https://github.com/postgis/docker-postgis), [zmienne Compose](https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/). Ostatecznym dowodem dla tego zestawu są lokalne wyniki poleceń w statusie.

Otwarte decyzje produktowe pozostają w [planie UX](mobile-ux.md): C-01–C-08, zapis offline, żądanie wersji i treści komunikatów. F-01 nie zmienia opisowego kontraktu `1.0.0-draft.1` ani zasad rankingu.
