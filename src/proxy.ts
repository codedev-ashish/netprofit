import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Changed function name from middleware to proxy
export function proxy(request: NextRequest) {
  // If we are not on localhost and the protocol is http
  const isLocalhost = request.nextUrl.hostname === 'localhost' || request.nextUrl.hostname === '127.0.0.1';
  const isHttp = request.nextUrl.protocol === 'http:' || request.headers.get('x-forwarded-proto') === 'http';

  if (!isLocalhost && isHttp) {
    // Redirect to https
    const url = request.nextUrl.clone();
    url.protocol = 'https:';

    // Using 301 Permanent Redirect for SEO
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  // Match all request paths except for the ones starting with:
  // - api (API routes)
  // - _next/static (static files)
  // - _next/image (image optimization files)
  // - favicon.ico (favicon file)
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};