import { writeFile } from 'node:fs/promises';
import { createPlanner, PILOT_POLICY, RoutingError } from '@krok/routing';
import { loadKrakowPrototype } from './krakow-prototype';

const { snapshot, audit } = await loadKrakowPrototype();
const planner = createPlanner(snapshot, PILOT_POLICY);
const adjacency = new Map<string, string[]>();
for (const edge of snapshot.graph.edges) {
  const list = adjacency.get(edge.from) ?? []; list.push(edge.to); adjacency.set(edge.from, list);
}
const remaining = new Set(snapshot.places.map(place => place.nodeId));
const groups: string[][] = [];
while (remaining.size) {
  const seed = [...remaining][0]!; const seen = new Set([seed]); const queue = [seed];
  for (let i = 0; i < queue.length; i++) for (const next of adjacency.get(queue[i]!) ?? []) if (!seen.has(next)) { seen.add(next); queue.push(next); }
  const group = snapshot.places.filter(place => remaining.has(place.nodeId) && seen.has(place.nodeId)).map(place => place.id);
  groups.push(group);
  for (const place of snapshot.places) if (group.includes(place.id)) remaining.delete(place.nodeId);
}
const pairs: { from: string; to: string; durationMs: number; status: string; distanceM?: number; stages?: number; steps?: number; alternatives?: number }[] = [];
const targets: [string, string][] = [];
for (const group of groups) for (const id of group.slice(1)) { targets.push([group[0]!, id], [id, group[0]!]); }
// Explicitly exercise disconnected components; no hidden links across roads/tracks.
for (const group of groups.slice(1)) targets.push([groups[0]![0]!, group[0]!]);
for (const [from, to] of targets) {
  const started = performance.now();
  try {
    const response = planner.plan({ cityId: snapshot.cityId, origin: { kind: 'place', placeId: from }, destination: { kind: 'place', placeId: to },
      locale: 'pl-PL', maxAlternatives: 3, preferences: { preferAudibleSignals: true, preferTactilePaving: true, preferSeparatedFootways: true,
        avoidKnownSteps: true, audibleRequirement: 'none', maxDetourRatio: 1.6 } }, { requestId: 'prototype-audit', asOf: snapshot.snapshotFetchedAt });
    const route = response.routes.find(r => r.id === response.recommendation.routeId)!;
    pairs.push({ from, to, durationMs: Math.round(performance.now() - started), status: response.calculation.status,
      distanceM: Math.round(route.metrics.distanceM), stages: route.metrics.crossingStageCount, steps: route.steps.length, alternatives: response.routes.length });
  } catch (error) {
    if (!(error instanceof RoutingError)) throw error;
    pairs.push({ from, to, durationMs: Math.round(performance.now() - started), status: error.code });
  }
}
const timings = pairs.map(pair => pair.durationMs).sort((a, b) => a - b);
const report = { checkedAt: new Date().toISOString(), graphVersion: snapshot.graphVersion, fetchedAt: snapshot.snapshotFetchedAt,
  graph: { ...audit, rejected: audit.rejected.reduce<Record<string, number>>((result, item) => {
    result[item.reason] = (result[item.reason] ?? 0) + 1; return result;
  }, {}) },
  groups: groups.map(group => group.map(id => ({ id, name: snapshot.places.find(place => place.id === id)!.name }))), pairs,
  p95Ms: timings[Math.ceil(timings.length * .95) - 1], maxMs: timings.at(-1) };
if (process.argv[2]) await writeFile(process.argv[2], JSON.stringify(report, null, 2) + '\n');
else console.log(JSON.stringify(report, null, 2));
