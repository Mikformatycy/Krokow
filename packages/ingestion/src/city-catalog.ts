import { CoordinateSchema, PlaceSearchItemSchema, PublicSourceSchema, UtcSchema } from '@krok/contracts';
import type { PlaceSearchItem, PublicSource } from '@krok/contracts';
import { sha256 } from './osm';

export interface SearchEntry { place: PlaceSearchItem; aliases: string[] }
export interface CityCatalog {
  cityId: string; areaName: string; fetchedAt: string; version: string;
  source: PublicSource; entries: SearchEntry[];
  audit: { input: number; accepted: number; excluded: number; duplicates: number };
}
type Point = [number, number];
type ObjectValue = Record<string, unknown>;
export function record(value: unknown): ObjectValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid city export object');
  return value as ObjectValue;
}
function elements(value: unknown): unknown[] {
  const root = record(value);
  if ('remark' in root || 'error' in root || !Array.isArray(root.elements) || !root.elements.length || root.elements.length > 300_000) throw new Error('Incomplete city export');
  return root.elements;
}
function positive(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) throw new Error('Invalid OSM ID/version');
  return value;
}
function same(a: Point, b: Point): boolean { return a[0] === b[0] && a[1] === b[1]; }

/** Only exact shared boundary endpoints join fragments. No repair by proximity. */
export function cityBoundary(value: unknown): { outer: Point[][]; inner: Point[][] } {
  const city = elements(value).map(record).find(e => e.type === 'relation' && e.id === 2768922);
  if (!city || record(city.tags).name !== 'Kraków' || !Array.isArray(city.members)) throw new Error('Missing Krakow boundary');
  const result: { outer: Point[][]; inner: Point[][] } = { outer: [], inner: [] };
  for (const role of ['outer', 'inner'] as const) {
    const fragments = city.members.map(record).filter(m => m.role === role).map(m => {
      if (m.type !== 'way' || !Array.isArray(m.geometry) || m.geometry.length < 2) throw new Error('Incomplete boundary geometry');
      return m.geometry.map(record).map(p => CoordinateSchema.parse([p.lon, p.lat]));
    });
    while (fragments.length) {
      const ring = fragments.shift()!;
      while (!same(ring[0]!, ring.at(-1)!)) {
        const tail = ring.at(-1)!;
        const index = fragments.findIndex(f => same(f[0]!, tail) || same(f.at(-1)!, tail));
        if (index < 0) throw new Error('Open city boundary');
        const next = fragments.splice(index, 1)[0]!;
        if (!same(next[0]!, tail)) next.reverse();
        ring.push(...next.slice(1));
      }
      if (ring.length < 4) throw new Error('Degenerate boundary');
      result[role].push(ring);
    }
  }
  if (!result.outer.length) throw new Error('Missing outer boundary');
  return result;
}
export function insideRing(point: Point, ring: readonly Point[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i]!; const b = ring[j]!;
    if ((a[1] > point[1]) !== (b[1] > point[1]) && point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}
function clean(value: unknown): string {
  // Public labels only. Never ingest contact details, notes, usernames or executable markup.
  return typeof value === 'string' ? value.replace(/[\p{Cc}\p{Cf}]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 450) : '';
}
const categoryTerms: Record<string, string> = {
  pharmacy: 'apteka', hospital: 'szpital', clinic: 'przychodnia', doctors: 'lekarz', dentist: 'dentysta',
  restaurant: 'restauracja', cafe: 'kawiarnia', supermarket: 'supermarket sklep spożywczy', convenience: 'sklep spożywczy',
  mall: 'galeria centrum handlowe', bank: 'bank', atm: 'bankomat', post_office: 'poczta', school: 'szkoła',
  university: 'uczelnia uniwersytet', library: 'biblioteka', museum: 'muzeum', hotel: 'hotel',
  bus_station: 'dworzec autobusowy', station: 'dworzec stacja kolejowa', park: 'park', cinema: 'kino', theatre: 'teatr',
};

/** City search is descriptive only. It cannot grant a graph binding or accessibility facts. */
export function buildCityCatalog(raw: unknown, boundary: ReturnType<typeof cityBoundary>, fetchedAt: string): CityCatalog {
  UtcSchema.parse(fetchedAt);
  const input = elements(raw);
  const source: PublicSource = PublicSourceSchema.parse({ id: 'osm-krakow-search', kind: 'osm', name: 'OpenStreetMap — katalog Krakowa',
    sourceUrl: 'https://www.openstreetmap.org/relation/2768922', attribution: '© OpenStreetMap contributors',
    license: 'ODbL 1.0', lastFetchedAt: fetchedAt, status: 'ok' });
  const candidates: SearchEntry[] = [];
  const ids = new Set<string>();
  for (const value of input) {
    const e = record(value);
    if (!['node', 'way', 'relation'].includes(String(e.type))) throw new Error('Unsupported OSM type');
    const sourceRecordId = `${String(e.type)}/${positive(e.id)}`;
    if (ids.has(sourceRecordId)) throw new Error('Duplicate OSM record');
    ids.add(sourceRecordId); positive(e.version);
    const modified = UtcSchema.parse(e.timestamp);
    if (Date.parse(modified) > Date.parse(fetchedAt)) throw new Error('Future OSM record');
    const tags = record(e.tags ?? {});
    if (tags.boundary || tags.route || tags.type === 'route' || tags.type === 'route_master'
      || ['proposed', 'construction', 'disused', 'abandoned'].some(k => tags[k] !== undefined && tags[k] !== 'no')) continue;
    const label = clean(tags['name:pl']) || clean(tags.name) || clean(tags.brand);
    const street = clean(tags['addr:street']) || clean(tags['addr:place']);
    const house = clean(tags['addr:housenumber']);
    const address = street && house ? `${street} ${house}`.slice(0, 450) : null;
    if (!label && !address) continue;
    if (e.type === 'relation' && !['multipolygon', 'site'].includes(String(tags.type))) continue;
    const point = e.type === 'node' ? e : record(e.center);
    const coordinate = CoordinateSchema.parse([point.lon, point.lat]);
    if (!boundary.outer.some(ring => insideRing(coordinate, ring)) || boundary.inner.some(ring => insideRing(coordinate, ring))) continue;
    const kind = tags.entrance ? 'entrance' : e.type === 'way' && tags.highway && !tags.building ? 'street' : !label ? 'address' : 'poi';
    const name = label || address!;
    const aliases = [...new Set([
      clean(tags.name), clean(tags['name:pl']), clean(tags['name:en']), clean(tags.alt_name), clean(tags.short_name),
      clean(tags.brand), address ?? '', clean(tags['addr:postcode']),
      ...['amenity', 'shop', 'tourism', 'railway', 'leisure'].map(key => categoryTerms[clean(tags[key])] ?? ''),
    ].flatMap(text => text.split(';')).map(text => text.trim()).filter(Boolean))];
    candidates.push({ place: PlaceSearchItemSchema.parse({ id: `osm-${String(e.type)}-${positive(e.id)}`, name, address, kind, coordinate,
      positionKind: e.type === 'node' ? 'mapped_point' : 'representative_point', sourceId: source.id, sourceRecordId, sourceModifiedAt: modified,
      routing: { status: 'unavailable', reason: 'unresolved' } }), aliases });
  }
  // One street suggestion instead of dozens of its OSM segments; one plain address
  // instead of a node + building duplicate. Named businesses remain separate.
  candidates.sort((a, b) => Number(a.place.positionKind !== 'mapped_point') - Number(b.place.positionKind !== 'mapped_point') || a.place.id.localeCompare(b.place.id, 'en'));
  const groups = new Set<string>();
  const entries = candidates.filter(({ place }) => {
    if (place.kind !== 'street' && place.kind !== 'address') return true;
    const key = `${place.kind}:${(place.kind === 'street' ? place.name : place.address)!.normalize('NFKC').toLocaleLowerCase('pl-PL')}`;
    if (groups.has(key)) return false;
    groups.add(key); return true;
  }).sort((a, b) => a.place.id.localeCompare(b.place.id, 'en'));
  if (!entries.length) throw new Error('Empty city catalog');
  return { cityId: 'krakow', areaName: 'Kraków', fetchedAt, version: `krakow-search-1-${sha256(JSON.stringify(entries)).slice(0, 24)}`,
    source, entries, audit: { input: input.length, accepted: entries.length, excluded: input.length - candidates.length, duplicates: candidates.length - entries.length } };
}
