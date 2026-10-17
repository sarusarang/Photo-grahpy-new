import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Play, Menu, X, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { Logo } from '../common/Logo';
import { useAuth } from '../../context/AuthContext';

export interface HeroSectionProps {
  /** Line 1 of the big centered headline */
  headlineLine1?: string;
  /** Line 2 of the big centered headline (rendered with high-fashion optical slit styling) */
  headlineLine2?: string;
  /** Primary CTA button text */
  primaryCtaText?: string;
  /** Primary CTA destination link */
  primaryCtaLink?: string;
  /** Secondary CTA button text */
  secondaryCtaText?: string;
  /** Secondary CTA destination link or anchor */
  secondaryCtaLink?: string;
  /** Central photographer portrait asset URL */
  photographerImage?: string;
  /** Bottom-right video preview thumbnail asset URL */
  videoPreviewImage?: string;
  /** Bottom-left editorial studio description paragraph */
  descriptionText?: string;
  /** Optional custom video embed or demo reel URL for interactive modal */
  videoUrl?: string;
  /** Optional callback when primary CTA is clicked */
  onPrimaryCtaClick?: () => void;
  /** Optional callback when secondary CTA is clicked */
  onSecondaryCtaClick?: () => void;
  /** Optional custom class name */
  className?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  headlineLine1 = 'FRAME EVERY MOMENT',
  headlineLine2 = 'EVERY MASTERPIECE!',
  primaryCtaText = 'EXPLORE VAULT',
  primaryCtaLink = '/signup',
  secondaryCtaText = 'EXPLORE ALL',
  secondaryCtaLink = '#selected-projects',
  photographerImage = '/hero-photographer.png',
  videoPreviewImage = '/hero-video-still.jpg',
  descriptionText = "Ultra-fast RAW proofing without compromising original dynamic range. Our AI face tethering and cloud vault are built for high-stakes editorial and luxury wedding studios.",
  videoUrl = 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1',
  onPrimaryCtaClick,
  onSecondaryCtaClick,
  className = '',
}) => {
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  return (
    <div className={`w-full p-0 m-0 text-neutral-900 selection:bg-neutral-900 selection:text-white ${className}`}>
      {/* ==================================================================== */}
      {/* MAIN FULL-SCREEN HERO CONTAINER (Edge-to-Edge, Zero Gaps)            */}
      {/* ==================================================================== */}
      <section className="relative w-full h-screen min-h-[680px] sm:min-h-[760px] lg:min-h-[860px] overflow-hidden bg-gradient-to-b from-[#dde7eb] via-[#e5edf0] to-[#d4dfe4] flex flex-col justify-between">
        
        {/* Subtle Ambient Radial Lighting in Center */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{
            background: 'radial-gradient(circle at 50% 38%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 65%)'
          }}
        />

        {/* ================================================================== */}
        {/* BACKGROUND GEOMETRIC CHEVRON VECTOR LINES (Exact Motif)            */}
        {/* ================================================================== */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center">
          <svg
            className="w-full h-full min-w-[1200px] opacity-70"
            viewBox="0 0 1440 900"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid slice"
          >
            {/* Symmetrical fine angled vector lines radiating behind subject */}
            <path
              d="M 120 380 L 720 620 L 1320 380"
              stroke="rgba(255,255,255,0.85)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <path
              d="M 180 430 L 720 670 L 1260 430"
              stroke="rgba(255,255,255,0.65)"
              strokeWidth="1"
              strokeLinecap="round"
            />
            <path
              d="M 240 480 L 720 720 L 1200 480"
              stroke="rgba(255,255,255,0.45)"
              strokeWidth="1"
              strokeLinecap="round"
            />
            {/* Subtle soft dark guideline accents */}
            <path
              d="M 320 540 L 720 770 L 1120 540"
              stroke="rgba(0,0,0,0.035)"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* ================================================================== */}
        {/* TOP NAVIGATION BAR WITH CENTER COCKPIT / NOTCH CUTOUT (Exact UI)   */}
        {/* ================================================================== */}
        {/* ================================================================== */}
        {/* TOP NAVIGATION BAR WITH CENTER COCKPIT / NOTCH CUTOUT (Exact UI)   */}
        {/* ================================================================== */}
        <header className="relative z-30 w-full">
          {/* Unified Chamfer Background (Zero seams, zero color mismatch, precision angled cutting) */}
          <div className="absolute inset-x-0 top-0 h-[74px] pointer-events-none z-0 filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.03)]">
            <div
              className="w-full h-full bg-white/75 backdrop-blur-xl border-b border-black/[0.05]"
              style={{
                clipPath: 'polygon(0 0, 100% 0, 100% 54px, calc(50% + 140px) 54px, calc(50% + 105px) 72px, calc(50% - 105px) 72px, calc(50% - 140px) 54px, 0 54px)',
              }}
            />
          </div>

          {/* Nav Container with Precision Horizontal Baseline Alignment */}
          <div className="relative w-full h-[54px] flex items-center justify-between px-6 sm:px-10 lg:px-12">
            
            {/* Left Navigation Links */}
            <nav className="relative z-10 hidden md:flex items-center gap-7 lg:gap-8 text-[11px] lg:text-xs font-semibold tracking-[0.18em] text-neutral-800 h-full">
              <Link 
                to="/#selected-projects" 
                className="hover:text-black transition-colors uppercase tracking-wider"
              >
                STUDIO
              </Link>
              <Link 
                to="/#selected-projects" 
                className="hover:text-black transition-colors uppercase tracking-wider"
              >
                GALLERIES
              </Link>
              <Link 
                to="/#upcoming-concept" 
                className="hover:text-black transition-colors uppercase tracking-wider"
              >
                PROOFING
              </Link>
              <Link 
                to="/#testimonials" 
                className="hover:text-black transition-colors uppercase tracking-wider"
              >
                TETHERING
              </Link>
            </nav>

            {/* Center Brand Logo: Absolutely Centered at 50% & Optically Aligned inside Chamfered Pod */}
            <div className="absolute left-1/2 -translate-x-1/2 top-0 h-[62px] flex items-center justify-center z-20 pointer-events-auto">
              <Link 
                to="/" 
                className="flex items-center justify-center transition-transform duration-300 hover:scale-105"
                title="EX SHARE Atelier"
              >
                <Logo 
                  variant="light" 
                  className="h-6 sm:h-7 lg:h-7.5 w-auto object-contain drop-shadow-sm" 
                  alt="EX SHARE"
                />
              </Link>
            </div>

            {/* Right Navigation Links & Action Buttons */}
            <div className="relative z-10 flex items-center gap-5 sm:gap-6 ml-auto h-full">
              <nav className="hidden lg:flex items-center gap-6 lg:gap-7 text-[11px] lg:text-xs font-semibold tracking-[0.18em] text-neutral-800">
                <a 
                  href="#selected-projects" 
                  className="hover:text-black transition-colors uppercase tracking-wider"
                >
                  ATELIER
                </a>
                <a 
                  href="#upcoming-concept" 
                  className="hover:text-black transition-colors uppercase tracking-wider"
                >
                  SHOWCASE
                </a>
              </nav>

              {/* Dynamic Sign In / Dashboard Pill Button */}
              {isAuthenticated ? (
                <Link
                  to="/dashboard/overview"
                  className="hidden sm:inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#111215] text-white text-[11px] font-semibold tracking-[0.14em] uppercase shadow-sm hover:bg-neutral-800 transition-all duration-200 hover:scale-[1.03]"
                >
                  <span>DASHBOARD</span>
                  <ArrowRight className="w-3 h-3 text-neutral-400" />
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="hidden sm:inline-block px-5 py-2 rounded-full bg-[#111215] text-white text-[11px] font-semibold tracking-[0.14em] uppercase shadow-sm hover:bg-neutral-800 transition-all duration-200 hover:scale-[1.03]"
                >
                  SIGN IN / UP
                </Link>
              )}

              {/* Black Circular Button with Lock Icon (from reference UI) */}
              <Link
                to={isAuthenticated ? "/dashboard/settings" : "/login"}
                aria-label="Secure Atelier Vault"
                className="hidden sm:flex w-8 sm:w-9 h-8 sm:h-9 rounded-full bg-[#111215] text-white items-center justify-center shadow-sm hover:bg-neutral-800 transition-all duration-200 hover:scale-105"
                title="Atelier Security Lock"
              >
                <Lock className="w-3.5 h-3.5 text-white/90" />
              </Link>

              {/* Mobile Menu Trigger */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-full bg-white/60 backdrop-blur-md text-neutral-900 border border-black/5 hover:bg-white transition-all shadow-sm"
                aria-label="Open Navigation Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.22 }}
              className="fixed inset-0 z-50 md:hidden bg-neutral-950/95 backdrop-blur-2xl flex flex-col justify-between p-6 text-white"
            >
              <div className="flex items-center justify-between">
                <Logo variant="dark" className="h-7 w-auto object-contain" />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-6 text-2xl font-light tracking-wide my-auto">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-medium text-white"
                >
                  HOME
                </Link>
                <a
                  href="#selected-projects"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-neutral-300 hover:text-white"
                >
                  STUDIO GALLERIES
                </a>
                <a
                  href="#upcoming-concept"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-neutral-300 hover:text-white"
                >
                  CLIENT PROOFING
                </a>
                <a
                  href="#testimonials"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-neutral-300 hover:text-white"
                >
                  LIVE TETHERING
                </a>
              </div>

              <div className="flex flex-col gap-3">
                {isAuthenticated ? (
                  <Link
                    to="/dashboard/overview"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-4 rounded-full bg-white text-neutral-950 text-center font-bold text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
                  >
                    <span>Open Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-3.5 rounded-full bg-white text-neutral-950 text-center font-bold text-xs uppercase tracking-widest shadow-xl"
                    >
                      Sign In / Login
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-3.5 rounded-full border border-white/30 text-white text-center text-xs font-semibold uppercase tracking-wider hover:bg-white/10"
                    >
                      Create Studio Account
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================================================================== */}
        {/* HERO CENTER HEADLINE & DUAL ACTION PILL BUTTONS                   */}
        {/* ================================================================== */}
        <div className="relative z-20 text-center pt-8 sm:pt-10 md:pt-12 px-4 max-w-4xl mx-auto flex flex-col items-center">
          
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            {/* Line 1: Heavy Clean Grotesk Sans */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-[72px] font-extrabold tracking-[-0.035em] text-neutral-900 leading-[1.04] uppercase">
              {headlineLine1}
            </h1>

            {/* Line 2: Optical Slit Horizontal Sliced Typography on the accent word (Exact UI Effect) */}
            <div className="mt-1 sm:mt-2 flex flex-wrap items-center justify-center gap-2.5 sm:gap-4">
              {headlineLine2.includes(' ') ? (
                <>
                  <span className="text-3xl sm:text-5xl md:text-6xl lg:text-[72px] font-extrabold tracking-[-0.035em] text-neutral-900 leading-[1.04] uppercase select-none">
                    {headlineLine2.slice(0, headlineLine2.lastIndexOf(' '))}
                  </span>
                  <span
                    className="block text-3xl sm:text-5xl md:text-6xl lg:text-[72px] font-extrabold tracking-[-0.035em] uppercase leading-[1.04] select-none"
                    style={{
                      background: 'repeating-linear-gradient(180deg, #101114 0px, #101114 6px, transparent 6px, transparent 9px, #101114 9px, #101114 15px)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {headlineLine2.slice(headlineLine2.lastIndexOf(' ') + 1)}
                  </span>
                </>
              ) : (
                <span
                  className="block text-3xl sm:text-5xl md:text-6xl lg:text-[72px] font-extrabold tracking-[-0.035em] uppercase leading-[1.04] select-none"
                  style={{
                    background: 'repeating-linear-gradient(180deg, #101114 0px, #101114 6px, transparent 6px, transparent 9px, #101114 9px, #101114 15px)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {headlineLine2}
                </span>
              )}
            </div>

            {/* Centered Dual Action Buttons */}
            <div className="flex items-center justify-center gap-3.5 sm:gap-4 mt-6 sm:mt-8">
              {/* Primary Black Pill Button */}
              {onPrimaryCtaClick ? (
                <button
                  onClick={onPrimaryCtaClick}
                  className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-full bg-[#141518] text-white text-[11px] sm:text-xs font-semibold tracking-[0.16em] uppercase shadow-md hover:bg-neutral-800 transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  {primaryCtaText}
                </button>
              ) : (
                <Link
                  to={primaryCtaLink}
                  className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-full bg-[#141518] text-white text-[11px] sm:text-xs font-semibold tracking-[0.16em] uppercase shadow-md hover:bg-neutral-800 transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  {primaryCtaText}
                </Link>
              )}

              {/* Secondary White Pill Button with Subtle Border */}
              {onSecondaryCtaClick ? (
                <button
                  onClick={onSecondaryCtaClick}
                  className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-full bg-white/90 backdrop-blur-sm text-neutral-900 border border-neutral-300/80 text-[11px] sm:text-xs font-semibold tracking-[0.16em] uppercase shadow-sm hover:bg-white hover:border-neutral-400 transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  {secondaryCtaText}
                </button>
              ) : (
                <a
                  href={secondaryCtaLink}
                  className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-full bg-white/90 backdrop-blur-sm text-neutral-900 border border-neutral-300/80 text-[11px] sm:text-xs font-semibold tracking-[0.16em] uppercase shadow-sm hover:bg-white hover:border-neutral-400 transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  {secondaryCtaText}
                </a>
              )}
            </div>
          </motion.div>
        </div>

        {/* ================================================================== */}
        {/* HERO BOTTOM SECTION (Photographer Subject + Left Block + Right Card) */}
        {/* ================================================================== */}
        <div className="relative w-full mt-auto flex items-end justify-center">

          {/* 1. CENTRAL PHOTOGRAPHER SUBJECT (Anchored to Bottom Edge) */}
          <div className="relative z-10 w-full max-w-[340px] sm:max-w-[420px] md:max-w-[480px] lg:max-w-[520px] mx-auto flex items-end justify-center pointer-events-none select-none">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              className="relative w-full flex justify-center"
            >
              <img
                src={photographerImage}
                alt="Editorial Photographer with Camera"
                className="w-full h-auto object-cover object-top max-h-[420px] sm:max-h-[500px] lg:max-h-[570px] pointer-events-auto"
                style={{
                  // Subtle bottom vignette fade to integrate seamlessly into container edge
                  maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 85%, rgba(0,0,0,0.4) 95%, rgba(0,0,0,0) 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 85%, rgba(0,0,0,0.4) 95%, rgba(0,0,0,0) 100%)',
                }}
              />
            </motion.div>
          </div>

          {/* 2. LOWER LEFT FLOATING ELEMENT: Avatars & Editorial Text Block */}
          <motion.div
            initial={{ opacity: 0, x: -25 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.85, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="hidden sm:block absolute left-6 sm:left-10 lg:left-14 bottom-8 sm:bottom-12 lg:bottom-14 z-20 max-w-[220px] sm:max-w-[260px] lg:max-w-[280px]"
          >
            {/* Overlapping Avatar Stack of 3 Photographers/Clients */}
            <div className="flex items-center -space-x-2">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80"
                alt="Studio Client Elena Rostova"
                className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm ring-1 ring-black/5"
              />
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80"
                alt="Fashion Director Marcus Vance"
                className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm ring-1 ring-black/5"
              />
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80"
                alt="Haute Couture Editor Clara Delacroix"
                className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm ring-1 ring-black/5"
              />
            </div>

            {/* Editorial Description Text */}
            <p className="mt-4 text-[11px] sm:text-xs text-neutral-600 leading-[1.6] font-normal tracking-normal select-text">
              {descriptionText}
            </p>
          </motion.div>

          {/* 3. LOWER RIGHT FLOATING ELEMENT: Cinematic Video Preview Card */}
          <motion.div
            initial={{ opacity: 0, x: 25 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.85, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="hidden sm:block absolute right-6 sm:right-10 lg:right-14 bottom-8 sm:bottom-12 lg:bottom-14 z-20"
          >
            <div
              onClick={() => setVideoModalOpen(true)}
              className="group cursor-pointer relative w-[190px] sm:w-[220px] lg:w-[260px] aspect-[16/10] rounded-[20px] sm:rounded-[24px] overflow-hidden shadow-[0_16px_36px_rgba(0,0,0,0.12)] border border-white/70 bg-neutral-900 transition-transform duration-300 hover:scale-[1.03] active:scale-[0.98]"
              title="Watch Atelier Reel"
            >
              {/* Cinematic Video Still Image */}
              <img
                src={videoPreviewImage}
                alt="Camera Lens & Atelier Cinematography"
                className="w-full h-full object-cover object-center grayscale contrast-125 transition-transform duration-700 group-hover:scale-105"
              />

              {/* Dark Ambient Overlay */}
              <div className="absolute inset-0 bg-black/25 group-hover:bg-black/15 transition-colors duration-300" />

              {/* Translucent Circular Play Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-11 sm:w-12 h-11 sm:h-12 rounded-full bg-black/45 backdrop-blur-md border border-white/40 flex items-center justify-center text-white shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:bg-black/70">
                  <Play className="w-4 sm:w-4.5 h-4 sm:h-4.5 fill-white text-white ml-0.5" />
                </div>
              </div>
            </div>
          </motion.div>

        </div>

      </section>

      {/* ==================================================================== */}
      {/* CINEMATIC VIDEO REEL MODAL                                           */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {videoModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8"
            onClick={() => setVideoModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-4xl bg-neutral-950 rounded-[28px] overflow-hidden border border-white/20 shadow-2xl aspect-video"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setVideoModalOpen(false)}
                className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/60 text-white hover:bg-white hover:text-black flex items-center justify-center transition-all"
                aria-label="Close video reel"
              >
                <X className="w-5 h-5" />
              </button>
              
              {/* Responsive Video Embed or Showcase Player */}
              <div className="w-full h-full flex items-center justify-center bg-neutral-900 relative">
                <img
                  src={videoPreviewImage}
                  alt="Cinema Still"
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/60 flex flex-col items-center justify-center text-center p-6 text-white">
                  <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/30 flex items-center justify-center mb-4">
                    <Sparkles className="w-7 h-7 text-amber-400" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight">EX SHARE Atelier Cinema</h3>
                  <p className="text-xs sm:text-sm text-neutral-300 max-w-md mt-2">
                    Experience ultra-high bitrate 4K video reel delivery, live tethering ingests, and cinematic proofing.
                  </p>
                  <Link
                    to="/signup"
                    onClick={() => setVideoModalOpen(false)}
                    className="mt-6 px-6 py-2.5 rounded-full bg-white text-neutral-900 font-semibold text-xs tracking-wider uppercase hover:bg-neutral-100 transition-transform hover:scale-105"
                  >
                    Start Free Atelier Trial
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
