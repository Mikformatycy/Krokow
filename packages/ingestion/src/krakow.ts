import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { extractHighways } from './map-extract';
import { buildPilotGraph, type PilotPlace } from './pilot-graph';
import { sha256 } from './osm';
import { KRAKOW_CAPTURE } from './krakow-capture';
import { record } from './city-catalog';

// Names are from OSM buildings sharing each entrance node, not nearby centroids.
export const KRAKOW_PLACES: PilotPlace[] = [
  { nodeId: 3719851597, name: 'Galeria Krakowska — wejście od Pawiej', description: 'Wejście na poziomie 0, węzeł OSM 3719851597, budynek 87527970. Trasa kończy się przy wejściu.' },
  { nodeId: 5213212813, name: 'High5ive, budynek 1 — wejście zachodnie', description: 'Wejście przy Pawiej 7, węzeł OSM 5213212813, budynek 522355527. Nie potwierdzono dostępności wejścia w terenie.' },
  { nodeId: 2443511648, name: 'Galeria Krakowska — wejście północno-zachodnie', description: 'Wejście na poziomie 0, węzeł OSM 2443511648, budynek 87527970. Trasa kończy się przy wejściu.' },
  { nodeId: 7157204495, name: 'Galeria Krakowska — drugie wejście północno-zachodnie', description: 'Wejście na poziomie 0, węzeł OSM 7157204495, budynek 87527970. Trasa kończy się przy wejściu.' },
  { nodeId: 5213212811, name: 'High5ive, budynek 1 — wejście wschodnie', description: 'Wejście przy Pawiej 7, węzeł OSM 5213212811, budynek 522355527. Nie potwierdzono dostępności wejścia w terenie.' },
];
export async function loadKrakowPilot() {
  const compressed = await readFile(new URL('../data/krakow/raw-map.json.gz', import.meta.url));
  const raw = gunzipSync(compressed, { maxOutputLength: 32 * 1024 * 1024 });
  if (sha256(raw) !== KRAKOW_CAPTURE.rawSha256) throw new Error('Archived OSM checksum mismatch');
  const { elements, restrictedWays, barrierNodes, railNodes } = extractHighways(raw);
  return buildPilotGraph({ elements, fetchedAt: KRAKOW_CAPTURE.fetchedAt,
    bbox: [50.0653, 19.9393, 50.0707, 19.9497], places: withEntranceAddresses(raw, KRAKOW_PLACES), restrictedWays, barrierNodes, railNodes });
}

/** Addresses come only from the entrance node or its exact parent building. */
export function withEntranceAddresses(raw: Uint8Array, places: PilotPlace[]): PilotPlace[] {
  const document = record(JSON.parse(new TextDecoder().decode(raw)) as unknown);
  if (!Array.isArray(document.elements)) throw new Error('Invalid entrance source');
  const records = document.elements.map(record);
  const address = (value: unknown) => {
    const tags = record(value ?? {});
    return typeof tags['addr:street'] === 'string' && typeof tags['addr:housenumber'] === 'string'
      ? `${tags['addr:street']} ${tags['addr:housenumber']}` : undefined;
  };
  return places.map(place => {
    const own = records.find(e => e.type === 'node' && e.id === place.nodeId);
    const direct = own ? address(own.tags) : undefined;
    const parents = records.filter(e => e.type === 'way' && record(e.tags ?? {}).building && Array.isArray(e.nodes) && e.nodes.includes(place.nodeId));
    const addresses = [...new Set(parents.map(e => address(e.tags)).filter((value): value is string => value !== undefined))];
    const known = direct ?? (addresses.length === 1 ? addresses[0] : undefined);
    return known ? { ...place, address: known } : { ...place };
  });
}
