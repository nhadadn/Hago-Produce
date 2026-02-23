import { TokenPayload } from './jwt';

export function verifyRole(user: TokenPayload, allowedRoles: string[]): boolean {
  return allowedRoles.includes(user.role);
}

export function hasRole(user: TokenPayload, role: string): boolean {
  return user.role === role;
}
