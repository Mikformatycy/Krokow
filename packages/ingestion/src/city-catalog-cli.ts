import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { buildCityCatalog, cityBoundary } from './city-catalog';
import { sha256 } from './osm';

const [rawPath, boundaryPath, outputPath, fetchedAt] = process.argv.slice(2);
if (!rawPath || !boundaryPath || !outputPath || !fetchedAt) throw new Error('Usage: tsx src/city-catalog-cli.ts raw.json boundary.json new-output-directory fetchedAt-UTC');
const raw = await readFile(rawPath); const boundary = await readFile(boundaryPath);
if (raw.length > 128 * 1024 * 1024 || boundary.length > 4 * 1024 * 1024) throw new Error('Export size limit');
const catalog = buildCityCatalog(JSON.parse(raw.toString('utf8')) as unknown, cityBoundary(JSON.parse(boundary.toString('utf8')) as unknown), fetchedAt);
const normalized = Buffer.from(JSON.stringify(catalog));
const directory = resolve(outputPath);
await mkdir(directory, { recursive: true });
// Operator output in a new directory. Runtime never downloads or replaces these files.
for (const [name, value] of [['raw-search.json.gz', raw], ['raw-boundary.json.gz', boundary], ['catalog.json.gz', normalized]] as const) {
  await writeFile(join(directory, name), gzipSync(value, { level: 9 }), { flag: 'wx' });
}
await writeFile(join(directory, 'capture.json'), JSON.stringify({ fetchedAt, endpoint: 'https://overpass-api.de/api/interpreter',
  query: '[out:json][timeout:60][maxsize:134217728];area["name"="Kraków"]["boundary"="administrative"]["admin_level"="8"]->.city; (nwr(area.city)["name"];nwr(area.city)["addr:housenumber"];);out meta center;',
  boundaryQuery: '[out:json][timeout:25];rel(2768922);out geom;',
  rawSha256: sha256(raw), boundarySha256: sha256(boundary), catalogSha256: sha256(normalized),
  rawBytes: raw.length, catalogBytes: normalized.length, version: catalog.version, audit: catalog.audit,
  license: 'ODbL 1.0', attribution: '© OpenStreetMap contributors',
}, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ version: catalog.version, ...catalog.audit }));
