import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { logger } from '@/lib/logger/logger.service';
import { comparePassword } from '@/lib/auth/password';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt';
import { loginSchema } from '@/lib/validation/auth';

// Simple in-memory brute force protection
// Key: email or IP, Value: { count: number, firstAttempt: number, lockedUntil?: number }
const loginAttempts = new Map<string, { count: number; firstAttempt: number; lockedUntil?: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000  // 15 minutes
const LOCKOUT_MS = 30 * 60 * 1000 // 30 minutes

function checkBruteForce(key: string): { blocked: boolean; remainingMs?: number } {
  const now = Date.now()
  const record = loginAttempts.get(key)

  if (record?.lockedUntil) {
    if (now < record.lockedUntil) {
      return { blocked: true, remainingMs: record.lockedUntil - now }
    }
    loginAttempts.delete(key)
  }

  return { blocked: false }
}

function recordFailedAttempt(key: string): void {
  const now = Date.now()
  const record = loginAttempts.get(key) ?? { count: 0, firstAttempt: now }

  // Reset window if expired
  if (now - record.firstAttempt > WINDOW_MS) {
    loginAttempts.set(key, { count: 1, firstAttempt: now })
    return
  }

  record.count++
  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MS
  }
  loginAttempts.set(key, record)
}

function clearAttempts(key: string): void {
  loginAttempts.delete(key)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: validation.error.errors[0].message } },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Brute force check — keyed by email and IP
    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
    const emailCheck = checkBruteForce(email)
    const ipCheck = checkBruteForce(ip)

    if (emailCheck.blocked || ipCheck.blocked) {
      return NextResponse.json(
        { success: false, error: { code: 'TOO_MANY_ATTEMPTS', message: 'Demasiados intentos. Intenta de nuevo en 30 minutos.' } },
        { status: 429 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      recordFailedAttempt(email)
      recordFailedAttempt(ip)
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Credenciales inválidas' } },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: { code: 'ACCOUNT_INACTIVE', message: 'La cuenta ha sido desactivada. Contacte al administrador.' } },
        { status: 403 }
      );
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      recordFailedAttempt(email)
      recordFailedAttempt(ip)
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Credenciales inválidas' } },
        { status: 401 }
      );
    }

    // Successful login — clear attempt counters
    clearAttempts(email)
    clearAttempts(ip)

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      customerId: user.customerId || undefined
    };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
          },
          tokens: {
            accessToken,
            refreshToken,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}
