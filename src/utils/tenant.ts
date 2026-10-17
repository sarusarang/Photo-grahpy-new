/**
 * EX SHARE Atelier — Tenant & Subdomain Detection
 *
 * Ingress resolution for photographer vanity subdomains (e.g. mridhul.exshare.ai)
 * versus primary studio applications (app.exshare.ai, www.exshare.ai, server.exshare.ai).
 */

export interface TenantInfo {
  isTenant: boolean;
  subdomain: string | null;
  baseDomain: string;
  fullHost: string;
}

const RESERVED_SUBDOMAINS = new Set([
  'www',
  'app',
  'api',
  'admin',
  'auth',
  'server',
  'static',
  'media',
  'cdn',
  'mail',
  'support',
  'staging',
  'billing',
  'dashboard',
  'dev',
  'test',
]);

/**
 * Extracts and returns the tenant subdomain from the current window host.
 * Returns null if on primary app, apex, or localhost root.
 */
export const getTenantSubdomain = (): string | null => {
  if (typeof window === 'undefined') return null;

  const hostname = window.location.hostname.toLowerCase();

  // Local development fallback: check URL query param ?subdomain=mridhul or localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const debugSub = urlParams.get('subdomain');
  if (debugSub && !RESERVED_SUBDOMAINS.has(debugSub.toLowerCase())) {
    return debugSub.toLowerCase();
  }

  // Central / Main App Domains (Not photographer subdomains)
  const mainDomains = [
    'exshare.ai',
    'www.exshare.ai',
    'app.exshare.ai',
    'server.exshare.ai',
    'localhost',
    '127.0.0.1',
  ];
  if (mainDomains.includes(hostname)) return null;

  // Handle *.localhost (e.g. mridhul.localhost in local development)
  if (hostname.endsWith('.localhost')) {
    const sub = hostname.replace('.localhost', '');
    return sub && !sub.includes('.') && !RESERVED_SUBDOMAINS.has(sub) ? sub : null;
  }

  // Handle *.exshare.ai (e.g. mridhul.exshare.ai in production)
  if (hostname.endsWith('.exshare.ai')) {
    const parts = hostname.split('.');
    // Exactly 3 parts: [<subdomain>, 'exshare', 'ai']
    if (parts.length === 3) {
      const sub = parts[0];
      return RESERVED_SUBDOMAINS.has(sub) ? null : sub;
    }
  }

  return null;
};

/**
 * Full tenant context details for routing and layouts.
 */
export function detectTenantHost(): TenantInfo {
  if (typeof window === 'undefined') {
    return { isTenant: false, subdomain: null, baseDomain: 'exshare.ai', fullHost: '' };
  }

  const fullHost = window.location.host.toLowerCase();
  const subdomain = getTenantSubdomain();

  const isLocal =
    window.location.hostname === 'localhost' ||
    window.location.hostname.endsWith('.localhost') ||
    window.location.hostname === '127.0.0.1';

  return {
    isTenant: Boolean(subdomain),
    subdomain,
    baseDomain: isLocal ? 'localhost' : 'exshare.ai',
    fullHost,
  };
}

/**
 * Returns canonical external URL for a given photographer subdomain.
 */
export function getSubdomainPublicUrl(subdomain: string): string {
  const clean = (subdomain || '').trim().toLowerCase();
  if (!clean) return '';

  const isLocal =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname.endsWith('.localhost') ||
      window.location.hostname === '127.0.0.1');

  if (isLocal) {
    const port = window.location.port ? `:${window.location.port}` : '';
    return `http://${clean}.localhost${port}`;
  }

  return `https://${clean}.exshare.ai`;
}
