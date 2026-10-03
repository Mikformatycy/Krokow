/* global document */
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const output = fileURLToPath(new URL('../../../deliverables/', import.meta.url));
await mkdir(path.join(output, 'work'), { recursive: true });
await mkdir(path.join(output, 'images'), { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, reducedMotion: 'reduce', recordVideo: { dir: path.join(output, 'work'), size: { width: 1280, height: 720 } } });
const page = await context.newPage();
page.setDefaultTimeout(15000);
const errors = []; page.on('pageerror', (error) => errors.push(error.message));
const started = Date.now();
const chapters = [];
const caption = async (title, body, seconds = 9) => {
  chapters.push({ atSec: (Date.now() - started) / 1000, title, body });
  await page.evaluate(({ title, body }) => {
    let panel = document.getElementById('demo-caption');
    if (!panel) { panel = document.createElement('div'); panel.id = 'demo-caption'; document.body.append(panel); }
    panel.style.cssText = 'position:fixed;z-index:99999;bottom:0;left:0;right:0;background:#092f32;color:#fff;padding:14px 40px;font:22px/1.35 Segoe UI,sans-serif;box-shadow:0 -4px 18px #0002;pointer-events:none;';
    const heading = document.createElement('strong'); heading.style.color = '#c7ee9b'; heading.style.display = 'block'; heading.textContent = title;
    const text = document.createElement('div'); text.textContent = body; panel.replaceChildren(heading, text);
  }, { title, body });
  await page.waitForTimeout(seconds * 1000);
};
const position = async (locator) => { await locator.evaluate((element) => element.scrollIntoView({ block: 'start' })); await page.waitForTimeout(250); };
const restore = () => page.getByRole('button', { name: 'Przywróć punkty i ustawienia przykładu A/B/C' }).click();
const calculate = async () => {
  await page.getByRole('button', { name: 'Oblicz trasy', exact: true }).click();
  await page.getByRole('heading', { name: 'Porównanie tras', exact: true }).waitFor();
};
try {
  await page.setContent('<body style="margin:0;background:#092f32;color:#faf9ef;font:28px Segoe UI,sans-serif;display:grid;place-content:center;height:100vh"><div style="color:#c7ee9b;font-size:20px;letter-spacing:3px">DEMONSTRACJA · DANE SYNTETYCZNE</div><h1 style="font-size:84px;margin:20px 0">Kroków</h1><p>Informacje o trasie.<br>Z miejscem na niewiadome.</p></body>');
  await page.waitForTimeout(7000);
  await page.goto('http://localhost:8081/plan');
  await page.getByRole('button', { name: 'Oblicz trasy', exact: true }).waitFor();
  await caption('Najkrótsza trasa nie mówi wszystkiego.', 'Porównujemy infrastrukturę i jawne braki danych. To fikcyjne miejsca — wyłącznie podgląd.', 10);
  await restore();
  await position(page.getByRole('heading', { name: 'Start', exact: true }));
  await caption('Wybieramy punkty i preferencje.', 'Aplikacja wysyła ustawienia do API. Algorytm oblicza warianty na syntetycznym grafie.', 9);
  await calculate();
  await page.getByText('Obliczono 3 warianty. Rekomendacja: 980 m.').waitFor();
  await position(page.getByTestId('route-card-1'));
  await page.getByTestId('route-card-1').screenshot({ path: path.join(output, 'images', 'wariant-740.png') });
  await caption('Najkrótszy wariant: 740 metrów.', 'Akustyka na etapach przejść: jedna opisana obecność, jeden opisany brak, jedna niewiadoma.', 11);
  await position(page.getByTestId('route-card-2'));
  await page.getByTestId('route-card-2').screenshot({ path: path.join(output, 'images', 'rekomendacja-980.png') });
  await caption('Rekomendacja: 980 metrów.', 'O 240 metrów dłużej. Na wszystkich trzech etapach przejść opisana obecność akustyki.', 12);
  await page.getByRole('checkbox', { name: 'Preferuj opisaną sygnalizację dźwiękową' }).click();
  await calculate(); await page.getByText(/Obliczono .*Rekomendacja: 740 m/).waitFor();
  await position(page.getByTestId('route-card-1'));
  await caption('Zmiana preferencji zmienia wynik.', 'Po wyłączeniu preferencji akustyki rekomendacja ma 740 metrów. To wynik nowego obliczenia.', 11);
  await restore(); await calculate();
  await page.getByRole('button', { name: 'Pokaż przebieg i dowody wariantu 1' }).click();
  await position(page.getByText('Etap 1, w odległości 50 m od startu', { exact: true }));
  await page.locator('#demo-caption').evaluate((element) => element.remove());
  await page.screenshot({ path: path.join(output, 'images', 'dowody.png') });
  await caption('Każda informacja ma pochodzenie.', 'Oddzielnie pokazujemy datę pobrania, obserwacji i potwierdzenia. Import nie jest kontrolą w terenie.', 12);
  await position(page.getByText('Etap 3, w odległości 250 m od startu', { exact: true }));
  await caption('Brak danych też jest informacją.', 'Niewiadoma nie oznacza ani obecności, ani braku udogodnienia. Nie dopowiadamy faktów.', 11);
  await page.getByRole('button', { name: 'Wymagaj potwierdzenia w terenie w ciągu 180 dni' }).click();
  await page.getByRole('button', { name: 'Oblicz trasy', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Brak trasy spełniającej' }).waitFor();
  await position(page.getByRole('button', { name: 'Oblicz trasy', exact: true }));
  await page.locator('#demo-caption').evaluate((element) => element.remove());
  await page.screenshot({ path: path.join(output, 'images', 'brak-trasy.png') });
  await caption('Twarde wymagania pozostają twarde.', 'Deklaracja źródła nie jest potwierdzeniem terenowym. Brak pasującej trasy zachowuje ustawienia.', 12);
  await restore(); await calculate();
  await position(page.getByRole('heading', { name: 'Odsłuch planu', exact: true }));
  await caption('Plan dostępny w tekście i przez moduł odsłuchu.', 'Odczyt na żądanie, zatrzymanie i powtórzenie. Brak polskiego głosu pozostawia pełny tekst.', 11);
  await page.getByRole('button', { name: 'Pokaż tekst odsłuchu', exact: true }).click();
  await position(page.getByText('Tekst wybranego odsłuchu', { exact: true }));
  await caption('Tekst pozostaje podstawą.', 'Nagranie pokazuje aplikację web. Nie jest testem dźwięku ani czytnika na telefonie.', 10);
  await page.setContent('<body style="margin:0;background:#092f32;color:#faf9ef;font:28px/1.5 Segoe UI,sans-serif;display:grid;place-content:center;height:100vh;padding:0 100px;box-sizing:border-box"><div style="color:#c7ee9b;font-size:20px;letter-spacing:3px">CO DALEJ</div><h1 style="font-size:55px;line-height:1.15;margin:20px 0">Realny obszar.<br>Audyt danych.<br>Testy z użytkownikami.</h1><p>Dziś: obliczenia, wyjaśnienia i widoczne niewiadome.<br>Bez prowadzenia terenowego. Bez deklaracji bezpieczeństwa.</p></body>');
  await page.waitForTimeout(12000);
  if (errors.length) throw new Error('Browser errors: ' + errors.join('; '));
  const video = page.video(); await context.close();
  await video.saveAs(path.join(output, 'work', 'demo-raw.webm'));
  await writeFile(path.join(output, 'work', 'chapters.json'), JSON.stringify(chapters, null, 2));
  console.log(JSON.stringify({ capturedSeconds: (Date.now() - started) / 1000, chapters: chapters.length, browserErrors: errors.length }));
} finally { await browser.close(); }
