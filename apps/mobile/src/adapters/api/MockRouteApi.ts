import { ApiErrorSchema, CoverageResponseSchema, PlacesQuerySchema, PlacesResponseSchema, RouteRequestSchema, RouteResponseSchema } from '@krok/contracts';
import type { ApiError, CoverageResponse, PlacesResponse, RouteRequest, RouteResponse } from '@krok/contracts';
import { coverageResponse, errorScenarios, placesResponse, routeRequest, routeScenarios } from '@krok/contracts/fixtures';

export interface RouteApi {
  coverage(): Promise<CoverageResponse>;
  places(cityId: string, query: string): Promise<PlacesResponse>;
  plan(request: RouteRequest): Promise<RouteResponse>;
}

export class DemoUnavailable extends Error {}
export class InvalidResponse extends Error {}
export class RouteFailure extends Error {
  constructor(readonly response: ApiError) { super(response.error.code); }
}

export function parseDemoResponse(value: unknown): RouteResponse {
  const parsed = RouteResponseSchema.safeParse(value);
  if (!parsed.success || parsed.data.mode !== 'synthetic' || parsed.data.navigationEligibility !== 'preview_only') {
    throw new InvalidResponse();
  }
  return parsed.data;
}

// Parse both sides first: Zod gives a stable field order and an independent copy.
function matches(left: RouteRequest, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(RouteRequestSchema.parse(right));
}

export function demoRequest(): RouteRequest { return RouteRequestSchema.parse(routeRequest); }

export class MockRouteApi implements RouteApi {
  coverage(): Promise<CoverageResponse> {
    return Promise.resolve(CoverageResponseSchema.parse(coverageResponse));
  }

  places(cityId: string, query: string): Promise<PlacesResponse> {
    const input = PlacesQuerySchema.parse({ cityId, query });
    if (input.cityId !== placesResponse.cityId) return Promise.reject(new DemoUnavailable());
    const catalog = PlacesResponseSchema.parse(placesResponse);
    const needle = input.query.toLocaleLowerCase('pl-PL');
    return Promise.resolve(PlacesResponseSchema.parse({ ...catalog,
      places: catalog.places.filter((place) => `${place.name} ${place.description}`.toLocaleLowerCase('pl-PL').includes(needle)),
    }));
  }

  plan(input: RouteRequest): Promise<RouteResponse> {
    const request = RouteRequestSchema.parse(input);
    if (request.origin.kind === 'place' && request.destination.kind === 'place' && request.origin.placeId === request.destination.placeId) {
      const same = errorScenarios.find((scenario) => scenario.id === 'SAME_ENDPOINT');
      if (!same) throw new InvalidResponse();
      return Promise.reject(new RouteFailure(ApiErrorSchema.parse(same.response)));
    }
    // Other success fixtures describe alternate data conditions for the same input.
    // They must not be selected accidentally by array order or changed preferences.
    const scenario = routeScenarios.find((item) => ['abc', 'single'].includes(item.id) && matches(request, item.request));
    if (scenario) return Promise.resolve(parseDemoResponse(scenario.response));
    const noMatch = errorScenarios.find((item) => item.id === 'NO_MATCHING_ROUTE' && matches(request, item.request));
    if (noMatch) return Promise.reject(new RouteFailure(ApiErrorSchema.parse(noMatch.response)));
    return Promise.reject(new DemoUnavailable());
  }
}
