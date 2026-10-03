# Materiały demonstracji „Krok po kroku”

**Archiwalna wersja robocza.** Finalna nazwa produktu to **Kroków**.
Użytkownik odłożył film i prezentację do czasu dalszego rozwoju aplikacji.
Pliki poniżej zachowują wcześniejszą nazwę i stan demonstracji.

Przygotowane 2026-10-03, po polsku. Materiały do przeglądu przez prezentującego;
nie zostały wysłane ani opublikowane.

[Pakiet ZIP](Krok-po-kroku-materialy.zip) zawiera cztery pliki do przeglądu:
PDF, MP4, notatki prezentera i transkrypt.

| Plik | Zawartość |
| --- | --- |
| [Kroków-prezentacja.pdf](Kroków-prezentacja.pdf) | 8 slajdów, format 16:9, tekst i rzeczywisty zrzut aplikacji. |
| [Krok-po-kroku-demo.mp4](Krok-po-kroku-demo.mp4) | 143,52 s; H.264, 1280 × 720, 25 kl./s. Napisy w obrazie, bez ścieżki dźwiękowej. |
| [notatki-prezentera.md](notatki-prezentera.md) | Tekst wystąpienia i odpowiedzi na pytania. Przećwicz z własnym tempem mówienia. |
| [transkrypt-filmu.txt](transkrypt-filmu.txt) | Tekst plansz i napisów, do odczytu niezależnie od wideo. |
| [prezentacja.html](prezentacja.html) | Edytowalne źródło PDF; korzysta z plików w `images/`. |

Film pokazuje eksport web połączony z prawdziwym lokalnym API w trybie
synthetic. Nie podstawia odpowiedzi ani testowych głosów. Scenariusz:
740/980/1120 m → rekomendacja 980 m → po zmianie preferencji 740 m →
pochodzenie i niewiadome → brak trasy spełniającej wymóg terenowy → tekst odsłuchu.
Wszystkie miejsca i fakty są fikcyjne. Brak prowadzenia terenowego.
Pokazanie modułu odsłuchu nie potwierdza dźwięku na telefonie.

Kontrole: osiem stron PDF, polskie znaki w wyodrębnionym tekście,
przegląd obrazów wszystkich slajdów i wybranych klatek filmu, pełne dekodowanie
MP4 bez błędów. Nagranie: zero błędów JavaScript przeglądarki. Wyniki aplikacji
i niewykonane testy urządzeń: [docs/status.md](../docs/status.md).
Źródłowy brief organizatora nadal nie jest dostępny w `references/brief.pdf`;
limity 10 slajdów / 3 min wynikają z planu repozytorium.

## Odtworzenie eksportu i nagrania

Wymagane zainstalowane zależności workspace oraz Chromium Playwright.
Komendy z katalogu głównego, Node 24.21.0 i pnpm 10.34.6.
Na tym hoście można używać wrappera `npm.cmd exec` opisanego w głównym README.
Port 8081 powinien być wolny przed uruchomieniem serwera statycznego.

Pierwszy terminal PowerShell:

```powershell
$env:API_DATA_MODE = 'synthetic'
$env:API_HOST = '127.0.0.1'
$env:API_PORT = '3001'
pnpm start:api
```

Drugi terminal:

```powershell
pnpm build:web
node apps/mobile/scripts/serve-demo.mjs
```

Trzeci terminal; nagranie zajmuje około 2,5 minuty:

```powershell
node apps/mobile/scripts/capture-demo.mjs
node apps/mobile/scripts/export-slides.mjs
```

Skrypt nagrania zapisuje zrzuty w `images/`, a surowe wideo i rozdziały
w ignorowanym `work/`. Eksport slajdów wymaga istniejącego zrzutu
`images/rekomendacja-980.png`, sprawdza osiem slajdów i brak przepełnienia.
Zmiany HTML wymagają ponownego eksportu PDF.

Kodowanie wymaga FFmpeg z H.264. W tej sesji użyto FFmpeg 7.1 dostarczonego
przez `imageio-ffmpeg 0.6.0`, zainstalowane wyłącznie w katalogu tymczasowym
narzędzi, bez nowej zależności projektu. Dla FFmpeg dostępnego w PATH:

```powershell
ffmpeg -y -i deliverables/work/demo-raw.webm -r 25 -c:v libx264 -crf 20 -preset medium -pix_fmt yuv420p -movflags +faststart -an deliverables/Krok-po-kroku-demo.mp4
ffmpeg -v error -xerror -i deliverables/Krok-po-kroku-demo.mp4 -f null -
```

Ponowne nagranie może nieznacznie zmienić długość; sprawdź limit 180 s.
PDF i MP4 otwierają się niezależnie od uruchomienia aplikacji lub serwerów.
Oryginalne PDF-y Lumi dotyczą innego produktu i nie były źródłem treści.
