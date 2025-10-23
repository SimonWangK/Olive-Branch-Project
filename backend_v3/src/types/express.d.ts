import { User } from '@prisma/client';
import { Multer } from 'multer';



declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: number;
      role: string;
      email?: string;
      gender?: number;
    };
    file?: Multer.File;
    pagination?: {
      skip: number;
      take: number;
      current: number;
      pageSize: number;
    };
  }
}