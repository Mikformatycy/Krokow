import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { IdSchema, PlaceSearchItemSchema, PublicSourceSchema, TextSchema, UtcSchema } from '@krok/contracts';
import { record, type CityCatalog } from './city-catalog';
import { sha256 } from './osm';

export async function loadKrakowCityCatalog(): Promise<CityCatalog> {
  const capture = record(JSON.parse(await readFile(new URL('../data/krakow-search/capture.json', import.meta.url), 'utf8')) as unknown);
  const compressed = await readFile(new URL('../data/krakow-search/catalog.json.gz', import.meta.url));
  const raw = gunzipSync(compressed, { maxOutputLength: 96 * 1024 * 1024 });
  if (sha256(raw) !== capture.catalogSha256) throw new Error('City catalog checksum mismatch');
  const value = record(JSON.parse(raw.toString('utf8')) as unknown);
  if (value.cityId !== 'krakow' || value.areaName !== 'Kraków' || !Array.isArray(value.entries) || !value.entries.length || value.entries.length > 200_000) throw new Error('Invalid city catalog');
  const source = PublicSourceSchema.parse(value.source);
  const fetchedAt = UtcSchema.parse(value.fetchedAt);
  if (fetchedAt !== capture.fetchedAt || source.lastFetchedAt !== fetchedAt || source.kind !== 'osm') throw new Error('Invalid catalog provenance');
  const entries = value.entries.map((entry: unknown) => {
    const item = record(entry);
    const place = PlaceSearchItemSchema.parse(item.place);
    if (place.coordinate === null || place.sourceId !== source.id || place.routing.status !== 'unavailable'
      || !Array.isArray(item.aliases) || item.aliases.length > 30) throw new Error('Invalid city entry');
    return { place, aliases: item.aliases.map(alias => TextSchema.parse(alias)) };
  });
  if (new Set(entries.map(e => e.place.id)).size !== entries.length) throw new Error('Duplicate city entry');
  const audit = record(value.audit);
  const count = (key: string) => { const n = audit[key]; if (typeof n !== 'number' || !Number.isSafeInteger(n) || n < 0) throw new Error('Invalid catalog audit'); return n; };
  return { cityId: 'krakow', areaName: 'Kraków', version: IdSchema.parse(value.version), fetchedAt, source, entries,
    audit: { input: count('input'), accepted: count('accepted'), excluded: count('excluded'), duplicates: count('duplicates') } };
}
