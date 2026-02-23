import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, generateAccessToken } from '@/lib/auth/jwt';
import { refreshSchema } from '@/lib/validation/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = refreshSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: validation.error.errors[0].message } },
        { status: 400 }
      );
    }

    const { refreshToken } = validation.data;
    const decoded = verifyToken(refreshToken);

    if (!decoded) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TOKEN', message: 'Refresh token inválido o expirado' } },
        { status: 401 }
      );
    }

    // In a real app, we should check if the refresh token is in a whitelist or blacklist in DB
    // For now, we just trust the signature and expiration

    const tokenPayload = { userId: decoded.userId, email: decoded.email, role: decoded.role };
    const newAccessToken = generateAccessToken(tokenPayload);

    return NextResponse.json(
      {
        success: true,
        data: {
          accessToken: newAccessToken,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}
