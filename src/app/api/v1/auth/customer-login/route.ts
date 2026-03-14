import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { comparePassword } from '@/lib/auth/password';
import { generateAccessToken } from '@/lib/auth/jwt';
import { customerLoginSchema } from '@/lib/validation/auth';
import { Role } from '@prisma/client';
import { logger } from '@/lib/logger/logger.service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = customerLoginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error.errors[0].message,
          },
        },
        { status: 400 }
      );
    }

    const { emailOrUsername, password } = validation.data;

    // Accept either email or username
    const isEmail = emailOrUsername.includes('@');
    const user = await prisma.user.findFirst({
      where: isEmail
        ? { email: emailOrUsername, role: Role.CUSTOMER, isActive: true }
        : { username: emailOrUsername, role: Role.CUSTOMER, isActive: true },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Credenciales inválidas',
          },
        },
        { status: 401 }
      );
    }

    const customer = user.customerId
      ? await prisma.customer.findUnique({ where: { id: user.customerId } })
      : null;

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Credenciales inválidas',
          },
        },
        { status: 401 }
      );
    }

    if (!customer.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ACCOUNT_INACTIVE',
            message: 'La cuenta ha sido desactivada. Contacte al administrador.',
          },
        },
        { status: 403 }
      );
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Credenciales inválidas',
          },
        },
        { status: 401 }
      );
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      customerId: customer.id,
    };

    const accessToken = generateAccessToken(tokenPayload);

    return NextResponse.json(
      {
        success: true,
        data: {
          access_token: accessToken,
          token_type: 'Bearer',
          expires_in: 3600,
          customer: {
            id: customer.id,
            email: user.email,
            company_name: customer.name,
            tax_id: customer.taxId,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('[CUSTOMER_LOGIN]', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error interno del servidor',
        },
      },
      { status: 500 }
    );
  }
}
