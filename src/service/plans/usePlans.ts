import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import {
  GetStudioPlansApi,
  GetCurrentSubscriptionApi,
  CheckoutPlanApi,
  VerifyPaymentApi,
  CancelAutoRenewApi,
  ResumeSubscriptionApi,
} from './PlanApi';
import type {
  StudioPlan,
  CurrentSubscription,
  CheckoutOrderPayload,
  CheckoutOrderResponse,
  VerifyPaymentPayload,
  VerifyPaymentResponse,
  CancelAutoRenewResponse,
  ResumeSubscriptionResponse,
} from './type';

/**
 * 1. Query: List all studio plans strictly from the API (No mock/dummy fallback)
 */
export const useStudioPlans = () => {
  return useQuery<StudioPlan[]>({
    queryKey: ['studio-plans'],
    queryFn: async () => {
      const plans = await GetStudioPlansApi();
      if (Array.isArray(plans)) {
        return plans;
      }
      return [];
    },
    staleTime: 60 * 1000,
    retry: 1,
  });
};

/**
 * 2. Query: Fetch current active subscription and storage quota metrics
 */
const SUBSCRIPTION_CACHE_KEY = 'exshare_studio_subscription_cache';

const getCachedSubscription = (): CurrentSubscription | undefined => {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = sessionStorage.getItem(SUBSCRIPTION_CACHE_KEY);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
};

const setCachedSubscription = (data: unknown) => {
  if (typeof window === 'undefined') return;
  try {
    if (data) {
      sessionStorage.setItem(SUBSCRIPTION_CACHE_KEY, JSON.stringify(data));
    } else if (data === null) {
      sessionStorage.removeItem(SUBSCRIPTION_CACHE_KEY);
    }
  } catch {
    // Non-fatal if storage unavailable
  }
};

export const useCurrentSubscription = (enabled?: boolean) => {
  const isPublicGuestRoute =
    typeof window !== 'undefined' &&
    (window.location.pathname.startsWith('/gallery/') ||
      window.location.pathname.startsWith('/events/') ||
      window.location.pathname.startsWith('/e/') ||
      window.location.pathname.startsWith('/portfolio/') ||
      window.location.pathname.startsWith('/guest/') ||
      window.location.pathname === '/' ||
      window.location.pathname === '/login' ||
      window.location.pathname === '/signup' ||
      window.location.pathname === '/register' ||
      window.location.pathname === '/onboarding');

  const isEnabled = enabled !== undefined ? enabled : !isPublicGuestRoute;

  return useQuery<CurrentSubscription | null>({
    queryKey: ['current-subscription'],
    queryFn: async () => {
      const res = await GetCurrentSubscriptionApi();
      setCachedSubscription(res);
      return res;
    },
    initialData: getCachedSubscription,
    enabled: isEnabled,
    staleTime: 60 * 1000,
    retry: 1,
  });
};

/**
 * Helper to dynamically load the Razorpay checkout script
 */
interface RazorpayWindow extends Window {
  Razorpay?: new (options: Record<string, unknown>) => {
    open: () => void;
    on?: (event: string, callback: (response: any) => void) => void;
    close?: () => void;
  };
}

export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window as unknown as RazorpayWindow).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * 3. Mutation: Checkout / Plan upgrade
 */
export const useCheckoutPlan = () => {
  const queryClient = useQueryClient();

  return useMutation<CheckoutOrderResponse, Error, CheckoutOrderPayload>({
    mutationFn: async (payload) => {
      return await CheckoutPlanApi(payload);
    },
    onSuccess: (data) => {
      if (data.direct_activated) {
        toast.success('Subscription Activated', {
          description: data.message || 'Your studio subscription is now active!',
        });
        queryClient.invalidateQueries({ queryKey: ['current-subscription'] });
        queryClient.invalidateQueries({ queryKey: ['subscription', 'current'] });
        queryClient.invalidateQueries({ queryKey: ['photographer-profile'] });
        queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      }
    },
    onError: (error: Error) => {
      toast.error('Upgrade Failed', {
        description: error?.message || 'Could not initiate plan checkout. Please try again.',
      });
    },
  });
};

