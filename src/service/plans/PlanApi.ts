import { CommonApi } from '@/lib/CommonApi';
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
 * 1. Retrieve Public / Active Studio Plans Catalog
 * Endpoint: GET /api/plans/ (or /api/subscriptions/)
 */
export const GetStudioPlansApi = async (): Promise<StudioPlan[]> => {
  let res: unknown;
  try {
    res = await CommonApi('GET', '/api/plans/');
  } catch {
    // Graceful routing fallback to alias
    res = await CommonApi('GET', '/api/subscriptions/');
  }
  if (Array.isArray(res)) return res;
  const obj = res as Record<string, unknown> | null;
  if (obj && Array.isArray(obj.results)) return obj.results as StudioPlan[];
  if (obj && Array.isArray(obj.data)) return obj.data as StudioPlan[];
  if (obj && Array.isArray(obj.plans)) return obj.plans as StudioPlan[];
  return [];
};

/**
 * 2. Get Current Active Subscription, Expiry & Real-time Storage Quotas
 * Endpoint: GET /api/plans/current/ (or /api/subscriptions/current/)
 */
export const GetCurrentSubscriptionApi = async (): Promise<CurrentSubscription> => {
  try {
    return (await CommonApi('GET', '/api/plans/current/')) as CurrentSubscription;
  } catch {
    // Graceful routing fallback to alias
    return (await CommonApi('GET', '/api/subscriptions/current/')) as CurrentSubscription;
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
  // Ensure both naming conventions are provided for compatibility
  const body = {
    plan_id: payload.plan_id,
    gateway_order_id: payload.gateway_order_id || payload.razorpay_order_id,
    gateway_payment_id: payload.gateway_payment_id || payload.razorpay_payment_id,
    gateway_signature: payload.gateway_signature || payload.razorpay_signature,
    razorpay_order_id: payload.razorpay_order_id || payload.gateway_order_id,
    razorpay_payment_id: payload.razorpay_payment_id || payload.gateway_payment_id,
    razorpay_signature: payload.razorpay_signature || payload.gateway_signature,
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

