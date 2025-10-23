// src/services/auth.service.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '@/config/env';

const prisma = new PrismaClient();

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  username: z.string().min(1),
  gender: z.number().int().optional(),  // Gender (0 for male, 1 for female)
  mobile: z.string().optional(),        // Optional mobile number
});

// Function to register a new user
export async function register(data: unknown, ip?: string, userAgent?: string) {
  const parsed = RegisterSchema.parse(data);
  const { email, password, name, username, gender, mobile } = parsed;

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw { code: 'EMAIL_ALREADY_EXISTS', message: 'Email already in use' };
  }

  // Hash the password before saving
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create new user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      username,
      gender,
      mobile,
      avatar:"https://gw.alipayobjects.com/zos/rmsportal/BiazfanxmamNRoxxVxka.png",
      role: 'viewer',  // Default role
    },
  });

  // Log the registration event
  await prisma.event.create({
    data: {
      type: 'REGISTER_SUCCESS',
      user_id: user.id,
      data: { email, ip, userAgent },
    },
  });

  // Return the newly created user data
  return {
    code: 2000,
    msg: 'Registration successful',
    data: {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  };
}


// Function to generate both access and refresh tokens
export async function login(data: unknown, ip?: string, userAgent?: string) {
  const parsed = LoginSchema.parse(data);
  const { email, password } = parsed;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Log failed attempt
    await prisma.event.create({
      data: {
        type: 'LOGIN_FAILED',
        data: { email, reason: 'User not found', ip, userAgent },
      },
    });
    throw { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' };
  }

  // Verify password
const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    // Log failed attempt
    await prisma.event.create({
      data: {
        type: 'LOGIN_FAILED',
        user_id: user.id,
        data: { email, reason: 'Incorrect password', ip, userAgent },
      },
    });
    throw { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' };
  }

  // Generate JWT access token (short-lived)
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    env.JWT_SECRET,
    { expiresIn: '30d' }  // 1 hour expiration for access token
  );

  // Generate JWT refresh token (longer-lived)
  const refreshToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    env.JWT_SECRET,
    { expiresIn: '90d' }  // 7 days expiration for refresh token
  );

  // Log successful login
  await prisma.event.create({
    data: {
      type: 'LOGIN_SUCCESS',
      user_id: user.id,
      data: { email, ip, userAgent },
    },
  });

  // Return both access and refresh tokens
  return {
    code: 2000,
    msg: 'Login successful',
    data: {
      access: accessToken,  // Access token
      refresh: refreshToken,  // Refresh token
      access_expire_in: Date.now() + 30 * 24 * 3600 * 1000,  // 30 days in milliseconds
    },
  };
}

export async function getUserInfo(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {

      id: true,
      username:true,
      avatar:true,
      name: true,
      email: true,
      role: true,
      gender: true,
      mobile: true,
    },
  });

  if (!user) {
    throw { code: 'USER_NOT_FOUND', message: 'User not found' };
  }

  return {
    code: 2000,
    detail:user,
    msg:'SUCCESS'
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}