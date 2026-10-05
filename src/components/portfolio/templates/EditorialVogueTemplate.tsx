import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { PortfolioTemplateProps } from './PortfolioTemplateRegistry';
import type { PortfolioProject } from '../../../types/portfolio';
import { EditableText, EditableImage, ProjectEditModal } from '../inline';
import {
  Sparkles,
  MapPin,
  Mail,
  Phone,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Send,
  Plus,
  Trash2,
  X,
  Loader2,
  Edit3,
  ChevronDown,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All Collections' },
  { id: 'weddings', label: 'Weddings' },
  { id: 'editorial', label: 'Editorial' },
  { id: 'pre-wedding', label: 'Pre-Wedding' },
  { id: 'commercial', label: 'Commercial' },
  { id: 'portrait', label: 'Portraits' },
];

export const EditorialVogueTemplate: React.FC<PortfolioTemplateProps> = ({
  config,
  onInquirySubmit,
  isEditable = false,
  onUpdateConfig,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeProjectModal, setActiveProjectModal] = useState<PortfolioProject | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // In-place project editing state
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // In-place update helper
  const handleUpdate = <K extends keyof typeof config>(field: K, value: (typeof config)[K]) => {
    if (onUpdateConfig) {
      onUpdateConfig({ [field]: value });
    }
  };

  // In-place project saving
  const handleSaveProject = (savedProject: PortfolioProject) => {
    const existingIndex = config.featuredWorks.findIndex((p) => p.id === savedProject.id);
    let nextWorks: PortfolioProject[];

    if (existingIndex !== -1) {
      nextWorks = [...config.featuredWorks];
      nextWorks[existingIndex] = savedProject;
    } else {
      nextWorks = [savedProject, ...config.featuredWorks];
    }

    handleUpdate('featuredWorks', nextWorks);
  };

  // In-place project delete
  const handleDeleteProject = (projectId: string) => {
    const nextWorks = config.featuredWorks.filter((p) => p.id !== projectId);
    handleUpdate('featuredWorks', nextWorks);
  };

  return (
    <div className="relative min-h-screen bg-[#faf9f5] dark:bg-[#0b0c0e] text-[#1c1a17] dark:text-[#f4f3ef] font-sans selection:bg-amber-400 selection:text-neutral-950 transition-colors duration-500 overflow-x-hidden">
      {/* ─── LIVE EDIT MODE FLOATING BANNER ─── */}
      {isEditable && (
        <aside
          aria-label="Editor controls"
          className="fixed bottom-6 right-6 z-40 bg-neutral-950/95 text-white backdrop-blur-xl border border-amber-400/50 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom duration-300"
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
              Live In-Place Edit Mode
            </span>
          </div>
          <span className="text-neutral-400 text-xs hidden sm:inline">• Click any title, story, or photo to edit</span>
        </aside>
      )}

      {/* ─── EDITORIAL MASTHEAD NAVIGATION ─── */}
      <header
        className={`fixed top-0 left-0 right-0 z-30 transition-all duration-500 ${
          isScrolled
            ? 'bg-[#faf9f5]/90 dark:bg-[#0b0c0e]/90 backdrop-blur-xl border-b border-neutral-200/80 dark:border-neutral-800/80 py-3.5 shadow-sm'
            : 'bg-gradient-to-b from-black/60 via-black/20 to-transparent py-5 text-white'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Masthead Monogram & Issue Tag */}
          <div className="flex items-center gap-3">
            <a
              href="#hero"
              className="group flex items-baseline gap-2 font-serif text-lg sm:text-xl font-bold tracking-tight"
            >
              <EditableText
                value={config.studioName}
                onSave={(val) => handleUpdate('studioName', val)}
                isEditable={isEditable}
                label="Studio Name"
                className="font-serif tracking-tight"
              />
            </a>
            <span
              className={`text-[9px] font-mono uppercase tracking-[0.25em] px-2 py-0.5 rounded-full border ${
                isScrolled
                  ? 'border-neutral-300 dark:border-neutral-800 text-neutral-500'
                  : 'border-white/30 text-white/80'
              } hidden sm:inline-block`}
            >
              VOL. 26 • L'ÉDITION
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-6 text-xs uppercase tracking-[0.2em] font-mono">
            <a
              href="#works"
              className={`transition-colors hover:text-amber-500 ${
                isScrolled ? 'text-neutral-600 dark:text-neutral-300' : 'text-white/80 hover:text-white'
              }`}
            >
              Collections
            </a>
            <a
              href="#philosophy"
              className={`transition-colors hover:text-amber-500 ${
                isScrolled ? 'text-neutral-600 dark:text-neutral-300' : 'text-white/80 hover:text-white'
              }`}
            >
              Atelier
            </a>
            <a
              href="#inquire"
              className="px-3.5 py-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold transition-transform hover:scale-105 active:scale-95 shadow-sm"
            >
              Inquire
            </a>
          </nav>
        </div>
      </header>

      {/* ─── HERO: HIGH-FASHION COVER SPREAD ─── */}
      <section id="hero" className="relative min-h-[92vh] sm:min-h-screen flex items-end justify-start overflow-hidden pt-24 pb-12 sm:pb-20">
        {/* Parallax Hero Background Image */}
        <div className="absolute inset-0 z-0">
          <EditableImage
            src={config.bannerUrl}
            alt={config.studioName}
            onSave={(url) => handleUpdate('bannerUrl', url)}
            isEditable={isEditable}
            label="Hero Cover Photo"
            className="w-full h-full object-cover object-center filter brightness-[0.82] contrast-[1.05]"
            containerClassName="w-full h-full"
          />
          {/* Subtle Editorial Vignette & Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/20 pointer-events-none" />
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/10 to-black/60 pointer-events-none" />
        </div>

        {/* Hero Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-4xl space-y-4"
          >
            {/* Dateline & Issue Meta */}
            <div className="flex flex-wrap items-center gap-2.5 text-[11px] sm:text-xs font-mono uppercase tracking-[0.25em] text-amber-400 font-semibold">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <EditableText
                  value={config.location}
                  onSave={(val) => handleUpdate('location', val)}
                  isEditable={isEditable}
                  label="Location"
                />
              </span>
              <span>•</span>
              <span>SPECIAL ISSUE 2026/27</span>
              {config.isBookingOpen && (
                <>
                  <span>•</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                    RESERVING DATES
                  </span>
                </>
              )}
            </div>

            {/* Huge Vogue-Style Editorial Headline */}
            <h1 className="font-serif text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-[0.92] text-white">
              <EditableText
                value={config.studioName}
                onSave={(val) => handleUpdate('studioName', val)}
                isEditable={isEditable}
                label="Headline / Studio Name"
                className="font-serif italic font-normal"
              />
            </h1>

            {/* Tagline / Subtitle */}
            <p className="text-sm sm:text-lg md:text-xl text-neutral-200/90 font-serif italic max-w-2xl leading-relaxed">
              "
              <EditableText
                value={config.tagline}
                onSave={(val) => handleUpdate('tagline', val)}
                isEditable={isEditable}
                label="Tagline"
                className="font-serif italic"
              />
              "
            </p>

            {/* Photographer Moniker */}
            <div className="pt-2 flex items-center gap-3 text-xs sm:text-sm font-mono tracking-wider text-neutral-300">
              <span className="uppercase text-neutral-400">Captured by</span>
              <EditableText
                value={config.artistName}
                onSave={(val) => handleUpdate('artistName', val)}
                isEditable={isEditable}
                label="Photographer Name"
                className="font-bold text-white uppercase tracking-widest border-b border-amber-400 pb-0.5"
              />
            </div>
          </motion.div>

          {/* Bottom Floating Scroll Indicator */}
          <div className="pt-10 flex items-center justify-between border-t border-white/20 mt-8 text-neutral-400 text-xs font-mono">
            <span className="uppercase tracking-[0.2em] text-[10px]">L'ÉDITION PHOTOGRAPHIQUE</span>
            <a
              href="#works"
              className="flex items-center gap-2 hover:text-amber-400 transition-colors cursor-pointer group"
            >
              <span>EXPLORE COLLECTIONS</span>
              <ChevronDown className="w-4 h-4 animate-bounce group-hover:text-amber-400" />
            </a>
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: CURATED COLLECTIONS & WORKS ─── */}
      <section id="works" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-neutral-200 dark:border-neutral-800">
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-600 dark:text-amber-400 font-bold block">
              PORTFOLIO ARCHIVE • INDEX 01
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight">
              Selected <span className="italic font-normal">Works</span>
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-serif max-w-md">
              A curated anthology of timeless celebrations, high-fashion editorials, and intimate storytelling.
            </p>
          </div>

          {/* Category Tabs & Add Work Button */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl font-mono text-[11px] uppercase tracking-wider font-semibold transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-amber-400 text-neutral-950 shadow-sm font-bold'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* In-Place Add Project Button */}
            {isEditable && (
              <button
                type="button"
                onClick={() => {
                  setEditingProject(null);
                  setIsProjectModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-2xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-transform hover:scale-105 active:scale-95 cursor-pointer ml-1"
                title="Add a new project to your portfolio"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Work</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Asymmetrical High-Fashion Masonry Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 pt-12">
          {filteredProjects.map((project, idx) => {
            // Asymmetrical layout styling for high-fashion editorial look
            const isWide = idx % 5 === 0;

            return (
              <motion.article
                key={project.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: (idx % 3) * 0.1 }}
                className={`group relative rounded-2xl overflow-hidden bg-white dark:bg-[#121316] border border-neutral-200/90 dark:border-neutral-800/80 shadow-xs hover:shadow-xl transition-all duration-500 flex flex-col ${
                  isWide ? 'md:col-span-2' : ''
                }`}
              >
                {/* Photo Container */}
                <div
                  className="relative aspect-4/3 sm:aspect-16/10 overflow-hidden cursor-pointer bg-neutral-900"
                  onClick={() => setActiveProjectModal(project)}
                >
                  <img
                    src={project.coverUrl}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

                  {/* Category Pill & Year */}
                  <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none">
                    <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-mono uppercase tracking-widest text-amber-300 font-bold border border-white/10">
                      {project.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-md text-[10px] font-mono text-white/90">
                      {project.year}
                    </span>
                  </div>

                  {/* In-Place Edit Actions (Photographer Only) */}
                  {isEditable && (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProject(project);
                          setIsProjectModalOpen(true);
                        }}
                        className="p-2 rounded-xl bg-neutral-950/90 hover:bg-amber-400 hover:text-neutral-950 text-white shadow-lg transition-colors cursor-pointer"
                        title="Edit project details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Remove "${project.title}" from your portfolio?`)) {
                            handleDeleteProject(project.id);
                          }
                        }}
                        className="p-2 rounded-xl bg-neutral-950/90 hover:bg-rose-500 text-white shadow-lg transition-colors cursor-pointer"
                        title="Remove project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Hover Inspect CTA */}
                  <div className="absolute bottom-3.5 right-3.5 px-3 py-1 rounded-full bg-white/90 dark:bg-neutral-950/90 text-neutral-950 dark:text-white text-[11px] font-mono uppercase tracking-wider font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-1 transform translate-y-1 group-hover:translate-y-0">
                    <span>Inspect</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Editorial Caption Box */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-500 uppercase tracking-wider">
                      <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                      <span className="line-clamp-1">{project.location}</span>
                      {project.clientName && (
                        <>
                          <span>•</span>
                          <span className="line-clamp-1">{project.clientName}</span>
                        </>
                      )}
                    </div>

                    <h3
                      onClick={() => setActiveProjectModal(project)}
                      className="font-serif text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors cursor-pointer line-clamp-2"
                    >
                      {project.title}
                    </h3>

                    {project.description && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed font-serif">
                        {project.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                    <span>{project.mediaCount || 24} Curated Frames</span>
                    <button
                      type="button"
                      onClick={() => setActiveProjectModal(project)}
                      className="font-semibold text-neutral-800 dark:text-neutral-200 group-hover:text-amber-500 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>View Lookbook</span>
                      <ArrowRight className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <div className="text-center py-20 rounded-3xl border-2 border-dashed border-neutral-300 dark:border-neutral-800 my-8 space-y-3">
            <Sparkles className="w-8 h-8 text-amber-400 mx-auto" />
            <h3 className="font-serif text-lg font-bold">No Projects Found in this Category</h3>
            <p className="text-xs text-neutral-400 font-mono">Select another category or add a new project to this collection.</p>
          </div>
        )}
      </section>

      {/* ─── SECTION 3: THE ATELIER & PHILOSOPHY DOUBLE SPREAD ─── */}
      <section id="philosophy" className="py-20 sm:py-28 bg-white dark:bg-[#0f1013] border-y border-neutral-200 dark:border-neutral-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left: Oversized Quotation & Philosophy Statement */}
            <div className="lg:col-span-7 space-y-6">
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-600 dark:text-amber-400 font-bold block">
                PHILOSOPHIE & VISION
              </span>

              <blockquote className="font-serif text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.15] text-neutral-900 dark:text-white">
                “
                <EditableText
                  value={config.philosophyQuote}
                  onSave={(val) => handleUpdate('philosophyQuote', val)}
                  isEditable={isEditable}
                  multiline={true}
                  label="Philosophy Quote"
                  className="font-serif italic font-normal"
                />
                ”
              </blockquote>

              <div className="flex items-center gap-3 pt-2">
                <div className="w-10 h-0.5 bg-amber-400" />
                <span className="font-mono text-xs uppercase tracking-widest text-neutral-500 dark:text-neutral-400 font-bold">
                  —{' '}
                  <EditableText
                    value={config.philosophyAuthor}
                    onSave={(val) => handleUpdate('philosophyAuthor', val)}
                    isEditable={isEditable}
                    label="Quote Author"
                    className="font-bold"
                  />
                </span>
              </div>

              {/* Bio & Story */}
              <div className="pt-4 space-y-4 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-serif max-w-xl">
                <EditableText
                  value={config.aboutStory || config.bio}
                  onSave={(val) => handleUpdate('aboutStory', val)}
                  isEditable={isEditable}
                  multiline={true}
                  label="Artist Story / Bio"
                  as="p"
                  className="leading-relaxed"
                />
              </div>

              {/* Investment Starting Pill */}
              <div className="pt-4 flex flex-wrap items-center gap-4 text-xs font-mono">
                <div className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                  <span className="text-neutral-500 uppercase mr-2">Investment from:</span>
                  <EditableText
                    value={config.pricingStartingAt}
                    onSave={(val) => handleUpdate('pricingStartingAt', val)}
                    isEditable={isEditable}
                    label="Starting Pricing"
                    className="font-bold text-amber-500 dark:text-amber-400"
                  />
                </div>
                <div className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                  <span className="text-neutral-500 uppercase mr-2">Studio Base:</span>
                  <span className="font-bold text-neutral-900 dark:text-white">{config.location}</span>
                </div>
              </div>
            </div>

            {/* Right: Framed Photographer Portrait */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="relative w-full max-w-md aspect-3/4 rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-neutral-800 bg-neutral-900">
                <EditableImage
                  src={config.avatarUrl}
                  alt={config.artistName}
                  onSave={(url) => handleUpdate('avatarUrl', url)}
                  isEditable={isEditable}
                  label="Artist Portrait"
                  className="w-full h-full object-cover filter contrast-[1.05]"
                  containerClassName="w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-amber-400 font-bold block mb-1">
                    PRIMARY ARTIST
                  </span>
                  <h4 className="font-serif text-2xl font-bold tracking-tight">
                    {config.artistName}
                  </h4>
                  <p className="text-xs text-neutral-300 font-serif italic">
                    Principal Visual Director & Founder
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 4: HAUTE COUTURE INQUIRY SALON ─── */}
      <section id="inquire" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center space-y-3 mb-12">
          <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-600 dark:text-amber-400 font-bold block">
            RESERVATION & COMMISSIONS
          </span>
          <h2 className="font-serif text-4xl sm:text-6xl font-bold tracking-tight">
            Reserve Your <span className="italic font-normal">Story</span>
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-serif max-w-lg mx-auto">
            We limit our calendar to a curated number of commissions each season to ensure bespoke attention to every story.
          </p>
        </div>

        {/* Inquiry Card Form */}
        <div className="rounded-3xl bg-white dark:bg-[#121316] border border-neutral-200 dark:border-neutral-800 shadow-xl p-6 sm:p-10 relative overflow-hidden">
          {isSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12 space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold">Commission Request Delivered</h3>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-serif max-w-md mx-auto leading-relaxed">
                Thank you for considering our atelier. We review all inquiries personally and will respond within 24 to 48 hours.
              </p>
              <button
                type="button"
                onClick={() => setIsSuccess(false)}
                className="mt-4 px-6 py-2.5 rounded-full bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider font-mono hover:bg-amber-300 transition-all cursor-pointer"
              >
                Send Another Note
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Row 1: Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-1.5">
                  <label htmlFor="client-name" className="text-[11px] font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 font-semibold block">
                    Your Full Name *
                  </label>
                  <input
                    id="client-name"
                    type="text"
                    required
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    placeholder="e.g. Alisha Mehta"
                    className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="client-email" className="text-[11px] font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 font-semibold block">
                    Email Address *
                  </label>
                  <input
                    id="client-email"
                    type="email"
                    required
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    placeholder="alisha@studio.com"
                    className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>

              {/* Row 2: Phone & Event Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-1.5">
                  <label htmlFor="client-phone" className="text-[11px] font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 font-semibold block">
                    Phone / WhatsApp
                  </label>
                  <input
                    id="client-phone"
                    type="tel"
                    value={formData.clientPhone}
                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="event-type" className="text-[11px] font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 font-semibold block">
                    Occasion / Event Type
                  </label>
                  <select
                    id="event-type"
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  >
                    <option value="wedding">Destination Wedding</option>
                    <option value="editorial">Fashion / Brand Editorial</option>
                    <option value="pre-wedding">Pre-Wedding Story</option>
                    <option value="portrait">Private Portrait Commission</option>
                    <option value="commercial">Architecture / Commercial</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Date & Destination */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-1.5">
                  <label htmlFor="event-date" className="text-[11px] font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 font-semibold block">
                    Anticipated Date
                  </label>
                  <input
                    id="event-date"
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm focus:outline-none focus:border-amber-400 transition-colors font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="event-location" className="text-[11px] font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 font-semibold block">
                    City / Venue Destination
                  </label>
                  <input
                    id="event-location"
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Udaipur, Lake Como, Mumbai"
                    className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label htmlFor="inquiry-message" className="text-[11px] font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 font-semibold block">
                  Tell Us About Your Vision *
                </label>
                <textarea
                  id="inquiry-message"
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Share details about your celebration, aesthetics, timeline, and what draws you to our work..."
                  className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm focus:outline-none focus:border-amber-400 transition-colors resize-none leading-relaxed"
                />
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-sm tracking-wide transition-all shadow-xl shadow-amber-400/20 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                ) : (
                  <>
                    <span>Submit Commission Inquiry</span>
                    <Send className="w-4 h-4 stroke-[2.2]" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Direct Studio Contacts */}
          <div className="pt-8 mt-8 border-t border-neutral-100 dark:border-neutral-800/80 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-neutral-500">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-500 shrink-0" />
              <EditableText
                value={config.contactEmail}
                onSave={(val) => handleUpdate('contactEmail', val)}
                isEditable={isEditable}
                label="Contact Email"
              />
            </div>
            {config.contactPhone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-500 shrink-0" />
                <EditableText
                  value={config.contactPhone}
                  onSave={(val) => handleUpdate('contactPhone', val)}
                  isEditable={isEditable}
                  label="Contact Phone"
                />
              </div>
            )}
            {config.instagramHandle && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-500 shrink-0 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                <span>@</span>
                <EditableText
                  value={config.instagramHandle}
                  onSave={(val) => handleUpdate('instagramHandle', val)}
                  isEditable={isEditable}
                  label="Instagram Handle"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── FOOTER: MAGAZINE COLOPHON ─── */}
      <footer className="py-12 border-t border-neutral-200 dark:border-neutral-800 text-center text-xs font-mono text-neutral-500 space-y-2">
        <p className="uppercase tracking-[0.25em]">
          © {new Date().getFullYear()} {config.studioName} • ALL RIGHTS RESERVED
        </p>
        <p className="text-[10px] text-neutral-400">
          POWERED BY EX SHARE • HIGH-FASHION EDITORIAL PORTFOLIO ENGINE
        </p>
      </footer>

      {/* ─── PROJECT LOOKBOOK LIGHTBOX MODAL ─── */}
      {activeProjectModal && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => setActiveProjectModal(null)}
        >
          <div
            className="w-full max-w-4xl rounded-3xl bg-neutral-950 border border-white/10 shadow-2xl overflow-hidden flex flex-col text-white max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Image */}
            <div className="relative aspect-16/9 bg-neutral-900 overflow-hidden">
              <img
                src={activeProjectModal.coverUrl}
                alt={activeProjectModal.title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setActiveProjectModal(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black text-white backdrop-blur-md transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-amber-400 font-mono text-xs uppercase font-bold tracking-wider">
                {activeProjectModal.category} • {activeProjectModal.year}
              </div>
            </div>

            {/* Modal Details */}
            <div className="p-6 sm:p-8 space-y-4 overflow-y-auto">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-4">
                <div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold">
                    {activeProjectModal.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>{activeProjectModal.location}</span>
                    {activeProjectModal.clientName && (
                      <>
                        <span>•</span>
                        <span>Client: {activeProjectModal.clientName}</span>
                      </>
                    )}
                  </div>
                </div>

                <span className="text-xs font-mono text-neutral-400 px-3 py-1 rounded-lg bg-neutral-900 border border-neutral-800">
                  {activeProjectModal.mediaCount || 24} High-Res Frames
                </span>
              </div>

              <p className="text-sm font-serif text-neutral-300 leading-relaxed">
                {activeProjectModal.description ||
                  'An intimate photographic visual narrative celebrating genuine emotion, tailored light, and candid luxury.'}
              </p>

              {/* Gallery Highlight Frames */}
              {activeProjectModal.highlightMedia && activeProjectModal.highlightMedia.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 font-bold block">
                    Curated Frames
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {activeProjectModal.highlightMedia.map((mediaUrl, idx) => (
                      <div key={idx} className="aspect-4/3 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800">
                        <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── IN-PLACE PROJECT EDIT MODAL ─── */}
      <ProjectEditModal
        project={editingProject}
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setEditingProject(null);
        }}
        onSave={handleSaveProject}
        onDelete={handleDeleteProject}
      />
    </div>
  );
};
