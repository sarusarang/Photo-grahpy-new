import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce any fast-changing value (e.g. keystrokes).
 * Used to avoid flooding rate-limited availability endpoints.
 *
 * @param value The value to debounce
 * @param delay Milliseconds to wait before updating debounced value (default: 400ms)
 */
export function useDebounce<T>(value: T, delay: number = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
