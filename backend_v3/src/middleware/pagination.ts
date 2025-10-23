import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Define the schema for pagination query parameters
const PaginationSchema = z.object({
  current: z.string().optional().transform(val => parseInt(val || '1')).default(1),
  pageSize: z.string().optional().transform(val => parseInt(val || '10')).default(10),
}).refine(data => data.current >= 1, { message: 'Current page must be at least 1' })
  .refine(data => data.pageSize >= 1 && data.pageSize <= 100, { message: 'Page size must be between 1 and 100' });

export const pagination = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = PaginationSchema.parse(req.query);
    const { current, pageSize } = parsed;

    // Attach pagination metadata to the request object
    (req as any).pagination = {
      skip: (current - 1) * pageSize,
      take: pageSize,
      current,
      pageSize,
    };

    next();
  } catch (error) {
    return res.status(400).json({
      code: 'INVALID_PAGINATION_PARAMS',
      message: 'Invalid pagination parameters',
      details: error,
    });
  }
};