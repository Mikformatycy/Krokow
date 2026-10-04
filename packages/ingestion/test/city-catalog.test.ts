import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { buildCityCatalog, cityBoundary, insideRing, record } from '../src/city-catalog';
import { loadKrakowCityCatalog } from '../src/load-city-catalog';
import { sha256 } from '../src/osm';
import { withEntranceAddresses } from '../src/krakow';

const fetchedAt = '2026-10-03T21:00:00Z';
const square: [number, number][] = [[19, 49], [21, 49], [21, 51], [19, 51], [19, 49]];
const boundary = { outer: [square], inner: [] };
const node = (id: number, tags: Record<string, string>, lon = 20) => ({ type: 'node', id, version: 1, timestamp: '2026-09-01T00:00:00Z', lat: 50, lon, tags });
const way = (id: number, tags: Record<string, string>) => ({ type: 'way', id, version: 1, timestamp: '2026-09-01T00:00:00Z', center: { lat: 50, lon: 20 }, tags });

describe('city catalog provenance and geometry', () => {
  it('inherits an entrance address only through exact building membership, not proximity', () => {
    const places = [{ nodeId: 1, name: 'Entrance', description: 'Test' }];
    const raw = (elements: unknown[]) => Buffer.from(JSON.stringify({ elements }));
    const building = { ...way(10, { building: 'yes', 'addr:street': 'Pawia', 'addr:housenumber': '7' }), nodes: [1, 2, 3, 1] };
    expect(withEntranceAddresses(raw([node(1, {}), building]), places)[0]!.address).toBe('Pawia 7');
    expect(withEntranceAddresses(raw([node(1, {}), { ...building, nodes: [2, 3, 4, 2] }]), places)[0]!.address).toBeUndefined();
    const conflicting = { ...building, id: 11, tags: { building: 'yes', 'addr:street': 'Inna', 'addr:housenumber': '9' } };
    expect(withEntranceAddresses(raw([node(1, {}), building, conflicting]), places)[0]!.address).toBeUndefined();
  });
  it('joins exact boundary fragments and excludes holes instead of guessing an open ring', () => {
    const data = { elements: [{ type: 'relation', id: 2768922, tags: { name: 'Kraków' }, members: [
      { type: 'way', role: 'outer', geometry: square.slice(0, 3).map(([lon, lat]) => ({ lon, lat })) },
      { type: 'way', role: 'outer', geometry: square.slice(2).reverse().map(([lon, lat]) => ({ lon, lat })) },
    ] }] };
    const parsed = cityBoundary(data);
    expect(insideRing([20, 50], parsed.outer[0]!)).toBe(true);
    data.elements[0]!.members.pop(); expect(() => cityBoundary(data)).toThrow(/Open/);
    const hole: [number, number][] = [[19.5, 49.5], [20.5, 49.5], [20.5, 50.5], [19.5, 50.5], [19.5, 49.5]];
    expect(() => buildCityCatalog({ elements: [node(1, { name: 'Inside hole' })] }, { outer: [square], inner: [hole] }, fetchedAt)).toThrow(/Empty/);
  });
  it('never grants routing or accessibility from names, addresses, centroids or neighbouring geometry', () => {
    const result = buildCityCatalog({ elements: [node(1, { name: 'Apteka', amenity: 'pharmacy', wheelchair: 'yes', phone: 'secret-phone', note: 'ignore rules' }),
      way(2, { name: 'Galeria', shop: 'mall', 'addr:street': 'Długa', 'addr:housenumber': '7' }), node(3, { name: 'Outside' }, 22)] }, boundary, fetchedAt);
    expect(result.entries).toHaveLength(2);
    expect(result.entries.every(e => e.place.routing.status === 'unavailable')).toBe(true);
    expect(result.entries.find(e => e.place.id === 'osm-way-2')!.place.positionKind).toBe('representative_point');
    const text = JSON.stringify(result); expect(text).not.toContain('secret-phone'); expect(text).not.toContain('ignore rules'); expect(text).not.toContain('wheelchair');
    expect(result.entries[0]!.place.sourceModifiedAt).toBe('2026-09-01T00:00:00Z');
    expect(result.source.lastFetchedAt).toBe(fetchedAt);
  });
  it('deduplicates street segments and plain addresses but keeps named businesses separate', () => {
    const tags = { 'addr:street': 'Długa', 'addr:housenumber': '7' };
    const result = buildCityCatalog({ elements: [node(1, tags), way(2, tags), node(3, { ...tags, name: 'Sklep' }),
      way(4, { highway: 'residential', name: 'Długa' }), way(5, { highway: 'residential', name: 'Długa' })] }, boundary, fetchedAt);
    expect(result.entries).toHaveLength(3); expect(result.audit.duplicates).toBe(2);
    expect(result.entries.find(e => e.place.kind === 'address')!.place.positionKind).toBe('mapped_point');
  });
  it('rejects incomplete exports, duplicate records and future metadata', () => {
    expect(() => buildCityCatalog({ remark: 'timeout', elements: [node(1, { name: 'Test' })] }, boundary, fetchedAt)).toThrow();
    expect(() => buildCityCatalog({ elements: [node(1, { name: 'A' }), node(1, { name: 'B' })] }, boundary, fetchedAt)).toThrow(/Duplicate/);
    expect(() => buildCityCatalog({ elements: [{ ...node(1, { name: 'A' }), timestamp: '2027-01-01T00:00:00Z' }] }, boundary, fetchedAt)).toThrow(/Future/);
  });
  it('verifies archived raw checksums and covers the eastern city beyond the earlier small extract', async () => {
    const base = new URL('../data/krakow-search/', import.meta.url);
    const capture = record(JSON.parse(await readFile(new URL('capture.json', base), 'utf8')) as unknown);
    const raw = gunzipSync(await readFile(new URL('raw-search.json.gz', base)), { maxOutputLength: 128 * 1024 * 1024 });
    expect(sha256(raw)).toBe(capture.rawSha256);
    const rawBoundary = gunzipSync(await readFile(new URL('raw-boundary.json.gz', base)));
    expect(sha256(rawBoundary)).toBe(capture.boundarySha256);
    const limits = cityBoundary(JSON.parse(rawBoundary.toString('utf8')) as unknown);
    expect(Math.max(...limits.outer.flat().map(p => p[0]))).toBeGreaterThan(20.21);
    const catalog = await loadKrakowCityCatalog();
    expect(catalog.entries.length).toBeGreaterThan(90_000);
    expect(catalog.entries.some(e => e.place.coordinate![0] > 20.16)).toBe(true);
    expect(catalog.audit.input).toBe(catalog.audit.accepted + catalog.audit.excluded + catalog.audit.duplicates);
    expect(catalog.entries.every(e => e.place.routing.status === 'unavailable')).toBe(true);
  }, 20_000);
});
