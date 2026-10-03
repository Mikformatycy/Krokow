/* global document */
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../../../deliverables/', import.meta.url));
await mkdir(path.join(root, 'work', 'slides'), { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(new URL('../../../deliverables/prezentacja.html', import.meta.url).href);
  await page.evaluate(() => document.fonts.ready);
  const badImages = await page.locator('img').evaluateAll((images) => images.filter((image) => !image.complete || image.naturalWidth === 0).length);
  if (badImages) throw new Error('Missing slide images');
  const slides = page.locator('.slide');
  if (await slides.count() !== 8) throw new Error('Expected eight slides');
  const layout = [];
  for (let i = 0; i < 8; i++) {
    const slide = slides.nth(i);
    layout.push(await slide.evaluate((element) => ({ width: element.scrollWidth, height: element.scrollHeight })));
    await slide.screenshot({ path: path.join(root, 'work', 'slides', `slide-${i + 1}.png`) });
  }
  if (layout.some((item) => item.width > 1280 || item.height > 720)) throw new Error('Slide overflow');
  await page.pdf({ path: path.join(root, 'Krok-po-kroku-prezentacja.pdf'), printBackground: true, preferCSSPageSize: true, tagged: true });
  await writeFile(path.join(root, 'work', 'slides-layout.json'), JSON.stringify(layout, null, 2));
  console.log('Exported 8 slides to PDF');
} finally { await browser.close(); }
