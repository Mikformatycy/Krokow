import { parseOsm } from './osm';

/** One archived OSM map export, not a network fallback or a second wire contract. */
export function extractHighways(raw: Uint8Array) {
  if (raw.byteLength > 32 * 1024 * 1024) throw new Error('Archived map exceeds size limit');
  const input: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(raw));
  if (!input || typeof input !== 'object' || 'error' in input || 'remark' in input || !('elements' in input) || !Array.isArray(input.elements)) throw new Error('Invalid map export');
  const objects = input.elements.map((entry: unknown): { type: unknown; id?: unknown; nodes?: unknown; tags?: Record<string, unknown>; members?: { type?: unknown; ref?: unknown }[] } => {
    if (!entry || typeof entry !== 'object' || !('type' in entry)) throw new Error('Invalid map element');
    return entry;
  });
  const ways = objects.filter(e => e.type === 'way' && typeof e.tags?.highway === 'string');
  const references = new Set(ways.flatMap(e => Array.isArray(e.nodes) ? e.nodes as unknown[] : []));
  const nodes = objects.filter(e => e.type === 'node' && references.has(e.id));
  const restricted = new Set(objects.filter(e => e.type === 'relation' && (e.tags?.['restriction:foot'] !== undefined || e.tags?.type === 'restriction:foot'))
    .flatMap(e => Array.isArray(e.members) ? e.members.filter(m => m.type === 'way' && typeof m.ref === 'number').map(m => Number(m.ref)) : []));
  const barrierNodes = new Set(objects.filter(e => e.type === 'way' && e.tags?.barrier && e.tags.barrier !== 'no')
    .flatMap(e => Array.isArray(e.nodes) ? e.nodes.filter((n: unknown): n is number => typeof n === 'number') : []));
  const railTypes = new Set(['rail', 'tram', 'light_rail', 'subway', 'narrow_gauge', 'funicular', 'monorail', 'construction', 'disused']);
  const railNodes = new Set(objects.filter(e => e.type === 'way' && typeof e.tags?.railway === 'string' && railTypes.has(e.tags.railway))
    .flatMap(e => Array.isArray(e.nodes) ? e.nodes.filter((n: unknown): n is number => typeof n === 'number') : []));
  return { elements: parseOsm(Buffer.from(JSON.stringify({ elements: [...nodes, ...ways] }))), restrictedWays: restricted, barrierNodes, railNodes };
}
