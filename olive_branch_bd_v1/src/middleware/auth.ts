import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Request type to support user property
interface AuthenticatedRequest extends Request {
  user?: { id: number; role: string };
}

export function auth(roles: string[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Get the Authorization token from the request header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return next({
        code: 'UNAUTHORIZED',
        message: 'No access token provided',
        status: 401,
      });
    }

    try {
      // Verify JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number; role: string };
      
      // Check if the user role is in the allowed roles list
      if (roles.length && !roles.includes(decoded.role)) {
        return next({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
          status: 403,
        });
      }

      // Attach user information to the request object
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