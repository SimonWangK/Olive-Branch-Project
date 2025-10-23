import { Request, Response, NextFunction } from 'express';

interface AppError {
  code: string;
  message: string;
  details?: unknown;
}

export function errorMiddleware(
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(error);

  let status = 400; // default

  if (error.code === 'ITEM_NOT_FOUND') {
    status = 404;
  } else if (error.code === 'CREATE_COMPLIANCE_FAILED') {
    status = 400;
  }

  res.status(status).json({
    code: error.code || 'UNKNOWN_ERROR',
    message: error.message || 'An error occurred',
    details: error.details || null,
  });
}
