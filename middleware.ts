// middleware.ts
// @ts-nocheck - Next.js Wildcard Multi-Tenant Routing
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const hostname = req.headers.get('host') || '';
  const baseDomain = 'exshare.ai';

  // Extract subdomain (e.g. mrudul.exshare.ai -> mrudul)
  const isSubdomain = hostname.endsWith(`.${baseDomain}`) && !hostname.startsWith('www.');

  if (isSubdomain) {
    const subdomain = hostname.replace(`.${baseDomain}`, '').split(':')[0].toLowerCase();
    const url = req.nextUrl.clone();
    // Rewrite internally to /_tenant/[subdomain]
    url.pathname = `/_tenant/${subdomain}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