/**
 * 4. Mutation: Verify payment signature
 */
export const useVerifyPayment = () => {
  const queryClient = useQueryClient();

  return useMutation<VerifyPaymentResponse, Error, VerifyPaymentPayload>({
    mutationFn: async (payload) => {
      return await VerifyPaymentApi(payload);
    },
    onSuccess: (data) => {
      toast.success('Payment Verified', {
        description: data?.message || 'Payment confirmed! Your new storage tier is now active.',
      });
      queryClient.invalidateQueries({ queryKey: ['current-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', 'current'] });
      queryClient.invalidateQueries({ queryKey: ['photographer-profile'] });
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
    },
    onError: (error: Error) => {
      toast.error('Verification Failed', {
        description: error?.message || 'Failed to verify payment with the gateway.',
      });
    },
  });
};

/**
 * 5. Mutation: Cancel Auto-Renewal
 */
export const useCancelAutoRenew = () => {
  const queryClient = useQueryClient();

  return useMutation<CancelAutoRenewResponse, Error, void>({
    mutationFn: async () => {
      return await CancelAutoRenewApi();
    },
    onSuccess: (data) => {
      toast.success('Subscription Cancelled', {
        description: data?.message || 'Your plan remains active until the end of your billing cycle.',
      });
      queryClient.invalidateQueries({ queryKey: ['current-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', 'current'] });
      queryClient.invalidateQueries({ queryKey: ['photographer-profile'] });
    },
    onError: (error: Error) => {
      toast.error('Action Failed', {
        description: error?.message || 'Could not cancel subscription.',
      });
    },
  });
};

/**
 * 6. Mutation: Resume / Restart Subscription (Netflix-style resumption before expiry)
 */
export const useResumeSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation<ResumeSubscriptionResponse, Error, void>({
    mutationFn: async () => {
      return await ResumeSubscriptionApi();
    },
    onSuccess: (data) => {
      toast.success('Membership Restarted', {
        description: data?.message || 'Your subscription will renew automatically at the end of the period.',
      });
      queryClient.invalidateQueries({ queryKey: ['current-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', 'current'] });
      queryClient.invalidateQueries({ queryKey: ['photographer-profile'] });
    },
    onError: (error: Error) => {
      toast.error('Resume Failed', {
        description: error?.message || 'Could not restart subscription.',
      });
    },
  });
};

/**
 * 6. Comprehensive Hook: usePlanUpgradeFlow
 * Razorpay Autopay Recurring Checkout & Signature Verification Flow
 */
