import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { extractHighways } from './map-extract';
import { buildPilotGraph, type PilotPlace } from './pilot-graph';
import { sha256 } from './osm';
import { KRAKOW_CAPTURE } from './krakow-capture';

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
    bbox: [50.0653, 19.9393, 50.0707, 19.9497], places: KRAKOW_PLACES, restrictedWays, barrierNodes, railNodes });
}
