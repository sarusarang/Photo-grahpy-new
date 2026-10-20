// hooks/useSubdomainCheck.ts
import { useState, useEffect } from 'react';
import { checkSubdomainAvailability } from '../services/portfolioApi';
import type { SubdomainAvailabilityResponse } from '../types/portfolio';

const SUBDOMAIN_REGEX = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/;
const RESERVED_CLIENT_LIST = new Set([
  'admin', 'api', 'app', 'www', 'static', 'media', 'dashboard',
  'billing', 'login', 'signup', 'register', 'root', 'exshare', 'support'
]);

export function useSubdomainCheck(token?: string, currentSubdomain?: string | null) {
  const [subdomain, setSubdomain] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<SubdomainAvailabilityResponse | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  // 1. Debounce input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(subdomain.trim().toLowerCase());
    }, 400);
    return () => clearTimeout(handler);
  }, [subdomain]);

  // 2. Perform validation and backend lookup
  useEffect(() => {
    if (!debouncedValue) {
      setResult(null);
      setClientError(null);
      return;
    }

    // Client-side quick checks
    if (debouncedValue.length < 3) {
      setClientError('Must be at least 3 characters long');
      setResult(null);
      return;
    }
    if (debouncedValue.length > 63) {
      setClientError('Cannot exceed 63 characters');
      setResult(null);
      return;
    }
    if (debouncedValue.startsWith('-') || debouncedValue.endsWith('-')) {
      setClientError('Cannot start or end with a hyphen');
      setResult(null);
      return;
    }
    if (!SUBDOMAIN_REGEX.test(debouncedValue)) {
      setClientError('Only lowercase letters, numbers, and hyphens allowed');
      setResult(null);
      return;
    }
    if (RESERVED_CLIENT_LIST.has(debouncedValue)) {
      setClientError(`'${debouncedValue}' is reserved for platform infrastructure`);
      setResult(null);
      return;
    }

    setClientError(null);

    // If matches user's current active subdomain
    if (currentSubdomain && currentSubdomain.toLowerCase() === debouncedValue) {
      setResult({
        subdomain: debouncedValue,
        available: true,
        url: `https://${debouncedValue}.exshare.ai`,
        message: 'Currently assigned to your studio',
        is_current_owner: true,
      });
      return;
    }

    // Query backend API
    let isCancelled = false;
    setIsChecking(true);

    checkSubdomainAvailability(debouncedValue, token)
      .then((data) => {
        if (!isCancelled) {
          setResult(data);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setResult({
            subdomain: debouncedValue,
            available: false,
            url: `https://${debouncedValue}.exshare.ai`,
            message: err.response?.data?.message || err.response?.data?.error || 'Validation error',
            reason: 'invalid_format',
          });
        }
      })
      .finally(() => {
        if (!isCancelled) setIsChecking(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [debouncedValue, token, currentSubdomain]);

  return {
    subdomain,
    setSubdomain,
    isChecking,
    result,
    clientError,
    isValid: Boolean(result?.available && !clientError),
  };
}
