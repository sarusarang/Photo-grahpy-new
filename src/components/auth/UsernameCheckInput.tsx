import React, { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import apiClient from '@/api/axiosClient';
import { Check, X, Loader2, AlertCircle } from 'lucide-react';

interface UsernameCheckInputProps {
  value?: string;
  onChange?: (val: string) => void;
  onAvailabilityChange?: (isAvailable: boolean | null, username: string) => void;
  placeholder?: string;
  className?: string;
}

export const UsernameCheckInput: React.FC<UsernameCheckInputProps> = ({
  value: controlledValue,
  onChange,
  onAvailabilityChange,
  placeholder = 'Choose username',
  className = '',
}) => {
  const [internalUsername, setInternalUsername] = useState('');
  const username = controlledValue !== undefined ? controlledValue : internalUsername;
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('');

  // 400ms debounce avoids spamming the 45/min rate limit
  const debouncedUsername = useDebounce(username, 400);

  useEffect(() => {
    if (!debouncedUsername || debouncedUsername.trim().length < 3) {
      setIsAvailable(null);
      setMessage('');
      if (onAvailabilityChange) onAvailabilityChange(null, debouncedUsername);
      return;
    }

    let isMounted = true;
    setChecking(true);

    apiClient
      .get(`/api/auth/check-username/`, { params: { username: debouncedUsername } })
      .then((res) => {
        if (isMounted) {
          const available = res.data?.is_available ?? false;
          setIsAvailable(available);
          setMessage(res.data?.message || (available ? 'Username available' : 'Username taken'));
          if (onAvailabilityChange) onAvailabilityChange(available, debouncedUsername);
        }
      })
      .catch((err) => {
        if (isMounted) {
          if (err.response?.status === 429) {
            setMessage('Checking too fast. Please pause for a moment.');
          } else {
            setMessage(err.response?.data?.message || 'Unable to verify username.');
          }
          setIsAvailable(false);
          if (onAvailabilityChange) onAvailabilityChange(false, debouncedUsername);
        }
      })
      .finally(() => {
        if (isMounted) setChecking(false);
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedUsername, onAvailabilityChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '');
    if (controlledValue === undefined) {
      setInternalUsername(sanitized);
    }
    if (onChange) {
      onChange(sanitized);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="relative flex items-center">
        <input
          type="text"
          value={username}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full bg-neutral-900 border border-neutral-700 focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none transition-colors pr-10"
        />
        <div className="absolute right-3 flex items-center">
          {checking && <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />}
          {!checking && isAvailable === true && <Check className="w-4 h-4 text-emerald-400" />}
          {!checking && isAvailable === false && <X className="w-4 h-4 text-rose-400" />}
        </div>
      </div>

      {checking && (
        <p className="text-xs text-neutral-400 mt-1.5 flex items-center gap-1">
          <span>Checking availability...</span>
        </p>
      )}
      {!checking && isAvailable === true && (
        <p className="text-xs text-emerald-400 mt-1.5 font-medium flex items-center gap-1">
          <Check className="w-3.5 h-3.5" />
          <span>{message || 'Username available'}</span>
        </p>
      )}
      {!checking && isAvailable === false && (
        <p className="text-xs text-rose-400 mt-1.5 font-medium flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{message || 'Username is unavailable'}</span>
        </p>
      )}
    </div>
  );
};

export default UsernameCheckInput;
