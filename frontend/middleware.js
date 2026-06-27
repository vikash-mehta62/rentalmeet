import { NextResponse } from 'next/server';

// Routes that require authentication
const PROTECTED_PREFIXES = ['/admin', '/owner', '/vendor', '/customer', '/employee'];
// Routes that logged-in users should not access
const AUTH_ONLY = ['/login', '/register', '/register-customer'];

const matchesRoute = (pathname, route) => pathname === route || pathname.startsWith(`${route}/`);

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Read auth from sessionStorage is not possible in middleware (server-side)
  // We use a cookie set by the frontend as a signal (not the actual token)
  const authSignal = request.cookies.get('auth-present')?.value;

  const isProtected = PROTECTED_PREFIXES.some(p => matchesRoute(pathname, p));
  const isAuthPage  = AUTH_ONLY.some(p => matchesRoute(pathname, p));

  // Redirect unauthenticated users away from protected pages
  if (isProtected && !authSignal) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Add security headers to every response
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo|.*\\.png|.*\\.jpg|.*\\.svg).*)',
  ],
};
