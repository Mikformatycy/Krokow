import { z } from 'zod';
import { CountSchema, EnvelopeShape, IdSchema, VersionSetSchema } from './common';

const error = <C extends string, R extends boolean, P extends z.ZodType>(code: C, retryable: R, details: P) =>
  z.strictObject({ code: z.literal(code), messageKey: z.literal(`error.${code.toLowerCase()}`), retryable: z.literal(retryable), details });
const empty = z.strictObject({});
export const ErrorBodySchema = z.discriminatedUnion('code', [
  error('VALIDATION_ERROR', false, z.strictObject({ fields: z.array(z.strictObject({
    path: z.array(z.union([IdSchema, CountSchema])).min(1),
    code: z.enum(['required', 'invalid_type', 'invalid_value', 'out_of_range', 'unrecognized_field']),
  })).min(1) })),
  error('SAME_ENDPOINT', false, empty),
  error('OUTSIDE_COVERAGE', false, z.strictObject({ cityId: IdSchema, endpoint: z.enum(['origin', 'destination']) })),
  error('UNRESOLVED_ENDPOINT', false, z.strictObject({ endpoint: z.enum(['origin', 'destination']) })),
  error('NO_PATH', false, z.strictObject({ cityId: IdSchema })),
  error('NO_MATCHING_ROUTE', false, z.strictObject({ blockingRequirements: z.array(z.enum(['avoidKnownSteps', 'audibleRequirement', 'maxDetourRatio'])).min(1) })),
  error('DATA_VERSION_CHANGED', false, z.strictObject({ requested: VersionSetSchema, available: VersionSetSchema })),
  error('FEATURE_NOT_ENABLED', false, z.strictObject({ capability: z.enum(['coordinate_endpoints', 'foreground_navigation']) })),
  error('SOURCE_UNAVAILABLE', true, z.strictObject({ cityId: IdSchema })),
  error('SEARCH_LIMIT_REACHED', true, empty),
  error('RATE_LIMITED', true, z.strictObject({ retryAfterSec: z.number().int().positive() })),
  error('INTERNAL_ERROR', true, empty),
]);
export const ApiErrorSchema = z.strictObject({ ...EnvelopeShape, error: ErrorBodySchema });
export type ApiError = z.infer<typeof ApiErrorSchema>;
export const ERROR_HTTP_STATUS = {
  VALIDATION_ERROR: 400, SAME_ENDPOINT: 422, OUTSIDE_COVERAGE: 422,
  UNRESOLVED_ENDPOINT: 422, NO_PATH: 422, NO_MATCHING_ROUTE: 422,
  DATA_VERSION_CHANGED: 409, FEATURE_NOT_ENABLED: 422, SOURCE_UNAVAILABLE: 503,
  SEARCH_LIMIT_REACHED: 504, RATE_LIMITED: 429, INTERNAL_ERROR: 500,
} as const satisfies Record<ApiError['error']['code'], number>;
