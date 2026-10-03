import { z } from 'zod';
import { SCHEMA_VERSION, IdSchema, RouteRequestSchema } from './common';
import { ApiErrorSchema, ERROR_HTTP_STATUS } from './errors';
import { BooleanFactSchema, EvidenceSchema, PublicSourceSchema, TactileFactSchema } from './evidence';
import { RouteResponseSchema } from './routes';
import { CoverageResponseSchema, FeatureEvidenceResponseSchema, HealthResponseSchema, PlacesQuerySchema, PlacesResponseSchema, ReadyResponseSchema, SourcesResponseSchema } from './catalog';

export const publicSchemas = {
  RouteRequest: RouteRequestSchema, RouteResponse: RouteResponseSchema, ApiError: ApiErrorSchema,
  CoverageResponse: CoverageResponseSchema, PlacesQuery: PlacesQuerySchema, PlacesResponse: PlacesResponseSchema,
  SourcesResponse: SourcesResponseSchema, FeatureEvidenceResponse: FeatureEvidenceResponseSchema,
  HealthResponse: HealthResponseSchema, ReadyResponse: ReadyResponseSchema,
  BooleanFact: BooleanFactSchema, TactileFact: TactileFactSchema, Evidence: EvidenceSchema, PublicSource: PublicSourceSchema,
};
type SchemaName = keyof typeof publicSchemas;
const json = (name: SchemaName) => ({ 'application/json': { schema: { $ref: `#/components/schemas/${name}` } } });
const response = (name: SchemaName, description: string) => ({ description, content: json(name) });
const errors = Object.fromEntries([...new Set(Object.values(ERROR_HTTP_STATUS))].map((status) => [status, {
  ...response('ApiError', Object.entries(ERROR_HTTP_STATUS).filter(([, http]) => http === status).map(([code]) => code).join(', ')),
  ...(status === 429 ? { headers: { 'Retry-After': { description: 'Seconds before retry; matches error.details.retryAfterSec', schema: { type: 'integer', minimum: 1 } } } } : {}),
}]));

/** Only transport metadata is authored here. All payload/parameter shapes come from Zod. */
export function createOpenApiDocument() {
  const schemas = Object.fromEntries(Object.entries(publicSchemas).map(([name, schema]) => {
    const result = z.toJSONSchema(schema, { target: 'draft-2020-12', unrepresentable: 'throw' });
    delete result.$schema;
    return [name, result];
  }));
  return {
    openapi: '3.1.0', info: { title: 'Kroków — API draft', version: SCHEMA_VERSION, description: 'Draft for A+B review. Schemas do not imply deployed endpoints. Cross-field and catalog reference constraints require the exported Zod validators.' },
    paths: {
      '/healthz': { get: { operationId: 'health', responses: { '200': response('HealthResponse', 'Process live') } } },
      '/readyz': { get: { operationId: 'ready', responses: { '200': response('ReadyResponse', 'Ready'), '503': response('ReadyResponse', 'Not ready') } } },
      '/v1/coverage': { get: { operationId: 'coverage', responses: { '200': response('CoverageResponse', 'Text and spatial coverage'), ...errors } } },
      '/v1/places': { get: { operationId: 'places', parameters: Object.entries(PlacesQuerySchema.shape).map(([name, schema]) => ({
        name, in: 'query', required: true, schema: z.toJSONSchema(schema, { target: 'draft-2020-12' }),
      })), responses: { '200': response('PlacesResponse', 'Up to ten catalog places'), ...errors } } },
      '/v1/routes': { post: { operationId: 'routes', requestBody: { required: true, content: json('RouteRequest') },
        responses: { '200': { ...response('RouteResponse', 'One to three routes'), headers: { 'Cache-Control': { schema: { type: 'string', const: 'no-store' } } } }, ...errors } } },
      '/v1/sources': { get: { operationId: 'sources', responses: { '200': response('SourcesResponse', 'Public sources'), ...errors } } },
      '/v1/features/{id}/evidence': { get: { operationId: 'featureEvidence', parameters: [{ name: 'id', in: 'path', required: true, schema: z.toJSONSchema(IdSchema) }], responses: { '200': response('FeatureEvidenceResponse', 'Published redacted observations only'), ...errors } } },
      '/openapi.json': { get: { operationId: 'openapi', responses: { '200': { description: 'Generated OpenAPI 3.1 document' } } } },
    },
    components: { schemas },
  };
}
