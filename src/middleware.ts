import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check for protected routes
  // For now, we only protect /api routes that are not auth related
  // In a real scenario, we might want to protect specific UI routes here too
  // or rely on the client-side useProtectedRoute hook for UX and API protection for security.
  
  // This is a simplified middleware example.
  // The real protection happens in the API routes using `getAuthenticatedUser`
  // and on the client side using `useProtectedRoute`.
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/v1/auth (auth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/v1/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
