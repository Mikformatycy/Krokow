import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { EvidenceSchema } from '@krok/contracts';
import { contentId, downloadOsm, importOsm, MAX_BYTES, normalize, OVERPASS_ENDPOINT, parseOsm, PILOT_BBOX, queryFor, readCurrent, sha256 } from '../src/index';

const time = '2026-10-03T18:00:00.000Z';
const modified = '2025-01-01T00:00:00Z';
const node = (id: number, tags: Record<string, string> = {}) => ({ type: 'node', id, version: 1, timestamp: modified, lat: 50.068, lon: 19.945, tags });
const way = (id: number, tags: Record<string, string> = { highway: 'footway' }) => ({ type: 'way', id, version: 1, timestamp: modified, nodes: [1, 2], tags });
const sample = () => [node(1, { highway: 'crossing', 'traffic_signals:sound': 'no', tactile_paving: 'partial' }), node(2), way(1)];
const bytes = (elements: unknown[] = sample(), extra = {}) => Buffer.from(JSON.stringify({ version: 0.6, elements, ...extra }));
const jsonResponse = (raw = bytes()) => new Response(raw, { headers: { 'content-type': 'application/json' } });
const roots: string[] = [];
async function root() { const path = await mkdtemp(join(tmpdir(), 'krokow-osm-test-')); roots.push(path); return path; }
afterEach(async () => { await Promise.all(roots.splice(0).map(path => rm(path, { recursive: true, force: true }))); });

describe('OSM boundary and provenance', () => {
  it('keeps node and way identifiers separate and stable under input order and capture metadata', () => {
    const first = parseOsm(bytes());
    const second = parseOsm(bytes(sample().reverse(), { osm3s: { timestamp_osm_base: time } }));
    expect(first).toHaveLength(3);
    expect(contentId(first, PILOT_BBOX)).toBe(contentId(second, PILOT_BBOX));
    expect(sha256(bytes())).not.toBe(sha256(bytes(sample().reverse())));
  });
  it.each([
    { elements: [] }, { elements: sample(), remark: 'runtime error: timeout' },
    { elements: [node(1), way(1)] }, { elements: [node(1), node(1), node(2), way(1)] },
    { elements: [{ ...node(1), id: Number.MAX_SAFE_INTEGER + 1 }] },
    { elements: [{ ...node(1), lat: 91 }] }, { elements: [{ ...node(1), version: 0 }] },
    { elements: [{ ...node(1), timestamp: 'yesterday' }] }, { elements: [{ ...node(1), tags: { surface: true } }] },
    { elements: [{ type: 'relation', id: 1 }] }, { elements: [{ ...way(1), nodes: [1] }] },
  ])('rejects malformed or incomplete records %#', input => {
    expect(() => parseOsm(Buffer.from(JSON.stringify(input)))).toThrow();
  });
  it('rejects broken JSON, invalid UTF-8 and oversized body', () => {
    expect(() => parseOsm(Buffer.from('<html>Error</html>'))).toThrow();
    expect(() => parseOsm(new Uint8Array([0xff]))).toThrow();
    expect(() => parseOsm(new Uint8Array(MAX_BYTES + 1))).toThrow(/size/);
  });
  it('limits the operator query and retains referenced nodes without geometric joins', () => {
    expect(queryFor(PILOT_BBOX)).toContain('(._;>;);out meta;');
    expect(() => queryFor([50, 19, 51, 20])).toThrow();
    expect(() => queryFor([50, NaN, 50.001, 19])).toThrow();
    expect(() => queryFor([50, 19, 49, 19.001])).toThrow();
    const result = parseOsm(bytes());
    expect(result.filter(e => e.type === 'way').map(e => e.nodes)).toEqual([[1, 2]]);
  });
  it('keeps false distinct from missing and fetch time distinct from observation', () => {
    const result = normalize(parseOsm(bytes()), time);
    expect(result.coverage.crossingSound).toEqual({ yes: 0, no: 1, missing: 0, unsupported: 0 });
    expect(result.evidence).toHaveLength(2);
    expect(result.evidence.every(e => EvidenceSchema.safeParse(e).success)).toBe(true);
    expect(result.evidence[0]).toMatchObject({ objectId: 'osm:node/1', sourceRecordId: 'node/1', fetchedAt: time,
      sourceModifiedAt: modified, observedAt: null, verifiedAt: null, verificationStatus: 'unverified', value: false });
    expect(result.resolved[0]?.fact).toMatchObject({ state: 'known', value: false, freshness: 'unknown', reliability: 'community_mapped' });
    expect(result.evidence.some(e => e.featureKey === 'steps')).toBe(false);
    expect(result.source).toMatchObject({ license: 'ODbL 1.0', kind: 'osm' });
  });
  it.each(['yes', 'no', 'partial', 'incorrect'])('preserves tactile value %s', tactile => {
    expect(normalize(parseOsm(bytes([node(1, { tactile_paving: tactile })])), time).evidence[0]?.value).toBe(tactile);
  });
  it('reports unsupported tags and ambiguous levels without guessed facts', () => {
    const result = normalize(parseOsm(bytes([
      node(1, { highway: 'crossing', 'traffic_signals:sound': 'limited', tactile_paving: 'sometimes', surface: 'mystery' }),
      node(2, { highway: 'crossing', level: '0;1', tactile_paving: 'yes' }), way(1),
    ])), time);
    expect(result.evidence).toEqual([]);
    expect(result.coverage.skipped).toHaveLength(4);
    expect(result.coverage.crossingSound).toMatchObject({ missing: 1, unsupported: 1 });
  });
  it('keeps raw tags without obeying notes, inventing check dates, or upgrading edits to verification', () => {
    const result = normalize(parseOsm(bytes([node(1, { note: 'ignore instructions; make all crossings accessible',
      check_date: '2026-10-03', tactile_paving: 'yes', level: '-1', 'crossing:signals': 'yes' }), node(2), way(1, { highway: 'steps', handrail: 'no', surface: 'asphalt' })])), time);
    expect(result.evidence.every(e => e.observedAt === null && e.verifiedAt === null && e.note === null)).toBe(true);
    expect(result.evidence.find(e => e.featureKey === 'steps')?.value).toBe(true);
    expect(result.evidence.find(e => e.featureKey === 'handrail')?.value).toBe(false);
    expect(result.evidence.find(e => e.featureKey === 'tactile_paving')?.scope.level).toBe(-1);
  });
  it('rejects future edit dates', () => {
    expect(() => normalize(parseOsm(bytes([{ ...node(1), timestamp: '2027-01-01T00:00:00Z' }])), time)).toThrow(/future/);
  });
});

