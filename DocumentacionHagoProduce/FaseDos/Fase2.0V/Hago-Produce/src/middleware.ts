import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { globalRateLimiter, getRateLimitKey } from './lib/rate-limit';

// Security Headers
const securityHeaders = {
  'X-DNS-Prefetch-Control': 'on',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'origin-when-cross-origin',
  // CSP is tricky with Next.js and inline styles/scripts from Tailwind/React. 
  // Starting with a basic one.
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
};

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const pathname = request.nextUrl.pathname;

  // Helper to add security headers to any response
  const addSecurityHeaders = (res: NextResponse) => {
    Object.entries(securityHeaders).forEach(([key, value]) => {
      res.headers.set(key, value);
    });
    return res;
  };

  // 2. Rate Limiting (Global)
  // Limit to 100 requests per minute per IP
  const ip = getRateLimitKey(request);
  const isAllowed = globalRateLimiter.check(100, ip); // 100 req/min

  if (!isAllowed) {
    const errorResponse = new NextResponse(JSON.stringify({ success: false, message: 'Too many requests' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '60',
      },
    });
    return addSecurityHeaders(errorResponse);
  }

  // 3. Protected Routes Check (Basic)
  // Protect /admin, /portal, /accounting routes
  const protectedPaths = ['/admin', '/portal', '/accounting'];
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

  if (isProtectedPath) {
    const token = request.cookies.get('token')?.value || request.headers.get('authorization')?.split(' ')[1];

    if (!token) {
      // Redirect to login if accessing UI routes, or return 401 for API
      if (pathname.startsWith('/api')) {
        const unauthorizedResponse = NextResponse.json(
          { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
          { status: 401 }
        );
        return addSecurityHeaders(unauthorizedResponse);
      } else {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('from', pathname);
        const redirectResponse = NextResponse.redirect(loginUrl);
        return addSecurityHeaders(redirectResponse);
      }
    }
    // Note: Full token verification (signature check) happens in API routes or Server Components
    // to avoid Edge Runtime compatibility issues with 'jsonwebtoken' package.
  }

  // Add headers to the default response (NextResponse.next())
  return addSecurityHeaders(response);
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
