import React, { useState, useMemo } from 'react';
import type { PortfolioTemplateProps } from './PortfolioTemplateRegistry';
import type { PortfolioProject } from '../../../types/portfolio';
import {
  Sparkles,
  MapPin,
  Calendar,
  Mail,
  Phone,
  ArrowRight,
  Heart,
  CheckCircle2,
  Send,
  ExternalLink,
  ChevronDown,
  Award,
  Film,
  Camera,
  Layers,
  MessageCircle,
  Clock,
  Globe,
  Sliders,
} from 'lucide-react';

const InstagramIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export const EditorialVogueTemplate: React.FC<PortfolioTemplateProps> = ({
  config,
  onInquirySubmit,
  isPreview = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeProjectModal, setActiveProjectModal] = useState<PortfolioProject | null>(null);

  // Inquiry form state
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    eventDate: '',
    eventType: 'wedding',
    location: '',
    estimatedBudget: '₹4,50,000 - ₹6,00,000',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const filteredProjects = useMemo(() => {
    if (selectedCategory === 'all') return config.featuredWorks;
    return config.featuredWorks.filter((p: PortfolioProject) => p.category === selectedCategory);
  }, [config.featuredWorks, selectedCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName || !formData.clientEmail || !formData.message) return;

    setIsSubmitting(true);
    try {
      if (onInquirySubmit) {
        await onInquirySubmit(formData);
      }
      setIsSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] dark:bg-[#0c0d12] text-neutral-900 dark:text-neutral-100 font-sans transition-colors duration-300 select-none selection:bg-amber-400 selection:text-neutral-950">
      {/* ─── 1. LUXURY TOP NAVIGATION ─── */}
      <header className="sticky top-0 z-40 bg-[#faf8f5]/85 dark:bg-[#0c0d12]/85 backdrop-blur-md border-b border-neutral-200/70 dark:border-neutral-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-amber-400/20 dark:bg-amber-400/10 border border-amber-400/40 text-amber-600 dark:text-amber-400 font-serif font-bold text-sm flex items-center justify-center">
              {config.artistName.charAt(0)}
            </span>
            <div>
              <span className="text-base sm:text-lg font-serif font-bold tracking-tight block text-neutral-950 dark:text-white">
                {config.studioName}
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-500 dark:text-neutral-400">
                Editorial & Fine-Art
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
            <a href="#works" className="hover:text-amber-500 transition-colors">Works</a>
            <a href="#philosophy" className="hover:text-amber-500 transition-colors">Philosophy</a>
            <a href="#about" className="hover:text-amber-500 transition-colors">About</a>
            <a href="#contact" className="hover:text-amber-500 transition-colors">Inquire</a>
          </nav>

          <div className="flex items-center gap-3">
            {config.isBookingOpen && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-mono font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>2026/27 Commissions Open</span>
              </span>
            )}
            <a
              href="#contact"
              className="px-4 py-2 rounded-full bg-neutral-950 dark:bg-amber-400 text-white dark:text-neutral-950 font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all shadow-sm cursor-pointer"
            >
              Book Date
            </a>
          </div>
        </div>
      </header>

      {/* ─── 2. EDITORIAL MAGAZINE HERO BANNER ─── */}
      <section className="relative min-h-[70vh] sm:min-h-[85vh] flex items-end justify-start overflow-hidden border-b border-neutral-200/80 dark:border-neutral-800">
        {/* Full-bleed banner visual */}
        <div className="absolute inset-0 z-0">
          <img
            src={config.bannerUrl}
            alt={config.studioName}
            className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000 ease-out"
          />
          {/* Magazine Gradient Scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent dark:from-[#0c0d12] dark:via-[#0c0d12]/60 dark:to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 w-full text-white">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 font-mono text-xs uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{config.location}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-serif font-normal tracking-tight text-white leading-[1.05]">
              {config.artistName}
            </h1>

            <p className="text-base sm:text-xl text-neutral-200 font-light max-w-2xl leading-relaxed">
              {config.tagline}
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <a
                href="#works"
                className="px-6 py-3 rounded-full bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-xl"
              >
                <span>Explore Works</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href="#contact"
                className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-semibold text-xs uppercase tracking-widest transition-all"
              >
                Inquire Commission
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. EDITORIAL PHILOSOPHY & STATEMENT ─── */}
      <section id="philosophy" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-neutral-200/80 dark:border-neutral-800">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-5 relative">
            <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border border-neutral-200/80 dark:border-neutral-800 relative">
              <img
                src={config.avatarUrl}
                alt={config.artistName}
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 block mb-1">
                  Creative Director
                </span>
                <span className="text-lg font-serif font-bold block">{config.artistName}</span>
                <span className="text-xs text-neutral-300 font-light">{config.location}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 text-amber-600 dark:text-amber-400 font-mono text-xs uppercase tracking-widest font-bold">
              <span className="w-6 h-[1px] bg-amber-500" />
              <span>Artistic Philosophy</span>
            </div>

            <blockquote className="text-2xl sm:text-3xl lg:text-4xl font-serif font-normal italic text-neutral-900 dark:text-white leading-snug">
              {config.philosophyQuote}
            </blockquote>

            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal">
              {config.bio}
            </p>

            <div className="pt-2 grid grid-cols-3 gap-4 border-t border-neutral-200 dark:border-neutral-800 text-center sm:text-left">
              <div>
                <span className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900 dark:text-white block font-mono">
                  8+
                </span>
                <span className="text-xs text-neutral-500 font-medium">Years Curating</span>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900 dark:text-white block font-mono">
                  180+
                </span>
                <span className="text-xs text-neutral-500 font-medium">Couples Documented</span>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-serif font-bold text-amber-500 block font-mono">
                  14
                </span>
                <span className="text-xs text-neutral-500 font-medium">Countries Traveled</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. CURATED WORKS SHOWCASE (MASONRY) ─── */}
      <section id="works" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-neutral-200/80 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto space-y-10">
          {/* Header & Category Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="text-xs uppercase font-mono tracking-widest text-amber-600 dark:text-amber-400 font-bold block mb-2">
                Selected Portfolio
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-neutral-900 dark:text-white">
                Curated Works & Stories
              </h2>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'all', label: 'All Works' },
                { id: 'weddings', label: 'Weddings' },
                { id: 'editorial', label: 'Editorial' },
                { id: 'pre-wedding', label: 'Pre-Wedding' },
                { id: 'commercial', label: 'Commercial' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === tab.id
                      ? 'bg-neutral-950 dark:bg-amber-400 text-white dark:text-neutral-950 shadow-md font-bold'
                      : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white border border-neutral-200 dark:border-neutral-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Masonry / Grid of Projects */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredProjects.map((project: PortfolioProject, idx: number) => (
              <div
                key={project.id}
                onClick={() => setActiveProjectModal(project)}
                className="group cursor-pointer rounded-3xl overflow-hidden bg-white dark:bg-[#13141b] border border-neutral-200/80 dark:border-neutral-800 shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img
                    src={project.coverUrl}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                  {/* Top Badge */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/25 text-white font-mono text-[10px] uppercase font-bold tracking-wider">
                      {project.category}
                    </span>
                    <span className="text-[11px] font-mono text-white/80 font-bold">
                      {project.year}
                    </span>
                  </div>

                  {/* Bottom Info on Image */}
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="text-[11px] font-mono text-amber-400 uppercase tracking-widest block mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{project.location}</span>
                    </span>
                    <h3 className="text-lg font-serif font-bold tracking-tight leading-snug">
                      {project.title}
                    </h3>
                  </div>
                </div>

                <div className="p-4 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 border-t border-neutral-100 dark:border-neutral-800/80">
                  <span>{project.mediaCount || 48} Photos Curated</span>
                  <span className="text-amber-600 dark:text-amber-400 font-semibold group-hover:underline flex items-center gap-1">
                    <span>Inspect Series</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 5. BESPOKE INQUIRY & BOOKING SECTION ─── */}
      <section id="contact" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto rounded-3xl p-6 sm:p-12 bg-white dark:bg-[#13141b] border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs uppercase font-mono tracking-widest text-amber-600 dark:text-amber-400 font-bold block">
              Commissions & Bookings
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-neutral-900 dark:text-white tracking-tight">
              Begin Your Visual Legacy
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              Tell us about your wedding, editorial campaign, or worldwide destination shoot.
            </p>
          </div>

          {isSuccess ? (
            <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3 animate-in fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-neutral-950 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                Inquiry Successfully Dispatched
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
                Thank you for reaching out to {config.studioName}. Our team will review your dates and respond within 24 hours.
              </p>
              <button
                onClick={() => setIsSuccess(false)}
                className="mt-2 text-xs font-semibold text-amber-500 hover:underline cursor-pointer"
              >
                Send Another Note
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 block mb-1">
                    Your Name / Couple
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    placeholder="Ananya & Kabir"
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    placeholder="ananya@example.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 block mb-1">
                    Phone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={formData.clientPhone}
                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                    placeholder="+91 98201 44521"
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 block mb-1">
                    Event Date
                  </label>
                  <input
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 block mb-1">
                    Event Category
                  </label>
                  <select
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-amber-400 transition-colors cursor-pointer"
                  >
                    <option value="wedding">Wedding (2-3 Days)</option>
                    <option value="pre-wedding">Pre-Wedding Shoot</option>
                    <option value="editorial">Fashion / Editorial</option>
                    <option value="commercial">Commercial / Brand</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 block mb-1">
                  Vision & Message
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us about your venue, the vision for your documentary film, and any specific moments you hold dear..."
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-amber-400 transition-colors resize-none"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <span className="text-xs text-neutral-500 font-mono">
                  Starting at: <strong className="text-neutral-900 dark:text-white">{config.pricingStartingAt}</strong>
                </span>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 rounded-xl bg-neutral-950 dark:bg-amber-400 hover:bg-neutral-800 dark:hover:bg-amber-300 text-white dark:text-neutral-950 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Sending...' : 'Submit Inquiry'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* ─── 6. FOOTER ─── */}
      <footer className="py-12 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-neutral-900 dark:text-white">{config.studioName}</span>
            <span>•</span>
            <span>{config.location}</span>
          </div>

          <div className="flex items-center gap-4">
            {config.instagramHandle && (
              <a href={`https://instagram.com/${config.instagramHandle.replace('@', '')}`} target="_blank" rel="noreferrer" className="hover:text-amber-500 transition-colors">
                <InstagramIcon className="w-4 h-4" />
              </a>
            )}
            <a href={`mailto:${config.contactEmail}`} className="hover:text-amber-500 transition-colors flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" />
              <span>{config.contactEmail}</span>
            </a>
          </div>
        </div>
      </footer>

      {/* Project Lightbox Modal */}
      {activeProjectModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="max-w-3xl w-full bg-white dark:bg-[#13141b] rounded-3xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-2xl">
            <div className="relative aspect-video">
              <img src={activeProjectModal.coverUrl} alt={activeProjectModal.title} className="w-full h-full object-cover" />
              <button
                onClick={() => setActiveProjectModal(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-amber-500">{activeProjectModal.category} • {activeProjectModal.year}</span>
                <span className="text-xs text-neutral-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {activeProjectModal.location}
                </span>
              </div>
              <h3 className="text-2xl font-serif font-bold text-neutral-900 dark:text-white">{activeProjectModal.title}</h3>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">{activeProjectModal.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
