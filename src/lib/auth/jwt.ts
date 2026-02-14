import jwt from 'jsonwebtoken';
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-me';
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
