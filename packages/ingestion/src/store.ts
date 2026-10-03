import { mkdir, open, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { UtcSchema } from '@krok/contracts';
import { downloadOsm, DownloadError, type DownloadOptions } from './download';
import { normalize } from './normalize';
import { ADAPTER_VERSION, contentId, elementKey, parseOsm, queryFor, sha256, validateBbox, type Bbox, type OsmElement } from './osm';

interface Current { snapshotId: string; snapshotSha256: string; highwayWays: number; bbox: Bbox }
const hashPattern = /^[a-f0-9]{64}$/;
function missing(error: unknown): boolean { return error instanceof Error && 'code' in error && error.code === 'ENOENT'; }
export async function readCurrent(root: string): Promise<(Current & { elements: OsmElement[] }) | null> {
  let body: string;
  try { body = await readFile(join(root, 'current.json'), 'utf8'); }
  catch (error) { if (missing(error)) return null; throw error; }
  const value: unknown = JSON.parse(body);
  if (!value || typeof value !== 'object' || !('snapshotId' in value) || typeof value.snapshotId !== 'string' || !hashPattern.test(value.snapshotId)
    || !('snapshotSha256' in value) || typeof value.snapshotSha256 !== 'string' || !hashPattern.test(value.snapshotSha256)
    || !('highwayWays' in value) || typeof value.highwayWays !== 'number' || !Number.isSafeInteger(value.highwayWays) || value.highwayWays < 1
    || !('bbox' in value) || !Array.isArray(value.bbox) || value.bbox.length !== 4 || value.bbox.some(v => typeof v !== 'number')) throw new Error('Invalid current snapshot pointer');
  const bbox = validateBbox(value.bbox as unknown as Bbox);
  const snapshot = await readFile(join(root, 'snapshots', value.snapshotId, 'snapshot.json'));
  if (sha256(snapshot) !== value.snapshotSha256) throw new Error('Current snapshot checksum mismatch');
  const stored: unknown = JSON.parse(snapshot.toString('utf8'));
  if (!stored || typeof stored !== 'object' || !('elements' in stored)) throw new Error('Invalid stored snapshot');
  const elements = parseOsm(Buffer.from(JSON.stringify({ elements: stored.elements })));
  if (contentId(elements, bbox) !== value.snapshotId || elements.filter(e => e.type === 'way' && e.tags.highway).length !== value.highwayWays) throw new Error('Current snapshot identity mismatch');
  return { snapshotId: value.snapshotId, snapshotSha256: value.snapshotSha256, highwayWays: value.highwayWays, bbox, elements };
}
export interface ImportOptions {
  root: string; bbox: Bbox; clock: () => string;
  download?: DownloadOptions;
  /** Offline replay still records the ORIGINAL acquisition date supplied by the operator. */
  raw?: { bytes: Uint8Array; fetchedAt: string };
}

/** Local staging only. No database migration or change to the running API. */
export async function importOsm(options: ImportOptions) {
  const query = queryFor(options.bbox);
  await mkdir(options.root, { recursive: true });
  const lockPath = join(options.root, 'import.lock');
  const lock = await open(lockPath, 'wx'); // A concurrent import cannot overwrite our pointer.
  const runId = randomUUID();
  const runPath = join(options.root, 'runs', runId);
  let rawSha256: string | null = null;
  try {
    await mkdir(runPath, { recursive: true });
    const startedAt = UtcSchema.parse(options.clock());
    await writeFile(join(runPath, 'query.overpassql'), query);
    const current = await readCurrent(options.root);
    if (current && JSON.stringify(current.bbox) !== JSON.stringify(options.bbox)) throw new Error('Use a separate store for a different bbox');
    const bytes = options.raw?.bytes ?? await downloadOsm(query, options.download);
    const fetchedAt = UtcSchema.parse(options.raw?.fetchedAt ?? options.clock());
    const completedAt = UtcSchema.parse(options.clock());
    if (Date.parse(fetchedAt) > Date.parse(completedAt)) throw new Error('Acquisition date is in the future');
    rawSha256 = sha256(bytes);
    await writeFile(join(runPath, 'raw.json'), bytes);
    const elements = parseOsm(bytes);
    const [south, west, north, east] = options.bbox;
    if (!elements.some(e => e.type === 'node' && e.lat >= south && e.lat <= north && e.lon >= west && e.lon <= east)) throw new Error('No nodes inside requested bbox');
    if (current) {
      const previous = new Map(current.elements.map(e => [elementKey(e), e]));
      for (const element of elements) {
        const prior = previous.get(elementKey(element));
        if (prior && (element.version < prior.version || (element.version === prior.version && JSON.stringify(element) !== JSON.stringify(prior)))) throw new Error('OSM version regressed or changed without a revision');
      }
    }
    const normalized = normalize(elements, fetchedAt);
    if (normalized.coverage.highwayWays === 0) throw new Error('No highway ways in candidate snapshot');
    if (current && (normalized.coverage.highwayWays < current.highwayWays * 0.5 || normalized.coverage.highwayWays > current.highwayWays * 2)) throw new Error('Large coverage change requires operator review; current snapshot preserved');
    const snapshotId = contentId(elements, options.bbox);
    const outcome = current?.snapshotId === snapshotId ? 'unchanged' : 'staged';
    const snapshot = { adapterVersion: ADAPTER_VERSION, snapshotId, bbox: options.bbox, fetchedAt, rawSha256,
      fieldNavigationAllowed: false, purpose: 'ingestion_audit_only', elements, ...normalized };
    const candidate = JSON.stringify(snapshot, null, 2) + '\n';
    // Every run is retained, even repeated downloads; original snapshot dates stay unchanged.
    await writeFile(join(runPath, 'candidate.json'), candidate);
    await writeFile(join(runPath, 'manifest.json'), JSON.stringify({ runId, startedAt, completedAt, fetchedAt,
      adapterVersion: ADAPTER_VERSION, rawSha256, snapshotId, outcome, attribution: normalized.source.attribution,
      license: normalized.source.license, acquisition: options.raw ? 'operator_file' : 'overpass', coverage: normalized.coverage }, null, 2) + '\n');
    if (outcome === 'staged') {
      const directory = join(options.root, 'snapshots', snapshotId);
      await mkdir(directory, { recursive: true });
      const snapshotPath = join(directory, 'snapshot.json');
      // A previously staged semantic version is immutable, including acquisition metadata.
      try { await writeFile(snapshotPath, candidate, { flag: 'wx' }); }
      catch (error) { if (!(error instanceof Error && 'code' in error && error.code === 'EEXIST')) throw error; }
      const stored = await readFile(snapshotPath);
      // Recovering an older semantic version uses its original bytes, not a new fetch date.
      const prior: unknown = JSON.parse(stored.toString('utf8'));
      if (!prior || typeof prior !== 'object' || !('snapshotId' in prior) || prior.snapshotId !== snapshotId
        || !('elements' in prior) || JSON.stringify(prior.elements) !== JSON.stringify(elements)) throw new Error('Stored snapshot integrity mismatch');
      const pointer: Current = { snapshotId, snapshotSha256: sha256(stored), highwayWays: normalized.coverage.highwayWays, bbox: options.bbox };
      const temporaryPointer = join(options.root, `current-${runId}.tmp`);
      await writeFile(temporaryPointer, JSON.stringify(pointer, null, 2) + '\n', { flag: 'wx' });
      await rename(temporaryPointer, join(options.root, 'current.json'));
    }
    return { outcome, snapshotId, runId, coverage: normalized.coverage, fetchedAt };
  } catch (error) {
    // No upstream text or coordinates in failure logs; raw response remains local to the run.
    const code = error instanceof DownloadError ? error.code : 'validation_or_storage_failure';
    await writeFile(join(runPath, 'failure.json'), JSON.stringify({ runId, rawSha256, code, currentPreserved: true }) + '\n').catch(() => undefined);
    throw error;
  } finally { await lock.close(); await unlink(lockPath); }
}
