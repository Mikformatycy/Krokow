import type { RouteResponse } from '@krok/contracts';
import type { Snapshot } from '@krok/routing';
import type { OsmElement } from './osm';

const tags = ['traffic_signals:sound', 'crossing:signals', 'tactile_paving', 'handrail', 'surface', 'kerb', 'incline', 'smoothness', 'lit'] as const;
const counts = (values: readonly string[]) => values.reduce<Record<string, number>>((out, value) => {
  out[value] = (out[value] ?? 0) + 1; return out;
}, {});

/** Pure audit: no clock, network, snapping, inference or modification of the snapshot. */
export function accessibilityAudit(elements: readonly OsmElement[], snapshot: Snapshot, responses: readonly RouteResponse[]) {
  const populations = {
    crossingNodes: elements.filter(e => e.type === 'node' && e.tags.highway === 'crossing'),
    crossingWays: elements.filter(e => e.type === 'way' && e.tags.footway === 'crossing'),
    pedestrianWays: elements.filter(e => e.type === 'way' && ['footway', 'path', 'pedestrian', 'steps'].includes(e.tags.highway ?? '')),
  };
  const objects = new Set(snapshot.graph.edges.map(edge => edge.objectId));
  const stages = [...new Map(snapshot.graph.edges.flatMap(edge => edge.events).map(event => [JSON.stringify([event.crossingId, event.stageId]), event])).values()];
  const physical = new Set(snapshot.graph.edges.map(edge => `${edge.physical.id}:${Math.min(edge.physical.startM, edge.physical.endM)}:${Math.max(edge.physical.startM, edge.physical.endM)}`));
  return {
    graphVersion: snapshot.graphVersion, evidenceVersion: snapshot.evidenceVersion, fetchedAt: snapshot.snapshotFetchedAt,
    populations: Object.fromEntries(Object.entries(populations).map(([name, population]) => [name, {
      denominator: population.length,
      tags: Object.fromEntries(tags.map(tag => [tag, counts(population.map(e => e.tags[tag] ?? '(missing)'))])),
    }])),
    normalized: counts(snapshot.evidence.map(e => `${e.featureKey}:${String(e.value)}`)),
    verification: counts(snapshot.evidence.map(e => e.verificationStatus)),
    graph: { directedEdges: snapshot.graph.edges.length, physicalSegments: physical.size, objects: objects.size,
      stages: stages.length, audible: counts(stages.map(e => e.facts.audible_signal.state === 'known' ? `known:${e.facts.audible_signal.value}` : e.facts.audible_signal.state)),
      tactile: counts(stages.map(e => e.facts.tactile_paving.state === 'known' ? `known:${e.facts.tactile_paving.value}` : e.facts.tactile_paving.state)),
      evidenceOnExactWay: counts(snapshot.evidence.filter(e => objects.has(e.objectId)).map(e => e.featureKey)),
      evidenceOutsideGraphWayScope: counts(snapshot.evidence.filter(e => !objects.has(e.objectId)).map(e => e.featureKey)),
    },
    responses: responses.map(response => {
      const edges = new Set(response.routes.flatMap(route => route.edgeIds));
      const routeObjects = new Set(snapshot.graph.edges.filter(edge => edges.has(edge.id)).map(edge => edge.objectId));
      const published = new Set(response.evidenceCatalog.map(e => e.id));
      const applicable = snapshot.evidence.filter(e => routeObjects.has(e.objectId));
      return { requestId: response.requestId, asOf: response.asOf,
        exactObjectEvidence: applicable.length, responseEvidence: response.evidenceCatalog.length,
        omittedExactObjectEvidence: counts(applicable.filter(e => !published.has(e.id)).map(e => e.featureKey)),
        routes: response.routes.map(route => ({ id: route.id, distanceM: route.metrics.distanceM,
          uniqueStages: new Set(route.events.map(e => e.id)).size, unknownSegmentLengthM: route.metrics.unknownSegmentLengthM,
          audible: route.metrics.audibleSignals })),
      };
    }),
  };
}
