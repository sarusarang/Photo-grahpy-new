import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Copy,
  ExternalLink,
  Globe,
  Sparkles,
} from 'lucide-react';
import {
  CheckSubdomainAvailabilityApi,
  ClaimSubdomainApi,
} from '@/service/portfolio/PortfolioApi';
import { getSubdomainPublicUrl } from '@/utils/tenantResolver';

interface PortfolioSubdomainSettingProps {
  currentSubdomain?: string | null;
  onSubdomainUpdated?: (newSubdomain: string, fullUrl: string) => void;
}

type SubdomainState =
  | 'idle'
  | 'checking'
  | 'available'
  | 'already_owned'
  | 'taken'
  | 'reserved'
  | 'invalid'
  | 'error';

export const PortfolioSubdomainSetting: React.FC<PortfolioSubdomainSettingProps> = ({
  currentSubdomain = '',
  onSubdomainUpdated,
}) => {
  const [subdomainInput, setSubdomainInput] = useState<string>(currentSubdomain || '');
  const [assignedSubdomain, setAssignedSubdomain] = useState<string>(currentSubdomain || '');
  const [statusState, setStatusState] = useState<SubdomainState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Stale-response & cancellation tracker
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestSeqRef = useRef<number>(0);

  // Sync initial prop when loaded or changed from parent
  useEffect(() => {
    if (currentSubdomain) {
      setSubdomainInput(currentSubdomain);
      setAssignedSubdomain(currentSubdomain);
      setStatusState('already_owned');
    }
  }, [currentSubdomain]);

  // Client-side quick syntax validation
  const validateFormat = (name: string): { valid: boolean; error?: string } => {
    const clean = name.trim().toLowerCase();
    if (!clean) return { valid: false };
    if (clean.length < 3) return { valid: false, error: 'Must be at least 3 characters.' };
    if (clean.length > 63) return { valid: false, error: 'Cannot exceed 63 characters.' };
    if (clean.startsWith('-') || clean.endsWith('-')) return { valid: false, error: 'Cannot start or end with a hyphen.' };
    if (!/^[a-z0-9-]+$/.test(clean)) return { valid: false, error: 'Only lowercase letters, numbers, and hyphens allowed.' };
    return { valid: true };
  };

  // Debounced availability check
  useEffect(() => {
    const clean = subdomainInput.trim().toLowerCase();

    // If input matches existing confirmed subdomain
    if (assignedSubdomain && clean === assignedSubdomain.toLowerCase()) {
      setStatusState('already_owned');
      setErrorMessage(null);
      return;
    }

    if (!clean) {
      setStatusState('idle');
      setErrorMessage(null);
      return;
    }

    const { valid, error } = validateFormat(clean);
    if (!valid) {
      setStatusState('invalid');
      setErrorMessage(error || 'Invalid subdomain format.');
      return;
    }

    setStatusState('checking');
    setErrorMessage(null);

    // Cancel pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const currentSeq = ++requestSeqRef.current;

    const timer = setTimeout(async () => {
      try {
        const data = await CheckSubdomainAvailabilityApi(clean, controller.signal);

        // Ignore if a newer request was dispatched
        if (currentSeq !== requestSeqRef.current) return;

        if (data.available) {
          if (data.is_current_owner) {
            setStatusState('already_owned');
          } else {
            setStatusState('available');
          }
          setErrorMessage(null);
        } else {
          if (data.reason === 'already_taken') {
            setStatusState('taken');
            setErrorMessage('This subdomain is already claimed by another photographer.');
          } else if (data.reason?.includes('reserved')) {
            setStatusState('reserved');
            setErrorMessage('This name is reserved for platform infrastructure.');
          } else {
            setStatusState('invalid');
            setErrorMessage(data.reason || 'This name is unavailable.');
          }
        }
      } catch (err: any) {
        if (err?.name === 'CanceledError' || err?.name === 'AbortError') return;
        if (currentSeq === requestSeqRef.current) {
          setStatusState('error');
          setErrorMessage('Could not verify availability. Check network connection.');
        }
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [subdomainInput, assignedSubdomain]);

  // Claim submission handler
  const handleClaim = async () => {
    const clean = subdomainInput.trim().toLowerCase();
    if (!clean || statusState !== 'available') return;

    setIsClaiming(true);
    setErrorMessage(null);

    try {
      const data = await ClaimSubdomainApi(clean);

      const claimedSub = data.subdomain || clean;
      const fullUrl = data.url || getSubdomainPublicUrl(claimedSub);

      setAssignedSubdomain(claimedSub);
      setStatusState('already_owned');
      if (onSubdomainUpdated) {
        onSubdomainUpdated(claimedSub, fullUrl);
      }
    } catch (err: any) {
      const respStatus = err?.response?.status || err?.status;
      const respData = err?.response?.data || err?.data;

      if (respStatus === 409) {
        setStatusState('taken');
        setErrorMessage('Another photographer just claimed this name! Please choose a different subdomain.');
      } else if (respStatus === 400 && respData?.code === 'RENAME_PROHIBITED') {
        setErrorMessage(respData?.error || respData?.detail || 'Self-service domain renaming is not supported in v1.');
      } else {
        setErrorMessage(respData?.error || respData?.detail || err?.message || 'Failed to claim subdomain. Please try again.');
      }
    } finally {
      setIsClaiming(false);
    }
  };

  const copyUrl = () => {
    if (!assignedSubdomain) return;
    const url = getSubdomainPublicUrl(assignedSubdomain);
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentUrl = assignedSubdomain ? getSubdomainPublicUrl(assignedSubdomain) : '';

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 text-white max-w-2xl shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
          <Globe className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base sm:text-lg text-neutral-100">
              Personal Portfolio Subdomain
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[10px] font-mono uppercase font-bold tracking-wider">
              Signature
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
            Publish your signature photography website to a direct, personalized web address.
          </p>
        </div>
      </div>

      <div className="mt-5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
          Domain Address
        </label>

        <div className="flex items-center">
          <div className="relative flex-1">
            <input
              type="text"
              value={subdomainInput}
              onChange={(e) => setSubdomainInput(e.target.value)}
              disabled={isClaiming}
              placeholder="yourstudio"
              className={`w-full bg-neutral-950 border px-4 py-3 rounded-l-xl text-neutral-100 placeholder-neutral-600 focus:outline-none transition-colors font-mono text-sm ${
                statusState === 'available'
                  ? 'border-emerald-500/80 focus:border-emerald-500'
                  : statusState === 'taken' || statusState === 'invalid'
                  ? 'border-rose-500/80 focus:border-rose-500'
                  : statusState === 'already_owned'
                  ? 'border-amber-500/60 focus:border-amber-500'
                  : 'border-neutral-800 focus:border-neutral-600'
              }`}
            />
          </div>

          <div className="bg-neutral-800/80 border border-l-0 border-neutral-700 px-4 py-3 rounded-r-xl text-neutral-400 font-mono text-sm select-none">
            .exshare.ai
          </div>
        </div>

        {/* Live Status Messaging */}
        <div className="mt-3 flex items-center justify-between flex-wrap gap-2 min-h-[28px]">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            {statusState === 'checking' && (
              <span className="flex items-center gap-1.5 text-neutral-400">
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                Checking availability...
              </span>
            )}

            {statusState === 'available' && (
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <CheckCircle className="w-4 h-4" />
                Available to claim!
              </span>
            )}

            {statusState === 'already_owned' && (
              <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                <CheckCircle className="w-4 h-4" />
                Active live subdomain
              </span>
            )}

            {(statusState === 'taken' || statusState === 'reserved' || statusState === 'invalid') && (
              <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                <XCircle className="w-4 h-4" />
                {errorMessage}
              </span>
            )}

            {statusState === 'error' && (
              <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                <AlertCircle className="w-4 h-4" />
                {errorMessage}
              </span>
            )}
          </div>

          {/* Action Button: Claim vs Copy/Visit */}
          <div className="flex items-center gap-2">
            {statusState === 'available' && (
              <button
                type="button"
                onClick={handleClaim}
                disabled={isClaiming}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-xl text-xs sm:text-sm transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer active:scale-95"
              >
                {isClaiming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Claiming...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Claim Subdomain
                  </>
                )}
              </button>
            )}

            {assignedSubdomain && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyUrl}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors border border-neutral-700 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-neutral-400" />
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
                <a
                  href={currentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-amber-500/30"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Visit Site
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
