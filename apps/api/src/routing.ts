import { SCHEMA_VERSION } from '@krok/contracts';
import { createPlanner, RoutingError, SYNTHETIC_POLICY } from '@krok/routing';
import type { Policy, Snapshot } from '@krok/routing';
import { createSyntheticSnapshot } from '@krok/routing/synthetic';
import { validateDataset } from './dataset';
import { publicError } from './errors';
import type { RoutePlanner } from './planner';

/** Catalog and planner use one validated, privately copied synthetic snapshot. */
export function createSyntheticServices(input: Snapshot = createSyntheticSnapshot(), policy: Policy = SYNTHETIC_POLICY, now?: () => number) {
  if (input.mode === 'pilot') throw new Error('Use explicit pilot services');
  return createSnapshotServices(input, policy, now);
}

export function createSnapshotServices(input: Snapshot, policy: Policy, now?: () => number) {
  const snapshot = structuredClone(input);
  const mode = snapshot.mode ?? 'synthetic';
  const engine = createPlanner(snapshot, policy, now);
  const envelope = { schemaVersion: SCHEMA_VERSION, requestId: `${mode}-catalog` } as const;
  const versions = { graphVersion: snapshot.graphVersion, evidenceVersion: snapshot.evidenceVersion, policyVersion: policy.id };
  const dataset = validateDataset({
    coverage: { ...envelope, cityId: snapshot.cityId, name: snapshot.coverage?.name ?? 'Fikcyjne miasto demonstracyjne',
      description: snapshot.coverage?.description ?? 'Syntetyczny graf A/B/C. Wyłącznie podgląd, bez nawigacji terenowej.',
      mode, navigationEligibility: 'preview_only', capabilities: ['catalog_routes'], polygon: snapshot.coverage?.polygon ?? null,
      policy: { policyVersion: policy.id, fieldVerificationMaxAgeDays: policy.fieldVerificationMaxAgeDays } },
    places: { ...envelope, cityId: snapshot.cityId, mode, navigationEligibility: 'preview_only',
      places: snapshot.places.map((p) => ({ id: p.id, cityId: snapshot.cityId, name: p.name,
        description: [p.address, p.description ?? (mode === 'synthetic' ? 'Fikcyjny punkt grafu demonstracyjnego.' : 'Punkt na grafie pieszym OSM.')].filter(Boolean).join('. '),
        coordinate: p.coordinate ?? null })) },
    sources: { ...envelope, mode, sources: snapshot.sources }, versions, evidence: snapshot.evidence,
  });
  const planner: RoutePlanner = {
    isReady: engine.isReady,
    async plan(request, context) {
      try { return await Promise.resolve(engine.plan(request, context)); }
      catch (error) {
        if (!(error instanceof RoutingError)) throw error;
        switch (error.code) {
          case 'NO_PATH': throw publicError(error.code, { cityId: request.cityId });
          case 'NO_MATCHING_ROUTE': throw publicError(error.code, { blockingRequirements: error.blockingRequirements });
          case 'SEARCH_LIMIT_REACHED': case 'SAME_ENDPOINT': throw publicError(error.code, {});
          case 'SOURCE_UNAVAILABLE': throw publicError(error.code, { cityId: request.cityId });
          case 'FEATURE_NOT_ENABLED': throw publicError(error.code, { capability: 'coordinate_endpoints' });
          case 'UNRESOLVED_ENDPOINT': {
            const originId = request.origin.kind === 'place' ? request.origin.placeId : '';
            throw publicError(error.code, { endpoint: snapshot.places.some((p) => p.id === originId) ? 'destination' : 'origin' });
          }
          case 'DATA_VERSION_CHANGED':
            if (!request.expectedVersions) throw error;
            throw publicError(error.code, { requested: request.expectedVersions, available: versions });
        }
      }
    },
  };
  return { dataset, planner };
}
