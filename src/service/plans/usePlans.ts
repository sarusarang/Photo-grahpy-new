import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  GetStudioPlansApi,
  GetCurrentSubscriptionApi,
  CheckoutPlanApi,
  VerifyPaymentApi,
  CancelAutoRenewApi,
} from './PlanApi';
import type {
  StudioPlan,
  CurrentSubscription,
  CheckoutOrderPayload,
  CheckoutOrderResponse,
  VerifyPaymentPayload,
  VerifyPaymentResponse,
  CancelAutoRenewResponse,
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
export const useCurrentSubscription = (enabled: boolean = true) => {
  return useQuery<CurrentSubscription | null>({
    queryKey: ['current-subscription'],
    queryFn: async () => {
      return await GetCurrentSubscriptionApi();
    },
    enabled,
    staleTime: 60 * 1000,
    retry: 1,
  });
};

/**
 * Helper to dynamically load the Razorpay checkout script
 */
interface RazorpayWindow extends Window {
  Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
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
        queryClient.invalidateQueries({ queryKey: ['photographer-profile'] });
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
      queryClient.invalidateQueries({ queryKey: ['photographer-profile'] });
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
      toast.success('Auto-Renewal Updated', {
        description: data?.message || 'Auto-renewal has been turned off.',
      });
      queryClient.invalidateQueries({ queryKey: ['current-subscription'] });
    },
    onError: (error: Error) => {
      toast.error('Action Failed', {
        description: error?.message || 'Could not update auto-renewal settings.',
      });
    },
  });
};

/**
 * 6. Comprehensive Hook: usePlanUpgradeFlow
 * Manages both Direct Activation and Razorpay Popup checkout with loading state
 */
export const usePlanUpgradeFlow = (onSuccess?: (plan: StudioPlan) => void) => {
  const [upgradingPlanId, setUpgradingPlanId] = useState<string | null>(null);
  const checkoutMutation = useCheckoutPlan();
  const verifyMutation = useVerifyPayment();

  const handleUpgrade = async (plan: StudioPlan, preferredGateway: 'direct' | 'razorpay' = 'direct') => {
    setUpgradingPlanId(plan.id);

    try {
      // 1. Direct Mode (Instant Direct Activation)
      if (preferredGateway === 'direct') {
        const res = await checkoutMutation.mutateAsync({
          plan_id: plan.id,
          gateway: 'direct',
        });

        if (res.direct_activated) {
          onSuccess?.(plan);
          return res;
        }
      }

      // 2. Razorpay Mode
      let order: CheckoutOrderResponse;
      try {
        order = await checkoutMutation.mutateAsync({
          plan_id: plan.id,
          gateway: 'razorpay',
        });
      } catch {
        toast.error('Razorpay Order Error', {
          description: 'Payment gateway order could not be created on the backend. Try Instant Dev mode.',
        });
        return;
      }

      if (order.direct_activated) {
        onSuccess?.(plan);
        return order;
      }

      // Ensure Razorpay SDK script is ready
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      // Open Razorpay Checkout Dialog
      const options: Record<string, unknown> = {
        key: order.key_id || 'rzp_test_placeholder',
        amount: order.amount_paise || Number(order.amount || 0) * 100,
        currency: order.currency || 'INR',
        name: 'EX SHARE Atelier',
        description: `Upgrade to ${plan.name}`,
        order_id: order.order_id,
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        theme: {
          color: '#fbbf24', // Amber gold
        },
        handler: async (response: Record<string, string>) => {
          try {
            await verifyMutation.mutateAsync({
              plan_id: plan.id,
              gateway_order_id: response.razorpay_order_id || order.order_id || '',
              gateway_payment_id: response.razorpay_payment_id || '',
              gateway_signature: response.razorpay_signature || '',
            });
            onSuccess?.(plan);
          } catch (err: unknown) {
            console.error('Payment verification failed', err);
          }
        },
        modal: {
          ondismiss: () => {
            toast.info('Checkout Closed', {
              description: 'Payment was not completed.',
            });
          },
        },
      };

      const razorpayClass = (window as unknown as RazorpayWindow).Razorpay;
      if (razorpayClass) {
        const rzp = new razorpayClass(options);
        rzp.open();
      }
    } catch (err: unknown) {
      console.error('Upgrade flow error:', err);
    } finally {
      setUpgradingPlanId(null);
    }
  };

  return {
    handleUpgrade,
    upgradingPlanId,
    isUpgrading: checkoutMutation.isPending || verifyMutation.isPending || upgradingPlanId !== null,
  };
};
