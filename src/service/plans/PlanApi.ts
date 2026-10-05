import { CommonApi } from '@/lib/CommonApi';
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
 * 1. Retrieve Public / Active Studio Plans Catalog
 * Endpoint: GET /api/plans/ (or /api/subscriptions/)
 */
export const GetStudioPlansApi = async (): Promise<StudioPlan[]> => {
  let res: unknown;
  try {
    res = await CommonApi('GET', '/api/plans/');
  } catch {
    res = await CommonApi('GET', '/api/subscriptions/');
  }

  let plans: StudioPlan[] = [];
  if (Array.isArray(res)) {
    plans = res;
  } else {
    const obj = res as Record<string, unknown> | null;
    if (obj && Array.isArray(obj.results)) plans = obj.results as StudioPlan[];
    else if (obj && Array.isArray(obj.data)) plans = obj.data as StudioPlan[];
    else if (obj && Array.isArray(obj.plans)) plans = obj.plans as StudioPlan[];
  }

  return plans;
};

/**
 * 2. Get Current Active Subscription, Expiry & Real-time Storage Quotas
 * Endpoint: GET /api/plans/current/ (or /api/subscriptions/current/)
 * 
 * Scalable Large-App Entitlement Handling:
 * - Active Plan: returns full CurrentSubscription.
 * - New User / No Plan: returns { has_subscription: false, status: 'no_plan', plan: null }.
 * - Server Failure (500, 502, 503, Network Offline): throws critical error to trigger
 *   the Studio Entitlement Service Error Fallback.
 */
export const GetCurrentSubscriptionApi = async (): Promise<CurrentSubscription> => {
  try {
    const res = (await CommonApi('GET', '/api/plans/current/')) as CurrentSubscription;
    if (res && (res.has_subscription === false || res.status === 'no_plan' || !res.plan)) {
      return {
        has_subscription: false,
        status: 'no_plan',
        plan: null,
      };
    }
    return res;
  } catch (err: any) {
    const status = err?.status || err?.response?.status;
    const data = err?.data || err?.response?.data;
    const errorCode = data?.code || data?.error_code;

    // Detect if this is specifically "User has no active subscription" (e.g. brand new user)
    if (
      status === 404 ||
      status === 402 ||
      errorCode === 'NO_ACTIVE_SUBSCRIPTION' ||
      errorCode === 'no_subscription' ||
      data?.has_subscription === false ||
      String(data?.detail || '').toLowerCase().includes('no active subscription') ||
      String(data?.message || '').toLowerCase().includes('no active subscription')
    ) {
      return {
        has_subscription: false,
        status: 'no_plan',
        plan: null,
      };
    }

    // Try secondary endpoint alias
    try {
      const resAlt = (await CommonApi('GET', '/api/subscriptions/current/')) as CurrentSubscription;
      if (resAlt && (resAlt.has_subscription === false || resAlt.status === 'no_plan' || !resAlt.plan)) {
        return {
          has_subscription: false,
          status: 'no_plan',
          plan: null,
        };
      }
      return resAlt;
    } catch (altErr: any) {
      const altStatus = altErr?.status || altErr?.response?.status;
      const altData = altErr?.data || altErr?.response?.data;
      const altCode = altData?.code || altData?.error_code;

      if (
        altStatus === 404 ||
        altStatus === 402 ||
        altCode === 'NO_ACTIVE_SUBSCRIPTION' ||
        altCode === 'no_subscription' ||
        altData?.has_subscription === false ||
        String(altData?.detail || '').toLowerCase().includes('no active subscription') ||
        String(altData?.message || '').toLowerCase().includes('no active subscription')
      ) {
        return {
          has_subscription: false,
          status: 'no_plan',
          plan: null,
        };
      }

      // True critical server error: throw so the dashboard shuts down cleanly
      throw altErr || err;
    }
  }
};

/**
 * 3. Initiate Checkout / Plan Upgrade (Supports 'direct' and 'razorpay')
 * Endpoint: POST /api/plans/checkout/
 */
export const CheckoutPlanApi = async (
  payload: CheckoutOrderPayload
): Promise<CheckoutOrderResponse> => {
  try {
    return (await CommonApi('POST', '/api/plans/checkout/', payload)) as CheckoutOrderResponse;
  } catch {
    return (await CommonApi('POST', '/api/subscriptions/checkout/', payload)) as CheckoutOrderResponse;
  }
};

/**
 * 4. Verify Razorpay Payment Signature and Activate Quota
 * Endpoint: POST /api/plans/verify/
 */
export const VerifyPaymentApi = async (
  payload: VerifyPaymentPayload
): Promise<VerifyPaymentResponse> => {
  // Ensure all naming conventions and subscription IDs are provided for Razorpay autopay
  const body = {
    plan_id: payload.plan_id,
    gateway_order_id: payload.gateway_order_id || payload.razorpay_order_id,
    gateway_payment_id: payload.gateway_payment_id || payload.razorpay_payment_id,
    gateway_signature: payload.gateway_signature || payload.razorpay_signature,
    gateway_subscription_id: payload.gateway_subscription_id || payload.razorpay_subscription_id,
    razorpay_order_id: payload.razorpay_order_id || payload.gateway_order_id,
    razorpay_payment_id: payload.razorpay_payment_id || payload.gateway_payment_id,
    razorpay_signature: payload.razorpay_signature || payload.gateway_signature,
    razorpay_subscription_id: payload.razorpay_subscription_id || payload.gateway_subscription_id,
  };

  try {
    return (await CommonApi('POST', '/api/plans/verify/', body)) as VerifyPaymentResponse;
  } catch {
    return (await CommonApi('POST', '/api/subscriptions/verify/', body)) as VerifyPaymentResponse;
  }
};

/**
 * 5. Turn Off Auto-Renewal for Current Subscription
 * Endpoint: POST /api/plans/cancel/
 */
export const CancelAutoRenewApi = async (): Promise<CancelAutoRenewResponse> => {
  try {
    return (await CommonApi('POST', '/api/plans/cancel/', {})) as CancelAutoRenewResponse;
  } catch {
    return (await CommonApi('POST', '/api/subscriptions/cancel/', {})) as CancelAutoRenewResponse;
  }
};

/**
 * 6. Add Extra Storage Add-on (For Studio Premium Elite)
 * Endpoint: POST /api/plans/storage-addon/
 */
export const AddStorageAddonApi = async (
  additional_gb: number
): Promise<{ status: string; subscription?: CurrentSubscription }> => {
  try {
    return await CommonApi('POST', '/api/plans/storage-addon/', { additional_gb });
  } catch {
    return await CommonApi('POST', '/api/subscriptions/storage-addon/', { additional_gb });
  }
};

/**
 * 7. Resume / Restart Membership (Netflix-style resumption before expiry)
 * Endpoint: POST /api/plans/resume/
 */
export const ResumeSubscriptionApi = async (): Promise<ResumeSubscriptionResponse> => {
  try {
    return (await CommonApi('POST', '/api/plans/resume/', {})) as ResumeSubscriptionResponse;
  } catch {
    return (await CommonApi('POST', '/api/subscriptions/resume/', {})) as ResumeSubscriptionResponse;
  }
};

