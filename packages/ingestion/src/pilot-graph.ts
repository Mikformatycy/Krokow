import type { BooleanFact, CrossingEvent } from '@krok/contracts';
import { resolveEvidence, validateSnapshot, type Edge, type GraphNode, type Place, type Snapshot } from '@krok/routing';
import { normalize } from './normalize';
import { contentId, sha256, validateBbox, type Bbox, type OsmElement } from './osm';

type Node = Extract<OsmElement, { type: 'node' }>;
type Way = Extract<OsmElement, { type: 'way' }>;
type Tags = Record<string, string>;
const unknown = (): BooleanFact => ({ state: 'unknown', reason: 'missing', evidenceIds: [] });
const walkingTypes = new Set(['footway', 'path', 'pedestrian']);
const motorTypes = new Set(['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'residential', 'service', 'living_street', 'unclassified', 'primary_link', 'secondary_link', 'tertiary_link']);
export interface PilotPlace { nodeId: number; name: string; description: string; address?: string; kind?: 'entrance' | 'poi' }
export interface GraphAudit { rejected: { wayId: number; reason: string }[]; nodes: number; directedEdges: number; crossings: number; components: number[] }
const graphId = (id: number) => `osm:node/${id}`;
function blocked(tags: Tags): boolean {
  if (Object.keys(tags).some(k => /^(foot|access|oneway)(:.*)?:conditional$/.test(k))) return true;
  if (tags.foot !== undefined && !['yes', 'designated', 'permissive'].includes(tags.foot)) return true;
  if (tags.foot === undefined && tags.access !== undefined && !['yes', 'designated', 'permissive'].includes(tags.access)) return true;
  return ['construction', 'disused', 'abandoned', 'proposed'].some(k => tags[k] !== undefined && tags[k] !== 'no') || tags.entrance === 'emergency' || tags.entrance === 'exit';
}
function nonGround(tags: Tags): boolean {
  return ['level', 'layer'].some(k => tags[k] !== undefined && tags[k] !== '0') || ['bridge', 'tunnel', 'indoor'].some(k => tags[k] !== undefined && tags[k] !== 'no');
}
export function distanceM(a: [number, number], b: [number, number]): number {
  const rad = Math.PI / 180;
  const sinLat = Math.sin((b[1] - a[1]) * rad / 2); const sinLon = Math.sin((b[0] - a[0]) * rad / 2);
  const h = sinLat ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * sinLon ** 2;
  return 6371008.8 * 2 * Math.atan2(Math.sqrt(Math.min(1, h)), Math.sqrt(Math.max(0, 1 - h)));
}

/** Only shared OSM node IDs join paths; no nearest-neighbour or road-centreline edges. */
export function buildPilotGraph(input: { elements: OsmElement[]; fetchedAt: string; bbox: Bbox; places: PilotPlace[]; coverageName?: string; restrictedWays?: ReadonlySet<number>; barrierNodes?: ReadonlySet<number>; railNodes?: ReadonlySet<number> }) {
  validateBbox(input.bbox);
  const normalized = normalize(input.elements, input.fetchedAt);
  const evidenceByObject = new Map<string, typeof normalized.evidence>();
  for (const evidence of normalized.evidence) {
    const list = evidenceByObject.get(evidence.objectId) ?? [];
    list.push(evidence); evidenceByObject.set(evidence.objectId, list);
  }
  const nodes = new Map(input.elements.filter((e): e is Node => e.type === 'node').map(e => [e.id, e]));
  const ways = input.elements.filter((e): e is Way => e.type === 'way');
  const roads = new Set(ways.filter(w => motorTypes.has(w.tags.highway ?? '') && !nonGround(w.tags)).flatMap(w => w.nodes));
  const [south, west, north, east] = input.bbox;
  const inside = (n: Node) => n.lat >= south && n.lat <= north && n.lon >= west && n.lon <= east;
  const passableNode = (n: Node) => inside(n) && !blocked(n.tags) && !nonGround(n.tags)
    && (!n.tags.barrier || ['no', 'kerb'].includes(n.tags.barrier)) && !n.tags.railway
    && !input.railNodes?.has(n.id)
    && (!input.barrierNodes?.has(n.id) || ['yes', 'main'].includes(n.tags.entrance ?? ''));
  const candidates: Way[] = [];
  const audit: GraphAudit = { rejected: [], nodes: 0, directedEdges: 0, crossings: 0, components: [] };
  for (const way of ways) {
    let reason: string | undefined;
    if (!walkingTypes.has(way.tags.highway ?? '')) reason = 'not_supported_pedestrian_way';
    else if (way.tags.area === 'yes') reason = 'area_not_linear_path';
    else if (blocked(way.tags) || input.restrictedWays?.has(way.id)) reason = 'restricted_access';
    else if (nonGround(way.tags)) reason = 'vertical_or_indoor_topology_unreviewed';
    else if (way.tags['oneway:foot'] !== undefined && !['yes', 'no', '-1'].includes(way.tags['oneway:foot'])) reason = 'unsupported_pedestrian_direction';
    else if (way.nodes.some(id => !nodes.has(id))) throw new Error('Missing topology node');
    if (reason) audit.rejected.push({ wayId: way.id, reason }); else candidates.push(way);
  }
  const memberships = new Map<number, number>();
  for (const way of candidates) for (const id of new Set(way.nodes)) memberships.set(id, (memberships.get(id) ?? 0) + 1);
  const catalogNodes = new Set(input.places.map(p => p.nodeId));
  const graphNodes = new Map<string, GraphNode>();
  const edges: Edge[] = [];
  const coordinate = (id: number): [number, number] => { const n = nodes.get(id)!; return [n.lon, n.lat]; };
  const addSegment = (way: Way, ids: number[], startM: number, endM: number, crossing: boolean) => {
    const first = ids[0]!; const last = ids.at(-1)!;
    if (first === last || endM - startM < 0.01) return;
    const physicalId = `osm:way/${way.id}`; const objectId = physicalId;
    const name = way.tags.name?.slice(0, 450) ?? (crossing ? 'Przejście przez jezdnię' : 'Ciąg pieszy');
    for (const id of [first, last]) graphNodes.set(graphId(id), { id: graphId(id), level: 0, coordinate: coordinate(id) });
    const lengthM = endM - startM;
    const candidates = (evidenceByObject.get(objectId) ?? []).map(e => ({ evidence: e, publication: 'published' as const }));
    const resolve = <K extends 'audible_signal' | 'tactile_paving'>(featureKey: K) => resolveEvidence({ objectId, featureKey,
      scope: { side: null, direction: null, level: way.tags.level === '0' ? 0 : null }, candidates, sources: [normalized.source],
      policy: { id: 'osm-pilot-1', infrastructureMaxAgeDays: 365, temporaryObservationMaxAgeHours: 24 } }, () => input.fetchedAt).fact;
    const event = (direction: string): CrossingEvent[] => crossing ? [{ id: `${physicalId}:crossing:${direction}`, kind: 'crossing', offsetM: 0,
      objectId, crossingId: physicalId, stageId: `${physicalId}:stage`, instructionKey: 'route.crossing_approach',
      facts: { audible_signal: resolve('audible_signal'), tactile_paving: resolve('tactile_paving') } }] : [];
    const common = { objectId, name, lengthM, kind: crossing ? 'crossing' as const : 'walk' as const,
      access: 'allowed' as const, closed: false, steps: unknown(), separatedFootway: unknown() };
    const geometry = ids.map(coordinate);
    const suffix = `${first}-${last}`;
    if (way.tags['oneway:foot'] !== '-1') edges.push({ ...common, id: `${physicalId}:${suffix}:f`, from: graphId(first), to: graphId(last),
      physical: { id: physicalId, startM, endM }, geometry, events: event('f') });
    if (way.tags['oneway:foot'] !== 'yes') edges.push({ ...common, id: `${physicalId}:${suffix}:b`, from: graphId(last), to: graphId(first),
      physical: { id: physicalId, startM: endM, endM: startM }, geometry: [...geometry].reverse(), events: event('b') });
    if (crossing) audit.crossings++;
  };
  for (const way of candidates) {
    const lengths = [0];
    for (let i = 1; i < way.nodes.length; i++) lengths.push(lengths[i - 1]! + distanceM(coordinate(way.nodes[i - 1]!), coordinate(way.nodes[i]!)));
    if (way.tags.footway === 'crossing') {
      const interior = way.nodes.slice(1, -1);
      // One explicit carriageway traversal; complex islands/trams/branches stay excluded.
      const roadNodes = interior.filter(id => roads.has(id));
      if (way.nodes.some(id => !passableNode(nodes.get(id)!)) || roads.has(way.nodes[0]!) || roads.has(way.nodes.at(-1)!)
        || roadNodes.length !== 1
        || interior.some(id => (memberships.get(id) ?? 0) > 1 || catalogNodes.has(id))) {
        audit.rejected.push({ wayId: way.id, reason: 'crossing_topology_requires_review' }); continue;
      }
      addSegment(way, way.nodes, 0, lengths.at(-1)!, true); continue;
    }
    let start = 0;
    for (let i = 1; i < way.nodes.length; i++) {
      const previous = nodes.get(way.nodes[i - 1]!)!; const current = nodes.get(way.nodes[i]!)!;
      if (!passableNode(previous) || !passableNode(current) || roads.has(previous.id) || roads.has(current.id)) { start = i; continue; }
      const next = nodes.get(way.nodes[i + 1] ?? -1);
      if (i === way.nodes.length - 1 || (memberships.get(current.id) ?? 0) > 1 || catalogNodes.has(current.id)
        || !next || !passableNode(next) || roads.has(next.id)) {
        addSegment(way, way.nodes.slice(start, i + 1), lengths[start]!, lengths[i]!, false); start = i;
      }
    }
  }
  const places: Place[] = input.places.map(p => {
    const node = graphNodes.get(graphId(p.nodeId));
    if (!node?.coordinate) throw new Error(`Catalog point has no proven walking connection: ${p.nodeId}`);
    return { id: `osm-place-${p.nodeId}`, nodeId: node.id, name: p.name, description: p.description, coordinate: node.coordinate,
      ...(p.address ? { address: p.address } : {}), ...(p.kind ? { kind: p.kind } : {}) };
  });
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) { adjacency.set(edge.from, [...adjacency.get(edge.from) ?? [], edge.to]); adjacency.set(edge.to, [...adjacency.get(edge.to) ?? [], edge.from]); }
  const visited = new Set<string>();
  for (const node of graphNodes.keys()) {
    if (visited.has(node)) continue;
    const queue = [node]; visited.add(node);
    for (let i = 0; i < queue.length; i++) for (const next of adjacency.get(queue[i]!) ?? []) if (!visited.has(next)) { visited.add(next); queue.push(next); }
    audit.components.push(queue.length);
  }
  audit.components.sort((a, b) => b - a); audit.nodes = graphNodes.size; audit.directedEdges = edges.length;
  const version = contentId(input.elements, input.bbox).slice(0, 24);
  const graphVersion = sha256(JSON.stringify({ nodes: [...graphNodes.values()], edges, places, bbox: input.bbox })).slice(0, 24);
  const snapshot: Snapshot = { mode: 'pilot', cityId: 'krakow-stare-miasto-pilot',
    graphVersion: `osm-walk-v1-${graphVersion}`, evidenceVersion: `osm-evidence-v1-${version}`, snapshotFetchedAt: input.fetchedAt,
    coverage: { name: input.coverageName ?? 'Kraków — okolice Galerii Krakowskiej',
      description: 'Prawdziwe dane OpenStreetMap. Wybrane połączenia piesze i punkty katalogu; niepełne dane o udogodnieniach. Podgląd planu, bez prowadzenia terenowego.',
      polygon: { type: 'Polygon', coordinates: [[[west, south], [east, south], [east, north], [west, north], [west, south]]] } },
    graph: { nodes: [...graphNodes.values()], edges }, places, sources: [normalized.source], evidence: normalized.evidence };
  validateSnapshot(snapshot);
  return { snapshot, audit, coverage: normalized.coverage };
}
