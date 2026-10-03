import { EvidenceSchema, PublicSourceSchema, UtcSchema, type Evidence } from '@krok/contracts';
import { resolveEvidence } from '@krok/routing';
import { elementKey, type OsmElement } from './osm';

type Value = Evidence['value'];
const boolean = (value: string): boolean | undefined => value === 'yes' ? true : value === 'no' ? false : undefined;
const surfaces: Readonly<Record<string, Value>> = {
  asphalt: 'asphalt', paved: 'paved', paving_stones: 'paved', concrete: 'paved',
  'concrete:plates': 'paved', 'concrete:lanes': 'paved', cobblestone: 'paved', sett: 'paved',
  unpaved: 'unpaved', gravel: 'unpaved', fine_gravel: 'unpaved', ground: 'unpaved', dirt: 'unpaved', sand: 'unpaved', grass: 'unpaved',
};
const mappings: readonly { tag: string; feature: Evidence['featureKey']; decode: (value: string) => Value | undefined }[] = [
  { tag: 'traffic_signals:sound', feature: 'audible_signal', decode: boolean },
  { tag: 'crossing:signals', feature: 'traffic_signals', decode: boolean },
  { tag: 'tactile_paving', feature: 'tactile_paving', decode: v => ['yes', 'no', 'partial', 'incorrect'].includes(v) ? v as Value : undefined },
  { tag: 'handrail', feature: 'handrail', decode: boolean },
  { tag: 'surface', feature: 'surface', decode: v => Object.hasOwn(surfaces, v) ? surfaces[v] : undefined },
];
export interface Coverage {
  nodes: number; ways: number; crossings: number; entrances: number; highwayWays: number;
  crossingSound: { yes: number; no: number; missing: number; unsupported: number };
  crossingTactile: { yes: number; no: number; partial: number; incorrect: number; missing: number; unsupported: number };
  skipped: { objectId: string; tag: string; reason: 'unsupported_value' | 'ambiguous_level' }[];
  evidenceCount: number;
}

export function normalize(elements: readonly OsmElement[], fetchedAt: string) {
  UtcSchema.parse(fetchedAt);
  const source = PublicSourceSchema.parse({ id: 'osm', kind: 'osm', name: 'OpenStreetMap',
    sourceUrl: 'https://www.openstreetmap.org/copyright', attribution: '© OpenStreetMap contributors',
    license: 'ODbL 1.0', lastFetchedAt: fetchedAt, status: 'ok' });
  const evidence: Evidence[] = [];
  const coverage: Coverage = { nodes: 0, ways: 0, crossings: 0, entrances: 0, highwayWays: 0,
    crossingSound: { yes: 0, no: 0, missing: 0, unsupported: 0 },
    crossingTactile: { yes: 0, no: 0, partial: 0, incorrect: 0, missing: 0, unsupported: 0 }, skipped: [], evidenceCount: 0 };
  for (const element of elements) {
    if (Date.parse(element.timestamp) > Date.parse(fetchedAt)) throw new Error('OSM source modification is in the future');
    coverage[element.type === 'node' ? 'nodes' : 'ways']++;
    if (element.type === 'way' && element.tags.highway) coverage.highwayWays++;
    if (element.tags.entrance && element.tags.entrance !== 'no') coverage.entrances++;
    if (element.type === 'node' && element.tags.highway === 'crossing') {
      coverage.crossings++;
      const sound = element.tags['traffic_signals:sound'];
      coverage.crossingSound[sound === undefined ? 'missing' : sound === 'yes' || sound === 'no' ? sound : 'unsupported']++;
      const tactile = element.tags.tactile_paving;
      coverage.crossingTactile[tactile === undefined ? 'missing' : tactile === 'yes' || tactile === 'no' || tactile === 'partial' || tactile === 'incorrect' ? tactile : 'unsupported']++;
    }
    const recordId = elementKey(element);
    const objectId = `osm:${recordId}`;
    const rawLevel = element.tags.level;
    if (rawLevel !== undefined && (!/^-?\d+(\.\d+)?$/.test(rawLevel) || !Number.isFinite(Number(rawLevel)))) {
      coverage.skipped.push({ objectId, tag: 'level', reason: 'ambiguous_level' });
      continue;
    }
    const base = { sourceId: source.id, sourceRecordId: recordId, objectId, fetchedAt,
      sourceModifiedAt: element.timestamp, observedAt: null, verifiedAt: null, validUntil: null,
      verificationStatus: 'unverified', scope: { side: null, direction: null, level: rawLevel === undefined ? null : Number(rawLevel) }, note: null };
    for (const mapping of mappings) {
      const rawValue = element.tags[mapping.tag];
      if (rawValue === undefined) continue;
      const value = mapping.decode(rawValue);
      if (value === undefined) { coverage.skipped.push({ objectId, tag: mapping.tag, reason: 'unsupported_value' }); continue; }
      evidence.push(EvidenceSchema.parse({ ...base, id: `${recordId}@${element.version}:${mapping.feature}`, featureKey: mapping.feature, value }));
    }
    if (element.tags.highway === 'steps') evidence.push(EvidenceSchema.parse({ ...base,
      id: `${recordId}@${element.version}:steps`, featureKey: 'steps', value: true }));
  }
  coverage.evidenceCount = evidence.length;
  // Object-level audit only: no assignment of a point's markings to a whole way.
  const resolved = evidence.map(item => ({ objectId: item.objectId, featureKey: item.featureKey, scope: item.scope,
    ...resolveEvidence({ objectId: item.objectId, featureKey: item.featureKey, scope: item.scope,
      candidates: [{ evidence: item, publication: 'published' }], sources: [source],
      policy: { id: 'osm-audit-1', infrastructureMaxAgeDays: 365, temporaryObservationMaxAgeHours: 24 } }, () => fetchedAt) }));
  return { source, evidence, resolved, coverage };
}
