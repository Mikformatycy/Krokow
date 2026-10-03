import { randomUUID } from 'node:crypto';
import type { Writable } from 'node:stream';
import Fastify, { LogController } from 'fastify';
import cors from '@fastify/cors';
import {
  CoverageResponseSchema, FeatureEvidenceResponseSchema, HealthResponseSchema, IdSchema,
  PlacesQuerySchema, PlacesResponseSchema, ReadyResponseSchema, RouteRequestSchema,
  SCHEMA_VERSION, SourcesResponseSchema,
} from '@krok/contracts';
import { createOpenApiDocument } from '@krok/contracts/openapi';
import type { CatalogDataset } from './dataset';
import { validateDataset } from './dataset';
import { PublicError, publicError, readInput, sendError } from './errors';
import type { RoutePlanner } from './planner';
import { validatePlan } from './planner';

export interface ApiDependencies {
  dataset?: CatalogDataset;
  planner?: RoutePlanner;
  databaseReady: () => Promise<boolean>;
  clock?: () => Date;
  logStream?: Writable;
  logging?: boolean;
  allowedOrigins?: string[];
  readinessTimeoutMs?: number;
}

async function databaseCheck(probe: () => Promise<boolean>, timeoutMs: number): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve().then(probe).then((result) => result === true, () => false),
      new Promise<false>((resolve) => { timer = setTimeout(() => resolve(false), timeoutMs); }),
    ]);
  } finally { if (timer) clearTimeout(timer); }
}

