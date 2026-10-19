import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, Sparkles, PhoneCall, Loader2 } from 'lucide-react';
import { useStudioPlans } from '@/service/plans/usePlans';
import type { StudioPlan } from '@/service/plans/type';
import { useAuth } from '@/context/AuthContext';

export interface PricingSectionProps {
  id?: string;
  className?: string;
}

export const PricingSection: React.FC<PricingSectionProps> = ({
  id = 'pricing',
  className = '',
}) => {
  const { isAuthenticated } = useAuth();
  const { data: apiPlans, isLoading } = useStudioPlans();

  // Billing Cycle Toggle: 'quarterly' | 'annual'
  const [billingCycle, setBillingCycle] = useState<'quarterly' | 'annual'>('annual');

  // Fallback high-fidelity plans in case API is loading or offline
  const fallbackPlans: StudioPlan[] = useMemo(
    () => [
      {
        id: 'plan-standard',
        name: 'Pro',
        subtitle: 'For studios seeking fast client proofing, instant delivery, and zero-loss dynamic range.',
        tier: 'standard',
        billing_cycle: billingCycle,
        duration_months: billingCycle === 'annual' ? 12 : 3,
        monthly_price: '800.00',
        original_monthly_price: '1100.00',
        total_price: billingCycle === 'annual' ? '9600.00' : '2400.00',
        billing_text:
          billingCycle === 'annual'
            ? '₹800 / Month • Billed Annually (₹9,600)'
            : '₹800 / Month • Billed Quarterly (₹2,400)',
        currency: 'INR',
        tag: 'POPULAR',
        tag_type: 'popular',
        image_storage_gb: 20,
        video_storage_gb: 10,
        image_storage: '20 GB',
        video_storage: '10 GB',
        storage_limit_bytes: 32212254720,
        features: [
          '20 GB High-Speed Image Storage',
          '10 GB Video Delivery',
          'Unlimited Client Galleries',
          'All 4 Layout Templates (Editorial, Masonry, etc.)',
          'PIN Security & Custom Watermark Suite',
          'Priority Delivery Speeds',
        ],
        cta_text: 'Get started',
        is_active: true,
        sort_order: 1,
      },
      {
        id: 'plan-premium',
        name: 'Pro Plus',
        subtitle: 'Designed for high-volume editorial studios, multi-day luxury weddings, and heavy video reels.',
        tier: 'premium',
        billing_cycle: billingCycle,
        duration_months: 12,
        monthly_price: '1800.00',
        original_monthly_price: '2400.00',
        total_price: '21600.00',
        billing_text: '₹1,800 / Month • Billed Annually (₹21,600)',
        currency: 'INR',
        tag: 'MOST POPULAR',
        tag_type: 'popular',
        image_storage_gb: 20,
        video_storage_gb: 10,
        image_storage: '20 GB',
        video_storage: '10 GB',
        storage_limit_bytes: 32212254720,
        features: [
          '20 GB High-Speed Image Storage',
          '10 GB 4K Video Delivery',
          'Dedicated High-Bandwidth Cloud Delivery',
          'Custom Domain & White-Labeling',
          'Advanced AI Face Search & Tagging',
          'Custom Studio Watermarking Suite',
          'VIP 24/7 Studio Priority Support',
        ],
        cta_text: 'Get started',
        is_active: true,
        sort_order: 2,
      },
    ],
    [billingCycle]
  );

  // Active plans based on fetched API or fallback
  const displayPlans = useMemo(() => {
    if (!apiPlans || apiPlans.length === 0) return fallbackPlans;

    // Filter by billing cycle or present standard + premium
    const standardPlan =
      apiPlans.find(
        (p) =>
          p.tier === 'standard' &&
          (billingCycle === 'annual' ? p.duration_months === 12 : p.duration_months === 3)
      ) ||
      apiPlans.find((p) => p.tier === 'standard') ||
      fallbackPlans[0];

    const premiumPlan =
      apiPlans.find((p) => p.tier === 'premium' || p.tier === 'elite') || fallbackPlans[1];

    return [
      {
        ...standardPlan,
        name: 'Pro',
        subtitle:
          standardPlan.subtitle ||
          'Ideal for growing studios who want ultra-fast client proofing and instant delivery.',
      },
      {
        ...premiumPlan,
        name: 'Pro Plus',
        subtitle:
          premiumPlan.subtitle ||
          'Ideal if you want to scale your studio with high-speed video reels and custom domains.',
      },
    ];
  }, [apiPlans, billingCycle, fallbackPlans]);

  const targetCtaLink = isAuthenticated ? '/dashboard/settings?tab=subscription' : '/signup';

  return (
    <section
      id={id}
      className={`relative w-full py-16 sm:py-20 lg:py-28 max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-14 overflow-hidden select-none ${className}`}
    >
      {/* Soft Ambient Violet Glow in Background matching the reference layout */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[900px] h-[500px] pointer-events-none opacity-45 -z-10 blur-3xl"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(147, 95, 255, 0.16) 0%, rgba(147, 95, 255, 0.04) 50%, transparent 75%)',
        }}
      />

      {/* ─── 1. SECTION HEADER ─── */}
      <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
        <motion.h2
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold tracking-tight text-neutral-900 leading-tight"
        >
          Choose your right plan!
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.85, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className="text-xs sm:text-sm lg:text-base text-neutral-600 font-normal mt-3 leading-relaxed"
        >
          Select from best plans, ensuring a perfect match. Need more or less?
          <br className="hidden sm:inline" /> Customize your subscription for a seamless fit!
        </motion.p>

        {/* ─── 2. BILLING CYCLE TOGGLE PILL ─── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="mt-7 sm:mt-8 inline-flex items-center p-1 rounded-full bg-white/80 backdrop-blur-md border border-neutral-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
        >
          {/* Monthly / Quarterly Tab */}
          <button
            type="button"
            onClick={() => setBillingCycle('quarterly')}
            className={`relative px-6 sm:px-7 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer ${
              billingCycle === 'quarterly'
                ? 'text-white'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {billingCycle === 'quarterly' && (
              <motion.div
                layoutId="activeBillingTab"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                className="absolute inset-0 rounded-full bg-[#7052ff] shadow-sm"
              />
            )}
            <span className="relative z-10">Quarterly</span>
          </button>

          {/* Annual Tab with discount badge */}
          <button
            type="button"
            onClick={() => setBillingCycle('annual')}
            className={`relative px-6 sm:px-7 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
              billingCycle === 'annual'
                ? 'text-white'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {billingCycle === 'annual' && (
              <motion.div
                layoutId="activeBillingTab"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                className="absolute inset-0 rounded-full bg-[#7052ff] shadow-sm"
              />
            )}
            <span className="relative z-10">Annual</span>
            <span
              className={`relative z-10 text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors ${
                billingCycle === 'annual'
                  ? 'bg-white/25 text-white'
                  : 'bg-[#7052ff]/10 text-[#7052ff]'
              }`}
            >
              save 27%
            </span>
          </button>
        </motion.div>
      </div>

      {/* ─── 3. PRICING CARDS GRID (3 Cards matching Image) ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 lg:gap-8 items-stretch max-w-6xl mx-auto">
        {/* CARD 1: PRO / STANDARD PLAN */}
        {displayPlans[0] && (
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-[30px] sm:rounded-[34px] bg-white p-7 sm:p-9 border border-neutral-200/80 shadow-[0_12px_40px_rgba(0,0,0,0.035)] hover:shadow-[0_20px_50px_rgba(112,82,255,0.08)] hover:-translate-y-1 transition-all duration-500 flex flex-col justify-between group"
          >
            <div>
              {/* Badge */}
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#7052ff] text-white text-xs font-bold shadow-xs mb-5">
                {displayPlans[0].name}
              </div>

              {/* Subtitle description */}
              <p className="text-xs sm:text-[13px] text-neutral-500 leading-relaxed font-normal min-h-[44px]">
                {displayPlans[0].subtitle}
              </p>

              {/* Pricing Display */}
              <div className="mt-6 mb-6">
                <div className="flex items-baseline gap-1">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={`price-pro-${billingCycle}`}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.35 }}
                      className="text-4xl sm:text-[44px] font-extrabold tracking-tight text-neutral-950 font-sans"
                    >
                      ₹{Math.round(Number(displayPlans[0].monthly_price))}
                    </motion.span>
                  </AnimatePresence>
                  <span className="text-xs sm:text-sm font-medium text-neutral-500">/month</span>
                </div>
                {displayPlans[0].original_monthly_price && (
                  <p className="text-[11px] text-neutral-400 font-mono mt-1">
                    <span className="line-through mr-1.5">
                      ₹{Math.round(Number(displayPlans[0].original_monthly_price))}
                    </span>
                    Billed {billingCycle === 'annual' ? 'annually (₹9,600)' : 'quarterly (₹2,400)'}
                  </p>
                )}
              </div>

              {/* Feature List Divider */}
              <div className="border-t border-neutral-100 my-6" />

              {/* Features List with Clean Checkmarks */}
              <ul className="space-y-3.5 mb-8 text-xs sm:text-[13px] text-neutral-700 font-normal">
                {displayPlans[0].features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 leading-snug">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-neutral-900">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA Button */}
            <Link
              to={targetCtaLink}
              className="w-full py-3 sm:py-3.5 rounded-2xl border border-neutral-200/90 hover:border-neutral-950 bg-white hover:bg-neutral-50 text-neutral-900 font-bold text-xs sm:text-sm tracking-wide transition-all text-center flex items-center justify-center gap-2 group-hover:bg-neutral-950 group-hover:text-white shadow-2xs hover:shadow-sm active:scale-[0.98]"
            >
              <span>Get started</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>
        )}

        {/* CARD 2: PRO PLUS / STUDIO PREMIUM ELITE */}
        {displayPlans[1] && (
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-[30px] sm:rounded-[34px] bg-white p-7 sm:p-9 border border-neutral-200/80 shadow-[0_12px_40px_rgba(0,0,0,0.035)] hover:shadow-[0_20px_50px_rgba(112,82,255,0.08)] hover:-translate-y-1 transition-all duration-500 flex flex-col justify-between group relative"
          >
            <div>
              {/* Badge */}
              <div className="flex items-center justify-between mb-5">
                <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#7052ff] text-white text-xs font-bold shadow-xs">
                  {displayPlans[1].name}
                </div>
                <span className="text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-700">
                  {displayPlans[1].tag || 'POPULAR'}
                </span>
              </div>

              {/* Subtitle description */}
              <p className="text-xs sm:text-[13px] text-neutral-500 leading-relaxed font-normal min-h-[44px]">
                {displayPlans[1].subtitle}
              </p>

              {/* Pricing Display */}
              <div className="mt-6 mb-6">
                <div className="flex items-baseline gap-1">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={`price-proplus-${billingCycle}`}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.35 }}
                      className="text-4xl sm:text-[44px] font-extrabold tracking-tight text-neutral-950 font-sans"
                    >
                      ₹{Math.round(Number(displayPlans[1].monthly_price))}
                    </motion.span>
                  </AnimatePresence>
                  <span className="text-xs sm:text-sm font-medium text-neutral-500">/month</span>
                </div>
                {displayPlans[1].original_monthly_price && (
                  <p className="text-[11px] text-neutral-400 font-mono mt-1">
                    <span className="line-through mr-1.5">
                      ₹{Math.round(Number(displayPlans[1].original_monthly_price))}
                    </span>
                    Billed annually (₹21,600)
                  </p>
                )}
              </div>

              {/* Feature List Divider */}
              <div className="border-t border-neutral-100 my-6" />

              {/* Features List with Clean Checkmarks */}
              <ul className="space-y-3.5 mb-8 text-xs sm:text-[13px] text-neutral-700 font-normal">
                {displayPlans[1].features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 leading-snug">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-neutral-900">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA Button */}
            <Link
              to={targetCtaLink}
              className="w-full py-3 sm:py-3.5 rounded-2xl border border-neutral-200/90 hover:border-neutral-950 bg-white hover:bg-neutral-50 text-neutral-900 font-bold text-xs sm:text-sm tracking-wide transition-all text-center flex items-center justify-center gap-2 group-hover:bg-neutral-950 group-hover:text-white shadow-2xs hover:shadow-sm active:scale-[0.98]"
            >
              <span>Get started</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>
        )}

        {/* CARD 3: CUSTOM / ENTERPRISE (Matching Reference Image 3rd Card exactly) */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-[30px] sm:rounded-[34px] bg-gradient-to-b from-[#ede6ff] via-[#f7f5ff] to-white p-7 sm:p-9 border border-[#ded5f8] shadow-[0_12px_40px_rgba(112,82,255,0.06)] hover:shadow-[0_20px_50px_rgba(112,82,255,0.14)] hover:-translate-y-1 transition-all duration-500 flex flex-col justify-between group"
        >
          <div>
            {/* White Pill Badge */}
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white text-neutral-950 border border-neutral-200/70 text-xs font-bold shadow-xs mb-5">
              Custom
            </div>

            {/* Subtitle description */}
            <p className="text-xs sm:text-[13px] text-neutral-600 leading-relaxed font-normal min-h-[44px]">
              If these plans don't fit, let's create one that suits. Customize your subscription for a
              perfect fit, bigger or smaller!
            </p>

            {/* Big Headline Callout */}
            <div className="mt-6 mb-6">
              <h3 className="text-4xl sm:text-[44px] font-extrabold tracking-tight text-neutral-950 leading-none">
                Let's Talk!
              </h3>
              <p className="text-[11px] text-neutral-500 font-mono mt-2">
                Bespoke studio quotes within 24h
              </p>
            </div>

            {/* Feature List Divider */}
            <div className="border-t border-purple-200/60 my-6" />

            {/* Features List with Clean Checkmarks */}
            <ul className="space-y-3.5 mb-8 text-xs sm:text-[13px] text-neutral-800 font-normal">
              {[
                'Everything in Pro Plus Atelier',
                'Multi-TB Custom Dedicated RAW Vault',
                'Custom White-Label Mobile App for Clients',
                'Dedicated High-Bandwidth Cloud Ingestion',
                'Multiple Studio Seats & Role Permissions',
                'Dedicated Concierge & Custom SLA',
              ].map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3 leading-snug">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-neutral-900">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA Button: Dark Solid Button matching reference */}
          <a
            href="mailto:concierge@exshare.ai?subject=Custom%20Studio%20Plan%20Inquiry"
            className="w-full py-3 sm:py-3.5 rounded-2xl bg-[#1e1c2e] hover:bg-neutral-950 text-white font-bold text-xs sm:text-sm tracking-wide transition-all text-center flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            <PhoneCall className="w-3.5 h-3.5 opacity-80" />
            <span>Book a Call</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
};
