/**
 * EX SHARE Atelier — Tenant Host & Subdomain Resolver
 *
 * Detects whether the current browser session is executing on a public photographer
 * custom subdomain (e.g. `mridhul.exshare.ai` or `mridhul.localhost:5173`) vs the primary
 * studio management app (e.g. `app.exshare.ai` or `localhost:5173`).
 */

export interface TenantInfo {
  isTenant: boolean;
  subdomain: string | null;
  baseDomain: string;
  fullHost: string;
}

const RESERVED_SUBDOMAINS = new Set([
  'app',
  'api',
  'admin',
  'auth',
  'www',
  'cdn',
  'static',
  'mail',
  'support',
  'staging',
  'billing',
  'dashboard',
  'dev',
  'test',
]);

export function detectTenantHost(): TenantInfo {
  if (typeof window === 'undefined') {
    return { isTenant: false, subdomain: null, baseDomain: 'exshare.ai', fullHost: '' };
  }

  const hostname = window.location.hostname.toLowerCase();
  const fullHost = window.location.host.toLowerCase();
  const baseDomain = 'exshare.ai';

  // 1. Manual query override for local testing (e.g. http://localhost:5173/?subdomain=mridhul)
  const searchParams = new URLSearchParams(window.location.search);
  const paramSubdomain = searchParams.get('subdomain')?.trim().toLowerCase();
  if (paramSubdomain && !RESERVED_SUBDOMAINS.has(paramSubdomain)) {
    return {
      isTenant: true,
      subdomain: paramSubdomain,
      baseDomain,
      fullHost,
    };
  }

  // 2. Local development hostnames (e.g. mridhul.localhost:5173 or mridhul.localhost)
  if (hostname.endsWith('.localhost')) {
    const sub = hostname.replace('.localhost', '').toLowerCase();
    const isValidTenant = sub !== 'localhost' && !sub.includes('.') && !RESERVED_SUBDOMAINS.has(sub);
    return {
      isTenant: isValidTenant,
      subdomain: isValidTenant ? sub : null,
      baseDomain: 'localhost',
      fullHost,
    };
  }

  // 3. Production & staging wildcard hostnames (e.g. mridhul.exshare.ai)
  if (hostname.endsWith(`.${baseDomain}`)) {
    const sub = hostname.slice(0, -(baseDomain.length + 1)).toLowerCase();

    // Disallow multi-level subdomains (e.g. foo.bar.exshare.ai) or reserved names
    if (sub.includes('.') || RESERVED_SUBDOMAINS.has(sub)) {
      return { isTenant: false, subdomain: null, baseDomain, fullHost };
    }

    return {
      isTenant: true,
      subdomain: sub,
      baseDomain,
      fullHost,
    };
  }

  return { isTenant: false, subdomain: null, baseDomain, fullHost };
}

/**
 * Returns canonical external URL for a given photographer subdomain.
 */
export function getSubdomainPublicUrl(subdomain: string): string {
  const clean = (subdomain || '').trim().toLowerCase();
  if (!clean) return '';

  const isLocal = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname.endsWith('.localhost') ||
    window.location.hostname === '127.0.0.1'
  );

  if (isLocal) {
    const port = window.location.port ? `:${window.location.port}` : '';
    return `http://${clean}.localhost${port}`;
  }

  return `https://${clean}.exshare.ai`;
}
