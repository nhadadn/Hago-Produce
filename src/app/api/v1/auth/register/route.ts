import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt';
import { registerSchema } from '@/lib/validation/auth';
import { Role } from '@prisma/client';
import { logger } from '@/lib/logger/logger.service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: validation.error.errors[0].message } },
        { status: 400 }
      );
    }

    const { email, password, firstName, lastName, role } = validation.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_EXISTS', message: 'El usuario ya existe' } },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    // Only allow safe roles via public registration — never allow ADMIN or ACCOUNTING escalation
    const ALLOWED_REGISTER_ROLES = [Role.MANAGEMENT, Role.CUSTOMER]
    const safeRole = role && ALLOWED_REGISTER_ROLES.includes(role as Role)
      ? (role as Role)
      : Role.MANAGEMENT

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: safeRole,
      },
    });

    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
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
      { status: 201 }
    );
  } catch (error) {
    logger.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}
