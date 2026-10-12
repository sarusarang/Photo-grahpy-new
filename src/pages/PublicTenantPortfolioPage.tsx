import React, { useEffect, useState, useMemo } from 'react';
import { Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { getPortfolioTemplate } from '@/components/portfolio/templates/PortfolioTemplateRegistry';
import {
  GetPublicTenantPortfolioApi,
  SubmitPublicTenantInquiryApi,
  TrackPublicTenantViewApi,
} from '@/service/portfolio/PortfolioApi';
import { normalizePortfolioConfig } from '@/services/portfolioService';
import type { PortfolioConfig } from '@/types/portfolio';
import { usePortfolioSeo } from '@/hooks/useSeo';

interface PublicTenantPortfolioPageProps {
  subdomain?: string | null;
}

export const PublicTenantPortfolioPage: React.FC<PublicTenantPortfolioPageProps> = ({
  subdomain,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [portfolio, setPortfolio] = useState<PortfolioConfig | null>(null);
  const [notFound, setNotFound] = useState<boolean>(false);

  // Fetch published portfolio resolved directly from Host / Subdomain
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setNotFound(false);

    GetPublicTenantPortfolioApi(subdomain || undefined)
      .then((rawConfig) => {
        if (!isMounted) return;

        const normalized = normalizePortfolioConfig(rawConfig as any);
        setPortfolio(normalized);
        setNotFound(false);

        // Record real-time visitor telemetry to tenant analytics
        const deviceType =
          window.innerWidth < 768
            ? 'mobile'
            : window.innerWidth < 1024
            ? 'tablet'
            : 'desktop';

        TrackPublicTenantViewApi(
          {
            page_section: 'hero',
            device: deviceType,
          },
          subdomain || undefined
        ).catch(() => {});
      })
      .catch((err) => {
        if (!isMounted) return;
        const statusCode = err?.response?.status || err?.status;
        if (statusCode === 404) {
          setNotFound(true);
        } else {
          // If network error, still check if 404
          setNotFound(true);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [subdomain]);

  // Dynamic OpenGraph, Twitter, and SEO Metadata
  usePortfolioSeo(portfolio, subdomain || undefined);

  // Handle client inquiry submission on tenant domain
  const handleInquirySubmit = async (inquiryData: {
    clientName: string;
    clientEmail: string;
    clientPhone?: string;
    eventDate?: string;
    eventType: string;
    location?: string;
    estimatedBudget?: string;
    message: string;
  }): Promise<boolean> => {
    try {
      const res = await SubmitPublicTenantInquiryApi(
        {
          client_name: inquiryData.clientName,
          client_email: inquiryData.clientEmail,
          client_phone: inquiryData.clientPhone,
          event_type: inquiryData.eventType,
          event_date: inquiryData.eventDate,
          location: inquiryData.location,
          budget: inquiryData.estimatedBudget,
          message: inquiryData.message,
        },
        subdomain || undefined
      );
      return Boolean(res?.success);
    } catch (err) {
      console.error('Tenant inquiry submission error:', err);
      return false;
    }
  };

  // Resolve template component dynamically
  const TemplateComponent = useMemo(() => {
    if (!portfolio) return null;
    return getPortfolioTemplate(portfolio.templateId);
  }, [portfolio]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center text-white px-4">
        <div className="relative flex items-center justify-center mb-5">
          <div className="w-16 h-16 rounded-full border-2 border-amber-500/20 border-t-amber-400 animate-spin" />
          <Loader2 className="w-6 h-6 text-amber-400 absolute" />
        </div>
        <p className="text-neutral-400 text-xs tracking-widest font-mono uppercase">
          Loading Portfolio Showcase...
        </p>
      </div>
    );
  }

  if (notFound || !portfolio || !TemplateComponent) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-6 text-neutral-400 shadow-xl">
          <AlertCircle className="w-8 h-8 text-neutral-400" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold mb-2 text-neutral-100">
          Portfolio Not Found
        </h1>
        <p className="text-neutral-400 max-w-md text-xs sm:text-sm mb-8 leading-relaxed">
          {subdomain ? (
            <>
              The signature showcase for <span className="font-mono text-amber-300">"{subdomain}"</span> has not been published or does not exist.
            </>
          ) : (
            'The showcase you are looking for has not been published or does not exist.'
          )}
        </p>
        <a
          href="https://exshare.ai"
          className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold tracking-wider uppercase transition-all border border-neutral-800 hover:border-neutral-700 shadow-lg"
        >
          <span>Return to EX SHARE</span>
          <ArrowRight className="w-4 h-4 text-amber-400" />
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white">
      <TemplateComponent
        config={portfolio}
        photographerSlug={subdomain || undefined}
        onInquirySubmit={handleInquirySubmit}
        isPreview={false}
        isEditable={false}
      />
    </div>
  );
};
