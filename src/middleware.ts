import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export function middleware(request: NextRequest) {
  // Generate correlation ID
  const correlationId = request.headers.get('x-correlation-id') || uuidv4();

  // Create response
  const response = NextResponse.next();

  // Add correlation ID to response headers for client visibility
  response.headers.set('x-correlation-id', correlationId);

  // Add correlation ID to request headers for downstream processing (Server Components/Actions)
  // Note: In Next.js middleware, mutating request headers for downstream requires setting them on the request passed to next()
  // But NextResponse.next({ request: { headers } }) is the way to pass modified headers forward.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-correlation-id', correlationId);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
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