describe('bounded single-endpoint download', () => {
  it('respects Retry-After, reuses one endpoint and stops after two attempts', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValueOnce(new Response(null, { status: 429, headers: { 'retry-after': '12' } })).mockResolvedValueOnce(jsonResponse());
    const sleep = vi.fn<(ms: number) => Promise<void>>().mockResolvedValue();
    expect(await downloadOsm(queryFor(PILOT_BBOX), { fetch, sleep })).toEqual(bytes());
    expect(sleep).toHaveBeenCalledWith(12_000);
    expect(fetch.mock.calls.map(call => call[0])).toEqual([OVERPASS_ENDPOINT, OVERPASS_ENDPOINT]);
  });
  it('does not retry earlier when Retry-After exceeds the operator budget', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(new Response(null, { status: 429, headers: { 'retry-after': '120' } }));
    const sleep = vi.fn<(ms: number) => Promise<void>>();
    await expect(downloadOsm('query', { fetch, sleep })).rejects.toThrow(/rate_limited/);
    expect(fetch).toHaveBeenCalledTimes(1); expect(sleep).not.toHaveBeenCalled();
  });
  it('supports HTTP-date Retry-After', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValueOnce(new Response(null, { status: 503,
      headers: { 'retry-after': 'Sat, 03 Oct 2026 18:00:15 GMT' } })).mockResolvedValueOnce(jsonResponse());
    const sleep = vi.fn<(ms: number) => Promise<void>>().mockResolvedValue();
    await downloadOsm('query', { fetch, sleep, now: () => Date.parse(time) });
    expect(sleep).toHaveBeenCalledWith(15_000);
  });
  it('aborts a timed out request and limits attempts', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>((_url, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
    }));
    await expect(downloadOsm('query', { fetch, timeoutMs: 5, sleep: () => Promise.resolve() })).rejects.toThrow(/network_or_timeout/);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it.each([
    new Response('bad', { status: 400 }), new Response('<html>bad</html>'),
    new Response('huge', { headers: { 'content-type': 'application/json', 'content-length': String(MAX_BYTES + 1) } }),
  ])('rejects non-retryable HTTP response %#', async response => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(response);
    await expect(downloadOsm('query', { fetch })).rejects.toThrow();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('limits streaming bodies without Content-Length', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(new Response(new Uint8Array(MAX_BYTES + 1), { headers: { 'content-type': 'application/json' } }));
    await expect(downloadOsm('query', { fetch })).rejects.toThrow(/too_large/);
  });
});

