import type { BooleanFact, CrossingEvent, Evidence, PublicSource } from '@krok/contracts';
import type { Edge, Snapshot } from './types';

export const SYNTHETIC_FETCHED_AT = '2026-10-03T10:00:00Z';
export function createSyntheticSnapshot(): Snapshot {
  const source: PublicSource = { id: 'synthetic-source', kind: 'synthetic', name: 'Fikcyjny graf A/B/C', sourceUrl: null,
    attribution: 'Kroków — fikcyjne dane demonstracyjne', license: 'CC0-1.0', lastFetchedAt: SYNTHETIC_FETCHED_AT, status: 'ok' };
  const snapshot: Snapshot = {
    cityId: 'synthetic-city', graphVersion: 'synthetic-graph-v2', evidenceVersion: 'synthetic-evidence-v2', snapshotFetchedAt: SYNTHETIC_FETCHED_AT,
    sources: [source], evidence: [], graph: { nodes: [{ id: 'start', level: 0 }, { id: 'end', level: 0 }], edges: [] },
    places: [{ id: 'demo-start', nodeId: 'start', name: 'Fikcyjny start' }, { id: 'demo-end', nodeId: 'end', name: 'Fikcyjny cel' }],
  };
  const unknown = (): Extract<BooleanFact, { state: 'unknown' }> => ({ state: 'unknown', reason: 'missing', evidenceIds: [] });
  function known(objectId: string, featureKey: 'steps' | 'separated_footway' | 'audible_signal', value: boolean): BooleanFact {
    const id = `${objectId}-${featureKey}`;
    const evidence: Evidence = { id, sourceId: source.id, sourceRecordId: id, objectId, featureKey, value,
      fetchedAt: SYNTHETIC_FETCHED_AT, sourceModifiedAt: null, observedAt: null, verifiedAt: null, validUntil: null,
      verificationStatus: 'source_declared', scope: { side: null, direction: 'both', level: 0 }, note: 'Fikcyjny fakt; wyłącznie demonstracja grafu.' };
    snapshot.evidence.push(evidence);
    return { state: 'known', value, evidenceIds: [id], reliability: 'source_declared', freshness: 'unknown', observedAt: null, verifiedAt: null };
  }
  // These are declared physical connections. Search never invents links from proximity.
  for (const branch of [
    { name: 'A', lengths: [100, 100, 100, 440], audible: [true, false, null] },
    { name: 'B', lengths: [100, 100, 100, 680], audible: [true, true, true] },
    { name: 'C', lengths: [100, 1020], audible: [true] },
  ]) {
    let from = 'start';
    for (const [index, lengthM] of branch.lengths.entries()) {
      const to = index === branch.lengths.length - 1 ? 'end' : `${branch.name}-node-${index}`;
      if (to !== 'end') snapshot.graph.nodes.push({ id: to, level: 0 });
      const id = `${branch.name}-edge-${index}`;
      const events: CrossingEvent[] = [];
      if (index < branch.audible.length) {
        const objectId = `${branch.name}-crossing-object-${index}`; const value = branch.audible[index];
        events.push({ id: `${id}-event`, kind: 'crossing', offsetM: lengthM / 2, objectId,
          crossingId: `${branch.name}-crossing-${index}`, stageId: `${branch.name}-stage-${index}`, instructionKey: 'route.crossing_approach',
          facts: { audible_signal: typeof value === 'boolean' ? known(objectId, 'audible_signal', value) : unknown(), tactile_paving: unknown() } });
      }
      const edge: Edge = { id, from, to, objectId: id, name: `Fikcyjny odcinek ${branch.name}${index + 1}`,
        lengthM, kind: events.length ? 'crossing' : 'walk', access: 'allowed', closed: false,
        physical: { id, startM: 0, endM: lengthM }, steps: known(id, 'steps', false), separatedFootway: unknown(), events };
      snapshot.graph.edges.push(edge);
      // Reverse traversals are authored explicitly for this synthetic graph, with their own event IDs.
      snapshot.graph.edges.push({ ...structuredClone(edge), id: `${id}-reverse`, from: to, to: from,
        physical: { id, startM: lengthM, endM: 0 }, events: [...events].reverse().map((e) => ({ ...structuredClone(e), id: `${e.id}-reverse`, offsetM: lengthM - e.offsetM })) });
      from = to;
    }
  }
  return snapshot;
}
