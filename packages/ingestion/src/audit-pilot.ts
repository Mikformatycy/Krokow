import { createPlanner, PILOT_POLICY, RoutingError } from '@krok/routing';
import { loadKrakowPilot } from './krakow';
import { writeFile } from 'node:fs/promises';

const { snapshot, audit, coverage } = await loadKrakowPilot();
const engine = createPlanner(snapshot, PILOT_POLICY);
const pairs = [];
for (const from of snapshot.places) for (const to of snapshot.places) {
  if (from.id >= to.id) continue;
  const started = performance.now();
  try {
    const result = engine.plan({ cityId: snapshot.cityId, origin: { kind: 'place', placeId: from.id }, destination: { kind: 'place', placeId: to.id },
      preferences: { preferAudibleSignals: true, preferTactilePaving: true, preferSeparatedFootways: true, avoidKnownSteps: true, audibleRequirement: 'none', maxDetourRatio: 1.6 }, maxAlternatives: 3, locale: 'pl-PL' },
    { requestId: 'operator-audit', asOf: new Date().toISOString() });
    pairs.push({ from: from.name, to: to.name, durationMs: Math.round(performance.now() - started), status: result.calculation.status,
      routes: result.routes.map(r => ({ distanceM: Math.round(r.metrics.distanceM), crossings: r.metrics.crossingStageCount, points: r.geometry?.coordinates.length })) });
  } catch (error) { if (!(error instanceof RoutingError)) throw error; pairs.push({ from: from.name, to: to.name, error: error.code }); }
}
const report = { graphVersion: snapshot.graphVersion, evidenceVersion: snapshot.evidenceVersion, fetchedAt: snapshot.snapshotFetchedAt,
  audit: { ...audit, rejected: audit.rejected.reduce<Record<string, number>>((r, item) => { r[item.reason] = (r[item.reason] ?? 0) + 1; return r; }, {}) },
  coverage: { ...coverage, skipped: coverage.skipped.length }, places: snapshot.places, pairs };
if (process.argv[2]) await writeFile(process.argv[2], JSON.stringify(report, null, 2) + '\n');
else console.log(JSON.stringify(report, null, 2));
