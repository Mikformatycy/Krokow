import { BooleanFactSchema, CrossingEventSchema, EvidenceSchema, IdSchema, PublicSourceSchema, UtcSchema } from '@krok/contracts';
import type { BooleanFact, Evidence, TactileFact } from '@krok/contracts';
import type { Edge, Snapshot } from './types';

export function validateSnapshot(snapshot: Snapshot): void {
  const nodes = new Map(snapshot.graph.nodes.map((n) => [n.id, n]));
  if (nodes.size !== snapshot.graph.nodes.length || nodes.size === 0) throw new Error('Invalid node IDs');
  for (const node of nodes.values()) {
    IdSchema.parse(node.id);
    if (!Number.isFinite(node.level)) throw new Error('Unknown node level');
  }
  const sources = new Map(snapshot.sources.map((s) => [s.id, PublicSourceSchema.parse(s)]));
  const evidence = new Map(snapshot.evidence.map((e) => [e.id, EvidenceSchema.parse(e)]));
  if (sources.size === 0 || sources.size !== snapshot.sources.length || evidence.size !== snapshot.evidence.length) throw new Error('Invalid catalog IDs');
  if ([...sources.values()].some((s) => s.kind !== 'synthetic')) throw new Error('B-02 accepts synthetic snapshots only');
  for (const e of evidence.values()) if (!sources.has(e.sourceId)) throw new Error('Missing evidence source');
  UtcSchema.parse(snapshot.snapshotFetchedAt);
  for (const id of [snapshot.cityId, snapshot.graphVersion, snapshot.evidenceVersion]) IdSchema.parse(id);
  const edges = new Set<string>(); const events = new Set<string>();
  const stageOwners = new Map<string, Edge[]>();
  for (const edge of snapshot.graph.edges) {
    IdSchema.parse(edge.id); IdSchema.parse(edge.objectId); IdSchema.parse(edge.physical.id);
    if (edges.has(edge.id)) throw new Error('Duplicate edge'); edges.add(edge.id);
    const from = nodes.get(edge.from); const to = nodes.get(edge.to);
    if (!from || !to || edge.from === edge.to) throw new Error('Invalid edge topology');
    if (from.level !== to.level && edge.kind !== 'steps' && edge.kind !== 'ramp') throw new Error('Unproven level connection');
    if (!['walk', 'crossing', 'steps', 'ramp'].includes(edge.kind) || !['allowed', 'denied', 'unknown'].includes(edge.access) || typeof edge.closed !== 'boolean') throw new Error('Invalid edge state');
    if (!Number.isFinite(edge.lengthM) || edge.lengthM <= 0 || !Number.isFinite(edge.physical.startM) || !Number.isFinite(edge.physical.endM)
      || Math.min(edge.physical.startM, edge.physical.endM) < 0 || Math.abs(Math.abs(edge.physical.endM - edge.physical.startM) - edge.lengthM) > 0.000001) throw new Error('Invalid physical edge length');
    checkFact(BooleanFactSchema.parse(edge.steps), edge.objectId, 'steps', evidence);
    checkFact(BooleanFactSchema.parse(edge.separatedFootway), edge.objectId, 'separated_footway', evidence);
    let last = -1;
    for (const input of edge.events) {
      const event = CrossingEventSchema.parse(input);
      if (events.has(event.id) || event.offsetM < last || event.offsetM > edge.lengthM) throw new Error('Duplicate or misplaced event');
      events.add(event.id); last = event.offsetM;
      const key = JSON.stringify([event.crossingId, event.stageId]);
      const owners = stageOwners.get(key) ?? [];
      const owner = owners[0];
      // The only second ownership allowed is the explicitly reversed traversal.
      if (owners.length >= 2 || (owner && !(owner.from === edge.to && owner.to === edge.from && owner.physical.id === edge.physical.id
        && owner.physical.startM === edge.physical.endM && owner.physical.endM === edge.physical.startM))) throw new Error('Crossing stage assigned more than once');
      stageOwners.set(key, [...owners, edge]);
      checkFact(event.facts.audible_signal, event.objectId, 'audible_signal', evidence);
      checkFact(event.facts.tactile_paving, event.objectId, 'tactile_paving', evidence);
    }
  }
  const places = new Set<string>();
  for (const place of snapshot.places) {
    IdSchema.parse(place.id);
    if (places.has(place.id) || !nodes.has(place.nodeId)) throw new Error('Invalid place binding');
    places.add(place.id);
  }
}

function checkFact(fact: BooleanFact | TactileFact, objectId: string, key: string, evidence: Map<string, Evidence>) {
  const entries = fact.evidenceIds.map((id) => {
    const e = evidence.get(id);
    if (!e || e.objectId !== objectId || e.featureKey !== key) throw new Error('Fact provenance mismatch');
    return e;
  });
  if (fact.state === 'known') {
    if (entries.length === 0 || entries.some((e) => e.value !== fact.value)) throw new Error('Known fact lacks matching evidence');
    if (fact.observedAt !== null && !entries.some((e) => e.observedAt === fact.observedAt)) throw new Error('Unsupported observation');
    if (fact.verifiedAt !== null && !entries.some((e) => e.verifiedAt === fact.verifiedAt)) throw new Error('Unsupported verification');
    if (fact.reliability === 'field_verified' && (fact.verifiedAt === null || !entries.some((e) => e.verificationStatus === 'field_verified' && e.verifiedAt === fact.verifiedAt))) throw new Error('Unsupported field reliability');
    if (fact.reliability === 'source_declared' && !entries.some((e) => e.verificationStatus === 'source_declared')) throw new Error('Unsupported source reliability');
    if (fact.freshness !== 'unknown' && fact.observedAt === null && fact.verifiedAt === null) throw new Error('Freshness requires observation or verification');
  }
  if (new Set(entries.map((e) => JSON.stringify(e.scope))).size > 1) throw new Error('Mixed fact scopes');
  if (fact.state === 'conflicting' && (new Set(entries.map((e) => e.value)).size < 2 || new Set(entries.map((e) => JSON.stringify([e.sourceId, e.sourceRecordId]))).size < 2)) throw new Error('Conflict requires independent opposing observations');
}

export function adjacency(edges: Edge[]): Map<string, Edge[]> {
  const result = new Map<string, Edge[]>();
  for (const edge of [...edges].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)) {
    const list = result.get(edge.from) ?? []; list.push(edge); result.set(edge.from, list);
  }
  return result;
}
