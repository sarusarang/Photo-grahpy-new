// components/SubdomainSettingsCard.tsx
import React, { useState } from 'react';
import { useSubdomainCheck } from '../hooks/useSubdomainCheck';
import { claimSubdomain } from '../services/portfolioApi';

interface Props {
  initialSubdomain: string | null;
  authToken: string;
  onSuccess?: (newSubdomain: string, liveUrl: string) => void;
}

export const SubdomainSettingsCard: React.FC<Props> = ({
  initialSubdomain,
  authToken,
  onSuccess,
}) => {
  const {
    subdomain,
    setSubdomain,
    isChecking,
    result,
    clientError,
    isValid,
  } = useSubdomainCheck(authToken, initialSubdomain);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const res = await claimSubdomain(subdomain, authToken);
      const liveUrl = res.url || res.live_url || `https://${res.subdomain}.exshare.ai`;
      setSubmitMessage({
        type: 'success',
        text: `Success! Your portfolio is now live at ${liveUrl}`,
      });
      if (onSuccess) {
        onSuccess(res.subdomain, liveUrl);
      }
    } catch (err: any) {
      setSubmitMessage({
        type: 'error',
        text: err.response?.data?.error || err.response?.data?.message || 'Failed to claim subdomain',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-white max-w-xl">
      <div className="mb-4">
        <h3 className="text-xl font-semibold tracking-tight">Studio Subdomain</h3>
        <p className="text-sm text-neutral-400 mt-1">
          Publish your photography portfolio with your custom branded URL on ExShare.
        </p>
      </div>

      <form onSubmit={handleClaim} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-neutral-300 uppercase tracking-wider mb-2">
            Portfolio Address
          </label>
          <div className="flex items-center rounded-xl bg-black/60 border border-neutral-700 px-3 py-2.5 focus-within:border-amber-400 transition-colors">
            <span className="text-neutral-500 select-none text-sm">https://</span>
            <input
              type="text"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value)}
              placeholder={initialSubdomain || 'yourstudio'}
              className="bg-transparent border-none text-white focus:outline-none px-1 text-sm font-medium w-full"
            />
            <span className="text-amber-400/90 font-medium select-none text-sm">.exshare.ai</span>
          </div>

          {/* Validation Feedback */}
          <div className="mt-2 min-h-5 text-xs">
            {isChecking && <span className="text-neutral-400 animate-pulse">Checking availability...</span>}
            {clientError && <span className="text-rose-400 font-medium">{clientError}</span>}
            {!isChecking && !clientError && result && (
              <span className={result.available ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
                {result.message}
              </span>
            )}
          </div>
        </div>

        {/* Live URL Preview */}
        {subdomain && isValid && (
          <div className="p-3 bg-neutral-950/80 rounded-lg border border-neutral-800/80 text-xs text-neutral-300 flex items-center justify-between">
            <span>Live URL:</span>
            <a
              href={`https://${subdomain}.exshare.ai`}
              target="_blank"
              rel="noreferrer"
              className="text-amber-400 hover:underline font-mono"
            >
              https://{subdomain}.exshare.ai
            </a>
          </div>
        )}

        {submitMessage && (
          <div
            className={`p-3 rounded-lg text-xs font-medium ${
              submitMessage.type === 'success'
                ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800'
                : 'bg-rose-950/50 text-rose-300 border border-rose-800'
            }`}
          >
            {submitMessage.text}
          </div>
        )}

        <button
          type="submit"
          disabled={!isValid || isSubmitting || isChecking}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-500/10 cursor-pointer"
        >
          {isSubmitting ? 'Activating Subdomain...' : 'Claim & Publish Portfolio'}
        </button>
      </form>
    </div>
  );
};
