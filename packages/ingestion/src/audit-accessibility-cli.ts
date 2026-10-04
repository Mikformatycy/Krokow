import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { createPlanner, PILOT_POLICY } from '@krok/routing';
import { loadKrakowPrototype } from './krakow-prototype';
import { extractHighways } from './map-extract';
import { normalize } from './normalize';
import { sha256 } from './osm';
import { accessibilityAudit } from './accessibility-audit';

const { snapshot, audit } = await loadKrakowPrototype(); // Validates archived checksum first.
const raw = gunzipSync(await readFile(new URL('../data/krakow-prototype/raw-map.json.gz', import.meta.url)));
const { elements } = extractHighways(raw);
const normalized = normalize(elements, snapshot.snapshotFetchedAt);
const planner = createPlanner(snapshot, PILOT_POLICY, () => 0); // Repeatable audit: operation budget, not host timing.
const pairs = [[3719851597, 5213212813], [14121238341, 6128078603], [278057644, 279117089]] as const;
const responses = pairs.map(([from, to]) => planner.plan({ cityId: snapshot.cityId,
  origin: { kind: 'place', placeId: `osm-place-${from}` }, destination: { kind: 'place', placeId: `osm-place-${to}` },
  locale: 'pl-PL', maxAlternatives: 1, preferences: { preferAudibleSignals: true, preferTactilePaving: true,
    preferSeparatedFootways: true, avoidKnownSteps: true, audibleRequirement: 'none', maxDetourRatio: 1.6 },
}, { requestId: `audit-${from}-${to}`, asOf: snapshot.snapshotFetchedAt }));
const report = { auditVersion: 1, input: 'krakow-prototype/raw-map.json.gz', rawSha256: sha256(raw),
  limitations: ['Archive audit, not field verification', 'City search POIs are not route infrastructure', 'Older pilot archive is not merged with current snapshot'],
  ...accessibilityAudit(elements, snapshot, responses),
  skippedNormalization: normalized.coverage.skipped,
  topologyExclusions: audit.rejected.reduce<Record<string, number>>((out, item) => { out[item.reason] = (out[item.reason] ?? 0) + 1; return out; }, {}),
};
const output = process.argv[2];
if (output) { await mkdir(dirname(output), { recursive: true }); await writeFile(output, JSON.stringify(report, null, 2) + '\n'); }
else console.log(JSON.stringify(report, null, 2));
