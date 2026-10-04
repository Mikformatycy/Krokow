import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { UtcSchema } from '@krok/contracts';
import { record } from './city-catalog';
import { extractHighways } from './map-extract';
import { buildPilotGraph, type PilotPlace } from './pilot-graph';
import { KRAKOW_PLACES, withEntranceAddresses } from './krakow';
import { sha256 } from './osm';

export const PROTOTYPE_BBOX = [50.0523, 19.9253, 50.0747, 19.9547] as const;
// Every point is an existing node of the named pedestrian way. No geometric snapping.
export const PROTOTYPE_PATH_POINTS = [
  { nodeId: 14121238341, wayId: 304542178 }, // Rynek Główny
  { nodeId: 6128078603, wayId: 1013618099 }, // Floriańska
  { nodeId: 2519190127, wayId: 244622821 }, // Mały Rynek
  { nodeId: 2996091179, wayId: 200770367 }, // Plac Mariacki
  { nodeId: 2110897859, wayId: 1527224198 }, // Szewska
  { nodeId: 11105838712, wayId: 23257334 }, // Stolarska
  { nodeId: 30375913, wayId: 23700115 }, // Grodzka (north)
  { nodeId: 272798894, wayId: 25117880 }, // Pijarska
  { nodeId: 14121238315, wayId: 25122843 }, // Sienna
  { nodeId: 2475475475, wayId: 239778952 }, // Pasaż Bielaka
  { nodeId: 278057644, wayId: 114713971 }, // Bulwar Czerwieński
  { nodeId: 279117089, wayId: 1173073673 }, // Bulwar Rodła
  { nodeId: 1517013550, wayId: 234876445 }, // Kanonicza
  { nodeId: 2466762398, wayId: 23700116 }, // Senacka
  { nodeId: 30375927, wayId: 244620139 }, // Grodzka (south)
] as const;
export const PROTOTYPE_ENTRANCES = [
  752177530, 3084757842, 6944785490, 12923496910, // Rajska / Garncarska / Karmelicka / Studencka
  11983033100, 6987139391, 6307183196, // Garbarska / bazylika Karmelicka / Herbewo
  8930701234, 2503121600, 10043663678, // bazylika Stolarska / Stolarska 9 / Baszta Pasamoników
] as const;

const clean = (value: unknown): string | undefined => typeof value === 'string'
  ? value.replace(/\p{Cc}/gu, ' ').trim().slice(0, 350) || undefined : undefined;

/** Fail closed if an audited node/parent relation changed. Never substitute a nearby point. */
export function prototypePlaces(raw: Uint8Array): PilotPlace[] {
  const document = record(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(raw)) as unknown);
  if (!Array.isArray(document.elements)) throw new Error('Invalid prototype archive');
  const elements = document.elements.map(record);
  const ways = new Map(elements.filter(e => e.type === 'way').map(e => [e.id, e]));
  const nodes = new Map(elements.filter(e => e.type === 'node').map(e => [e.id, e]));
  const points: PilotPlace[] = PROTOTYPE_PATH_POINTS.map(({ nodeId, wayId }) => {
    const way = ways.get(wayId); const tags = record(way?.tags ?? {});
    const name = clean(tags.name);
    if (!way || !name || !Array.isArray(way.nodes) || !way.nodes.includes(nodeId)
      || !['footway', 'path', 'pedestrian'].includes(String(tags.highway)) || tags.area === 'yes') {
      throw new Error('Unproven named pedestrian point');
    }
    const suffix = nodeId === 30375913 ? 'punkt przy Rynku' : nodeId === 30375927 ? 'punkt przy Senackiej' : 'punkt na ciągu pieszym';
    return { nodeId, name: `${name} — ${suffix}`, kind: 'poi',
      description: `Punkt OSM node/${nodeId} na nazwanym ciągu pieszym way/${wayId}. Trasa kończy się w tym punkcie, nie przy wejściu do budynku. Podgląd danych OSM.` };
  });
  const entrances: PilotPlace[] = PROTOTYPE_ENTRANCES.map(nodeId => {
    const node = nodes.get(nodeId); const tags = record(node?.tags ?? {});
    if (!node || !['yes', 'main'].includes(String(tags.entrance))) throw new Error('Unproven public entrance');
    const parents = [...ways.values()].filter(way => record(way.tags ?? {}).building && Array.isArray(way.nodes) && way.nodes.includes(nodeId));
    const names = [...new Set(parents.map(way => {
      const parent = record(way.tags ?? {});
      return clean(parent.name) ?? (clean(parent['addr:street']) && clean(parent['addr:housenumber'])
        ? `${clean(parent['addr:street'])} ${clean(parent['addr:housenumber'])}` : undefined);
    }).filter((name): name is string => name !== undefined))];
    if (names.length !== 1) throw new Error('Ambiguous entrance building');
    return { nodeId, name: `${names[0]} — wejście`, kind: 'entrance',
      description: `Wejście OSM node/${nodeId}, należące do obrysu budynku. Koniec trasy przy wejściu; nie potwierdzono dostępności ani godzin otwarcia w terenie.` };
  });
  return withEntranceAddresses(raw, [...points.slice(0, 10), ...KRAKOW_PLACES, ...points.slice(10), ...entrances]);
}

export async function loadKrakowPrototype() {
  const capture = record(JSON.parse(await readFile(new URL('../data/krakow-prototype/capture.json', import.meta.url), 'utf8')) as unknown);
  const raw = gunzipSync(await readFile(new URL('../data/krakow-prototype/raw-map.json.gz', import.meta.url)), { maxOutputLength: 32 * 1024 * 1024 });
  if (sha256(raw) !== capture.rawSha256 || raw.length !== capture.rawBytes) throw new Error('Prototype archive checksum mismatch');
  return buildPilotGraph({ ...extractHighways(raw), fetchedAt: UtcSchema.parse(capture.fetchedAt), bbox: PROTOTYPE_BBOX,
    coverageName: 'Kraków — wybrane ciągi piesze w centrum', places: prototypePlaces(raw) });
}
