/** Zod validation middleware for body / query / params. */
import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { errors } from '../../platform/errors.js';

type Target = 'body' | 'query' | 'params';

export function validate(schema: ZodTypeAny, target: Target = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      return next(errors.unprocessable('Validation failed', result.error.flatten()));
    }
    // Store parsed/coerced value for handlers to consume.
    (req as unknown as Record<string, unknown>)[`valid_${target}`] = result.data;
    next();
  };
}

/** Retrieve validated data set by `validate`. */
export function valid<T>(req: Request, target: Target = 'body'): T {
  return (req as unknown as Record<string, unknown>)[`valid_${target}`] as T;
}