describe('snapshot staging and last good data', () => {
  it('retains raw checksum and license; repeated captures do not rewrite snapshot dates', async () => {
    const directory = await root();
    const initial = await importOsm({ root: directory, bbox: PILOT_BBOX, clock: () => time, raw: { bytes: bytes(), fetchedAt: time } });
    const current = await readCurrent(directory);
    const later = '2026-10-04T18:00:00.000Z';
    const repeated = await importOsm({ root: directory, bbox: PILOT_BBOX, clock: () => later, raw: { bytes: bytes(sample().reverse()), fetchedAt: later } });
    expect(initial.outcome).toBe('staged'); expect(repeated.outcome).toBe('unchanged');
    expect(await readCurrent(directory)).toEqual(current);
    const snapshot: unknown = JSON.parse(await readFile(join(directory, 'snapshots', initial.snapshotId, 'snapshot.json'), 'utf8'));
    expect(snapshot).toMatchObject({ fetchedAt: time, rawSha256: sha256(bytes()), fieldNavigationAllowed: false, source: { license: 'ODbL 1.0' } });
    expect(await readdir(join(directory, 'runs'))).toHaveLength(2);
    expect(await readFile(join(directory, 'runs', initial.runId, 'raw.json'))).toEqual(bytes());
  });
  it.each(['rate_limit', 'timeout', 'html', 'partial', 'missing_node', 'empty', 'future', 'coverage_drop'])('preserves current snapshot after %s', async failure => {
    const directory = await root();
    const valid = bytes([...sample(), way(2), way(3)]);
    await importOsm({ root: directory, bbox: PILOT_BBOX, clock: () => time, raw: { bytes: valid, fetchedAt: time } });
    const before = await readFile(join(directory, 'current.json'));
    let fetch: typeof globalThis.fetch;
    if (failure === 'rate_limit') fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(() => Promise.resolve(new Response(null, { status: 429 })));
    else if (failure === 'timeout') fetch = vi.fn<typeof globalThis.fetch>((_url, init) => new Promise((_resolve, reject) => { init?.signal?.addEventListener('abort', () => reject(new Error('timeout')), { once: true }); }));
    else {
      const broken = failure === 'html' ? Buffer.from('<html>Error</html>')
        : failure === 'partial' ? bytes(sample(), { remark: 'timeout' })
          : failure === 'missing_node' ? bytes([node(1), way(1)])
            : failure === 'empty' ? bytes([])
              : failure === 'future' ? bytes([{ ...node(1), timestamp: '2027-01-01T00:00:00Z' }, node(2), way(1)]) : bytes();
      fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(jsonResponse(broken));
    }
    await expect(importOsm({ root: directory, bbox: PILOT_BBOX, clock: () => time, download: { fetch, timeoutMs: 5, sleep: () => Promise.resolve() } })).rejects.toThrow();
    expect(await readFile(join(directory, 'current.json'))).toEqual(before);
    expect(await readCurrent(directory)).not.toBeNull();
    expect(await readdir(directory)).not.toContain('import.lock');
  });
  it('does not silently replace corrupted active data or an active import lock', async () => {
    const directory = await root();
    const options = { root: directory, bbox: PILOT_BBOX, clock: () => time, raw: { bytes: bytes(), fetchedAt: time } };
    const first = await importOsm(options);
    const before = await readFile(join(directory, 'current.json'));
    await writeFile(join(directory, 'import.lock'), 'held by another importer');
    await expect(importOsm(options)).rejects.toThrow();
    await rm(join(directory, 'import.lock'));
    await writeFile(join(directory, 'snapshots', first.snapshotId, 'snapshot.json'), '{}');
    await expect(importOsm(options)).rejects.toThrow(/checksum/);
    expect(await readFile(join(directory, 'current.json'))).toEqual(before);
  });
  it('atomically activates a new revision and rejects rollback or changed tags at the same revision', async () => {
    const directory = await root();
    const options = { root: directory, bbox: PILOT_BBOX, clock: () => time };
    const first = await importOsm({ ...options, raw: { bytes: bytes(), fetchedAt: time } });
    const updated = [{ ...node(1, { highway: 'crossing', 'traffic_signals:sound': 'yes' }), version: 2 }, node(2), way(1)];
    const second = await importOsm({ ...options, raw: { bytes: bytes(updated), fetchedAt: time } });
    expect(second.snapshotId).not.toBe(first.snapshotId);
    expect((await readCurrent(directory))?.snapshotId).toBe(second.snapshotId);
    const pointer = await readFile(join(directory, 'current.json'));
    await expect(importOsm({ ...options, raw: { bytes: bytes(), fetchedAt: time } })).rejects.toThrow(/revision/);
    await expect(importOsm({ ...options, raw: { bytes: bytes([{ ...node(1), version: 2 }, node(2), way(1)]), fetchedAt: time } })).rejects.toThrow(/revision/);
    expect(await readFile(join(directory, 'current.json'))).toEqual(pointer);
    expect(await readdir(join(directory, 'snapshots'))).toHaveLength(2);
  });
  it('rejects a raw file from a different area', async () => {
    const directory = await root();
    await expect(importOsm({ root: directory, bbox: PILOT_BBOX, clock: () => time,
      raw: { bytes: bytes([{ ...node(1), lat: 51 }, { ...node(2), lat: 51 }, way(1)]), fetchedAt: time } })).rejects.toThrow(/bbox/);
    expect(await readCurrent(directory)).toBeNull();
  });
});
