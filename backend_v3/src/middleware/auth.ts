// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthenticatedRequest extends Request {
  user?: { id: number; role: string };
}

export function auth(roles: string[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return next({
        code: 'UNAUTHORIZED',
        message: 'No access token provided',
        status: 401,
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number; role: string };
      if (roles.length && !roles.includes(decoded.role)) {
        return next({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
          status: 403,
        });
      }

      req.user = decoded;
      next();
    } catch (error) {
      return next({
        code: 'UNAUTHORIZED',
        message: 'Invalid access token',
        status: 401,
      });
    }
  };
}