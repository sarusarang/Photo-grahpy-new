import React, { useState } from 'react';
import { PortfolioSubdomainForm, type PortfolioSubdomainFormProps } from './PortfolioSubdomainForm';
import { SubdomainSettingsCard } from '../SubdomainSettingsCard';

export type PortfolioSubdomainSettingsProps = PortfolioSubdomainFormProps;

export const PortfolioSubdomainSettings: React.FC<PortfolioSubdomainSettingsProps> = (props) => {
  const [viewMode, setViewMode] = useState<'card' | 'detailed'>('detailed');
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('access_token') || localStorage.getItem('token') || ''
      : '';

  return (
    <div className="w-full max-w-2xl flex flex-col items-center">
      <div className="self-end mb-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setViewMode(viewMode === 'card' ? 'detailed' : 'card')}
          className="text-[11px] font-mono text-neutral-400 hover:text-amber-400 underline transition-colors cursor-pointer"
        >
          {viewMode === 'card' ? 'Switch to Advanced Domain Manager' : 'Switch to Quick Subdomain Card'}
        </button>
      </div>

      {viewMode === 'card' ? (
        <SubdomainSettingsCard
          initialSubdomain={props.currentSubdomain || null}
          authToken={token}
          onSuccess={(sub, url) => {
            if (props.onSubdomainUpdated) {
              props.onSubdomainUpdated(sub, url);
            }
          }}
        />
      ) : (
        <PortfolioSubdomainForm {...props} />
      )}
    </div>
  );
};

export default PortfolioSubdomainSettings;
