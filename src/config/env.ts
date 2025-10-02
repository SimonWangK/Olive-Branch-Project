// src/config/env.ts
// import { z } from 'zod';

// const EnvSchema = z.object({
//   JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
//   NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
//   DATABASE_URL: z.string().url(),
// });

// export const env = EnvSchema.parse(process.env);