import jwt from 'jsonwebtoken';
import { z } from 'zod';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 16) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[AUTH] JWT_SECRET must be set and at least 16 characters in production')
    }
    return 'dev-secret-minimum-16-chars-local'
  }
  return secret
}
const JWT_SECRET = getJwtSecret();
const ACCESS_TOKEN_EXPIRES_IN = '1h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

export const tokenSchema = z.object({
  userId: z.string(),
  role: z.string(),
  email: z.string(),
  customerId: z.string().optional(),
});

export type TokenPayload = z.infer<typeof tokenSchema>;

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = tokenSchema.safeParse(decoded);
    if (result.success) {
      return result.data;
    }
    return null;
  } catch (error) {
    return null;
  }
}
