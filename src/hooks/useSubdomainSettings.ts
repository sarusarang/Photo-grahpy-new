import { useState, useEffect, useRef, useCallback } from 'react';
import { subdomainService } from '../api/subdomainService';
import type { SubdomainAvailability, SubdomainStatusResponse, SubdomainStatus } from '../types/portfolio';

export interface UseSubdomainSettingsReturn {
  subdomainInput: string;
  statusData: SubdomainStatusResponse | null;
  availability: SubdomainAvailability | null;
  isChecking: boolean;
  isSubmitting: boolean;
  isRetrying: boolean;
  retryCooldown: number;
  errorMessage: string | null;
  onInputChange: (val: string) => void;
  claimSubdomain: () => Promise<boolean>;
  retryProvisioning: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

export const useSubdomainSettings = (
  initialSubdomain?: string | null,
  onClaimSuccess?: (claimedSubdomain: string, fullUrl: string) => void,
  initialStatus?: SubdomainStatus
): UseSubdomainSettingsReturn => {
  const [subdomainInput, setSubdomainInput] = useState(initialSubdomain || '');
  const [statusData, setStatusData] = useState<SubdomainStatusResponse | null>(() =>
    initialStatus
      ? {
          subdomain: initialSubdomain || null,
          status: initialStatus,
          domain: initialSubdomain ? `${initialSubdomain}.exshare.ai` : null,
          url: initialSubdomain ? `https://${initialSubdomain}.exshare.ai` : null,
          error: null,
          retry_allowed: initialStatus === 'failed',
        }
      : null
  );
  const [availability, setAvailability] = useState<SubdomainAvailability | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCooldown, setRetryCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync initialSubdomain prop when loaded
  useEffect(() => {
    if (initialSubdomain && !subdomainInput) {
      setSubdomainInput(initialSubdomain);
    }
  }, [initialSubdomain]);

  useEffect(() => {
    if (initialStatus) {
      setStatusData((prev) => (prev ? { ...prev, status: initialStatus } : {
        subdomain: initialSubdomain || null,
        status: initialStatus,
        domain: initialSubdomain ? `${initialSubdomain}.exshare.ai` : null,
        url: initialSubdomain ? `https://${initialSubdomain}.exshare.ai` : null,
        error: null,
        retry_allowed: initialStatus === 'failed',
      }));
    }
  }, [initialStatus, initialSubdomain]);

  // 1. Fetch current status
  const refreshStatus = useCallback(async () => {
    try {
      const data = await subdomainService.getStatus();
      setStatusData(data);
      if (data.subdomain && !subdomainInput) {
        setSubdomainInput(data.subdomain);
      }
    } catch (err) {
      console.error('Failed to load subdomain status', err);
    }
  }, [subdomainInput]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // 2. Poll every 4 seconds when provisioning is pending or provisioning
  useEffect(() => {
    if (statusData?.status === 'pending' || statusData?.status === 'provisioning') {
      const interval = setInterval(refreshStatus, 4000);
      return () => clearInterval(interval);
    }
  }, [statusData?.status, refreshStatus]);

  // 3. Countdown timer for retry rate limit and api-throttled listener
  useEffect(() => {
    if (retryCooldown <= 0) return;
    const timer = setInterval(() => setRetryCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [retryCooldown]);

  useEffect(() => {
    const handleThrottle = (e: Event) => {
      const customEvent = e as CustomEvent<{ seconds?: number; url?: string }>;
      if (customEvent.detail?.url?.includes('subdomain')) {
        const wait = customEvent.detail.seconds || 30;
        setRetryCooldown(wait);
        setErrorMessage(`Please wait ${wait}s before retrying.`);
      }
    };
    window.addEventListener('api-throttled', handleThrottle);
    return () => window.removeEventListener('api-throttled', handleThrottle);
  }, []);

  // 4. Debounced availability check (400ms) with AbortController
  const onInputChange = (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSubdomainInput(clean);
    setErrorMessage(null);

    if (abortControllerRef.current) abortControllerRef.current.abort();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    // If input matches existing confirmed active subdomain
    if (statusData?.subdomain && clean === statusData.subdomain.toLowerCase()) {
      setAvailability(null);
      setIsChecking(false);
      return;
    }

    if (!clean || clean.length < 3) {
      setAvailability(null);
      setIsChecking(false);
      return;
    }

    setIsChecking(true);
    debounceTimerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      try {
        const data = await subdomainService.checkAvailability(clean, controller.signal);
        setAvailability(data);
      } catch (err: any) {
        if (err?.name !== 'CanceledError' && err?.name !== 'AbortError') {
          console.error(err);
        }
      } finally {
        setIsChecking(false);
      }
    }, 400);
  };

  // 5. Claim submission
  const claimSubdomain = async (): Promise<boolean> => {
    if (!subdomainInput || isSubmitting) return false;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await subdomainService.claimSubdomain(subdomainInput);
      await refreshStatus();
      if (onClaimSuccess) {
        const fullUrl = res?.url || `https://${subdomainInput}.exshare.ai`;
        onClaimSuccess(subdomainInput, fullUrl);
      }
      return true;
    } catch (err: any) {
      if (err.response?.status === 409) {
        setErrorMessage('This subdomain was just claimed by another studio.');
      } else if (err.response?.status === 400) {
        setErrorMessage(err.response.data?.error || 'Subdomain renaming is not permitted.');
      } else {
        setErrorMessage('Failed to reserve subdomain. Please try again.');
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. Retry provisioning
  const retryProvisioning = async () => {
    if (retryCooldown > 0 || isRetrying) return;
    setIsRetrying(true);
    setErrorMessage(null);
    try {
      const res = await subdomainService.retryProvisioning();
      if (res?.retry_after_seconds) {
        setRetryCooldown(res.retry_after_seconds);
      }
      await refreshStatus();
    } catch (err: any) {
      if (err.response?.status === 429) {
        const wait = err.response.data?.retry_after_seconds || 30;
        setRetryCooldown(wait);
        setErrorMessage(`Please wait ${wait}s before retrying.`);
      } else {
        setErrorMessage('Failed to trigger retry.');
      }
    } finally {
      setIsRetrying(false);
    }
  };

  return {
    subdomainInput,
    statusData,
    availability,
    isChecking,
    isSubmitting,
    isRetrying,
    retryCooldown,
    errorMessage,
    onInputChange,
    claimSubdomain,
    retryProvisioning,
    refreshStatus,
  };
};
