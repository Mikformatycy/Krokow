import { RouteRequestSchema, UtcSchema } from '@krok/contracts';
import type { RouteRequest } from '@krok/contracts';
import { validateSnapshot } from './graph';
import { validatePolicy } from './policy/default';
import { searchRoutes } from './engine';
import { present } from './present';
import type { Policy, Snapshot } from './types';

export * from './types';
export * from './cost';
export * from './policy/default';
export * from './graph';
export * from './engine';
export * from './alternatives';
export * from './evidence/types';
export * from './evidence/resolve';
export function createPlanner(input: Snapshot, configuration: Policy, now: () => number = () => performance.now()) {
  const snapshot = structuredClone(input); const policy = structuredClone(configuration);
  validateSnapshot(snapshot); validatePolicy(policy);
  return {
    isReady: () => true,
    plan: (inputRequest: RouteRequest, context: { requestId: string; asOf: string }) => {
      const request = RouteRequestSchema.parse(inputRequest); UtcSchema.parse(context.asOf);
      const result = searchRoutes(snapshot, policy, request, context.asOf, now);
      const originId = request.origin.kind === 'place' ? request.origin.placeId : '';
      const destinationId = request.destination.kind === 'place' ? request.destination.placeId : '';
      return present(snapshot, policy, result, snapshot.places.find((p) => p.id === originId)!, snapshot.places.find((p) => p.id === destinationId)!, context);
    },
  };
}
