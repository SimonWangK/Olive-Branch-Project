// src/services/auth.service.ts
import { PrismaClient } from '@prisma/client'
// Import bcrypt for hashing and comparing passwords securely
import bcrypt from 'bcrypt';
// Import jwt for generating JSON Web Tokens for authentication
import jwt from 'jsonwebtoken';
// Import zod for data validation
import { z } from 'zod';
// Import environment variables (like JWT secret key)
import { env } from '@/config/env';

// Create an instance of Prisma client
const prisma = new PrismaClient();

// Define a schema for validating login input data
const LoginSchema = z.object({
  email: z.string().email(),    // must be a valid email format
  password: z.string().min(6), // password must be at least 6 characters long
});

// Login function: handles user authentication
export async function login(data: unknown, ip?: string, userAgent?: string) {
  // Validate input data against the schema
  const parsed = LoginSchema.parse(data);
  const { email, password } = parsed;

  // Try to find a user in the database by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // If no user is found
  if (!user) {
    // Log the failed login attempt
    await prisma.event.create({
      data: {
        type: 'LOGIN_FAILED',                   // event type
        data: { email, reason: 'User not found', ip, userAgent }, // extra info
      },
    });
    // Throw an error for invalid credentials
    throw { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' };
  }

  // Compare entered password with the hashed password stored in the database
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    // Log the failed login attempt due to incorrect password
    await prisma.event.create({
      data: {
        type: 'LOGIN_FAILED',
        user_id: user.id,
        data: { email, reason: 'Incorrect password', ip, userAgent },
      },
    });
    // Throw an error for invalid credentials
    throw { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' };
  }

  // Generate a JWT token if authentication is successful
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role }, // payload data
    env.JWT_SECRET,                                      // secret key
    { expiresIn: '1288h' }                               // token expiry
  );

  // Log successful login
  await prisma.event.create({
    data: {
      type: 'LOGIN_SUCCESS',
      user_id: user.id,
      data: { email, ip, userAgent },
    },
  });

  // Return the response with authorization code, token, and user info
  return {
    code: 'AUTHORIZED',
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
}

// Helper function: hash a password before storing it in the database
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10); // hash password with salt rounds = 10
}
