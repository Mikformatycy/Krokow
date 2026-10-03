import type { RouteRequest } from '@krok/contracts';
import { allowed, edgeCost } from './cost';
import { adjacency } from './graph';
import { dominates, nearDuplicate } from './alternatives';
import { BudgetExceeded, SearchBudget, comparePaths, dijkstra, pathFrom, signature, yen } from './search';
import { RoutingError } from './types';
import type { Path, Policy, Snapshot } from './types';

export interface SearchResult { baseline: Path; selected: Path[]; recommended: Path; limited: boolean; operations: number }
export function searchRoutes(snapshot: Snapshot, policy: Policy, request: RouteRequest, asOf: string, now: () => number): SearchResult {
  if (request.origin.kind !== 'place' || request.destination.kind !== 'place') throw new RoutingError('FEATURE_NOT_ENABLED');
  const originId = request.origin.placeId; const destinationId = request.destination.placeId;
  const origin = snapshot.places.find((p) => p.id === originId); const destination = snapshot.places.find((p) => p.id === destinationId);
  if (!origin || !destination) throw new RoutingError('UNRESOLVED_ENDPOINT');
  if (origin.nodeId === destination.nodeId) throw new RoutingError('SAME_ENDPOINT');
  if (request.cityId !== snapshot.cityId) throw new RoutingError('SOURCE_UNAVAILABLE');
  if (request.expectedVersions && (request.expectedVersions.graphVersion !== snapshot.graphVersion || request.expectedVersions.evidenceVersion !== snapshot.evidenceVersion || request.expectedVersions.policyVersion !== policy.id)) throw new RoutingError('DATA_VERSION_CHANGED');
  const graph = adjacency(snapshot.graph.edges);
  const budget = new SearchBudget(policy.maxOperations, policy.maxSearchMs, now);
  const hard = (edge: Snapshot['graph']['edges'][number]) => allowed(edge, request.preferences, policy, asOf);
  const weights = (profile: 'shortest' | 'preferences' | 'documented') => (edge: Snapshot['graph']['edges'][number]) => edgeCost(edge, request.preferences, policy, profile);
  let baseline: Path;
  try {
    const result = dijkstra(graph, origin.nodeId, destination.nodeId, weights('shortest'), hard, budget);
    if (!result) {
      const base = dijkstra(graph, origin.nodeId, destination.nodeId, weights('shortest'), (edge) => allowed(edge, request.preferences, policy, asOf, false), budget);
      if (!base) throw new RoutingError('NO_PATH');
      const requirements: ('avoidKnownSteps' | 'audibleRequirement')[] = [];
      if (request.preferences.avoidKnownSteps) requirements.push('avoidKnownSteps');
      if (request.preferences.audibleRequirement !== 'none') requirements.push('audibleRequirement');
      throw new RoutingError('NO_MATCHING_ROUTE', requirements);
    }
    baseline = pathFrom(result.edges, weights('preferences'));
  } catch (error) { if (error instanceof BudgetExceeded) throw new RoutingError('SEARCH_LIMIT_REACHED'); throw error; }
  const candidates = new Map<string, Path>([[signature(baseline.edges), baseline]]);
  let limited = false;
  const add = (path: Path | null) => {
    if (path && candidates.size < policy.maxCandidates) candidates.set(signature(path.edges), pathFrom(path.edges, weights('preferences')));
  };
  try {
    for (const profile of ['preferences', 'documented'] as const) {
      if (candidates.size >= policy.maxCandidates) break;
      add(dijkstra(graph, origin.nodeId, destination.nodeId, weights(profile), hard, budget));
    }
    if (candidates.size < policy.maxCandidates) {
      for (const path of yen(graph, origin.nodeId, destination.nodeId, weights('preferences'), hard, budget, policy.maxCandidates)) {
        add(path);
        if (candidates.size >= policy.maxCandidates) break;
      }
    }
  } catch (error) { if (error instanceof BudgetExceeded) limited = true; else throw error; }
  // Recheck each candidate after generation. No coordinate-based links are ever created.
  const valid = [...candidates.values()].filter((path) => {
    if (path.distanceM > baseline.distanceM * request.preferences.maxDetourRatio + 0.000001) return false;
    const visited = new Set([origin.nodeId]); const stages = new Set<string>(); let node = origin.nodeId;
    for (const edge of path.edges) {
      if (node !== edge.from || visited.has(edge.to) || !hard(edge)) return false;
      node = edge.to; visited.add(node);
      for (const event of edge.events) {
        const key = JSON.stringify([event.crossingId, event.stageId]);
        if (stages.has(key)) return false; stages.add(key);
      }
    }
    return node === destination.nodeId;
  }).sort(comparePaths);
  const recommended = valid[0];
  if (!recommended) throw new Error('Validated baseline disappeared');
  // Among equally short paths, use the recommended one as the baseline representative.
  // draft.2 identifies a visible baseline by distance; this also avoids self-comparison reasons.
  if (recommended.distanceM === baseline.distanceM) baseline = recommended;
  const selected = [recommended];
  if (request.maxAlternatives >= 2 && signature(recommended.edges) !== signature(baseline.edges)) selected.push(baseline);
  for (const path of valid) {
    if (selected.length >= request.maxAlternatives) break;
    if (selected.some((p) => signature(p.edges) === signature(path.edges) || nearDuplicate(p, path, policy.overlapThreshold))) continue;
    if (valid.some((other) => dominates(other, path))) continue;
    selected.push(path);
  }
  // Distance ordering keeps the baseline unambiguous to draft.2's metric validator.
  selected.sort((a, b) => a.distanceM - b.distanceM || (a === baseline ? -1 : b === baseline ? 1 : comparePaths(a, b)));
  return { baseline, selected, recommended, limited, operations: budget.operations };
}
