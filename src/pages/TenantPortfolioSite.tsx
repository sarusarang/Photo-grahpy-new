import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { publicTenantService } from '../api/subdomainService';
import { fetchTenantPortfolioSite } from '../services/portfolioApi';
import type { TenantPortfolioData, PortfolioConfig, PortfolioProject } from '../types/portfolio';
import { getPortfolioTemplate } from '../components/portfolio/templates/PortfolioTemplateRegistry';
import { normalizePortfolioConfig } from '../services/portfolioService';
import { usePortfolioSeo } from '../hooks/useSeo';
import { EventGalleryModal } from '../components/portfolio/EventGalleryModal';
import { BookingInquiryModal } from '../components/portfolio/BookingInquiryModal';
import { WhatsAppFloatingButton, WhatsAppIcon } from '../components/portfolio/WhatsAppFloatingButton';
import {
  Loader2,
  AlertCircle,
  ArrowRight,
  MapPin,
  Calendar,
  Sparkles,
  ExternalLink,
  Globe,
  Quote,
  Eye,
  Mail,
  Send,
} from 'lucide-react';

const InstagramIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const YouTubeIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

export interface TenantPortfolioSiteProps {
  subdomain?: string | null;
}

export const TenantPortfolioSite: React.FC<TenantPortfolioSiteProps> = ({ subdomain: propSubdomain }) => {
  const { subdomain: routeSubdomain } = useParams<{ subdomain?: string }>();
  const [searchParams] = useSearchParams();
  const querySubdomain = searchParams.get('subdomain');

  const targetSubdomain = propSubdomain || routeSubdomain || querySubdomain || null;

  const [data, setData] = useState<TenantPortfolioData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);

  // Lightbox & Inquiry Modal States
  const [activeProject, setActiveProject] = useState<PortfolioProject | null>(null);
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setNotFound(false);

    // 1. Fetch showcase configuration from backend
    fetchTenantPortfolioSite(targetSubdomain || undefined)
      .then((res) => {
        if (!isMounted) return;
        setData(res as unknown as TenantPortfolioData);
        setNotFound(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        if (err.response?.status === 404) {
          setNotFound(true);
        } else {
          // Attempt fallback through publicTenantService
          publicTenantService
            .getPortfolioShowcase()
            .then((res) => {
              if (!isMounted) return;
              setData(res);
              setNotFound(false);
            })
            .catch(() => {
              if (!isMounted) return;
              setNotFound(true);
            });
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    // 2. Fire telemetry visitor tracker on mount
    const deviceType: 'mobile' | 'tablet' | 'desktop' =
      window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop';

    publicTenantService
      .trackView({
        page_section: 'hero',
        device: deviceType,
        device_type: deviceType,
        referrer: document.referrer || 'direct',
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [targetSubdomain]);

  // Convert to full PortfolioConfig for template rendering and SEO
  const portfolioConfig: PortfolioConfig | null = useMemo(() => {
    if (!data) return null;
    return normalizePortfolioConfig(data as any);
  }, [data]);

  // Dynamic SEO metadata
  usePortfolioSeo(portfolioConfig, targetSubdomain || data?.subdomain || undefined);

  // Inquiries submission handler
  const handleInquirySubmit = async (inquiryData: {
    clientName?: string;
    clientEmail?: string;
    clientPhone?: string;
    eventDate?: string;
    eventType?: string;
    location?: string;
    estimatedBudget?: string;
    message: string;
    client_name?: string;
    client_email?: string;
    client_phone?: string;
    event_type?: string;
    event_date?: string;
    event_location?: string;
    estimated_budget?: string;
  }): Promise<boolean> => {
    try {
      const res = await publicTenantService.submitInquiry({
        client_name: inquiryData.client_name || inquiryData.clientName || '',
        client_email: inquiryData.client_email || inquiryData.clientEmail || '',
        client_phone: inquiryData.client_phone || inquiryData.clientPhone || '',
        event_type: inquiryData.event_type || inquiryData.eventType || 'wedding',
        event_date: inquiryData.event_date || inquiryData.eventDate || '',
        event_location: inquiryData.event_location || inquiryData.location || '',
        location: inquiryData.location || inquiryData.event_location || '',
        estimated_budget: inquiryData.estimated_budget || inquiryData.estimatedBudget || '',
        budget: inquiryData.estimatedBudget || inquiryData.estimated_budget || '',
        message: inquiryData.message,
      });
      return Boolean(res?.success || (res as any)?.status === 'success' || res?.inquiry_id);
    } catch {
      return false;
    }
  };

  // Resolve template component
  const Template = data && data.templateId ? getPortfolioTemplate(data.templateId) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white px-4">
        <div className="relative flex items-center justify-center mb-5">
          <div className="w-16 h-16 rounded-full border-2 border-amber-500/20 border-t-amber-400 animate-spin" />
          <Loader2 className="w-6 h-6 text-amber-400 absolute" />
        </div>
        <p className="text-neutral-400 text-xs tracking-widest font-mono uppercase">
          Loading Portfolio Atelier...
        </p>
      </div>
    );
  }

  if (notFound || !data || !portfolioConfig) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-center p-6 text-neutral-100">
        <div className="w-16 h-16 rounded-3xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-6 text-neutral-400 shadow-2xl">
          <AlertCircle className="w-8 h-8 text-amber-400" />
        </div>
        <h1 className="text-3xl font-serif mb-2 text-white">Portfolio is private or does not exist</h1>
        <p className="text-neutral-400 text-xs sm:text-sm max-w-md mb-8 leading-relaxed">
          {targetSubdomain ? (
            <>
              The signature showcase for <span className="font-mono text-amber-300">"{targetSubdomain}"</span> is private or does not exist.
            </>
          ) : (
            'This photography portfolio is private or does not exist.'
          )}
        </p>
        <a
          href="https://exshare.ai"
          className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold tracking-wider uppercase transition-all border border-neutral-800 hover:border-neutral-700 shadow-xl"
        >
          <span>Return to EX SHARE</span>
          <ArrowRight className="w-4 h-4 text-amber-400" />
        </a>
      </div>
    );
  }

  // If a template is configured in the template registry (e.g. editorial-vogue, darkroom-atelier),
  // render the designated full-featured layout!
  if (Template && data.templateId !== 'default') {
    return (
      <div className="min-h-screen bg-black text-white selection:bg-amber-500 selection:text-black">
        {React.createElement(Template, {
          config: portfolioConfig,
          photographerSlug: targetSubdomain || data.subdomain || undefined,
          onInquirySubmit: handleInquirySubmit,
          isPreview: false,
          isEditable: false,
        })}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STANDALONE SIGNATURE ATELIER SHOWCASE LAYOUT (UI/UX Specification)
  // ═══════════════════════════════════════════════════════════════════════════
  const accentColor = data.accentColor || '#d4af37';
  const cleanWaNumber = data.cleanWhatsappNumber || data.whatsappNumber;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-amber-500 selection:text-black antialiased font-sans">
      {/* ─── 1. HERO & BRANDING BANNER ─── */}
      <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Full-bleed background with subtle ken-burns zoom */}
        <div className="absolute inset-0 z-0">
          <img
            src={
              data.bannerUrl ||
              'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1920&auto=format&fit=crop&q=85'
            }
            alt={data.studioName}
            className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000"
          />
          {/* Elegant Dark Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/45 to-neutral-950" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center space-y-6 pt-16 pb-12">
          {/* Avatar / Studio Crest */}
          {data.avatarUrl && (
            <div className="relative inline-block mb-2">
              <img
                src={data.avatarUrl}
                alt={data.artistName || data.studioName}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full mx-auto object-cover border-2 shadow-2xl"
                style={{ borderColor: `${accentColor}80` }}
              />
              <span
                className="absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-neutral-950"
                style={{ backgroundColor: accentColor }}
                title="Verified Studio"
              />
            </div>
          )}

          {/* Location Badge */}
          {data.location && (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-neutral-200 text-xs font-mono uppercase tracking-widest">
              <MapPin className="w-3 h-3 text-amber-400" />
              <span>{data.location}</span>
            </div>
          )}

          {/* Studio Name & Artist Title */}
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif tracking-tight text-white font-normal leading-[1.08]">
              {data.studioName}
            </h1>
            {data.artistName && (
              <p
                className="text-xs sm:text-sm font-mono uppercase tracking-[0.25em] font-medium"
                style={{ color: accentColor }}
              >
                By {data.artistName}
              </p>
            )}
          </div>

          {/* Tagline */}
          {data.tagline && (
            <p className="text-sm sm:text-base md:text-lg text-neutral-300 max-w-2xl mx-auto font-light leading-relaxed">
              {data.tagline}
            </p>
          )}

          {/* Action CTAs: Inquire / Book Session */}
          <div className="pt-4 flex items-center justify-center gap-3.5 flex-wrap">
            <button
              onClick={() => setIsInquiryModalOpen(true)}
              className="px-7 py-3.5 rounded-full text-neutral-950 font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-xl active:scale-95 flex items-center gap-2"
              style={{ backgroundColor: accentColor }}
            >
              <Send className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Commission Studio</span>
            </button>

            {data.whatsappEnabled && cleanWaNumber && (
              <a
                href={`https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(
                  data.whatsappPrefillMessage || 'Hello, I would like to inquire about booking a session.'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-md text-white font-semibold text-xs tracking-wider uppercase border border-white/15 transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
                <span>Chat on WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ─── 2. FEATURED WORKS MASONRY GRID ─── */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-neutral-900">
        <div className="text-center space-y-2 mb-14">
          <span
            className="text-[11px] font-mono uppercase tracking-[0.25em] font-bold block"
            style={{ color: accentColor }}
          >
            Selected Masterworks
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif text-white">Visual Stories</h2>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto">
            Click on any editorial archive to view the curated photo collection.
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {(data.featuredWorks || []).map((work) => {
            const projectItem: PortfolioProject = {
              ...work,
              highlightMedia: work.highlightMedia?.length ? work.highlightMedia : [work.coverUrl],
            };

            return (
              <div
                key={work.id}
                onClick={() => setActiveProject(projectItem)}
                className="group relative rounded-3xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-xl cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-neutral-700"
              >
                {/* Project Image */}
                <div className="relative aspect-[4/5] overflow-hidden bg-neutral-950">
                  <img
                    src={work.coverUrl}
                    alt={work.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  {/* Scrim Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                  {/* Top Category Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider bg-black/60 backdrop-blur-md border border-white/10 text-white font-medium">
                      {work.category}
                    </span>
                  </div>

                  {/* Media Count Pill */}
                  <div className="absolute top-4 right-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-black/60 backdrop-blur-md text-neutral-300 border border-white/10 flex items-center gap-1">
                      <Eye className="w-3 h-3 text-amber-400" />
                      <span>{work.mediaCount || work.highlightMedia?.length || 1}</span>
                    </span>
                  </div>

                  {/* Bottom Work Information */}
                  <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
                    <h3 className="font-serif text-xl sm:text-2xl tracking-tight leading-snug group-hover:text-amber-300 transition-colors">
                      {work.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-neutral-400 font-mono">
                      {work.location && <span>{work.location}</span>}
                      {work.year && <span>• {work.year}</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── 3. ABOUT & PHILOSOPHY SECTION ─── */}
      <section className="max-w-5xl mx-auto px-6 py-20 border-t border-neutral-900">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          {/* Philosophy Quote */}
          <div className="md:col-span-5 space-y-4 p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800/80 relative">
            <Quote className="w-8 h-8 opacity-20" style={{ color: accentColor }} />
            <blockquote className="text-base sm:text-lg font-serif italic text-neutral-200 leading-relaxed">
              "{data.philosophyQuote || 'Photography is the poetry of moments you cannot put into words.'}"
            </blockquote>
            <p
              className="text-xs font-mono uppercase tracking-widest font-bold pt-2"
              style={{ color: accentColor }}
            >
              — {data.philosophyAuthor || data.artistName || data.studioName}
            </p>
          </div>

          {/* Narrative & Bio */}
          <div className="md:col-span-7 space-y-4">
            <span
              className="text-[11px] font-mono uppercase tracking-[0.25em] font-bold block"
              style={{ color: accentColor }}
            >
              About the Craft
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif text-white">
              Behind the Lens
            </h2>
            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed font-light">
              {data.bio ||
                'Documenting raw emotion, modern romanticism, and timeless moments with quiet observation.'}
            </p>
            {data.aboutStory && (
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed pt-2">
                {data.aboutStory}
              </p>
            )}

            {/* Inquire Action Button */}
            <div className="pt-4">
              <button
                onClick={() => setIsInquiryModalOpen(true)}
                className="px-6 py-3 rounded-full text-neutral-950 font-bold text-xs uppercase tracking-wider transition cursor-pointer active:scale-95 flex items-center gap-2"
                style={{ backgroundColor: accentColor }}
              >
                <span>Check Availability</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. FOOTER & SOCIALS ─── */}
      <footer className="border-t border-neutral-900 py-14 px-6 text-center text-neutral-500 text-xs">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Social Icons */}
          <div className="flex items-center justify-center gap-4">
            {data.instagramHandle && (
              <a
                href={`https://instagram.com/${data.instagramHandle.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:border-neutral-700 transition"
                title="Instagram"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>
            )}
            {data.youtubeHandle && (
              <a
                href={
                  data.youtubeHandle.startsWith('http')
                    ? data.youtubeHandle
                    : `https://youtube.com/@${data.youtubeHandle.replace('@', '')}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:border-neutral-700 transition"
                title="YouTube"
              >
                <YouTubeIcon className="w-4 h-4" />
              </a>
            )}
            {data.websiteUrl && (
              <a
                href={data.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:border-neutral-700 transition"
                title="Website"
              >
                <Globe className="w-4 h-4" />
              </a>
            )}
          </div>

          <p className="font-serif text-sm text-neutral-300">
            {data.studioName} • All Rights Reserved
          </p>

          <p className="text-[11px] text-neutral-600 font-mono tracking-wider">
            Powered by <span className="text-amber-500 font-bold">EX SHARE Atelier</span> • High-Performance Multi-Tenant Architecture
          </p>
        </div>
      </footer>

      {/* ─── 5. FLOATING WHATSAPP BUTTON ─── */}
      {data.whatsappEnabled && cleanWaNumber && (
        <WhatsAppFloatingButton
          whatsappNumber={cleanWaNumber}
          prefillMessage={
            data.whatsappPrefillMessage || 'Hello, I would like to inquire about booking a session.'
          }
          buttonLabel={data.whatsappButtonLabel || 'Chat on WhatsApp'}
          enabled={true}
        />
      )}

      {/* ─── 6. EDITORIAL LIGHTBOX MODAL (Highlight Media) ─── */}
      <EventGalleryModal
        isOpen={Boolean(activeProject)}
        project={activeProject}
        onClose={() => setActiveProject(null)}
        isEditable={false}
        theme="dark"
      />

      {/* ─── 7. BOOKING INQUIRY MODAL ─── */}
      <BookingInquiryModal
        isOpen={isInquiryModalOpen}
        onClose={() => setIsInquiryModalOpen(false)}
        studioName={data.studioName}
        artistName={data.artistName}
        accentColor={accentColor}
        onSubmit={async (payload) => {
          return handleInquirySubmit(payload as any);
        }}
      />
    </div>
  );
};
