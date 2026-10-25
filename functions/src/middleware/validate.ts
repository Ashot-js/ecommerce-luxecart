import type { Request, Response, NextFunction } from 'express';
import { z, type ZodSchema } from 'zod';

function details(err: z.ZodError) {
  return err.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
}

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Validation failed', details: details(result.error) });
      return;
    }
    req.body = result.data;
    next();
  };
}

// Express 5 makes req.query read-only, so the parsed query goes to res.locals.query.
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json({ error: 'Invalid query parameters', details: details(result.error) });
      return;
    }
    res.locals.query = result.data;
    next();
  };
}

// Rejects malformed ids with 404 before they reach Postgres, which throws on a bad UUID.
export function uuidParam(...names: string[]) {
  const uuid = z.string().uuid();
  return (req: Request, res: Response, next: NextFunction): void => {
    if (names.some((n) => !uuid.safeParse(req.params[n]).success)) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    next();
  };
}
