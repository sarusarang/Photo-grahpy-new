import React, { useState, useEffect, useMemo } from 'react';
import type { PortfolioTemplateProps } from './PortfolioTemplateRegistry';
import type { PortfolioProject } from '../../../types/portfolio';
import { CURATED_HERO_PRESETS } from '../../../services/portfolioService';
import {
  Sparkles,
  MapPin,
  Mail,
  ArrowRight,
  CheckCircle2,
  Send,
  Film,
  Edit2,
  Edit3,
  Plus,
  Trash2,
  X,
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
  isEditable = false,
  onUpdateConfig,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeProjectModal, setActiveProjectModal] = useState<PortfolioProject | null>(null);

  // Scroll detection for transparent -> frosted glass navbar
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Modals for editing sections
  const [editingModal, setEditingModal] = useState<
    'hero' | 'philosophy' | 'contact' | 'project' | null
  >(null);
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null);

  // Local form drafts for modals
  const [heroDraft, setHeroDraft] = useState({
    studioName: config.studioName,
    artistName: config.artistName,
    tagline: config.tagline,
    location: config.location,
    bannerUrl: config.bannerUrl,
  });

  const [philDraft, setPhilDraft] = useState({
    philosophyQuote: config.philosophyQuote,
    philosophyAuthor: config.philosophyAuthor,
    bio: config.bio,
    aboutStory: config.aboutStory,
    avatarUrl: config.avatarUrl,
  });

  const [contactDraft, setContactDraft] = useState({
    pricingStartingAt: config.pricingStartingAt,
    contactEmail: config.contactEmail,
    contactPhone: config.contactPhone,
    instagramHandle: config.instagramHandle,
    isBookingOpen: config.isBookingOpen,
  });

  // Keep draft states aligned when config updates
  useEffect(() => {
    setHeroDraft({
      studioName: config.studioName,
      artistName: config.artistName,
      tagline: config.tagline,
      location: config.location,
      bannerUrl: config.bannerUrl,
    });
    setPhilDraft({
      philosophyQuote: config.philosophyQuote,
      philosophyAuthor: config.philosophyAuthor,
      bio: config.bio,
      aboutStory: config.aboutStory,
      avatarUrl: config.avatarUrl,
    });
    setContactDraft({
      pricingStartingAt: config.pricingStartingAt,
      contactEmail: config.contactEmail,
      contactPhone: config.contactPhone,
      instagramHandle: config.instagramHandle,
      isBookingOpen: config.isBookingOpen,
    });
  }, [config]);

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

  // Save section helpers
  const handleSaveHero = () => {
    if (onUpdateConfig) {
      onUpdateConfig(heroDraft);
    }
    setEditingModal(null);
  };

  const handleSavePhilosophy = () => {
    if (onUpdateConfig) {
      onUpdateConfig(philDraft);
    }
    setEditingModal(null);
  };

  const handleSaveContact = () => {
    if (onUpdateConfig) {
      onUpdateConfig(contactDraft);
    }
    setEditingModal(null);
  };

  const handleSaveProject = () => {
    if (!editingProject || !onUpdateConfig) return;
    const exists = config.featuredWorks.some((p) => p.id === editingProject.id);
    let updated: PortfolioProject[];
    if (exists) {
      updated = config.featuredWorks.map((p) => (p.id === editingProject.id ? editingProject : p));
    } else {
      updated = [editingProject, ...config.featuredWorks];
    }
    onUpdateConfig({ featuredWorks: updated });
    setEditingModal(null);
    setEditingProject(null);
  };

  const handleDeleteProject = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Remove this project from your portfolio?') && onUpdateConfig) {
      const updated = config.featuredWorks.filter((p) => p.id !== projectId);
      onUpdateConfig({ featuredWorks: updated });
    }
  };

  const handleCreateNewProject = () => {
    const newProj: PortfolioProject = {
      id: `proj-${Date.now()}`,
      title: 'New Editorial Story',
      category: 'weddings',
      coverUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop&q=85',
      year: new Date().getFullYear().toString(),
      location: 'Udaipur, Rajasthan',
      description: 'A curated visual documentation capturing timeless elegance, raw emotion, and exquisite daylight moments.',
      mediaCount: 45,
      highlightMedia: [
        'https://images.unsplash.com/photo-1519741497674-611481863552?w=1000&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1000&auto=format&fit=crop&q=80',
      ],
    };
    setEditingProject(newProj);
    setEditingModal('project');
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] dark:bg-[#0a0b10] text-neutral-900 dark:text-neutral-100 font-sans transition-colors duration-300 selection:bg-amber-400 selection:text-neutral-950">
      
      {/* ─── 1. LUXURY TOP NAVIGATION (TRANSPARENT ON TOP OVER HERO) ─── */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-neutral-950/85 backdrop-blur-xl border-b border-white/10 shadow-2xl py-3.5'
            : 'bg-transparent border-b border-transparent py-5 sm:py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Clean Brand Typography (No profile pic / avatar circle) */}
          <div className="flex items-center gap-3">
            <div className="group cursor-pointer">
              <span className="text-base sm:text-xl font-serif font-bold tracking-tight block text-white drop-shadow-sm">
                {config.studioName}
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>Editorial & Fine-Art</span>
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-widest text-neutral-200">
            <a href="#works" className="hover:text-amber-400 transition-colors">Works</a>
            <a href="#philosophy" className="hover:text-amber-400 transition-colors">Philosophy</a>
            <a href="#about" className="hover:text-amber-400 transition-colors">About</a>
            <a href="#contact" className="hover:text-amber-400 transition-colors">Inquire</a>
          </nav>

          {/* Booking Button & Commissions Badge */}
          <div className="flex items-center gap-3">
            {config.isBookingOpen && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-emerald-400/30 text-emerald-300 text-[11px] font-mono font-medium shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Commissions Open</span>
              </span>
            )}
            <a
              href="#contact"
              className="px-5 py-2 rounded-full bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Book Date
            </a>
          </div>
        </div>
      </header>

      {/* ─── 2. EDITORIAL MAGAZINE HERO BANNER ─── */}
      <section className="relative min-h-[85vh] sm:min-h-[92vh] flex items-end justify-start overflow-hidden border-b border-neutral-200/80 dark:border-neutral-800/80">
        {/* Full-bleed banner visual */}
        <div className="absolute inset-0 z-0">
          <img
            src={config.bannerUrl}
            alt={config.studioName}
            className="w-full h-full object-cover object-center scale-100 transition-transform duration-1000 ease-out"
          />
          {/* Luxury Gradient Scrim: ensures transparent header text & hero content pop */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/90 dark:from-black/80 dark:via-black/40 dark:to-[#0a0b10]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* In-Place Hero Edit Trigger */}
        {isEditable && (
          <div className="absolute top-24 right-6 z-30 animate-in fade-in">
            <button
              onClick={() => setEditingModal('hero')}
              className="px-4 py-2 rounded-full bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-mono font-bold shadow-2xl flex items-center gap-2 hover:scale-105 transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Edit Hero & Cover</span>
            </button>
          </div>
        )}

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 w-full text-white">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 font-mono text-xs uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{config.location}</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-8xl font-serif font-normal tracking-tight text-white leading-[1.05] drop-shadow-md">
              {config.artistName}
            </h1>

            <p className="text-base sm:text-xl text-neutral-200 font-light max-w-2xl leading-relaxed">
              {config.tagline}
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <a
                href="#works"
                className="px-7 py-3.5 rounded-full bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-amber-500/20"
              >
                <span>Explore Works</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href="#contact"
                className="px-7 py-3.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/25 text-white font-semibold text-xs uppercase tracking-widest transition-all"
              >
                Inquire Commission
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. EDITORIAL PHILOSOPHY & STATEMENT ─── */}
      <section id="philosophy" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-neutral-200/80 dark:border-neutral-800/80 relative">
        {isEditable && (
          <div className="max-w-6xl mx-auto flex justify-end mb-4">
            <button
              onClick={() => setEditingModal('philosophy')}
              className="px-3.5 py-1.5 rounded-full bg-neutral-900 dark:bg-neutral-800 text-amber-400 border border-amber-400/30 text-xs font-mono font-bold flex items-center gap-2 hover:bg-neutral-800 transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Philosophy & Story</span>
            </button>
          </div>
        )}

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-5 relative">
            <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border border-neutral-200/80 dark:border-neutral-800 relative group">
              <img
                src={config.avatarUrl}
                alt={config.artistName}
                className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
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

            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed font-light">
              {config.aboutStory}
            </p>

            <div className="pt-4 grid grid-cols-3 gap-4 border-t border-neutral-200 dark:border-neutral-800 text-center sm:text-left">
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

      {/* ─── 4. CURATED WORKS SHOWCASE (MASONRY GRID) ─── */}
      <section id="works" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-neutral-200/80 dark:border-neutral-800/80">
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

            <div className="flex flex-wrap items-center gap-3">
              {/* Add Project Button (Editable Mode) */}
              {isEditable && (
                <button
                  onClick={handleCreateNewProject}
                  className="px-4 py-2 rounded-full bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Add Project</span>
                </button>
              )}

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
          </div>

          {/* Masonry / Grid of Projects */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredProjects.map((project: PortfolioProject) => (
              <div
                key={project.id}
                onClick={() => setActiveProjectModal(project)}
                className="group cursor-pointer rounded-3xl overflow-hidden bg-white dark:bg-[#13141b] border border-neutral-200/80 dark:border-neutral-800 shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between relative"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img
                    src={project.coverUrl}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                  {/* Top Badge & Edit/Delete Controls */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/25 text-white font-mono text-[10px] uppercase font-bold tracking-wider">
                      {project.category}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {isEditable && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingProject(project);
                              setEditingModal('project');
                            }}
                            className="p-1.5 rounded-full bg-black/60 hover:bg-amber-400 hover:text-neutral-950 text-white backdrop-blur-md transition-colors"
                            title="Edit Project"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteProject(project.id, e)}
                            className="p-1.5 rounded-full bg-black/60 hover:bg-rose-500 text-white backdrop-blur-md transition-colors"
                            title="Delete Project"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                      <span className="text-[11px] font-mono text-white/80 font-bold bg-black/40 px-2 py-0.5 rounded-full">
                        {project.year}
                      </span>
                    </div>
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
                  <span>{project.mediaCount || 48} Curated Frames</span>
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
      <section id="contact" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 relative">
        {isEditable && (
          <div className="max-w-4xl mx-auto flex justify-end mb-4">
            <button
              onClick={() => setEditingModal('contact')}
              className="px-3.5 py-1.5 rounded-full bg-neutral-900 dark:bg-neutral-800 text-amber-400 border border-amber-400/30 text-xs font-mono font-bold flex items-center gap-2 hover:bg-neutral-800 transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Pricing & Contact Details</span>
            </button>
          </div>
        )}

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
                  Starting Investment: <strong className="text-neutral-900 dark:text-white">{config.pricingStartingAt}</strong>
                </span>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3.5 rounded-xl bg-neutral-950 dark:bg-amber-400 hover:bg-neutral-800 dark:hover:bg-amber-300 text-white dark:text-neutral-950 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
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
      <footer className="py-12 border-t border-neutral-200 dark:border-neutral-800/80 text-xs text-neutral-500 dark:text-neutral-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-neutral-900 dark:text-white">{config.studioName}</span>
            <span>•</span>
            <span>{config.location}</span>
          </div>

          <div className="flex items-center gap-4">
            {config.instagramHandle && (
              <a href={`https://instagram.com/${config.instagramHandle.replace('@', '')}`} target="_blank" rel="noreferrer" className="hover:text-amber-500 transition-colors flex items-center gap-1">
                <InstagramIcon className="w-4 h-4" />
                <span>{config.instagramHandle}</span>
              </a>
            )}
            <a href={`mailto:${config.contactEmail}`} className="hover:text-amber-500 transition-colors flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" />
              <span>{config.contactEmail}</span>
            </a>
          </div>
        </div>
      </footer>

      {/* ─── PROJECT LIGHTBOX MODAL WITH MULTI-IMAGE CAROUSEL ─── */}
      {activeProjectModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="max-w-4xl w-full bg-white dark:bg-[#13141b] rounded-3xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="relative aspect-video bg-black shrink-0">
              <img src={activeProjectModal.coverUrl} alt={activeProjectModal.title} className="w-full h-full object-cover" />
              <button
                onClick={() => setActiveProjectModal(null)}
                className="absolute top-4 right-4 p-2.5 rounded-full bg-black/70 text-white hover:bg-black transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 sm:p-8 space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-amber-500 tracking-wider">
                  {activeProjectModal.category} • {activeProjectModal.year}
                </span>
                <span className="text-xs text-neutral-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {activeProjectModal.location}
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900 dark:text-white">
                {activeProjectModal.title}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                {activeProjectModal.description}
              </p>

              {activeProjectModal.highlightMedia && activeProjectModal.highlightMedia.length > 0 && (
                <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
                  <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block">
                    Series Highlights
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {activeProjectModal.highlightMedia.map((imgUrl, i) => (
                      <div key={i} className="aspect-square rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
                        <img src={imgUrl} alt={`Highlight ${i}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── LIVE EDIT MODAL: HERO & BANNER ─── */}
      {editingModal === 'hero' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="max-w-2xl w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-5 text-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <h3 className="font-serif font-bold text-lg text-white">Edit Hero & Cover Image</h3>
              </div>
              <button onClick={() => setEditingModal(null)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-neutral-400 block mb-1">STUDIO NAME</label>
                <input
                  type="text"
                  value={heroDraft.studioName}
                  onChange={(e) => setHeroDraft({ ...heroDraft, studioName: e.target.value })}
                  className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-400 block mb-1">ARTIST / DIRECTOR NAME</label>
                  <input
                    type="text"
                    value={heroDraft.artistName}
                    onChange={(e) => setHeroDraft({ ...heroDraft, artistName: e.target.value })}
                    className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1">LOCATION TAG</label>
                  <input
                    type="text"
                    value={heroDraft.location}
                    onChange={(e) => setHeroDraft({ ...heroDraft, location: e.target.value })}
                    className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">HERO TAGLINE / ELEVATOR STATEMENT</label>
                <textarea
                  rows={2}
                  value={heroDraft.tagline}
                  onChange={(e) => setHeroDraft({ ...heroDraft, tagline: e.target.value })}
                  className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">COVER IMAGE URL</label>
                <input
                  type="text"
                  value={heroDraft.bannerUrl}
                  onChange={(e) => setHeroDraft({ ...heroDraft, bannerUrl: e.target.value })}
                  className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-2">OR CHOOSE FROM CURATED FINE-ART PRESETS</label>
                <div className="grid grid-cols-3 gap-2">
                  {CURATED_HERO_PRESETS.map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setHeroDraft({ ...heroDraft, bannerUrl: preset.url })}
                      className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        heroDraft.bannerUrl === preset.url ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-neutral-700 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={preset.url} alt={preset.title} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 inset-x-0 bg-black/75 p-1 text-[9px] text-white truncate text-center">
                        {preset.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setEditingModal(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-mono hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveHero}
                className="px-6 py-2 rounded-xl bg-amber-400 text-neutral-950 text-xs font-mono font-bold hover:bg-amber-300 cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── LIVE EDIT MODAL: PHILOSOPHY & STORY ─── */}
      {editingModal === 'philosophy' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="max-w-2xl w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-5 text-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <h3 className="font-serif font-bold text-lg text-white">Edit Philosophy & Bio</h3>
              </div>
              <button onClick={() => setEditingModal(null)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-neutral-400 block mb-1">SIGNATURE PHILOSOPHY QUOTE</label>
                <textarea
                  rows={3}
                  value={philDraft.philosophyQuote}
                  onChange={(e) => setPhilDraft({ ...philDraft, philosophyQuote: e.target.value })}
                  className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">ARTISTIC BIO STATEMENT</label>
                <textarea
                  rows={3}
                  value={philDraft.bio}
                  onChange={(e) => setPhilDraft({ ...philDraft, bio: e.target.value })}
                  className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">ABOUT STUDIO STORY</label>
                <textarea
                  rows={3}
                  value={philDraft.aboutStory}
                  onChange={(e) => setPhilDraft({ ...philDraft, aboutStory: e.target.value })}
                  className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">PORTRAIT PHOTO URL</label>
                <input
                  type="text"
                  value={philDraft.avatarUrl}
                  onChange={(e) => setPhilDraft({ ...philDraft, avatarUrl: e.target.value })}
                  className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setEditingModal(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-mono hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePhilosophy}
                className="px-6 py-2 rounded-xl bg-amber-400 text-neutral-950 text-xs font-mono font-bold hover:bg-amber-300 cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── LIVE EDIT MODAL: PROJECT EDIT / ADD ─── */}
      {editingModal === 'project' && editingProject && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="max-w-xl w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-4 text-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-amber-400" />
                <h3 className="font-serif font-bold text-lg text-white">
                  {config.featuredWorks.some((p) => p.id === editingProject.id) ? 'Edit Project' : 'Add New Project'}
                </h3>
              </div>
              <button onClick={() => setEditingModal(null)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs font-mono">
              <div>
                <label className="text-neutral-400 block mb-1">PROJECT TITLE</label>
                <input
                  type="text"
                  value={editingProject.title}
                  onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                  placeholder="e.g. Royal Palace Udaipur • Ananya & Kabir"
                  className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-400 block mb-1">CATEGORY</label>
                  <select
                    value={editingProject.category}
                    onChange={(e) => setEditingProject({ ...editingProject, category: e.target.value as any })}
                    className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="weddings">Weddings</option>
                    <option value="editorial">Editorial</option>
                    <option value="pre-wedding">Pre-Wedding</option>
                    <option value="commercial">Commercial</option>
                  </select>
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1">YEAR</label>
                  <input
                    type="text"
                    value={editingProject.year}
                    onChange={(e) => setEditingProject({ ...editingProject, year: e.target.value })}
                    className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">LOCATION</label>
                <input
                  type="text"
                  value={editingProject.location}
                  onChange={(e) => setEditingProject({ ...editingProject, location: e.target.value })}
                  placeholder="Taj Lake Palace, Udaipur"
                  className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">COVER IMAGE URL</label>
                <input
                  type="text"
                  value={editingProject.coverUrl}
                  onChange={(e) => setEditingProject({ ...editingProject, coverUrl: e.target.value })}
                  className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">STORY / DESCRIPTION</label>
                <textarea
                  rows={3}
                  value={editingProject.description}
                  onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                  placeholder="Describe the mood, rituals, daylight, and styling..."
                  className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setEditingModal(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-mono hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProject}
                className="px-6 py-2 rounded-xl bg-amber-400 text-neutral-950 text-xs font-mono font-bold hover:bg-amber-300 cursor-pointer"
              >
                Save Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── LIVE EDIT MODAL: CONTACT & PRICING ─── */}
      {editingModal === 'contact' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="max-w-xl w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-4 text-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <h3 className="font-serif font-bold text-lg text-white">Edit Pricing & Contact</h3>
              </div>
              <button onClick={() => setEditingModal(null)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs font-mono">
              <div>
                <label className="text-neutral-400 block mb-1">STARTING INVESTMENT RATE</label>
                <input
                  type="text"
                  value={contactDraft.pricingStartingAt}
                  onChange={(e) => setContactDraft({ ...contactDraft, pricingStartingAt: e.target.value })}
                  placeholder="₹4,50,000 / Day"
                  className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">STUDIO CONTACT EMAIL</label>
                <input
                  type="email"
                  value={contactDraft.contactEmail}
                  onChange={(e) => setContactDraft({ ...contactDraft, contactEmail: e.target.value })}
                  className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">PHONE / WHATSAPP NUMBER</label>
                <input
                  type="tel"
                  value={contactDraft.contactPhone}
                  onChange={(e) => setContactDraft({ ...contactDraft, contactPhone: e.target.value })}
                  className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">INSTAGRAM HANDLE</label>
                <input
                  type="text"
                  value={contactDraft.instagramHandle}
                  onChange={(e) => setContactDraft({ ...contactDraft, instagramHandle: e.target.value })}
                  className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="bookingOpenCheck"
                  checked={contactDraft.isBookingOpen}
                  onChange={(e) => setContactDraft({ ...contactDraft, isBookingOpen: e.target.checked })}
                  className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                />
                <label htmlFor="bookingOpenCheck" className="text-neutral-300 cursor-pointer">
                  Show "Commissions Open" Availability Badge
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setEditingModal(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-mono hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveContact}
                className="px-6 py-2 rounded-xl bg-amber-400 text-neutral-950 text-xs font-mono font-bold hover:bg-amber-300 cursor-pointer"
              >
                Save Details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
