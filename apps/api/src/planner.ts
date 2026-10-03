import { RouteResponseSchema } from '@krok/contracts';
import type { RouteRequest, RouteResponse } from '@krok/contracts';
import type { CatalogDataset } from './dataset';

export interface PlanningContext { requestId: string; asOf: string }
/** Graph traversal and hard constraints belong to @krok/routing. No default fixture planner. */
export interface RoutePlanner {
  isReady(): boolean;
  plan(this: void, request: RouteRequest, context: PlanningContext): Promise<unknown>;
}

export function validatePlan(payload: unknown, request: RouteRequest, context: PlanningContext, dataset: CatalogDataset): RouteResponse {
  const plan = RouteResponseSchema.parse(payload);
  const invalid = () => { throw new Error('Planner response violates request context'); };
  if (plan.requestId !== context.requestId || plan.asOf !== context.asOf || plan.dataContext.cityId !== request.cityId
    || plan.mode !== dataset.coverage.mode || plan.navigationEligibility !== dataset.coverage.navigationEligibility
    || plan.policy.fieldVerificationMaxAgeDays !== dataset.coverage.policy.fieldVerificationMaxAgeDays
    || plan.routes.length > request.maxAlternatives) invalid();
  for (const key of ['graphVersion', 'evidenceVersion', 'policyVersion'] as const) {
    if (plan.dataContext[key] !== dataset.versions[key]) invalid();
  }
  if (request.maxAlternatives >= 2 && !plan.routes.some((r) => Math.abs(r.metrics.distanceM - plan.baseline.distanceM) < 0.001)) invalid();
  for (const route of plan.routes) {
    if (route.metrics.distanceM > plan.baseline.distanceM * request.preferences.maxDetourRatio + 0.001) invalid();
    if (request.preferences.audibleRequirement === 'none') continue;
    for (const event of route.events) {
      const fact = event.facts.audible_signal;
      if (fact.state !== 'known' || !fact.value) { invalid(); continue; }
      if (request.preferences.audibleRequirement === 'field_verified_recent') {
        if (fact.reliability !== 'field_verified' || fact.freshness !== 'recent' || fact.verifiedAt === null) { invalid(); continue; }
        const age = Date.parse(context.asOf) - Date.parse(fact.verifiedAt);
        if (age < 0 || age > plan.policy.fieldVerificationMaxAgeDays * 86_400_000) invalid();
      }
    }
  }
  // Step/topology/known-stairs checks require graph edges and remain the planner's responsibility.
  return plan;
}
