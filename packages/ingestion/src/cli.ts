import { readFile, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { importOsm } from './store';
import { MAX_BYTES, PILOT_BBOX } from './osm';

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log('pnpm import:osm [--root DIR] [--file RAW_JSON --fetched-at UTC]\nSmall fixed Krakow bbox; local audit only. Default: LOCALAPPDATA/Krokow/osm or ~/.local/share/Krokow/osm.');
    return;
  }
  const flags = new Map<string, string>();
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]; const value = args[i + 1];
    if (!key || !['--root', '--file', '--fetched-at'].includes(key) || !value || value.startsWith('--') || flags.has(key)) throw new Error('Invalid CLI arguments; use --help');
    flags.set(key, value);
  }
  if (flags.has('--file') !== flags.has('--fetched-at')) throw new Error('--file requires original --fetched-at UTC');
  const root = resolve(flags.get('--root') ?? join(process.env.LOCALAPPDATA ?? join(homedir(), '.local', 'share'), 'Krokow', 'osm'));
  const path = flags.get('--file');
  let raw: { bytes: Uint8Array; fetchedAt: string } | undefined;
  if (path) {
    if ((await stat(path)).size > MAX_BYTES) throw new Error('Local raw file exceeds size limit');
    raw = { bytes: await readFile(path), fetchedAt: flags.get('--fetched-at')! };
  }
  const result = await importOsm({ root, bbox: PILOT_BBOX, clock: () => new Date().toISOString(), ...(raw ? { raw } : {}) });
  console.log(JSON.stringify({ ...result, root, fieldNavigationAllowed: false }, null, 2));
}
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'OSM import failed');
  process.exitCode = 1;
});
