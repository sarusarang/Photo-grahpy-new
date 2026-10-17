import React from 'react';
import { PortfolioSubdomainForm, type PortfolioSubdomainFormProps } from './PortfolioSubdomainForm';

export type PortfolioSubdomainSettingsProps = PortfolioSubdomainFormProps;

export const PortfolioSubdomainSettings: React.FC<PortfolioSubdomainSettingsProps> = (props) => {
  return <PortfolioSubdomainForm {...props} />;
};

export default PortfolioSubdomainSettings;
