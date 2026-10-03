import type { BooleanFact, Preferences, TactileFact } from '@krok/contracts';
import type { Edge, Policy, Profile } from './types';

export function booleanState(fact: BooleanFact): 'present' | 'absent' | 'unknown' | 'conflicting' {
  return fact.state === 'known' ? fact.value ? 'present' : 'absent' : fact.state;
}
export function allowed(edge: Edge, preferences: Preferences, policy: Policy, asOf: string, hard = true): boolean {
  if (edge.access !== 'allowed' || edge.closed) return false;
  if (!hard) return true;
  if (preferences.avoidKnownSteps && (edge.kind === 'steps' || edge.steps.state === 'known' && edge.steps.value)) return false;
  if (preferences.audibleRequirement === 'none') return true;
  return edge.events.every((event) => {
    const fact = event.facts.audible_signal;
    if (fact.state !== 'known' || !fact.value) return false;
    if (preferences.audibleRequirement === 'documented') return true;
    if (fact.reliability !== 'field_verified' || fact.freshness !== 'recent' || fact.verifiedAt === null) return false;
    const age = Date.parse(asOf) - Date.parse(fact.verifiedAt);
    return age >= 0 && age <= policy.fieldVerificationMaxAgeDays * 86_400_000;
  });
}
function ageCost(fact: BooleanFact | TactileFact, policy: Policy): number {
  return fact.state === 'known' && fact.freshness !== 'recent' ? policy.freshness[fact.freshness] : 0;
}
export function edgeCost(edge: Edge, preferences: Preferences, policy: Policy, profile: Profile): number {
  let cost = edge.lengthM;
  if (profile === 'shortest') return cost;
  if (profile === 'preferences') {
    if (preferences.preferSeparatedFootways) cost += edge.lengthM * policy.separated[booleanState(edge.separatedFootway)];
    for (const event of edge.events) {
      cost += policy.baseCrossing;
      if (preferences.preferAudibleSignals) cost += policy.audible[booleanState(event.facts.audible_signal)] + ageCost(event.facts.audible_signal, policy);
      if (preferences.preferTactilePaving) {
        const fact = event.facts.tactile_paving;
        cost += policy.tactile[fact.state === 'known' ? fact.value : fact.state] + ageCost(fact, policy);
      }
    }
  } else {
    if (preferences.preferSeparatedFootways && edge.separatedFootway.state !== 'known') cost += edge.lengthM * policy.documented.separatedUnknownPerM;
    for (const event of edge.events) {
      const facts: (BooleanFact | TactileFact)[] = [];
      if (preferences.preferAudibleSignals || preferences.audibleRequirement !== 'none') facts.push(event.facts.audible_signal);
      if (preferences.preferTactilePaving) facts.push(event.facts.tactile_paving);
      for (const fact of facts) {
        if (fact.state !== 'known') cost += policy.documented[fact.state];
        else if (fact.freshness === 'stale') cost += policy.documented.stale;
        else if (fact.observedAt === null && fact.verifiedAt === null) cost += policy.documented.undated;
      }
    }
  }
  if (!Number.isFinite(cost) || cost < edge.lengthM) throw new Error('Invalid edge cost');
  return cost;
}
