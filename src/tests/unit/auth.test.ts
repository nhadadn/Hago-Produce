import { hashPassword, comparePassword } from '../../lib/auth/password';
import { generateAccessToken, verifyToken } from '../../lib/auth/jwt';
import { verifyRole } from '../../lib/auth/verify-role';

describe('Auth Utilities', () => {
  describe('Password Hashing', () => {
    it('should hash a password correctly', async () => {
      const password = 'password123';
      const hash = await hashPassword(password);
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should verify a correct password', async () => {
      const password = 'password123';
      const hash = await hashPassword(password);
      const isValid = await comparePassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject an incorrect password', async () => {
      const password = 'password123';
      const hash = await hashPassword(password);
      const isValid = await comparePassword('wrongpassword', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('JWT Tokens', () => {
    it('should generate and verify a valid token', () => {
      const payload = { userId: '123', email: 'test@example.com', role: 'ADMIN' };
      const token = generateAccessToken(payload);
      const decoded = verifyToken(token);
      
      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe(payload.userId);
      expect(decoded?.email).toBe(payload.email);
      expect(decoded?.role).toBe(payload.role);
    });

    it('should return null for invalid token', () => {
      const decoded = verifyToken('invalid-token');
      expect(decoded).toBeNull();
    });
  });

  describe('Role Verification', () => {
    it('should return true if user has required role', () => {
      const user = { userId: '1', email: 'test', role: 'ADMIN' };
      expect(verifyRole(user, ['ADMIN', 'MANAGEMENT'])).toBe(true);
    });

    it('should return false if user does not have required role', () => {
      const user = { userId: '1', email: 'test', role: 'CUSTOMER' };
      expect(verifyRole(user, ['ADMIN', 'MANAGEMENT'])).toBe(false);
    });
  });
});
