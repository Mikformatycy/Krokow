# iPhone przez własny ngrok

Aktualna ścieżka developerska: **API 3001 → gateway 8082 → ngrok → Metro 8081**. Tunel nie jest potrzebny do lokalnego web ani nie stanowi wdrożenia produkcyjnego. Nie ma stałego adresu — odczytaj aktualny URL po uruchomieniu. [Podstawowy start](../README.md).

Expo SDK 57 dobrano do zgłoszonego iPhone'a/Expo Go 57.0.9. Pięć prób VoiceOver potwierdził użytkownik; dokładny zakres i dalsze próby: [testing.md](testing.md). Katalog to dziś 96 556 wpisów wyszukiwania i 30 końców tras, nie dawny katalog pięciu wejść.

## Wymagania

Zainstalowane zależności repozytorium oraz własny dostęp do ngrok. Windowsowy skrypt oczekuje agenta v3 w %LOCALAPPDATA%/krokow-tools/ngrok/ngrok.exe; pobierz odpowiedni program z [oficjalnej strony](https://ngrok.com/download/windows?tab=download), jeśli go nie masz. Skrypt nie instaluje agenta ani nie tworzy konta. Token wpisuj tylko lokalnie w ukrytym polu skryptu, nigdy w czacie/repozytorium.

Polecenia poniżej zakładają Node/pnpm z README. Przy ich braku użyj opisanego tam wrappera npm.cmd exec. Każdy terminal otwórz w katalogu głównym projektu; nie uruchamiaj drugiej instancji na zajętym porcie.

## Cztery terminale

Terminal 1 — API:

```powershell
$env:API_DATA_MODE = 'pilot'
$env:API_HOST = '127.0.0.1'
$env:API_PORT = '3001'
pnpm start:api
```

Terminal 2 — gateway:

```powershell
$env:KROK_GATEWAY_ONLY = '1'
node apps/mobile/scripts/start-tunnel.mjs
```

Terminal 3 — własny ngrok:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\apps\mobile\scripts\connect-ngrok.ps1
```

Skrypt pyta o authtoken przez Read-Host -AsSecureString, przekazuje go w środowisku procesu i wyłącza inspekcję treści żądań. Nie zapisuje tokenu w argumentach ani pliku projektu.

Terminal 4 — odczyt URL i uruchomienie Metro:

```powershell
$krokPublicUrl = (Invoke-RestMethod http://127.0.0.1:4040/api/tunnels).tunnels |
    Where-Object { $_.proto -eq 'https' } |
    Select-Object -First 1 -ExpandProperty public_url
if (-not $krokPublicUrl) { throw 'Brak aktywnego tunelu HTTPS' }

$env:EXPO_PACKAGER_PROXY_URL = $krokPublicUrl
$env:EXPO_PUBLIC_API_URL = $krokPublicUrl
Remove-Item Env:REACT_NATIVE_PACKAGER_HOSTNAME -ErrorAction SilentlyContinue
pnpm --filter @krok/mobile exec expo start --go --lan --port 8081 --max-workers 2
```

Otwórz QR Expo Go. Adres odpowiada aktualnemu URL tunelu ze schematem exps:// zamiast https://. Stary QR LAN nie przełącza się sam na tunel. Zmiana publicznego adresu wymaga ustawienia obu zmiennych przed ponownym startem Metro.

Jeśli testujesz również web przez tę domenę, dodaj jej HTTPS origin do API_ALLOWED_ORIGINS procesu API, zachowując potrzebne originy lokalne. To wymaga kontrolowanego restartu własnego API; CORS nie jest uwierzytelnieniem.

## Diagnostyka

```powershell
Invoke-RestMethod http://127.0.0.1:3001/healthz
Invoke-RestMethod http://127.0.0.1:3001/v1/coverage
Invoke-WebRequest http://127.0.0.1:8081/status -UseBasicParsing
Get-NetTCPConnection -State Listen |
    Where-Object { $_.LocalPort -in 3001,8081,8082,4040 } |
    Select-Object LocalAddress,LocalPort,OwningProcess
```

Oczekiwane: health status=ok, coverage mode=pilot, Metro packager-status:running. /readyz bez PostGIS może zwracać 503 mimo działających tras. 502 gateway oznacza niedostępny lokalny komponent; samo otwarcie TCP nie potwierdza poprawności API.

Jeżeli Expo Go wyświetli wymóg logowania, zaloguj CLI i telefon do tego samego konta. To osobna czynność użytkownika:

```powershell
pnpm --filter @krok/mobile exec expo whoami
$env:BROWSER = 'none'
pnpm --filter @krok/mobile exec expo login --browser
```

Otwórz link CLI na tym samym komputerze. [Opis komunikatu Expo](https://docs.expo.dev/troubleshooting/expo-go-sign-in-required/). Nie twórz kont automatycznie.

Historycznie wspólny tunel Expo zwrócił ERR_NGROK_108, a stary token instalacji Microsoft Store ERR_NGROK_105. To opis tamtych prób, nie diagnoza każdego nowego błędu.

## Próba i zatrzymanie

Pawia 5 → Galeria od Pawiej → High5ive wejście zachodnie → około 420 m, unknown akustyki. Szczegóły i odsłuch sprawdź według testing.md. Tunel działa tylko przy uruchomionych komponentach; po własnej próbie Ctrl+C zatrzymuje dany terminal. Nie zatrzymuj podglądu innego wykonawcy/użytkownika bez ustalenia procesu.
