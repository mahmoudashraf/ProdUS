import { NextRequest, NextResponse } from 'next/server';

const passthroughPrefixes = ['/_next', '/api', '/auth', '/login', '/register'];

const shouldPassThrough = (pathname: string) =>
  passthroughPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  || /\.[a-zA-Z0-9]+$/.test(pathname);

export function middleware(request: NextRequest) {
  const host = request.headers.get('host')?.split(':')[0] || '';
  const pathname = request.nextUrl.pathname;

  if (shouldPassThrough(pathname)) {
    return NextResponse.next();
  }

  if (host === 'network.produs.com' || host === 'teams.produs.com' || host.startsWith('network.') || host.startsWith('teams.')) {
    const url = request.nextUrl.clone();
    if (pathname === '/') {
      url.pathname = '/expert-network';
      return NextResponse.rewrite(url);
    }
    if (!pathname.startsWith('/expert-network')) {
      url.pathname = `/expert-network${pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  if (host === 'studio.produs.com' || host.startsWith('studio.')) {
    const url = request.nextUrl.clone();
    if (pathname === '/') {
      url.pathname = '/dashboard';
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
