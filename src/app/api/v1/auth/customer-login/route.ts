import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { comparePassword } from '@/lib/auth/password';
import { generateAccessToken } from '@/lib/auth/jwt';
import { customerLoginSchema } from '@/lib/validation/auth';
import { Role } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = customerLoginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: validation.error.errors[0].message } },
        { status: 400 }
      );
    }

    const { tax_id, password } = validation.data;

    const customer = await prisma.customer.findUnique({
      where: { taxId: tax_id },
    });

    if (!customer || !customer.isActive || !customer.portalPasswordHash) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Credenciales inválidas' } },
        { status: 401 }
      );
    }

    const isPasswordValid = await comparePassword(password, customer.portalPasswordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Credenciales inválidas' } },
        { status: 401 }
      );
    }

    const tokenPayload = {
      userId: customer.id,
      email: customer.email || `${customer.taxId}@customer.hago.local`,
      role: Role.CUSTOMER,
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
            company_name: customer.companyName || customer.name,
            tax_id: customer.taxId,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}

