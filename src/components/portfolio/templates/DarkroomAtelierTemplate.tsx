import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PortfolioTemplateProps } from './PortfolioTemplateRegistry';
import type { PortfolioProject } from '../../../types/portfolio';
import { EditableText, EditableImage, ProjectEditModal } from '../inline';
import { EventGalleryModal } from '../EventGalleryModal';
import { WhatsAppFloatingButton } from '../WhatsAppFloatingButton';
import { usePlanQuota } from '@/hooks/usePlanQuota';
import { PlanUpgradeModal } from '@/components/billing/PlanUpgradeModal';
import { useToast } from '@/components/ui/Toast';
import { TrackPortfolioViewApi } from '@/service/portfolio/PortfolioApi';
import {
  MapPin,
  Calendar,
  Send,
  CheckCircle2,
  Plus,
  Trash2,
  Edit3,
  ArrowDown,
  Camera,
  Mail,
  Phone,
  Globe,
  Sparkles,
  ChevronUp,
  Images,
  Lock,
} from 'lucide-react';

const InstagramIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

export const DarkroomAtelierTemplate: React.FC<PortfolioTemplateProps> = ({
  config,
  photographerSlug,
  onInquirySubmit,
  isEditable = false,
  onUpdateConfig,
}) => {
  const planQuota = usePlanQuota();
  const { showToast } = useToast();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Event gallery modal (opened work)
  const [activeWorkModal, setActiveWorkModal] = useState<PortfolioProject | null>(null);

  // Project creator / editor modal
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
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const heroFileRef = useRef<HTMLInputElement | null>(null);

  // Config updater helper
  const handleUpdate = <K extends keyof typeof config>(field: K, value: (typeof config)[K]) => {
    if (onUpdateConfig) {
      onUpdateConfig({ [field]: value });
    }
  };

  // Save / Update a Project
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

    // Keep active modal updated if currently inspecting this project
    if (activeWorkModal && activeWorkModal.id === savedProject.id) {
      setActiveWorkModal(savedProject);
    }
  };

  // Delete a Project
  const handleDeleteProject = (projectId: string) => {
    const nextWorks = config.featuredWorks.filter((p) => p.id !== projectId);
    handleUpdate('featuredWorks', nextWorks);
    if (activeWorkModal && activeWorkModal.id === projectId) {
      setActiveWorkModal(null);
    }
  };

  // Handle hero background image file upload
  const handleHeroUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const res = event.target?.result as string;
        if (res) handleUpdate('bannerUrl', res);
      };
      reader.readAsDataURL(file);
    }
  };

  // Form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName || !formData.clientEmail || !formData.message) return;

    setIsSubmitting(true);
    try {
      if (onInquirySubmit) {
        await onInquirySubmit({
          ...formData,
          estimatedBudget: 'Custom',
        });
      }
      setIsSuccess(true);
      setFormData({
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        eventDate: '',
        eventType: 'wedding',
        location: '',
        message: '',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen bg-[#070709] text-neutral-100 font-sans selection:bg-amber-400 selection:text-neutral-950 overflow-x-hidden antialiased">
      {/* ─── ATMOSPHERIC AMBIENT GLOW ─── */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-amber-500/5 blur-[160px] pointer-events-none z-0" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-amber-400/5 blur-[180px] pointer-events-none z-0" />

      {/* ─── LIVE EDIT MODE FLOATING BADGE ─── */}
      {isEditable && (
        <aside
          aria-label="Editor status"
          className="fixed bottom-6 right-6 z-40 bg-neutral-950/95 text-white backdrop-blur-xl border border-amber-400/50 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom duration-300"
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
              Obsidian Noir • Live Edit Mode
            </span>
          </div>
          <span className="text-neutral-400 text-xs hidden sm:inline">
            • Click studio text, portrait, or works to edit directly
          </span>
        </aside>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1: FULL SIZE HERO BANNER
          (Studio Name + Small Description thats it)
          ═══════════════════════════════════════════════════════════════ */}
      <section
        id="hero"
        className="relative min-h-screen w-full flex items-center justify-center overflow-hidden"
      >
        {/* Full-bleed background hero image */}
        <div className="absolute inset-0 z-0">
          <img
            src={config.bannerUrl || 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1920&auto=format&fit=crop&q=85'}
            alt={config.studioName}
            className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000"
          />
          {/* Deep cinematic gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/55 to-[#070709]" />
          <div className="absolute inset-0 bg-radial from-transparent via-black/40 to-[#070709]/90" />
        </div>

        {/* Change Hero Banner Button in Edit Mode */}
        {isEditable && (
          <div className="absolute top-20 right-6 sm:right-10 z-20 flex items-center gap-2">
            <input
              ref={heroFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleHeroUpload}
            />
            <button
              type="button"
              onClick={() => heroFileRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-black/75 hover:bg-black text-amber-400 hover:text-amber-300 border border-amber-400/40 backdrop-blur-md text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-lg"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Change Hero Banner</span>
            </button>
          </div>
        )}

        {/* Hero Content: Studio Name + Small Description - Centered Vertically & Horizontally */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center flex flex-col items-center justify-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="space-y-4 max-w-4xl mx-auto"
          >
            {/* Studio Name */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-white uppercase drop-shadow-2xl">
              <EditableText
                value={config.studioName}
                onSave={(val) => handleUpdate('studioName', val)}
                isEditable={isEditable}
                label="Studio Name"
                placeholder="STUDIO NAME"
                className="bg-gradient-to-r from-white via-neutral-100 to-amber-200 bg-clip-text text-transparent"
              />
            </h1>

            {/* Small Description */}
            <div className="max-w-2xl mx-auto">
              <p className="text-sm sm:text-base md:text-lg text-neutral-300 font-light tracking-wide leading-relaxed drop-shadow-md">
                <EditableText
                  value={config.tagline}
                  onSave={(val) => handleUpdate('tagline', val)}
                  isEditable={isEditable}
                  multiline
                  label="Description"
                  placeholder="A short description of your visual storytelling..."
                  className="text-neutral-300"
                />
              </p>
            </div>
          </motion.div>
        </div>

        {/* Smooth Scroll Down Indicator - Anchored at the Bottom of Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 z-20"
        >
          <button
            type="button"
            onClick={() => scrollToSection('about')}
            className="group flex flex-col items-center gap-2 text-neutral-400 hover:text-amber-400 transition-colors cursor-pointer"
            aria-label="Scroll to about section"
          >
            <span className="text-[11px] font-mono tracking-widest uppercase">
              Explore
            </span>
            <div className="w-8 h-8 rounded-full border border-white/15 group-hover:border-amber-400/60 bg-black/40 backdrop-blur-sm flex items-center justify-center transition-all group-hover:scale-105 shadow-lg">
              <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
            </div>
          </button>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2: SMALL ABOUT SECTION WITH AN IMAGE
          ═══════════════════════════════════════════════════════════════ */}
      <section id="about" className="relative py-10 sm:py-14 px-6 max-w-6xl mx-auto">
        <div className="relative rounded-3xl bg-neutral-900/60 border border-white/10 backdrop-blur-xl p-6 sm:p-10 lg:p-12 shadow-2xl overflow-hidden">
          {/* Subtle amber corner glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* About Portrait Image */}
            <div className="md:col-span-5 flex justify-center">
              <div className="relative group w-full max-w-xs aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-neutral-950">
                <EditableImage
                  src={config.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80'}
                  alt={config.artistName}
                  onSave={(newUrl) => handleUpdate('avatarUrl', newUrl)}
                  isEditable={isEditable}
                  label="About Portrait"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-3 right-3 text-center pointer-events-none">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
                    Creative Director
                  </span>
                </div>
              </div>
            </div>

            {/* About Narrative */}
            <div className="md:col-span-7 space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>About The Studio</span>
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
                  <EditableText
                    value={config.artistName}
                    onSave={(val) => handleUpdate('artistName', val)}
                    isEditable={isEditable}
                    label="Artist Name"
                    placeholder="Artist Name"
                  />
                </h2>
              </div>

              <div className="space-y-4 text-neutral-300 text-sm sm:text-base leading-relaxed">
                <p>
                  <EditableText
                    value={config.aboutStory || config.bio}
                    onSave={(val) => handleUpdate('aboutStory', val)}
                    isEditable={isEditable}
                    multiline
                    label="About Story"
                    placeholder="Tell your story, approach, and philosophy..."
                  />
                </p>
              </div>

              {/* Location badge & Contact chip */}
              <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-mono">
                <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-1.5 text-neutral-300">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <EditableText
                    value={config.location}
                    onSave={(val) => handleUpdate('location', val)}
                    isEditable={isEditable}
                    label="Location"
                    placeholder="Studio Location"
                  />
                </div>
                {config.contactEmail && (
                  <a
                    href={`mailto:${config.contactEmail}`}
                    className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-amber-400/40 flex items-center gap-1.5 text-neutral-300 hover:text-white transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-amber-400" />
                    <span>{config.contactEmail}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 3: WORKS SECTION
          (Upload works: title, location, photo; click opens event photos)
          ═══════════════════════════════════════════════════════════════ */}
      <section id="works" className="relative py-10 sm:py-14 px-6 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8 border-b border-white/10 pb-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold flex items-center gap-1.5 mb-2">
              <Images className="w-3.5 h-3.5" />
              <span>Portfolio Collection</span>
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Selected Works
            </h2>
            <p className="text-neutral-400 text-xs sm:text-sm mt-1">
              Click any project to view event photos and behind-the-scenes moments
            </p>
          </div>

          {/* Add New Work Button in Edit Mode */}
          {isEditable && (
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] font-mono px-3 py-1.5 rounded-full bg-neutral-900 border border-white/10 text-neutral-300 font-semibold hidden sm:inline">
                {planQuota.isUnlimitedPortfolio
                  ? 'Unlimited Works'
                  : `${config.featuredWorks.length} / ${planQuota.maxPortfolioPosts} Works`}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (
                    !planQuota.isUnlimitedPortfolio &&
                    planQuota.maxPortfolioPosts > 0 &&
                    config.featuredWorks.length >= planQuota.maxPortfolioPosts
                  ) {
                    showToast(
                      'Work Limit Reached',
                      `Your current plan allows up to ${planQuota.maxPortfolioPosts} showcase works. Upgrade to add more works.`,
                      'error'
                    );
                    setIsUpgradeModalOpen(true);
                    return;
                  }
                  setEditingProject(null);
                  setIsProjectModalOpen(true);
                }}
                className="px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs tracking-wide uppercase flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add New Work</span>
              </button>
            </div>
          )}
        </div>

        {/* Works Grid or Atmospheric Studio Empty State */}
        {config.featuredWorks.length === 0 ? (
          <div className="py-16 sm:py-24 px-6 rounded-3xl bg-[#0c0d12]/60 border border-dashed border-white/10 text-center max-w-2xl mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-400/5">
              <Images className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-serif font-bold text-white tracking-wide">
                {isEditable ? 'No Showcase Projects Published' : 'Showcase Archive Coming Soon'}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
                {isEditable
                  ? 'Add your curated client galleries, ceremonies, and commissioned assignments to showcase your work.'
                  : 'The atelier has not published any public exhibitions yet. Please check back shortly.'}
              </p>
            </div>
            {isEditable && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingProject(null);
                    setIsProjectModalOpen(true);
                  }}
                  className="px-6 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Publish First Project</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {config.featuredWorks.map((work) => {
            const photoCount = work.highlightMedia?.length || work.mediaCount || 1;
            return (
              <motion.div
                key={work.id}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.3 }}
                onClick={() => {
                  setActiveWorkModal(work);
                  if (photographerSlug) {
                    TrackPortfolioViewApi(photographerSlug, {
                      project_id: work.id,
                      project_title: work.title,
                      page_section: 'works',
                    });
                  }
                }}
                className="group relative rounded-3xl bg-[#0c0d12] border border-white/10 hover:border-amber-400/50 overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500 flex flex-col"
              >
                {/* Cover Photo */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-950">
                  <img
                    src={work.coverUrl}
                    alt={work.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                  />
                  {/* Subtle Gradient & Badge */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Photo count pill */}
                  <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-[11px] font-mono text-white flex items-center gap-1.5 shadow-md">
                    <Images className="w-3 h-3 text-amber-400" />
                    <span>{photoCount} {photoCount === 1 ? 'photo' : 'photos'}</span>
                  </div>

                  {/* Edit / Delete actions on card if in Edit Mode */}
                  {isEditable && (
                    <div
                      className="absolute top-4 left-4 flex items-center gap-1.5 z-20"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProject(work);
                          setIsProjectModalOpen(true);
                        }}
                        title="Edit Work Details"
                        className="p-2 rounded-xl bg-neutral-950/90 text-amber-400 hover:bg-neutral-900 border border-amber-400/30 transition-all cursor-pointer shadow-lg"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProject(work.id)}
                        title="Delete Work"
                        className="p-2 rounded-xl bg-neutral-950/90 text-rose-400 hover:bg-rose-950/50 border border-rose-500/30 transition-all cursor-pointer shadow-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Meta Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    {/* Location */}
                    <div className="flex items-center gap-1.5 text-amber-400 text-xs font-mono uppercase tracking-wider mb-2">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{work.location || 'Destination'}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-amber-200 transition-colors line-clamp-1">
                      {work.title}
                    </h3>
                  </div>

                  {/* Open call-to-action */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs font-mono text-neutral-400 group-hover:text-white transition-colors">
                    <span>View Event Photos</span>
                    <span className="text-amber-400 group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 4: CONTACT FORM
          ═══════════════════════════════════════════════════════════════ */}
      <section id="contact" className="relative py-10 sm:py-14 px-6 max-w-4xl mx-auto">
        <div className="rounded-3xl bg-[#0c0d12]/90 border border-white/10 backdrop-blur-2xl p-6 sm:p-10 lg:p-12 shadow-2xl space-y-6">
          <div className="text-center space-y-3">
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Inquire & Reserve Dates</span>
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Let&apos;s Create Together
            </h2>
            <p className="text-neutral-400 text-sm max-w-lg mx-auto">
              Tell us about your celebration or campaign. We will reach out within 24 hours.
            </p>
          </div>

          {isSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-amber-400/10 border border-amber-400 text-amber-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h3 className="text-xl font-bold text-white">Inquiry Received</h3>
              <p className="text-sm text-neutral-400 max-w-md mx-auto">
                Thank you! Your details have been delivered to our studio. We will contact you shortly.
              </p>
              <button
                type="button"
                onClick={() => setIsSuccess(false)}
                className="mt-4 px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono uppercase tracking-wider text-white transition-colors cursor-pointer"
              >
                Send Another Note
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Client Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    placeholder="Ananya & Kabir"
                    className="w-full px-4 py-3 rounded-2xl bg-neutral-950 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm transition-all"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    placeholder="hello@example.com"
                    className="w-full px-4 py-3 rounded-2xl bg-neutral-950 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                    Phone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={formData.clientPhone}
                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 rounded-2xl bg-neutral-950 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm transition-all"
                  />
                </div>

                {/* Event Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-neutral-950 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm transition-all"
                  />
                </div>

                {/* Event Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                    Occasion
                  </label>
                  <select
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-neutral-950 border border-white/10 text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm capitalize cursor-pointer transition-all"
                  >
                    <option value="wedding">Wedding / Ceremony</option>
                    <option value="pre-wedding">Pre-Wedding / Destination</option>
                    <option value="editorial">Fashion / Editorial</option>
                    <option value="commercial">Commercial / Architecture</option>
                    <option value="portrait">Portrait Session</option>
                    <option value="workshop">Workshop / Mentorship</option>
                  </select>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                  Event Location & Vision *
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us about the location, venue, dates, and what you are looking for..."
                  className="w-full px-4 py-3 rounded-2xl bg-neutral-950 border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm leading-relaxed resize-none transition-all"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-[0.99] text-neutral-950 font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 shadow-2xl transition-all cursor-pointer"
              >
                <Send className="w-4 h-4 stroke-[2.5]" />
                <span>{isSubmitting ? 'Sending Inquiry...' : 'Submit Inquiry'}</span>
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 5: FOOTER
          ═══════════════════════════════════════════════════════════════ */}
      <footer className="relative border-t border-white/10 bg-neutral-950 py-8 sm:py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-neutral-400">
          {/* Studio Name & Location */}
          <div className="text-center md:text-left space-y-1">
            <p className="font-bold text-white text-base tracking-tight uppercase">
              {config.studioName}
            </p>
            <p className="font-mono text-neutral-500">
              {config.location} • Fine-Art Visual Atelier
            </p>
          </div>

          {/* Social / Direct Links */}
          <div className="flex items-center gap-4">
            {config.instagramHandle && (
              <a
                href={`https://instagram.com/${config.instagramHandle.replace('@', '')}`}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-amber-400 transition-colors"
                title="Instagram"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>
            )}
            {config.contactEmail && (
              <a
                href={`mailto:${config.contactEmail}`}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-amber-400 transition-colors"
                title="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
            )}
            {config.contactPhone && (
              <a
                href={`tel:${config.contactPhone}`}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-amber-400 transition-colors"
                title="Phone"
              >
                <Phone className="w-4 h-4" />
              </a>
            )}
            {config.websiteUrl && (
              <a
                href={config.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-amber-400 transition-colors"
                title="Website"
              >
                <Globe className="w-4 h-4" />
              </a>
            )}
          </div>

          {/* Copyright & Back to Top */}
          <div className="flex items-center gap-4 text-center md:text-right">
            <span className="font-mono">
              © {new Date().getFullYear()} {config.studioName}. All Rights Reserved.
            </span>
            <button
              type="button"
              onClick={() => scrollToSection('hero')}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-amber-400 transition-colors cursor-pointer"
              title="Back to Top"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </footer>

      {/* ─── EVENT GALLERY MODAL (Work opened up with photo upload) ─── */}
      <EventGalleryModal
        project={activeWorkModal}
        isOpen={Boolean(activeWorkModal)}
        onClose={() => setActiveWorkModal(null)}
        onUpdateProject={handleSaveProject}
        isEditable={isEditable}
        theme="dark"
      />

      {/* ─── WORK CREATOR / EDITOR MODAL ─── */}
      <ProjectEditModal
        project={editingProject}
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSave={handleSaveProject}
        onDelete={handleDeleteProject}
      />

      {/* ─── PLAN UPGRADE MODAL ─── */}
      <PlanUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        errorCode="PORTFOLIO_POSTS_LIMIT_REACHED"
        lockedFeature="Portfolio Showcase Posts"
        errorMessage={`Your ${planQuota.planName} allows up to ${planQuota.maxPortfolioPosts} showcase works. Upgrade your plan to increase or unlock unlimited portfolio works.`}
      />

      {/* ─── WHATSAPP FLOATING DIRECT ACTION BUTTON & LIVE INLINE EDITOR ─── */}
      <WhatsAppFloatingButton
        config={config}
        isEditable={isEditable}
        onUpdateConfig={onUpdateConfig}
        theme="dark"
      />
    </div>
  );
};
