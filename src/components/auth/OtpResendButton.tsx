import React, { useState, useEffect } from 'react';
import apiClient from '@/api/axiosClient';
import { toast } from 'sonner';

interface OtpResendButtonProps {
  emailOrPhone: string;
  endpoint?: string;
  cooldownSeconds?: number;
  className?: string;
}

export const OtpResendButton: React.FC<OtpResendButtonProps> = ({
  emailOrPhone,
  endpoint = '/api/auth/resend-otp/',
  cooldownSeconds = 60,
  className,
}) => {
  const [countdown, setCountdown] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  // Synchronize with server 429 throttle event if triggered globally
  useEffect(() => {
    const handleThrottleEvent = (e: Event) => {
      const custom = e as CustomEvent<{ seconds?: number; url?: string }>;
      if (custom.detail?.seconds) {
        setCountdown(custom.detail.seconds);
      }
    };
    window.addEventListener('api-throttled', handleThrottleEvent);
    return () => window.removeEventListener('api-throttled', handleThrottleEvent);
  }, []);

  const handleResend = async () => {
    if (countdown > 0 || loading) return;
    setLoading(true);

    try {
      await apiClient.post(endpoint, { email: emailOrPhone, identifier: emailOrPhone });
      toast.success('Verification code resent successfully.');
      setCountdown(cooldownSeconds);
    } catch (err: any) {
      if (err.response?.status === 429) {
        // If throttled by server, sync countdown to server time
        const match = err.response.data?.detail?.match(/(\d+)\s*seconds?/i);
        const retrySec = match ? parseInt(match[1], 10) : 60;
        setCountdown(retrySec);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleResend}
      disabled={countdown > 0 || loading}
      className={
        className ||
        "text-sm font-medium text-amber-400 hover:text-amber-300 disabled:text-neutral-500 disabled:cursor-not-allowed transition-colors"
      }
    >
      {loading ? (
        'Sending...'
      ) : countdown > 0 ? (
        `Resend code in ${countdown}s`
      ) : (
        'Resend verification code'
      )}
    </button>
  );
};

export default OtpResendButton;
