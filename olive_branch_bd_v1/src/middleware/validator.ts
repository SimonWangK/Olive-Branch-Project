import { Request, Response, NextFunction } from 'express';
import { ZodObject } from 'zod';

export function validate(schema: ZodObject) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      next({ code: 'VALIDATION_ERROR', message: 'Invalid input', details: error });
    }
  };
}