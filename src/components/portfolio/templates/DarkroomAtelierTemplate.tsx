import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { PortfolioTemplateProps } from './PortfolioTemplateRegistry';
import type { PortfolioProject } from '../../../types/portfolio';
import { EditableText, EditableImage, ProjectEditModal } from '../inline';
import {
  Film,
  MapPin,
  ArrowRight,
  ArrowUpRight,
  Send,
  CheckCircle2,
  Plus,
  Trash2,
  X,
  Loader2,
  Sliders,
  Mail,
  Phone,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All Frames' },
  { id: 'weddings', label: 'Weddings' },
  { id: 'editorial', label: 'Editorial' },
  { id: 'pre-wedding', label: 'Pre-Wedding' },
  { id: 'commercial', label: 'Commercial' },
  { id: 'portrait', label: 'Portraits' },
];

export const DarkroomAtelierTemplate: React.FC<PortfolioTemplateProps> = ({
  config,
  onInquirySubmit,
  isEditable = false,
  onUpdateConfig,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeProjectIndex, setActiveProjectIndex] = useState<number>(0);
  const [activeProjectModal, setActiveProjectModal] = useState<PortfolioProject | null>(null);
  const [viewMode, setViewMode] = useState<'reel' | 'contact-sheet'>('reel');
  const [isScrolled, setIsScrolled] = useState(false);

  // In-place project editing state
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  // Inquiry form
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    eventDate: '',
    eventType: 'wedding',
    location: '',
    estimatedBudget: '₹5,00,000 - ₹7,50,000',
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

  const activeReelProject = filteredProjects[activeProjectIndex] || filteredProjects[0];

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

  const handleUpdate = <K extends keyof typeof config>(field: K, value: (typeof config)[K]) => {
    if (onUpdateConfig) {
      onUpdateConfig({ [field]: value });
    }
  };

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

  const handleDeleteProject = (projectId: string) => {
    const nextWorks = config.featuredWorks.filter((p) => p.id !== projectId);
    handleUpdate('featuredWorks', nextWorks);
  };

  return (
    <div className="relative min-h-screen bg-[#070709] text-neutral-100 font-sans selection:bg-amber-500 selection:text-black overflow-x-hidden">
      {/* Darkroom Ambient Background Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-amber-500/5 blur-[140px] pointer-events-none z-0" />

      {/* ─── LIVE EDIT MODE FLOATING BADGE ─── */}
      {isEditable && (
        <aside
          aria-label="Editor controls"
          className="fixed bottom-6 right-6 z-40 bg-black/95 text-white backdrop-blur-xl border border-amber-500/60 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom duration-300"
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
              Darkroom In-Place Editor
            </span>
          </div>
          <span className="text-neutral-400 text-xs hidden sm:inline">• Click on text or negative frames to modify</span>
        </aside>
      )}

      {/* ─── DARKROOM ANALOG HEADER ─── */}
      <header
        className={`fixed top-0 left-0 right-0 z-30 transition-all duration-500 ${
          isScrolled
            ? 'bg-[#070709]/90 backdrop-blur-xl border-b border-neutral-800/90 py-3 shadow-2xl'
            : 'bg-gradient-to-b from-black/80 via-black/30 to-transparent py-5 text-white'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo / Studio Monogram */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Film className="w-4 h-4" />
            </div>
            <a href="#hero" className="font-mono text-sm sm:text-base font-bold tracking-wider text-white">
              <EditableText
                value={config.studioName}
                onSave={(val) => handleUpdate('studioName', val)}
                isEditable={isEditable}
                label="Studio Name"
                className="font-mono uppercase tracking-wider"
              />
            </a>
          </div>

          {/* Analog Lens Status Bar (Desktop) */}
          <div className="hidden lg:flex items-center gap-3 px-3 py-1 rounded-full bg-neutral-900/90 border border-neutral-800 text-[10px] font-mono text-neutral-400">
            <span className="text-amber-400 font-bold">ISO 400</span>
            <span>•</span>
            <span>35MM PRIME</span>
            <span>•</span>
            <span className="text-neutral-300">f/1.4 AVAILABLE LIGHT</span>
            <span>•</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              COMMISSIONS OPEN
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-5 text-xs font-mono uppercase tracking-widest">
            <a href="#reel" className="text-neutral-400 hover:text-amber-400 transition-colors">
              Reel
            </a>
            <a href="#manifesto" className="text-neutral-400 hover:text-amber-400 transition-colors">
              Manifesto
            </a>
            <a
              href="#commission"
              className="px-4 py-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold transition-transform hover:scale-105 active:scale-95 shadow-md shadow-amber-400/20"
            >
              Commission
            </a>
          </nav>
        </div>
      </header>

      {/* ─── HERO: CINEMATIC 2.39:1 LETTERBOX ─── */}
      <section id="hero" className="relative min-h-[90vh] sm:min-h-screen flex items-end justify-start overflow-hidden pt-24 pb-12 sm:pb-20">
        {/* Full-Bleed Cinematic Background Image */}
        <div className="absolute inset-0 z-0">
          <EditableImage
            src={config.bannerUrl}
            alt={config.studioName}
            onSave={(url) => handleUpdate('bannerUrl', url)}
            isEditable={isEditable}
            label="Hero Background"
            className="w-full h-full object-cover object-center filter brightness-[0.75] contrast-[1.1]"
            containerClassName="w-full h-full"
          />
          {/* Moody Darkroom Gradients & Perforation Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-black/50 to-black/30 pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black to-transparent pointer-events-none" />
        </div>

        {/* Hero Overlay Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-4xl space-y-4"
          >
            {/* HUD Metadata Badge */}
            <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-xs font-mono uppercase tracking-[0.25em] text-amber-400">
              <span className="px-2.5 py-1 rounded-md bg-black/60 border border-amber-500/30 backdrop-blur-md">
                DARKROOM ATELIER ARCHIVE
              </span>
              <span>//</span>
              <span className="text-neutral-300">
                <EditableText
                  value={config.location}
                  onSave={(val) => handleUpdate('location', val)}
                  isEditable={isEditable}
                  label="Studio Location"
                />
              </span>
            </div>

            {/* Huge Cinematic Moniker */}
            <h1 className="font-mono text-4xl sm:text-7xl md:text-8xl font-black uppercase tracking-tight leading-[0.95] text-white">
              <EditableText
                value={config.studioName}
                onSave={(val) => handleUpdate('studioName', val)}
                isEditable={isEditable}
                label="Studio Name"
                className="font-mono font-black"
              />
            </h1>

            {/* Tagline */}
            <p className="text-sm sm:text-lg md:text-xl text-neutral-300 font-mono tracking-wide max-w-2xl leading-relaxed">
              <EditableText
                value={config.tagline}
                onSave={(val) => handleUpdate('tagline', val)}
                isEditable={isEditable}
                label="Tagline"
                className="font-mono text-neutral-300"
              />
            </p>

            {/* Director Sign-Off */}
            <div className="pt-2 flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-neutral-400">
              <span>VISUAL DIRECTION BY</span>
              <EditableText
                value={config.artistName}
                onSave={(val) => handleUpdate('artistName', val)}
                isEditable={isEditable}
                label="Photographer / Director Name"
                className="font-bold text-amber-400 border-b border-amber-400 pb-0.5"
              />
            </div>
          </motion.div>

          {/* Film Perforation Bar at Bottom */}
          <div className="pt-8 border-t border-neutral-800 mt-8 flex items-center justify-between text-neutral-500 font-mono text-[10px]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>35MM FILM CONTACT SYSTEM</span>
            </div>
            <div className="flex items-center gap-4">
              <span>EXP: 01-36</span>
              <span>KODAK TRI-X / CINESTILL</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: THE 35MM FILMSTRIP REEL & CONTACT SHEET ─── */}
      <section id="reel" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-neutral-800">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-amber-400 font-bold">
              <Film className="w-3.5 h-3.5" />
              <span>THE 35MM REEL ARCHIVE</span>
            </div>
            <h2 className="font-mono text-3xl sm:text-5xl font-black uppercase tracking-tight">
              Negative <span className="text-amber-400">Reel</span>
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 font-mono max-w-lg">
              High-contrast analog captures documenting genuine emotion, ambient room light, and candid cinema.
            </p>
          </div>

          {/* Controls: Categories & View Switcher */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Toggle */}
            <div className="flex p-1 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono">
              <button
                type="button"
                onClick={() => setViewMode('reel')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'reel' ? 'bg-amber-400 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Reel Viewer
              </button>
              <button
                type="button"
                onClick={() => setViewMode('contact-sheet')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'contact-sheet' ? 'bg-amber-400 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Contact Sheet
              </button>
            </div>

            {/* In-Place Add Project Button */}
            {isEditable && (
              <button
                type="button"
                onClick={() => {
                  setEditingProject(null);
                  setIsProjectModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center gap-1.5 shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer font-mono"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>New Frame</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 pt-6 pb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setActiveProjectIndex(0);
              }}
              className={`px-3 py-1.5 rounded-lg font-mono text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-neutral-100 text-neutral-950 font-bold shadow-md'
                  : 'bg-neutral-900/80 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* VIEW 1: INTERACTIVE CINEMATIC FILM REEL */}
        {viewMode === 'reel' && activeReelProject && (
          <div className="space-y-6">
            {/* Main Featured Frame with Authentic Film Perforations */}
            <div className="relative rounded-3xl overflow-hidden bg-black border-2 border-neutral-800 shadow-2xl p-4 sm:p-6">
              {/* Film Sprocket Perforation Strip (Top) */}
              <div className="flex justify-between items-center pb-3 border-b border-neutral-800/80 text-neutral-600 font-mono text-[10px]">
                <div className="flex gap-2.5">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="w-3 h-2 rounded-[2px] bg-neutral-800 border border-neutral-700/60" />
                  ))}
                </div>
                <span className="tracking-[0.2em] uppercase text-amber-500 font-bold">
                  FRAME #{String(activeProjectIndex + 1).padStart(2, '0')} // KODAK 400
                </span>
                <div className="flex gap-2.5">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="w-3 h-2 rounded-[2px] bg-neutral-800 border border-neutral-700/60" />
                  ))}
                </div>
              </div>

              {/* Main Photo Display */}
              <div
                className="relative aspect-16/9 sm:aspect-21/9 my-4 rounded-xl overflow-hidden cursor-pointer group bg-neutral-950"
                onClick={() => setActiveProjectModal(activeReelProject)}
              >
                <img
                  src={activeReelProject.coverUrl}
                  alt={activeReelProject.title}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />

                {/* In-Place Project Edit Button */}
                {isEditable && (
                  <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingProject(activeReelProject);
                        setIsProjectModalOpen(true);
                      }}
                      className="p-2.5 rounded-xl bg-black/80 hover:bg-amber-400 hover:text-black text-white transition-colors cursor-pointer shadow-lg"
                      title="Edit this project"
                    >
                      <Sliders className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Delete "${activeReelProject.title}"?`)) {
                          handleDeleteProject(activeReelProject.id);
                        }
                      }}
                      className="p-2.5 rounded-xl bg-black/80 hover:bg-rose-500 text-white transition-colors cursor-pointer shadow-lg"
                      title="Delete this project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Metadata HUD */}
                <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-white">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{activeReelProject.location}</span>
                      <span>•</span>
                      <span className="uppercase">{activeReelProject.category}</span>
                      <span>•</span>
                      <span>{activeReelProject.year}</span>
                    </div>
                    <h3 className="font-mono text-xl sm:text-3xl font-black uppercase tracking-tight">
                      {activeReelProject.title}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveProjectModal(activeReelProject)}
                    className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg cursor-pointer"
                  >
                    <span>Inspect Negative</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Film Sprocket Perforation Strip (Bottom) */}
              <div className="flex justify-between items-center pt-3 border-t border-neutral-800/80 text-neutral-600 font-mono text-[10px]">
                <div className="flex gap-2.5">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="w-3 h-2 rounded-[2px] bg-neutral-800 border border-neutral-700/60" />
                  ))}
                </div>
                <span>EXP SAFETY FILM • DX CODED</span>
                <div className="flex gap-2.5">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="w-3 h-2 rounded-[2px] bg-neutral-800 border border-neutral-700/60" />
                  ))}
                </div>
              </div>
            </div>

            {/* Horizontal Film Reel Thumbnails Slider */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
              {filteredProjects.map((p, idx) => (
                <div
                  key={p.id}
                  onClick={() => setActiveProjectIndex(idx)}
                  className={`shrink-0 w-36 sm:w-44 rounded-xl overflow-hidden border-2 cursor-pointer transition-all duration-300 group ${
                    idx === activeProjectIndex
                      ? 'border-amber-400 ring-2 ring-amber-400/30 scale-102'
                      : 'border-neutral-800 hover:border-neutral-600 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="aspect-16/10 relative">
                    <img src={p.coverUrl} alt={p.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors" />
                    <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-amber-400 font-bold">
                      #{String(idx + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="p-2 bg-neutral-900 text-[10px] font-mono">
                    <p className="font-bold text-white truncate">{p.title}</p>
                    <p className="text-neutral-500 truncate">{p.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 2: FULL CONTACT SHEET GRID */}
        {viewMode === 'contact-sheet' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {filteredProjects.map((p, idx) => (
              <div
                key={p.id}
                className="group relative rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800 hover:border-amber-400 transition-all duration-300 flex flex-col"
              >
                <div
                  className="relative aspect-4/3 overflow-hidden cursor-pointer"
                  onClick={() => setActiveProjectModal(p)}
                >
                  <img
                    src={p.coverUrl}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-70" />

                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-amber-400 font-bold border border-white/10">
                    FRAME #{String(idx + 1).padStart(2, '0')}
                  </span>

                  {isEditable && (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProject(p);
                          setIsProjectModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-black/80 hover:bg-amber-400 hover:text-black text-white transition-colors"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete "${p.title}"?`)) {
                            handleDeleteProject(p.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-black/80 hover:bg-rose-500 text-white transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 block">
                      {p.category} • {p.year}
                    </span>
                    <h3 className="font-mono text-base font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                      {p.title}
                    </h3>
                    <p className="text-xs text-neutral-400 font-mono truncate">{p.location}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveProjectModal(p)}
                    className="pt-2 text-xs font-mono font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Inspect Frame</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── SECTION 3: THE DARKROOM MANIFESTO & DEVELOPER TRAY ─── */}
      <section id="manifesto" className="py-20 sm:py-28 bg-[#0c0d11] border-y border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left: Photographer Darkroom Contact Print */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-sm aspect-4/5 rounded-2xl overflow-hidden bg-black border-4 border-neutral-800 shadow-2xl p-3">
                <div className="relative w-full h-full rounded-xl overflow-hidden">
                  <EditableImage
                    src={config.avatarUrl}
                    alt={config.artistName}
                    onSave={(url) => handleUpdate('avatarUrl', url)}
                    isEditable={isEditable}
                    label="Photographer Portrait"
                    className="w-full h-full object-cover filter contrast-[1.1] grayscale"
                    containerClassName="w-full h-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 text-white font-mono">
                    <span className="text-[10px] uppercase tracking-widest text-amber-400 font-bold block">
                      ARCHIVAL PRINT // 001
                    </span>
                    <p className="text-lg font-bold">{config.artistName}</p>
                    <p className="text-[11px] text-neutral-400">Principal Cinematographer & Director</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: The Manifesto */}
            <div className="lg:col-span-7 space-y-6">
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-400 font-bold block">
                DARKROOM MANIFESTO // 002
              </span>

              <blockquote className="font-mono text-2xl sm:text-4xl font-black uppercase tracking-tight leading-[1.2] text-white">
                “
                <EditableText
                  value={config.philosophyQuote}
                  onSave={(val) => handleUpdate('philosophyQuote', val)}
                  isEditable={isEditable}
                  multiline={true}
                  label="Philosophy Statement"
                  className="font-mono font-black"
                />
                ”
              </blockquote>

              <p className="text-xs font-mono uppercase tracking-widest text-neutral-400 font-bold">
                // AUTHOR:{' '}
                <EditableText
                  value={config.philosophyAuthor}
                  onSave={(val) => handleUpdate('philosophyAuthor', val)}
                  isEditable={isEditable}
                  label="Quote Author"
                />
              </p>

              {/* Bio / About */}
              <div className="pt-2 text-xs sm:text-sm font-mono text-neutral-300 leading-relaxed max-w-xl">
                <EditableText
                  value={config.aboutStory || config.bio}
                  onSave={(val) => handleUpdate('aboutStory', val)}
                  isEditable={isEditable}
                  multiline={true}
                  label="Artist Bio / Story"
                  as="p"
                  className="leading-relaxed"
                />
              </div>

              {/* Specs & Pricing */}
              <div className="pt-4 flex flex-wrap gap-4 text-xs font-mono">
                <div className="px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                  <span className="text-neutral-500 uppercase mr-2">Commission Starting at:</span>
                  <EditableText
                    value={config.pricingStartingAt}
                    onSave={(val) => handleUpdate('pricingStartingAt', val)}
                    isEditable={isEditable}
                    label="Starting Pricing"
                    className="font-bold text-amber-400"
                  />
                </div>
                <div className="px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                  <span className="text-neutral-500 uppercase mr-2">Base Studio:</span>
                  <span className="text-white font-bold">{config.location}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 4: COMMISSION DESK (DARK INQUIRY SALON) ─── */}
      <section id="commission" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center space-y-2 mb-10 font-mono">
          <span className="text-[10px] uppercase tracking-[0.3em] text-amber-400 font-bold block">
            ANALOG COMMISSION CONTRACT
          </span>
          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
            Initiate <span className="text-amber-400">Commission</span>
          </h2>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            Book private wedding documentations, editorial campaigns, or worldwide cinematic commissions.
          </p>
        </div>

        <div className="rounded-3xl bg-[#0f1014] border border-neutral-800 p-6 sm:p-10 shadow-2xl relative">
          {isSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12 space-y-4 font-mono"
            >
              <div className="w-16 h-16 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h3 className="text-2xl font-bold uppercase tracking-wide">Commission Note Transmitted</h3>
              <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
                Your commission specifications have been logged in the studio docket. Expect a tailored response within 24 hours.
              </p>
              <button
                type="button"
                onClick={() => setIsSuccess(false)}
                className="mt-4 px-6 py-2 rounded-xl bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider font-mono hover:bg-amber-300 transition-all cursor-pointer"
              >
                Transmit Another Note
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="client-name-dark" className="text-[10px] uppercase tracking-wider text-neutral-400 block font-bold">
                    Client Name *
                  </label>
                  <input
                    id="client-name-dark"
                    type="text"
                    required
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    placeholder="e.g. Maya & Siddharth"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-700 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="client-email-dark" className="text-[10px] uppercase tracking-wider text-neutral-400 block font-bold">
                    Email Address *
                  </label>
                  <input
                    id="client-email-dark"
                    type="email"
                    required
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    placeholder="maya@atelier.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-700 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="client-phone-dark" className="text-[10px] uppercase tracking-wider text-neutral-400 block font-bold">
                    WhatsApp / Phone
                  </label>
                  <input
                    id="client-phone-dark"
                    type="tel"
                    value={formData.clientPhone}
                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                    placeholder="+91 99999 88888"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-700 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="event-type-dark" className="text-[10px] uppercase tracking-wider text-neutral-400 block font-bold">
                    Project Type
                  </label>
                  <select
                    id="event-type-dark"
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-amber-400 transition-colors"
                  >
                    <option value="wedding">Destination Wedding (35mm + Digital)</option>
                    <option value="editorial">Fashion / Brand Editorial</option>
                    <option value="pre-wedding">Intimate Pre-Wedding Reel</option>
                    <option value="portrait">Private Darkroom Commission</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="event-date-dark" className="text-[10px] uppercase tracking-wider text-neutral-400 block font-bold">
                    Event Date
                  </label>
                  <input
                    id="event-date-dark"
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="event-location-dark" className="text-[10px] uppercase tracking-wider text-neutral-400 block font-bold">
                    Location / Destination
                  </label>
                  <input
                    id="event-location-dark"
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Udaipur, London, Goa"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-700 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="message-dark" className="text-[10px] uppercase tracking-wider text-neutral-400 block font-bold">
                  Commission Scope & Details *
                </label>
                <textarea
                  id="message-dark"
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us about the light, your aesthetic inspirations, and key moments..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-700 focus:outline-none focus:border-amber-400 transition-colors resize-none leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-amber-400/10 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                ) : (
                  <>
                    <span>Submit Analog Commission</span>
                    <Send className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Studio Direct Contacts */}
          <div className="pt-6 mt-6 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-4 text-[11px] font-mono text-neutral-400">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <EditableText
                value={config.contactEmail}
                onSave={(val) => handleUpdate('contactEmail', val)}
                isEditable={isEditable}
                label="Studio Email"
              />
            </div>
            {config.contactPhone && (
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <EditableText
                  value={config.contactPhone}
                  onSave={(val) => handleUpdate('contactPhone', val)}
                  isEditable={isEditable}
                  label="Studio Phone"
                />
              </div>
            )}
            {config.instagramHandle && (
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-amber-400 shrink-0 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                <span>@</span>
                <EditableText
                  value={config.instagramHandle}
                  onSave={(val) => handleUpdate('instagramHandle', val)}
                  isEditable={isEditable}
                  label="Instagram Moniker"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── FOOTER: DARKROOM FILM STRIP ─── */}
      <footer className="py-12 border-t border-neutral-800/80 text-center font-mono text-xs text-neutral-500 space-y-2">
        <p className="uppercase tracking-[0.25em]">
          © {new Date().getFullYear()} {config.studioName} • 35MM ANALOG & DIGITAL ATELIER
        </p>
        <p className="text-[10px] text-neutral-600">
          PROCESSED VIA EX SHARE ARCHIVAL ENGINE • ALL NEGATIVES RESERVED
        </p>
      </footer>

      {/* ─── NEGATIVE INSPECTION MODAL ─── */}
      {activeProjectModal && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => setActiveProjectModal(null)}
        >
          <div
            className="w-full max-w-4xl rounded-3xl bg-[#0e0f14] border border-neutral-800 shadow-2xl overflow-hidden flex flex-col text-white max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Image Display */}
            <div className="relative aspect-16/9 bg-black overflow-hidden">
              <img
                src={activeProjectModal.coverUrl}
                alt={activeProjectModal.title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setActiveProjectModal(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/70 hover:bg-black text-white backdrop-blur-md transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-4 px-3 py-1 rounded-md bg-black/70 backdrop-blur-md text-amber-400 font-mono text-xs uppercase font-bold tracking-wider">
                FRAME INSPECTION // {activeProjectModal.category}
              </div>
            </div>

            {/* Negative Details */}
            <div className="p-6 sm:p-8 space-y-4 font-mono overflow-y-auto">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
                    {activeProjectModal.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>{activeProjectModal.location}</span>
                    <span>•</span>
                    <span>{activeProjectModal.year}</span>
                  </div>
                </div>

                <span className="text-xs text-amber-400 px-3 py-1 rounded-lg bg-neutral-900 border border-neutral-800">
                  {activeProjectModal.mediaCount || 24} Raw Frames
                </span>
              </div>

              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans">
                {activeProjectModal.description ||
                  'Captured with natural room light and analog film warmth, emphasizing genuine moments over staged setups.'}
              </p>

              {/* Curated Highlight Frames */}
              {activeProjectModal.highlightMedia && activeProjectModal.highlightMedia.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold block">
                    Curated Negative Strip
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {activeProjectModal.highlightMedia.map((mediaUrl, idx) => (
                      <div key={idx} className="aspect-4/3 rounded-xl overflow-hidden bg-black border border-neutral-800">
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
