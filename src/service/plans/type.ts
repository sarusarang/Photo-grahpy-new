// -------------------------------------------------------------
// Studio Plans & Subscription API Type Definitions
// -------------------------------------------------------------

export interface StudioPlan {
  id: string;
  name: string;
  subtitle: string;
  tier: 'standard' | 'premium' | 'custom' | string;
  billing_cycle: 'quarterly' | 'annual' | 'monthly' | string;
  period_label: string;
  duration_months: number;
  monthly_price: string;
  original_monthly_price: string | null;
  total_price: string;
  billing_text: string;
  currency: string;
  tag: string;
  tag_type: 'default' | 'popular' | 'current';
  image_storage: string;
  video_storage: string;
  storage_limit_bytes: number;
  features: string[];
  cta_text: string;
  is_active: boolean;
  sort_order: number;
}

export interface StorageQuotaMetrics {
  used_bytes: number;
  limit_bytes: number;
  used_gb: number;
  limit_gb: number;
  used_percentage: number;
}

export interface CurrentSubscriptionPlanSummary {
  id: string;
  name: string;
  tier: string;
  billing_cycle: string;
  duration_months?: number;
  total_price?: string;
  currency?: string;
}

export interface CurrentSubscription {
  id: string;
  status: 'active' | 'expired' | 'pending' | 'cancelled';
  plan: CurrentSubscriptionPlanSummary;
  start_date: string;
  expiry_date: string;
  days_remaining: number;
  storage: StorageQuotaMetrics;
  auto_renew: boolean;
  payment_gateway_ref?: string;
}

export interface CheckoutOrderPayload {
  plan_id: string;
  gateway?: 'direct' | 'razorpay';
}

export interface CheckoutOrderResponse {
  status: string;
  message?: string;
  direct_activated: boolean;
  order_id?: string;
  amount?: number;
  amount_paise?: number;
  currency?: string;
  key_id?: string;
  plan_id?: string;
  payment_id?: string;
  subscription?: CurrentSubscription;
}

export interface VerifyPaymentPayload {
  plan_id: string;
  gateway_order_id: string;
  gateway_payment_id: string;
  gateway_signature: string;
  // Compatibility with razorpay_ prefixed keys
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
}

export interface VerifyPaymentResponse {
  status: string;
  message: string;
  subscription: CurrentSubscription;
}

export interface CancelAutoRenewResponse {
  status: string;
  message: string;
  auto_renew: boolean;
}
