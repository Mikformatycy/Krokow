import type { Edge, Path } from './types';

function intervals(edges: Edge[]): Map<string, [number, number][]> {
  const result = new Map<string, [number, number][]>();
  for (const edge of edges) {
    const list = result.get(edge.physical.id) ?? [];
    list.push([Math.min(edge.physical.startM, edge.physical.endM), Math.max(edge.physical.startM, edge.physical.endM)]);
    result.set(edge.physical.id, list);
  }
  for (const [key, list] of result) {
    const merged: [number, number][] = [];
    for (const interval of list.sort((a, b) => a[0] - b[0])) {
      const last = merged.at(-1);
      if (last && interval[0] <= last[1]) last[1] = Math.max(last[1], interval[1]); else merged.push([...interval]);
    }
    result.set(key, merged);
  }
  return result;
}
export function sharedPhysicalLength(a: Path, b: Path): number {
  const left = intervals(a.edges); const right = intervals(b.edges); let length = 0;
  for (const [key, intervalsA] of left) for (const x of intervalsA) for (const y of right.get(key) ?? []) length += Math.max(0, Math.min(x[1], y[1]) - Math.max(x[0], y[0]));
  return length;
}
function crossingSignature(path: Path): string {
  return JSON.stringify(path.edges.flatMap((e) => e.events).map((e) => [e.crossingId, e.stageId, e.facts]));
}
export function nearDuplicate(a: Path, b: Path, threshold: number): boolean {
  return crossingSignature(a) === crossingSignature(b) && sharedPhysicalLength(a, b) / Math.min(a.distanceM, b.distanceM) >= threshold;
}
export function dominates(a: Path, b: Path): boolean {
  // Preference cost, length and crossing stages are explicit comparison dimensions.
  const x = [a.cost, a.distanceM, a.edges.reduce((n, e) => n + e.events.length, 0)];
  const y = [b.cost, b.distanceM, b.edges.reduce((n, e) => n + e.events.length, 0)];
  return x.every((value, i) => value <= y[i]!) && x.some((value, i) => value < y[i]!);
}
