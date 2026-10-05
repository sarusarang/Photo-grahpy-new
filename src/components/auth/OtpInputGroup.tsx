import React, { useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

export interface OtpInputGroupProps {
  /** The full 6-digit OTP string */
  value: string;
  /** Callback fired when any digit changes or when pasted */
  onChange: (value: string) => void;
  /** Optional callback fired when all 6 digits are fully filled */
  onComplete?: (value: string) => void;
  /** Whether the input is disabled (e.g. during submission or when expired) */
  disabled?: boolean;
  /** Indicates the OTP has expired */
  isExpired?: boolean;
  /** Whether there is a validation error */
  hasError?: boolean;
  /** Prefix for element IDs to prevent duplicate IDs on complex pages */
  idPrefix?: string;
  /** Whether to autofocus the first input slot on mount */
  autoFocus?: boolean;
  className?: string;
}

export const OtpInputGroup: React.FC<OtpInputGroupProps> = ({
  value,
  onChange,
  onComplete,
  disabled = false,
  isExpired = false,
  hasError = false,
  idPrefix = 'auth-otp',
  autoFocus = true,
  className,
}) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Split current value into array of 6 characters
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');

  // Auto focus first input on mount if requested
  useEffect(() => {
    if (autoFocus && !disabled && !isExpired) {
      inputsRef.current[0]?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run on initial mount

  const focusInput = (index: number) => {
    const clamped = Math.max(0, Math.min(5, index));
    inputsRef.current[clamped]?.focus();
    inputsRef.current[clamped]?.select();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, startIndex: number) => {
    e.preventDefault();
    if (disabled || isExpired) return;

    const pastedText = e.clipboardData.getData('text');
    const digitsOnly = pastedText.replace(/\D/g, '');
    if (!digitsOnly) return;

    const newDigits = [...digits];
    // If 6 or more digits pasted, fill completely from index 0
    const startFrom = digitsOnly.length >= 6 ? 0 : startIndex;
    const chars = digitsOnly.slice(0, 6 - startFrom).split('');

    chars.forEach((char, i) => {
      if (startFrom + i < 6) {
        newDigits[startFrom + i] = char;
      }
    });

    const fullCode = newDigits.join('');
    onChange(fullCode);

    if (fullCode.length === 6 && onComplete) {
      onComplete(fullCode);
    }

    const nextFocus = Math.min(5, startFrom + chars.length);
    focusInput(nextFocus);
  };

  const handleChange = (index: number, val: string) => {
    if (disabled || isExpired) return;

    const digitsOnly = val.replace(/\D/g, '');

    // User cleared the box
    if (!digitsOnly) {
      const nextDigits = [...digits];
      nextDigits[index] = '';
      const fullCode = nextDigits.join('');
      onChange(fullCode);
      return;
    }

    // Single digit input
    if (digitsOnly.length === 1) {
      const nextDigits = [...digits];
      nextDigits[index] = digitsOnly;
      const fullCode = nextDigits.join('');
      onChange(fullCode);

      if (fullCode.length === 6 && onComplete) {
        onComplete(fullCode);
      }

      if (index < 5) {
        focusInput(index + 1);
      }
      return;
    }

    // Multiple digits entered (native autofill or multi-character paste)
    const nextDigits = [...digits];
    if (digitsOnly.length === 2 && digitsOnly[0] === digits[index]) {
      // Replaced existing digit
      nextDigits[index] = digitsOnly[1];
      const fullCode = nextDigits.join('');
      onChange(fullCode);
      if (index < 5) {
        focusInput(index + 1);
      }
      return;
    }

    const startFrom = digitsOnly.length >= 6 ? 0 : index;
    const chars = digitsOnly.slice(0, 6 - startFrom).split('');
    chars.forEach((char, i) => {
      if (startFrom + i < 6) {
        nextDigits[startFrom + i] = char;
      }
    });

    const fullCode = nextDigits.join('');
    onChange(fullCode);

    if (fullCode.length === 6 && onComplete) {
      onComplete(fullCode);
    }

    const nextFocus = Math.min(5, startFrom + chars.length);
    focusInput(nextFocus);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        e.preventDefault();
        const nextDigits = [...digits];
        nextDigits[index - 1] = '';
        onChange(nextDigits.join(''));
        focusInput(index - 1);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      focusInput(index - 1);
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      focusInput(index + 1);
    }
  };

  return (
    <div
      className={cn(
        'flex gap-2 sm:gap-2.5 justify-between items-center my-1 select-none',
        className
      )}
      role="group"
      aria-label="6-digit verification code"
    >
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el;
          }}
          id={`${idPrefix}-${i}`}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={digit}
          disabled={disabled || isExpired}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(e, i)}
          onFocus={(e) => e.target.select()}
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`Digit ${i + 1} of 6`}
          className={cn(
            'w-11 h-12 sm:w-12 sm:h-14 text-center rounded-xl font-mono text-lg font-bold outline-none transition-all duration-200',
            disabled && 'opacity-50 cursor-not-allowed',
            isExpired && 'opacity-60 bg-neutral-900/60 border-neutral-800 text-neutral-500 cursor-not-allowed',
            !isExpired && hasError && 'border-rose-500/80 bg-rose-500/5 text-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30',
            !isExpired && !hasError && digit && 'bg-amber-400/10 border border-amber-400 text-amber-400 shadow-sm shadow-amber-400/10',
            !isExpired && !hasError && !digit && 'bg-neutral-900 border border-neutral-800 text-white hover:border-neutral-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30'
          )}
        />
      ))}
    </div>
  );
};
