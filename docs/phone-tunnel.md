# iPhone przez ngrok

**Aktualizacja 2026-10-03:** użytkownik uruchomił własny ngrok. Potwierdzono
publiczne health/API, manifest iOS, pobranie bundla iOS i WebSocket Metro.
Aktualny origin: `https://chaos-virtuous-mumble.ngrok-free.dev`;
adres do Expo Go: `exps://chaos-virtuous-mumble.ngrok-free.dev`.
Nowy QR `apps/mobile/.expo/krokow-ngrok-qr.png` otwarto w Windows Zdjęcia.
Adres działa, gdy procesy ngrok, gateway, API i Metro są uruchomione.
Próba na fizycznym iPhonie pozostaje do potwierdzenia przez użytkownika.

Na tym komputerze LAN nie pozwolił użytkownikowi uruchomić Expo Go.
Wspólny tunel Expo odmówił uruchomienia: `ERR_NGROK_108`, limit wspólnego
konta Expo (5000 agentów). To nie limit własnego konta użytkownika.
Użytkownik wskazał własne konto ngrok. Nie zapisujemy jego tokenu w repozytorium.

Sprawdzono również konfigurację wersji Microsoft Store:
`%LOCALAPPDATA%/Packages/ngrok.ngrok_1g87z0zv29zzc/LocalCache/Local/ngrok/ngrok.yml`.
Plik przechodzi kontrolę składni, lecz próba jego użycia 2026-10-03 zakończyła
się `ERR_NGROK_105`: zapisany token został odrzucony jako niepoprawny.
Poniższy skrypt pozwala wpisać poprawny authtoken lokalnie, bez zmiany tego pliku.

API działa na 3001, Metro na 8081, a lokalny gateway na `127.0.0.1:8082`.
Gateway przekazuje API oraz Metro wraz z WebSocket przez jeden publiczny
endpoint. Uruchomienie gatewaya (osobny terminal w katalogu repozytorium):

```powershell
$env:KROK_GATEWAY_ONLY = '1'
npm.cmd exec --yes --package=node@24.21.0 --package=pnpm@10.34.6 --call "node apps/mobile/scripts/start-tunnel.mjs"
```

Agent ngrok v3 pobrany z [oficjalnej strony](https://ngrok.com/download/windows?tab=download)
jest w `%LOCALAPPDATA%/krokow-tools/ngrok/ngrok.exe`, poza projektem.
Skrypt połączenia pyta o token przez `Read-Host -AsSecureString` i przekazuje
go agentowi wyłącznie w środowisku procesu. Nie zapisuje tokenu w pliku ani
w argumentach polecenia. Rejestrowanie treści żądań ngrok jest wyłączone.

Użytkownik uruchamia w terminalu z katalogu repozytorium:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\apps\mobile\scripts\connect-ngrok.ps1
```

Po uruchomieniu tunelu jego publiczny adres jest dostępny lokalnie pod
`http://127.0.0.1:4040/api/tunnels` (pole `public_url`). Tylko ten publiczny
adres przekazujemy do Expo jako `EXPO_PUBLIC_API_URL` i `EXPO_PACKAGER_PROXY_URL`.
Następnie restartujemy Metro na porcie 8081, bez `REACT_NATIVE_PACKAGER_HOSTNAME`.
Do listy `API_ALLOWED_ORIGINS` dodajemy ten adres, jeśli sprawdzamy też web.
Kod QR musi wskazywać nowy adres `exps://...`, odpowiadający HTTPS tunelu.
Stary kod LAN nie zaczyna automatycznie używać tunelu.

## Logowanie Expo na fizycznym iPhonie

Expo Go na iPhonie wymaga zalogowania do **tego samego konta Expo** w aplikacji
i w CLI. To dodatkowy etap po uruchomieniu tunelu; komunikat o logowaniu
nie oznacza niedostępnego ngrok. [Dokumentacja tego błędu](https://docs.expo.dev/troubleshooting/expo-go-sign-in-required/).

Stan CLI sprawdza `pnpm --filter @krok/mobile exec expo whoami`.
Logowanie: `pnpm --filter @krok/mobile exec expo login --browser`.
Na tym Windows automatyczne otwieranie linku przez Expo CLI zakończyło się
błędem. W takim przypadku ustaw `$env:BROWSER = 'none'`, uruchom logowanie
i otwórz wypisany link **na tym samym komputerze**, pozostawiając proces aktywny.
Logowanie odbywa się na stronie Expo, a nie w czacie. Przy braku pnpm użyj
przypiętego wrappera z README.

W Expo Go wybierz ikonę konta w prawym górnym rogu i zaloguj się na to samo
konto. Następnie wybierz „Try Again” na ekranie błędu. Przy pierwszym logowaniu
nie trzeba restartować Metro; przy zmianie konta zrestartuj serwer.

Po zakończeniu próby zatrzymujemy tunel przez Ctrl+C. To developerski
podgląd, a nie wdrożenie aplikacji. Kolejne uruchomienie może zmienić adres.
Obsługa proxy i tunelu: [dokumentacja Expo CLI](https://docs.expo.dev/more/expo-cli/).
