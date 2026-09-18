import React, { useState } from 'react';
import type { PortfolioTemplateProps } from './PortfolioTemplateRegistry';
import type { PortfolioProject } from '../../../types/portfolio';
import {
  Camera,
  Film,
  Sparkles,
  MapPin,
  Calendar,
  Mail,
  Phone,
  ArrowRight,
  ArrowUpRight,
  Send,
  CheckCircle2,
  SlidersHorizontal,
  Layers,
  Clock,
  Eye,
  X,
} from 'lucide-react';

export const DarkroomAtelierTemplate: React.FC<PortfolioTemplateProps> = ({
  config,
  onInquirySubmit,
  isPreview = false,
}) => {
  const [activeProjectIndex, setActiveProjectIndex] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Contact form
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

  const activeProject = config.featuredWorks[activeProjectIndex] || config.featuredWorks[0];

  const filteredProjects = selectedCategory === 'all'
    ? config.featuredWorks
    : config.featuredWorks.filter((p: PortfolioProject) => p.category === selectedCategory);

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
    <div className="min-h-screen bg-[#07080b] text-[#edece8] font-sans selection:bg-amber-400 selection:text-black overflow-x-hidden">
      {/* ─── 1. MINIMAL ATELIER HEADER ─── */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#07080b]/90 backdrop-blur-xl border-b border-neutral-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-amber-500/40 flex items-center justify-center font-mono font-bold text-amber-400 text-xs">
              DK
            </div>
            <div>
              <span className="text-sm sm:text-base font-mono font-bold tracking-wider uppercase text-white block">
                {config.studioName}
              </span>
              <span className="text-[10px] text-neutral-400 font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                <span>DARKROOM NOIR • ATELIER</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-neutral-400">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{config.location}</span>
            </div>

            <button
              onClick={() => setIsDrawerOpen(true)}
              className="px-4 sm:px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-mono font-bold text-xs uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <span>Dispatch Note</span>
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </header>

      {/* ─── 2. CINEMATIC HERO & FILM WORK BENCH ─── */}
      <section className="pt-24 sm:pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        {/* Atmosphere Banner */}
        <div className="relative rounded-3xl overflow-hidden border border-neutral-800/90 bg-[#0e1017] p-6 sm:p-12 shadow-2xl min-h-[480px] sm:min-h-[580px] flex flex-col justify-between group">
          {/* Active Work Background */}
          <div className="absolute inset-0 z-0">
            <img
              src={activeProject?.coverUrl || config.bannerUrl}
              alt={activeProject?.title}
              className="w-full h-full object-cover object-center opacity-40 group-hover:opacity-50 transition-opacity duration-1000 scale-100 group-hover:scale-105 transition-transform"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07080b] via-[#07080b]/70 to-transparent" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* Top Stamp Bar */}
          <div className="relative z-10 flex items-center justify-between text-xs font-mono text-neutral-400 border-b border-white/10 pb-4">
            <span className="flex items-center gap-2">
              <Film className="w-4 h-4 text-amber-400" />
              <span>FRAME NO. {(activeProjectIndex + 1).toString().padStart(2, '0')} / {config.featuredWorks.length.toString().padStart(2, '0')}</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold uppercase tracking-wider text-[10px]">
              {activeProject?.category}
            </span>
          </div>

          {/* Center Title & Description */}
          <div className="relative z-10 max-w-3xl space-y-4 my-auto py-8">
            <span className="text-xs font-mono text-amber-400 uppercase tracking-widest flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5" />
              <span>{activeProject?.location} • {activeProject?.year}</span>
            </span>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-white tracking-tight leading-tight">
              {activeProject?.title}
            </h1>
            <p className="text-xs sm:text-base text-neutral-300 font-light max-w-xl leading-relaxed">
              {activeProject?.description}
            </p>
          </div>

          {/* Bottom Film Strip Thumbnails Controller */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
              Selected Frames ({config.featuredWorks.length})
            </span>

            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
              {config.featuredWorks.map((proj: PortfolioProject, idx: number) => (
                <button
                  key={proj.id}
                  onClick={() => setActiveProjectIndex(idx)}
                  className={`relative shrink-0 w-16 h-12 sm:w-20 sm:h-14 rounded-xl overflow-hidden border transition-all cursor-pointer ${
                    activeProjectIndex === idx
                      ? 'border-amber-400 ring-2 ring-amber-400/30 scale-105'
                      : 'border-neutral-700 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={proj.coverUrl} alt={proj.title} className="w-full h-full object-cover" />
                  <span className="absolute bottom-0.5 right-1 text-[9px] font-mono text-white bg-black/70 px-1 rounded">
                    {idx + 1}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. DARKROOM MANIFESTO & ARTIST BIO ─── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-neutral-800/80">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
          <div className="md:col-span-4">
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl group">
              <img
                src={config.avatarUrl}
                alt={config.artistName}
                className="w-full h-full object-cover grayscale contrast-125 group-hover:grayscale-0 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="text-[10px] font-mono uppercase text-amber-400 tracking-widest block">
                  Author & Master Colorist
                </span>
                <span className="text-base font-bold font-serif text-white">{config.artistName}</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-8 space-y-6">
            <div className="inline-flex items-center gap-2 text-amber-400 font-mono text-xs uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              <span>The Atelier Manifesto</span>
            </div>

            <p className="text-2xl sm:text-3xl font-serif text-white leading-relaxed italic">
              {config.philosophyQuote}
            </p>

            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed font-normal">
              {config.aboutStory}
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-6 text-xs font-mono text-neutral-400 border-t border-neutral-800">
              <div>
                <span className="text-white font-bold block text-lg font-mono">1/1</span>
                <span>Bespoke Edition</span>
              </div>
              <div>
                <span className="text-amber-400 font-bold block text-lg font-mono">{config.pricingStartingAt}</span>
                <span>Starting Investment</span>
              </div>
              <div>
                <span className="text-white font-bold block text-lg font-mono">Worldwide</span>
                <span>Destination Logistics</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. FULL INVENTORY FILM GRID ─── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-neutral-800/80 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono text-amber-400 uppercase tracking-widest block mb-1">
              Contact Sheets
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">
              The Complete Works Archive
            </h2>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {['all', 'weddings', 'editorial', 'commercial', 'pre-wedding'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl font-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-amber-400 text-neutral-950 font-bold'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((proj: PortfolioProject, idx: number) => (
            <div
              key={proj.id}
              onClick={() => {
                const i = config.featuredWorks.findIndex((p: PortfolioProject) => p.id === proj.id);
                if (i !== -1) setActiveProjectIndex(i);
                window.scrollTo({ top: 100, behavior: 'smooth' });
              }}
              className="group cursor-pointer rounded-2xl overflow-hidden bg-[#0e1017] border border-neutral-800 hover:border-amber-500/50 p-3 space-y-3 transition-all hover:-translate-y-1 shadow-lg"
            >
              <div className="relative aspect-[16/10] rounded-xl overflow-hidden">
                <img
                  src={proj.coverUrl}
                  alt={proj.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 text-[10px] font-mono text-amber-400">
                  REF #{(idx + 1).toString().padStart(2, '0')}
                </div>
              </div>

              <div className="px-1 flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block">
                    {proj.category} • {proj.year}
                  </span>
                  <h3 className="text-sm font-serif font-bold text-white group-hover:text-amber-400 transition-colors">
                    {proj.title}
                  </h3>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-amber-400 transition-colors shrink-0 mt-1" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 5. FOOTER ─── */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-neutral-800 text-xs font-mono text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>{config.studioName} © 2026 • DARKROOM EDITION</span>
          <div className="flex items-center gap-6">
            <a href={`mailto:${config.contactEmail}`} className="hover:text-amber-400 transition-colors">
              {config.contactEmail}
            </a>
            <button onClick={() => setIsDrawerOpen(true)} className="text-amber-400 font-bold hover:underline cursor-pointer">
              Book Dates →
            </button>
          </div>
        </div>
      </footer>

      {/* ─── 6. INTERACTIVE CONTACT SHEET DRAWER ─── */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end animate-in fade-in">
          <div className="w-full max-w-xl bg-[#0c0d12] border-l border-neutral-800 p-6 sm:p-10 h-full overflow-y-auto space-y-6 animate-in slide-in-from-right duration-300 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 block">
                    Darkroom Dispatch
                  </span>
                  <h3 className="text-xl font-serif font-bold text-white">
                    Request Studio Booking
                  </h3>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isSuccess ? (
                <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h4 className="text-base font-bold text-white">Dispatched to Darkroom</h4>
                  <p className="text-xs text-neutral-400">
                    We will review your shoot requirements and reply with a tailored treatment.
                  </p>
                  <button
                    onClick={() => {
                      setIsSuccess(false);
                      setIsDrawerOpen(false);
                    }}
                    className="text-xs font-mono text-amber-400 hover:underline cursor-pointer"
                  >
                    Close Drawer
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
                  <div>
                    <label className="block text-neutral-400 mb-1">CLIENT NAME / COUPLE</label>
                    <input
                      type="text"
                      required
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      placeholder="Ananya Sharma & Kabir Roy"
                      className="w-full p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1">EMAIL ADDRESS</label>
                    <input
                      type="email"
                      required
                      value={formData.clientEmail}
                      onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                      placeholder="client@atelier.com"
                      className="w-full p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-neutral-400 mb-1">PHONE NUMBER</label>
                      <input
                        type="tel"
                        value={formData.clientPhone}
                        onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                        placeholder="+91 ..."
                        className="w-full p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-400 mb-1">SHOOT DATE</label>
                      <input
                        type="date"
                        value={formData.eventDate}
                        onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                        className="w-full p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1">NOTES / VISION</label>
                    <textarea
                      rows={4}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Venue location, desired aesthetic, and coverage expectations..."
                      className="w-full p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-amber-400 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'DISPATCHING...' : 'TRANSMIT INQUIRY'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
