import type { Policy } from '../types';

// Hypotheses from architecture.md, not a calibrated safety model.
export const PILOT_POLICY: Policy = {
  id: 'pilot-v1', walkingSpeedMps: 1.2, fieldVerificationMaxAgeDays: 180,
  baseCrossing: 40,
  audible: { present: 0, absent: 260, unknown: 360, conflicting: 460 },
  tactile: { yes: 0, no: 40, partial: 60, incorrect: 100, unknown: 60, conflicting: 100 },
  separated: { present: 0, absent: 0.35, unknown: 0.1, conflicting: 0.1 },
  freshness: { stale: 80, unknown: 40 },
  documented: { unknown: 400, conflicting: 600, stale: 120, undated: 60, separatedUnknownPerM: 0.2 },
  maxCandidates: 12, maxOperations: 50_000, maxSearchMs: 2000, overlapThreshold: 0.85,
};
export const SYNTHETIC_POLICY: Policy = {
  ...PILOT_POLICY, id: 'synthetic-acoustic-v1', baseCrossing: 0,
  audible: { present: 40, absent: 300, unknown: 400, conflicting: 500 },
  tactile: { yes: 0, no: 0, partial: 0, incorrect: 0, unknown: 0, conflicting: 0 },
  separated: { present: 0, absent: 0, unknown: 0, conflicting: 0 },
  freshness: { stale: 0, unknown: 0 },
};
export function validatePolicy(policy: Policy): void {
  const penalties = [policy.baseCrossing, ...Object.values(policy.audible), ...Object.values(policy.tactile),
    ...Object.values(policy.separated), ...Object.values(policy.freshness), ...Object.values(policy.documented)];
  if (penalties.some((n) => !Number.isFinite(n) || n < 0)) throw new Error('Costs must be finite and nonnegative');
  if (![policy.walkingSpeedMps, policy.fieldVerificationMaxAgeDays, policy.maxSearchMs].every((n) => Number.isFinite(n) && n > 0)
    || ![policy.maxCandidates, policy.maxOperations].every((n) => Number.isSafeInteger(n) && n > 0)
    || policy.maxCandidates > 12 || !Number.isFinite(policy.overlapThreshold) || policy.overlapThreshold <= 0 || policy.overlapThreshold > 1) throw new Error('Invalid routing policy limits');
}