export const usePlanUpgradeFlow = (onSuccess?: (plan: StudioPlan) => void) => {
  const [upgradingPlanId, setUpgradingPlanId] = useState<string | null>(null);
  const checkoutMutation = useCheckoutPlan();
  const verifyMutation = useVerifyPayment();
  const { user, photographer } = useAuth();

  const handleUpgrade = async (plan: StudioPlan) => {
    setUpgradingPlanId(plan.id);

    try {
      // 1. Create Razorpay Order / Subscription on backend
      let order: CheckoutOrderResponse;
      try {
        order = await checkoutMutation.mutateAsync({
          plan_id: plan.id,
          gateway: 'razorpay',
        });
      } catch (err: any) {
        setUpgradingPlanId(null);
        const errorMsg =
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.message ||
          'Failed to initialize checkout with Razorpay.';
        toast.error('Upgrade Failed', {
          description: errorMsg,
        });
        return;
      }

      // If backend direct activated without gateway (e.g. free tier or 100% coupon)
      if (order.direct_activated) {
        setUpgradingPlanId(null);
        toast.success('Subscription Activated', {
          description: `You are now on the ${plan.name} plan.`,
        });
        onSuccess?.(plan);
        return;
      }

      // 2. Ensure Razorpay SDK script is loaded
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      const razorpayKey =
        order.key_id ||
        import.meta.env.VITE_RAZORPAY_KEY_ID ||
        'rzp_test_51AbCdEfGhIjKl';

      // 3. Build Safe Prefill (NEVER send empty strings "" as Razorpay rejects them with 400 Bad Request)
      const prefill: Record<string, string> = {};
      const candidateEmail = (user?.email || photographer?.email || '').trim();
      const candidatePhone = (user?.phone || photographer?.phone || '').trim();
      const candidateName = (user?.fullname || photographer?.fullName || photographer?.studioName || '').trim();

      if (candidateEmail && candidateEmail.includes('@')) {
        prefill.email = candidateEmail;
      }
      if (candidatePhone && candidatePhone.replace(/\D/g, '').length >= 10) {
        prefill.contact = candidatePhone;
      }
      if (candidateName) {
        prefill.name = candidateName;
      }

      // 4. Build Clean Razorpay Options
      const options: Record<string, unknown> = {
        key: razorpayKey,
        name: 'EX SHARE Atelier',
        description: `Studio Cloud Plan — ${plan.name}`,
        theme: {
          color: '#fbbf24', // Amber gold
        },
        modal: {
          confirm_close: true,
          ondismiss: () => {
            setUpgradingPlanId(null);
            toast.info('Checkout Cancelled', {
              description: 'You closed the payment dialog before completing.',
            });
          },
        },
        notes: {
          plan_id: plan.id,
          plan_name: plan.name,
          user_id: user?.id ? String(user.id) : '',
        },
        handler: async (response: Record<string, string>) => {
          try {
            await verifyMutation.mutateAsync({
              plan_id: plan.id,
              gateway_order_id: response.razorpay_order_id || order.order_id || '',
              gateway_payment_id: response.razorpay_payment_id || '',
              gateway_signature: response.razorpay_signature || '',
              gateway_subscription_id: response.razorpay_subscription_id || order.subscription_id || '',
              razorpay_order_id: response.razorpay_order_id || order.order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              razorpay_subscription_id: response.razorpay_subscription_id || order.subscription_id,
            });
            onSuccess?.(plan);
          } catch (err: unknown) {
            console.error('Payment verification failed', err);
          } finally {
            setUpgradingPlanId(null);
          }
        },
      };

      // Only attach prefill if valid entries exist
      if (Object.keys(prefill).length > 0) {
        options.prefill = prefill;
      }

      // 5. Subscription vs Order parameter separation:
      // When subscription_id is provided, DO NOT pass amount or currency (Razorpay rules).
      // When order_id is provided, pass order_id, currency and integer amount in paise.
      if (order.subscription_id) {
        options.subscription_id = order.subscription_id;
      } else if (order.order_id) {
        options.order_id = order.order_id;
        options.currency = order.currency || plan.currency || 'INR';
        const amountPaise = order.amount_paise
          ? Math.round(Number(order.amount_paise))
          : Math.round(Number(order.amount || plan.total_price || 0) * 100);
        options.amount = amountPaise;
      } else {
        // Fallback if neither id was generated
        options.currency = order.currency || plan.currency || 'INR';
        const amountPaise = order.amount_paise
          ? Math.round(Number(order.amount_paise))
          : Math.round(Number(order.amount || plan.total_price || 0) * 100);
        options.amount = amountPaise;
      }

      const razorpayClass = (window as unknown as RazorpayWindow).Razorpay;
      if (razorpayClass) {
        const rzp = new razorpayClass(options);
        if (typeof rzp.on === 'function') {
          rzp.on('payment.failed', (response: any) => {
            setUpgradingPlanId(null);
            console.error('Razorpay payment failed:', response);
            const reason =
              response?.error?.description ||
              response?.error?.reason ||
              'Payment failed or was cancelled.';
            toast.error('Payment Failed', {
              description: reason,
            });
          });
        }
        rzp.open();
      } else {
        throw new Error('Razorpay client instance could not be initialized.');
      }
    } catch (err: unknown) {
      setUpgradingPlanId(null);
      console.error('Upgrade flow error:', err);
    }
  };

  return {
    handleUpgrade,
    upgradingPlanId,
    isUpgrading: checkoutMutation.isPending || verifyMutation.isPending || upgradingPlanId !== null,
  };
};
