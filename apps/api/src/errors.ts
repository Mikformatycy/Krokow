import { ApiErrorSchema, ERROR_HTTP_STATUS, ErrorBodySchema, SCHEMA_VERSION } from '@krok/contracts';
import type { ApiError } from '@krok/contracts';
import type { FastifyReply } from 'fastify';
import type { z } from 'zod';

type ErrorCode = ApiError['error']['code'];
type Details<C extends ErrorCode> = Extract<ApiError['error'], { code: C }>['details'];

export class PublicError extends Error {
  constructor(readonly body: ApiError['error']) { super(body.code); }
}

export function publicError<C extends ErrorCode>(code: C, details: Details<C>): PublicError {
  const schema = ErrorBodySchema.options.find((option) => option.shape.code.value === code);
  if (!schema) throw new Error('Unknown internal error code');
  return new PublicError(schema.parse({
    code, details, messageKey: schema.shape.messageKey.value, retryable: schema.shape.retryable.value,
  }));
}

export function readInput<T extends z.ZodType>(schema: T, value: unknown, location: 'body' | 'query' | 'params'): z.output<T> {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  throw publicError('VALIDATION_ERROR', {
    fields: result.error.issues.slice(0, 20).map((issue) => ({
      path: [location, ...issue.path.filter((item): item is string | number => typeof item === 'string' || typeof item === 'number')],
      code: issue.code === 'invalid_type' ? 'invalid_type'
        : issue.code === 'too_small' || issue.code === 'too_big' ? 'out_of_range'
          : issue.code === 'unrecognized_keys' ? 'unrecognized_field' : 'invalid_value',
    })),
  });
}

export function sendError(reply: FastifyReply, requestId: string, error: PublicError) {
  const parsed = ApiErrorSchema.safeParse({ schemaVersion: SCHEMA_VERSION, requestId, error: error.body });
  const result = parsed.success ? parsed.data : ApiErrorSchema.parse({
    schemaVersion: SCHEMA_VERSION, requestId, error: publicError('INTERNAL_ERROR', {}).body,
  });
  if (result.error.code === 'RATE_LIMITED') reply.header('Retry-After', result.error.details.retryAfterSec);
  return reply.code(ERROR_HTTP_STATUS[result.error.code]).send(result);
}
