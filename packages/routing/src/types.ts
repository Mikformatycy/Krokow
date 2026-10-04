import type { BooleanFact, CrossingEvent, Evidence, PublicSource } from '@krok/contracts';

export interface GraphNode { id: string; level: number; coordinate?: [number, number] }
export interface Edge {
  id: string; from: string; to: string; objectId: string; name: string;
  lengthM: number; kind: 'walk' | 'crossing' | 'steps' | 'ramp';
  access: 'allowed' | 'denied' | 'unknown'; closed: boolean;
  physical: { id: string; startM: number; endM: number };
  steps: BooleanFact; separatedFootway: BooleanFact;
  events: CrossingEvent[]; // Offsets local to this directed edge.
  geometry?: [number, number][];
}
export interface Graph { nodes: GraphNode[]; edges: Edge[] }
export interface Place { id: string; nodeId: string; name: string; coordinate?: [number, number]; description?: string; address?: string; kind?: 'entrance' | 'poi' }
export interface Snapshot {
  mode?: 'synthetic' | 'pilot';
  coverage?: { name: string; description: string; polygon: { type: 'Polygon'; coordinates: [number, number][][] } };
  graph: Graph; places: Place[]; cityId: string;
  graphVersion: string; evidenceVersion: string; snapshotFetchedAt: string;
  sources: PublicSource[]; evidence: Evidence[];
}
export interface Path { edges: Edge[]; distanceM: number; cost: number }
export type Profile = 'shortest' | 'preferences' | 'documented';
export interface Policy {
  id: string; walkingSpeedMps: number; fieldVerificationMaxAgeDays: number;
  baseCrossing: number;
  audible: Record<'present' | 'absent' | 'unknown' | 'conflicting', number>;
  tactile: Record<'yes' | 'no' | 'partial' | 'incorrect' | 'unknown' | 'conflicting', number>;
  separated: Record<'present' | 'absent' | 'unknown' | 'conflicting', number>;
  freshness: { stale: number; unknown: number };
  documented: { unknown: number; conflicting: number; stale: number; undated: number; separatedUnknownPerM: number };
  maxCandidates: number; maxOperations: number; maxSearchMs: number; overlapThreshold: number;
}
export class RoutingError extends Error {
  constructor(readonly code: 'NO_PATH' | 'NO_MATCHING_ROUTE' | 'SEARCH_LIMIT_REACHED' | 'UNRESOLVED_ENDPOINT' | 'SAME_ENDPOINT' | 'FEATURE_NOT_ENABLED' | 'SOURCE_UNAVAILABLE' | 'DATA_VERSION_CHANGED',
    readonly blockingRequirements: ('avoidKnownSteps' | 'audibleRequirement')[] = []) { super(code); }
}
