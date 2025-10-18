import { User } from '@prisma/client';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: number;
      role: string;
      email?: string;
    };
  }
}