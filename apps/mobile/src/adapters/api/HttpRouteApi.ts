import { ApiErrorSchema, CoverageResponseSchema, ERROR_HTTP_STATUS, PlacesQuerySchema, PlacesResponseSchema, RouteRequestSchema } from '@krok/contracts';
import type { CoverageResponse, PlacesResponse, RouteRequest, RouteResponse } from '@krok/contracts';
import { InvalidResponse, parseDemoResponse, RouteFailure } from './MockRouteApi';
import type { RouteApi } from './MockRouteApi';

export class TransportUnavailable extends Error {}
export class RequestTimeout extends Error {}

/** Explicit HTTP transport. Never substitutes fixtures for a failed request. */
export class HttpRouteApi implements RouteApi {
  private readonly base: string;
  constructor(baseUrl: string, private readonly fetcher: typeof fetch = fetch, private readonly timeoutMs = 8000) {
    const url = new URL(baseUrl);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('Invalid API origin');
    this.base = url.origin;
  }
  private async send(path: string, body?: RouteRequest): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      // Browser fetch must not receive the adapter instance as its Window receiver.
      const fetcher = this.fetcher;
      const response = await fetcher(this.base + path, {
        method: body ? 'POST' : 'GET', signal: controller.signal, credentials: 'omit',
        headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      if (!response.headers.get('content-type')?.includes('application/json')) throw new InvalidResponse();
      let value: unknown;
      try { value = await response.json(); } catch { throw new InvalidResponse(); }
      if (response.status !== 200) {
        const error = ApiErrorSchema.safeParse(value);
        if (!error.success || response.status !== ERROR_HTTP_STATUS[error.data.error.code]) throw new InvalidResponse();
        throw new RouteFailure(error.data);
      }
      return value;
    } catch (error) {
      if (controller.signal.aborted) throw new RequestTimeout();
      if (error instanceof InvalidResponse || error instanceof RouteFailure) throw error;
      throw new TransportUnavailable();
    } finally { clearTimeout(timer); }
  }
  async coverage(): Promise<CoverageResponse> {
    const result = CoverageResponseSchema.safeParse(await this.send('/v1/coverage'));
    if (!result.success || result.data.mode !== 'synthetic' || result.data.navigationEligibility !== 'preview_only') throw new InvalidResponse();
    return result.data;
  }
  async places(cityId: string, query: string): Promise<PlacesResponse> {
    const input = PlacesQuerySchema.parse({ cityId, query });
    const result = PlacesResponseSchema.safeParse(await this.send(`/v1/places?cityId=${encodeURIComponent(input.cityId)}&query=${encodeURIComponent(input.query)}`));
    if (!result.success || result.data.cityId !== cityId || result.data.mode !== 'synthetic' || result.data.navigationEligibility !== 'preview_only') throw new InvalidResponse();
    return result.data;
  }
  async plan(input: RouteRequest): Promise<RouteResponse> {
    const request = RouteRequestSchema.parse(input);
    const result = parseDemoResponse(await this.send('/v1/routes', request));
    if (result.dataContext.cityId !== request.cityId || result.routes.length > request.maxAlternatives
      || result.routes.some((r) => r.metrics.distanceM > result.baseline.distanceM * request.preferences.maxDetourRatio + .001)) throw new InvalidResponse();
    if (request.expectedVersions && (['graphVersion', 'evidenceVersion', 'policyVersion'] as const).some((key) => result.dataContext[key] !== request.expectedVersions?.[key])) throw new InvalidResponse();
    if (request.maxAlternatives >= 2 && !result.routes.some((r) => Math.abs(r.metrics.distanceM - result.baseline.distanceM) < .001)) throw new InvalidResponse();
    for (const route of result.routes) for (const event of route.events) {
      if (request.preferences.audibleRequirement === 'none') continue;
      const fact = event.facts.audible_signal;
      if (fact.state !== 'known' || !fact.value) throw new InvalidResponse();
      if (request.preferences.audibleRequirement === 'field_verified_recent') {
        const age = fact.verifiedAt === null ? NaN : Date.parse(result.asOf) - Date.parse(fact.verifiedAt);
        if (fact.reliability !== 'field_verified' || fact.freshness !== 'recent' || !Number.isFinite(age) || age < 0 || age > result.policy.fieldVerificationMaxAgeDays * 86400000) throw new InvalidResponse();
      }
    }
    return result;
  }
}
