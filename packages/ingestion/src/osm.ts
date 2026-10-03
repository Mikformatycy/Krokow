import { createHash } from 'node:crypto';
import { CoordinateSchema, UtcSchema } from '@krok/contracts';

export const ADAPTER_VERSION = 'osm-staging-1';
export const MAX_BYTES = 8 * 1024 * 1024;
export type Bbox = readonly [south: number, west: number, north: number, east: number];
export const PILOT_BBOX: Bbox = [50.065, 19.939, 50.071, 19.950];
interface OsmBase { id: number; version: number; timestamp: string; tags: Record<string, string> }
export type OsmElement = (OsmBase & { type: 'node'; lat: number; lon: number })
  | (OsmBase & { type: 'way'; nodes: number[] });

export function validateBbox(input: Bbox): Bbox {
  if (!Array.isArray(input) || input.length !== 4 || input.some(n => !Number.isFinite(n))) throw new Error('Invalid bbox');
  const [s, w, n, e] = input;
  CoordinateSchema.parse([w, s]); CoordinateSchema.parse([e, n]);
  // Small operator imports only; no antimeridian or bulk city extraction.
  if (s >= n || w >= e || n - s > 0.03 || e - w > 0.05) throw new Error('Bbox exceeds small import bounds');
  return input;
}
export function queryFor(bbox: Bbox): string {
  const box = validateBbox(bbox).join(',');
  return `[out:json][timeout:25][maxsize:16777216];(way["highway"](${box});node["highway"="crossing"](${box});node["entrance"](${box});node["public_transport"="platform"](${box}););(._;>;);out meta;`;
}
export function sha256(value: string | Uint8Array): string { return createHash('sha256').update(value).digest('hex'); }
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected OSM object');
  return value as Record<string, unknown>;
}
function positiveId(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) throw new Error('Invalid OSM integer');
  return value;
}
export function elementKey(element: Pick<OsmElement, 'type' | 'id'>): string { return `${element.type}/${element.id}`; }

/** External OSM boundary. Usernames/uid are kept only in raw bytes, never normalized. */
export function parseOsm(raw: Uint8Array): OsmElement[] {
  if (raw.byteLength > MAX_BYTES) throw new Error('OSM response exceeds size limit');
  const root = object(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(raw)) as unknown);
  if ('remark' in root) throw new Error('Overpass returned a partial/error response');
  if (!Array.isArray(root.elements) || root.elements.length === 0 || root.elements.length > 100_000) throw new Error('Invalid OSM element count');
  const seen = new Set<string>();
  const elements = root.elements.map((value: unknown): OsmElement => {
    const input = object(value);
    const tags = Object.fromEntries(Object.entries(object(input.tags ?? {})).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, tag]) => {
      if (typeof tag !== 'string' || key.length > 255 || tag.length > 4096) throw new Error('Invalid OSM tag');
      return [key, tag];
    }));
    const base = { id: positiveId(input.id), version: positiveId(input.version), timestamp: UtcSchema.parse(input.timestamp), tags };
    let element: OsmElement;
    if (input.type === 'node') {
      const [lon, lat] = CoordinateSchema.parse([input.lon, input.lat]);
      element = { ...base, type: 'node', lon, lat };
    } else if (input.type === 'way') {
      if (!Array.isArray(input.nodes) || input.nodes.length < 2) throw new Error('Way has no complete node sequence');
      element = { ...base, type: 'way', nodes: input.nodes.map(positiveId) };
    } else throw new Error('Unexpected OSM element type');
    const key = elementKey(element);
    if (seen.has(key)) throw new Error('Duplicate OSM element');
    seen.add(key);
    return element;
  });
  for (const element of elements) {
    if (element.type === 'way' && element.nodes.some(id => !seen.has(`node/${id}`))) throw new Error('Missing way node reference');
  }
  return elements.sort((a, b) => elementKey(a) < elementKey(b) ? -1 : elementKey(a) > elementKey(b) ? 1 : 0);
}

export function contentId(elements: readonly OsmElement[], bbox: Bbox): string {
  return sha256(JSON.stringify({ adapter: ADAPTER_VERSION, bbox: validateBbox(bbox), elements }));
}
