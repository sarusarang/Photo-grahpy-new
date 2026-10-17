// src/utils/trackPortfolioView.ts
import apiClient from '@/api/axiosClient';
import { publicTenantApi } from '@/api/client';

/**
 * Deduplicated Visitor Analytics Telemetry.
 * Prevents rapid page refreshes or route changes from consuming
 * the 60 requests/minute view-tracking quota via sessionStorage caching.
 */
export function trackPortfolioView(slug: string, section: string = 'hero') {
  if (typeof window === 'undefined') return;

  const sessionKey = `tracked_view_${slug}_${section}`;
  // Only track once per browser tab session
  if (sessionStorage.getItem(sessionKey)) {
    return;
  }

  try {
    sessionStorage.setItem(sessionKey, '1');
  } catch {
    // SessionStorage may fail in restricted/private modes
  }

  apiClient
    .post(`/api/public/portfolio/${slug}/track-view/`, {
      page_section: section,
      device: window.innerWidth < 768 ? 'mobile' : 'desktop',
    })
    .catch(() => {
      // Suppress analytics telemetry errors silently
    });
}

/**
 * Deduplicated Tenant Subdomain Portfolio Site View Telemetry.
 */
export function trackTenantSiteView(subdomainOrHost: string = 'default', section: string = 'hero') {
  if (typeof window === 'undefined') return;

  const sessionKey = `tracked_tenant_view_${subdomainOrHost}_${section}`;
  if (sessionStorage.getItem(sessionKey)) {
    return;
  }

  try {
    sessionStorage.setItem(sessionKey, '1');
  } catch {
    // SessionStorage may fail in restricted/private modes
  }

  const device = window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop';

  publicTenantApi
    .post('/api/public/portfolio-site/track-view/', {
      page_section: section,
      device,
      device_type: device,
      referrer: document.referrer || 'direct',
    })
    .catch(() => {
      // Suppress analytics telemetry errors silently
    });
}

export default trackPortfolioView;