export function buildApi(dependencies: ApiDependencies) {
  const dataset = dependencies.dataset ? validateDataset(dependencies.dataset) : undefined;
  const clock = dependencies.clock ?? (() => new Date());
  const openapi = createOpenApiDocument();
  const app = Fastify({
    bodyLimit: 16 * 1024, requestTimeout: 10_000, connectionTimeout: 10_000,
    trustProxy: false, requestIdHeader: false, genReqId: () => randomUUID(),
    logController: new LogController({ disableRequestLogging: true }),
    logger: dependencies.logging === false ? false : {
      level: 'info', ...(dependencies.logStream ? { stream: dependencies.logStream } : {}),
      // Defense in depth: framework error logs cannot serialize sensitive request/error objects.
      serializers: { req: () => ({}), res: () => ({}), err: () => ({ type: 'Error', message: 'Internal failure', stack: '' }) },
    },
  });
  app.register(cors, {
    origin: dependencies.allowedOrigins ?? [], methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'], exposedHeaders: ['X-Request-Id', 'Retry-After'], credentials: false,
  });
  app.addHook('onRequest', async (_request, reply) => {
    reply.header('Cache-Control', 'no-store');
    reply.header('X-Request-Id', _request.id);
  });
  app.addHook('onResponse', async (request, reply) => {
    const route = request.routeOptions.url;
    // Only static registered templates, never raw URL/query, headers, IP, preferences or exception text.
    const endpoint = route && Object.hasOwn(openapi.paths, route.replace(':id', '{id}')) ? route : 'unmatched';
    const method = ['GET', 'HEAD', 'POST', 'OPTIONS'].includes(request.method) ? request.method : 'OTHER';
    app.log.info({ event: 'http_response', requestId: request.id, endpoint, method, statusCode: reply.statusCode });
  });
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof PublicError) return sendError(reply, request.id, error);
    // Parse/media/body errors are client failures. Do not forward their raw message or input.
    const code = error instanceof Error && 'code' in error && typeof error.code === 'string' ? error.code : '';
    if (code.startsWith('FST_ERR_CTP_') || code === 'FST_ERR_BAD_URL') {
      return sendError(reply, request.id, publicError('VALIDATION_ERROR', { fields: [{ path: ['body'], code: 'invalid_value' }] }));
    }
    return sendError(reply, request.id, publicError('INTERNAL_ERROR', {}));
  });
  // Unknown paths have no public feature code in draft.2; return a sanitized transport 404.
  app.setNotFoundHandler((_request, reply) => reply.code(404).type('text/plain').send('Not found'));

  function requireDataset(cityId?: string): CatalogDataset {
    if (!dataset || cityId !== undefined && dataset.coverage.cityId !== cityId) throw publicError('SOURCE_UNAVAILABLE', { cityId: cityId ?? 'unconfigured' });
    return dataset;
  }
  app.get('/healthz', () => HealthResponseSchema.parse({ status: 'ok' }));
  app.get('/readyz', async (request, reply) => {
    let graph = false;
    try { graph = dataset !== undefined && dependencies.planner?.isReady() === true; } catch { /* unavailable */ }
    const checks = {
      database: await databaseCheck(dependencies.databaseReady, dependencies.readinessTimeoutMs ?? 1500),
      graph, contract: openapi.info.version === SCHEMA_VERSION,
    };
    const ready = checks.database && checks.graph && checks.contract;
    return reply.code(ready ? 200 : 503).send(ReadyResponseSchema.parse({
      schemaVersion: SCHEMA_VERSION, requestId: request.id, status: ready ? 'ready' : 'not_ready', checkedAt: clock().toISOString(), checks,
    }));
  });
  app.get('/v1/coverage', (request) => CoverageResponseSchema.parse({ ...requireDataset().coverage, requestId: request.id }));
  app.get('/v1/places', (request) => {
    const query = readInput(PlacesQuerySchema, request.query, 'query');
    const catalog = requireDataset(query.cityId);
    const search = query.query.toLocaleLowerCase('pl-PL');
    const places = catalog.places.places.filter((p) => search === '' || p.name.toLocaleLowerCase('pl-PL').includes(search)).slice(0, 10);
    return PlacesResponseSchema.parse({ ...catalog.places, requestId: request.id, places });
  });
  app.get('/v1/sources', (request) => SourcesResponseSchema.parse({ ...requireDataset().sources, requestId: request.id }));
  app.get<{ Params: { id: string } }>('/v1/features/:id/evidence', (request) => {
    const objectId = readInput(IdSchema, request.params.id, 'params');
    const catalog = requireDataset();
    return FeatureEvidenceResponseSchema.parse({
      schemaVersion: SCHEMA_VERSION, requestId: request.id, mode: catalog.coverage.mode,
      objectId, evidenceVersion: catalog.versions.evidenceVersion,
      evidence: catalog.evidence.filter((e) => e.objectId === objectId), sources: catalog.sources.sources,
    });
  });
  app.get('/openapi.json', () => openapi);
  app.post('/v1/routes', async (request) => {
    const input = readInput(RouteRequestSchema, request.body, 'body');
    if (input.origin.kind === 'coordinate' || input.destination.kind === 'coordinate') {
      throw publicError('FEATURE_NOT_ENABLED', { capability: 'coordinate_endpoints' });
    }
    if (input.origin.placeId === input.destination.placeId) throw publicError('SAME_ENDPOINT', {});
    const catalog = requireDataset(input.cityId);
    for (const endpoint of ['origin', 'destination'] as const) {
      const point = input[endpoint];
      if (point.kind === 'place' && !catalog.places.places.some((p) => p.id === point.placeId)) throw publicError('UNRESOLVED_ENDPOINT', { endpoint });
    }
    if (input.expectedVersions && (['graphVersion', 'evidenceVersion', 'policyVersion'] as const).some((k) => input.expectedVersions?.[k] !== catalog.versions[k])) {
      throw publicError('DATA_VERSION_CHANGED', { requested: input.expectedVersions, available: catalog.versions });
    }
    if (!dependencies.planner?.isReady()) throw publicError('SOURCE_UNAVAILABLE', { cityId: input.cityId });
    const context = { requestId: request.id, asOf: clock().toISOString() };
    const result = await dependencies.planner.plan(input, context);
    return validatePlan(result, input, context, catalog);
  });
  return app;
}
