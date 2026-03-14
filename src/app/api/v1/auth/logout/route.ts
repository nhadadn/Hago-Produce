import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth/middleware'
import { logger } from '@/lib/logger/logger.service'

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) return unauthorizedResponse()

    const body = await req.json().catch(() => ({}))
    const { refreshToken } = body

    if (refreshToken) {
      // Add refresh token to blacklist
      await prisma.tokenBlacklist.upsert({
        where: { token: refreshToken },
        create: {
          token: refreshToken,
          userId: user.userId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          reason: 'logout',
        },
        update: {},
      })
    }

    logger.info(`[AUTH] User ${user.email} logged out`)

    return NextResponse.json({ success: true, message: 'Sesión cerrada correctamente' })
  } catch (error: any) {
    logger.error('[AUTH] Logout error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error al cerrar sesión' } },
      { status: 500 }
    )
  }
}
