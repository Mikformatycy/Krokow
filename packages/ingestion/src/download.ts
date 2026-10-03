import { MAX_BYTES } from './osm';

export const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';
export interface DownloadOptions {
  fetch?: typeof globalThis.fetch;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
  timeoutMs?: number;
}
export class DownloadError extends Error {
  constructor(readonly code: 'rate_limited' | 'upstream_error' | 'network_or_timeout' | 'invalid_response' | 'too_large', readonly retryAfterMs?: number) {
    super(`OSM download failed: ${code}`);
  }
}
function retryAfter(header: string | null, now: number): number | undefined {
  if (header === null) return undefined;
  const value = /^\d+$/.test(header) ? Number(header) * 1000 : Date.parse(header) - now;
  return Number.isFinite(value) ? Math.max(0, value) : undefined;
}
export async function downloadOsm(query: string, options: DownloadOptions = {}): Promise<Uint8Array> {
  const fetcher = options.fetch ?? globalThis.fetch;
  const sleep = options.sleep ?? (async ms => { await new Promise(resolve => setTimeout(resolve, ms)); });
  const now = options.now ?? Date.now;
  const timeoutMs = options.timeoutMs ?? 40_000;
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1 || timeoutMs > 60_000) throw new Error('Invalid download timeout');
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let error: DownloadError;
    try {
      const response = await fetcher(OVERPASS_ENDPOINT, { method: 'POST', signal: controller.signal, redirect: 'error',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Krokow-prototype/0.0 (https://github.com/Mikformatycy/Krokow)' },
        body: new URLSearchParams({ data: query }) });
      if (!response.ok) {
        await response.body?.cancel();
        if (response.status === 429) throw new DownloadError('rate_limited', retryAfter(response.headers.get('retry-after'), now()));
        if ([502, 503, 504].includes(response.status)) throw new DownloadError('upstream_error', retryAfter(response.headers.get('retry-after'), now()));
        throw new DownloadError('invalid_response');
      }
      if (!response.headers.get('content-type')?.toLowerCase().includes('application/json')) { await response.body?.cancel(); throw new DownloadError('invalid_response'); }
      if (Number(response.headers.get('content-length')) > MAX_BYTES) { await response.body?.cancel(); throw new DownloadError('too_large'); }
      if (!response.body) throw new DownloadError('invalid_response');
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let length = 0;
      try {
        while (true) {
          const result = await reader.read();
          if (result.done) break;
          const chunk: unknown = result.value;
          if (!(chunk instanceof Uint8Array)) throw new DownloadError('invalid_response');
          length += chunk.byteLength;
          if (length > MAX_BYTES) { await reader.cancel(); throw new DownloadError('too_large'); }
          chunks.push(chunk);
        }
      } finally { reader.releaseLock(); }
      return Buffer.concat(chunks, length);
    } catch (caught) {
      error = caught instanceof DownloadError ? caught : new DownloadError('network_or_timeout');
    } finally { clearTimeout(timeout); }
    const wait = Math.max(2000 * (attempt + 1), error.retryAfterMs ?? 0);
    if (attempt === 1 || wait > 60_000 || !['rate_limited', 'upstream_error', 'network_or_timeout'].includes(error.code)) throw error;
    await sleep(wait);
  }
  throw new Error('Unreachable download state');
}
