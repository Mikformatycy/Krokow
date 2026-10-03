import type { Edge, Path } from './types';

export class BudgetExceeded extends Error {}
export class SearchBudget {
  operations = 0;
  private readonly start: number;
  constructor(private readonly maxOperations: number, private readonly maxMs: number, private readonly now: () => number) { this.start = now(); }
  spend(): void {
    if (++this.operations > this.maxOperations || this.now() - this.start >= this.maxMs) throw new BudgetExceeded('Search budget exhausted');
  }
}
export const signature = (edges: Edge[]): string => JSON.stringify(edges.map((e) => e.id));
export const comparePaths = (a: Path, b: Path): number => a.cost - b.cost || a.distanceM - b.distanceM || (signature(a.edges) < signature(b.edges) ? -1 : signature(a.edges) > signature(b.edges) ? 1 : 0);
export function pathFrom(edges: Edge[], weight: (edge: Edge) => number): Path {
  const result = { edges, distanceM: edges.reduce((n, e) => n + e.lengthM, 0), cost: edges.reduce((n, e) => n + weight(e), 0) };
  if (!Number.isFinite(result.distanceM) || !Number.isFinite(result.cost)) throw new Error('Path cost overflow');
  return result;
}
interface QueueEntry { node: string; path: Path }
class MinHeap {
  private readonly values: QueueEntry[] = [];
  push(entry: QueueEntry) {
    this.values.push(entry);
    let i = this.values.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (comparePaths(this.values[parent]!.path, entry.path) <= 0) break;
      this.values[i] = this.values[parent]!; i = parent;
    }
    this.values[i] = entry;
  }
  pop(): QueueEntry | undefined {
    const first = this.values[0]; const last = this.values.pop();
    if (!first || !last || this.values.length === 0) return first;
    let i = 0;
    while (i * 2 + 1 < this.values.length) {
      let child = i * 2 + 1;
      if (child + 1 < this.values.length && comparePaths(this.values[child + 1]!.path, this.values[child]!.path) < 0) child++;
      if (comparePaths(last.path, this.values[child]!.path) <= 0) break;
      this.values[i] = this.values[child]!; i = child;
    }
    this.values[i] = last;
    return first;
  }
}

export function dijkstra(graph: Map<string, Edge[]>, origin: string, destination: string, weight: (edge: Edge) => number,
  accepts: (edge: Edge) => boolean, budget: SearchBudget, bannedNodes = new Set<string>(), bannedEdges = new Set<string>()): Path | null {
  if (bannedNodes.has(origin) || bannedNodes.has(destination)) return null;
  const queue = new MinHeap();
  const initial = pathFrom([], weight);
  const best = new Map<string, Path>([[origin, initial]]); const settled = new Set<string>();
  queue.push({ node: origin, path: initial });
  for (let current = queue.pop(); current; current = queue.pop()) {
    budget.spend();
    if (settled.has(current.node) || best.get(current.node) !== current.path) continue;
    settled.add(current.node);
    if (current.node === destination) return current.path;
    for (const edge of graph.get(current.node) ?? []) {
      budget.spend();
      if (settled.has(edge.to) || bannedNodes.has(edge.to) || bannedEdges.has(edge.id) || !accepts(edge)) continue;
      const cost = weight(edge);
      if (!Number.isFinite(cost) || cost < 0) throw new Error('Dijkstra requires nonnegative finite costs');
      const next = { edges: [...current.path.edges, edge], cost: current.path.cost + cost, distanceM: current.path.distanceM + edge.lengthM };
      if (!Number.isFinite(next.cost) || !Number.isFinite(next.distanceM)) throw new Error('Path cost overflow');
      const previous = best.get(edge.to);
      if (!previous || comparePaths(next, previous) < 0) { best.set(edge.to, next); queue.push({ node: edge.to, path: next }); }
    }
  }
  return null;
}

/** Yen's loopless deviations. Candidate and search-operation limits bound work. */
export function* yen(graph: Map<string, Edge[]>, origin: string, destination: string, weight: (edge: Edge) => number,
  accepts: (edge: Edge) => boolean, budget: SearchBudget, count: number): Generator<Path> {
  const first = dijkstra(graph, origin, destination, weight, accepts, budget);
  if (!first) return;
  const accepted = [first]; const pool = new Map<string, Path>(); const seen = new Set([signature(first.edges)]);
  yield first;
  while (accepted.length < count) {
    const previous = accepted.at(-1)!;
    for (let i = 0; i < previous.edges.length; i++) {
      budget.spend();
      const root = previous.edges.slice(0, i); const spur = previous.edges[i]!.from;
      const bannedEdges = new Set<string>();
      for (const path of accepted) if (signature(path.edges.slice(0, i)) === signature(root) && path.edges[i]) bannedEdges.add(path.edges[i]!.id);
      const bannedNodes = new Set(root.map((e) => e.from));
      const suffix = dijkstra(graph, spur, destination, weight, accepts, budget, bannedNodes, bannedEdges);
      if (suffix) {
        const path = pathFrom([...root, ...suffix.edges], weight); const key = signature(path.edges);
        if (!seen.has(key)) pool.set(key, path);
      }
    }
    const next = [...pool.values()].sort(comparePaths)[0];
    if (!next) break;
    const key = signature(next.edges); pool.delete(key); seen.add(key); accepted.push(next);
    yield next;
  }
}
