// -------------------------------------------------------------
// Studio Plans & Subscription API Type Definitions
// -------------------------------------------------------------

export interface StudioPlan {
  id: string;
  name: string;
  subtitle: string;
  tier: 'standard' | 'premium' | 'custom' | string;
  billing_cycle: 'quarterly' | 'annual' | 'monthly' | string;
  period_label?: string;
  duration_months: number;
  monthly_price: string | number;
  original_monthly_price: string | number | null;
  total_price: string | number;
  billing_text?: string;
  currency: string;
  tag: string;
  tag_type: 'default' | 'popular' | 'current';
  image_storage?: string;
  video_storage?: string;
  image_storage_gb?: number;
  video_storage_gb?: number;
  storage_limit_bytes: number;
  features: string[];
  cta_text: string;
  max_galleries?: number;
  gallery_expiry_days?: number;
  face_search_enabled?: boolean;
  max_events?: number;
  allowed_templates?: string[];
  allowed_portfolio_templates?: string[];
  max_portfolio_posts?: number;
  max_inquiries?: number;
  has_full_inquiry_access?: boolean;
  can_upgrade_storage?: boolean;
  max_upgrade_image_gb?: number;
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

export interface ResourceUsageMetric {
  used: number;
  limit: number;
  remaining: number | null;
  is_unlimited: boolean;
}

export interface SubscriptionUsageSummary {
  galleries: ResourceUsageMetric;
  events: ResourceUsageMetric;
  portfolio_posts: ResourceUsageMetric;
}

export interface CurrentSubscriptionPlanSummary {
  id: string;
  name: string;
  tier: 'standard' | 'premium' | 'custom' | string;
  billing_cycle: 'quarterly' | 'annual' | 'monthly' | string;
  max_galleries?: number;
  allowed_templates?: string[];
  face_search_enabled?: boolean;
  gallery_expiry_days?: number;
  max_events?: number;
  max_portfolio_posts?: number;
  has_full_inquiry_access?: boolean;
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
  usage?: SubscriptionUsageSummary;
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
