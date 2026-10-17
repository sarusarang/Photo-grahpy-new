import React from 'react';
import { TenantPortfolioSite, type TenantPortfolioSiteProps } from './TenantPortfolioSite';

export type TenantPortfolioPageProps = TenantPortfolioSiteProps;

export const TenantPortfolioPage: React.FC<TenantPortfolioPageProps> = (props) => {
  return <TenantPortfolioSite {...props} />;
};

export default TenantPortfolioPage;
export { TenantPortfolioSite };
