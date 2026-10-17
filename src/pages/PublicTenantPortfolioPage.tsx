import React from 'react';
import { TenantPortfolioSite } from './TenantPortfolioSite';
import { publicTenantService } from '../api/subdomainService';
import type { ClientInquiryPayload } from '../types/portfolio';

interface PublicTenantPortfolioPageProps {
  subdomain?: string | null;
}

/**
 * Reusable helper to submit tenant-scoped client inquiries
 */
export async function submitTenantInquiry(formData: ClientInquiryPayload) {
  return publicTenantService.submitInquiry(formData);
}

export const PublicTenantPortfolioPage: React.FC<PublicTenantPortfolioPageProps> = ({
  subdomain,
}) => {
  return <TenantPortfolioSite subdomain={subdomain} />;
};

export { TenantPortfolioSite };
