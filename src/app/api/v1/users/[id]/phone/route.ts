import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/middleware';
import { z } from 'zod';

const phoneSchema = z.object({
  phone: z
    .string()
    .nullable()
    .refine((val) => {
      if (val === null) return true;
      return /^\+\d{10,}$/.test(val);
    }, {
      message: "Phone number must start with + and contain at least 10 digits",
    }),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return unauthorizedResponse();
    }

    // Only ADMIN can update user phones (or maybe the user themselves, but sticking to ADMIN for now based on context)
    if (user.role !== 'ADMIN') {
       return NextResponse.json(
        { success: false, error: { message: 'Forbidden' } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = phoneSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Validation failed',
            details: validation.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const { phone } = validation.data;
    const userId = params.id;

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: { message: 'User not found' } },
        { status: 404 }
      );
    }

    // Check uniqueness if phone is not null
    if (phone) {
      const existingUser = await prisma.user.findUnique({
        where: { phone },
      });

      if (existingUser && existingUser.id !== userId) {
        return NextResponse.json(
          {
            success: false,
            error: { message: 'Phone number already assigned to another user' },
          },
          { status: 409 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { phone },
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (error: any) {
    console.error('Error updating phone:', error);
    return NextResponse.json(
      {
        success: false,
        error: { message: error.message || 'Internal Server Error' },
      },
      { status: 500 }
    );
  }
}
