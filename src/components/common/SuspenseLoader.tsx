import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Aperture, Camera } from 'lucide-react';

interface SuspenseLoaderProps {
  message?: string;
  submessage?: string;
  showViewfinder?: boolean;
  className?: string;
}

const PHOTOGRAPHY_STATUS_MESSAGES = [
  'INITIALIZING ATELIER',
  'LOADING HIGH-RES CANVAS',
  'CALIBRATING COLOR PROFILES',
  'CURATING VISUAL EXPERIENCE',
  'FINALIZING FRAME ASSETS',
];

export const SuspenseLoader: React.FC<SuspenseLoaderProps> = ({
  message,
  submessage,
  showViewfinder = true,
  className = '',
}) => {
  const [statusIndex, setStatusIndex] = useState(0);

  // Smoothly cycle status messages if no custom message is provided
  useEffect(() => {
    if (message) return;
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % PHOTOGRAPHY_STATUS_MESSAGES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [message]);

  const activeMessage = message || PHOTOGRAPHY_STATUS_MESSAGES[statusIndex];
  const activeSubmessage = submessage || 'Professional Photography & Client Galleries';

  return (
    <div
      className={`fixed inset-0 min-h-[100dvh] w-full bg-[#08080a] flex flex-col items-center justify-center p-4 sm:p-6 select-none overflow-hidden z-50 ${className}`}
      role="status"
      aria-label="Loading workspace"
    >
      {/* 1. Cinematic Background Atmosphere & Light Flares */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Warm Golden Glow Orb */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[480px] h-[300px] sm:h-[480px] rounded-full bg-gradient-to-tr from-amber-500/12 via-amber-400/8 to-transparent blur-[80px] sm:blur-[110px]"
          animate={{
            scale: [0.95, 1.12, 0.95],
            opacity: [0.6, 0.9, 0.6],
          }}
          transition={{
            duration: 4.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Subtle Sapphire Studio Rim Light */}
        <motion.div
          className="absolute top-1/3 left-1/2 -translate-x-1/3 -translate-y-1/2 w-[240px] sm:w-[380px] h-[240px] sm:h-[380px] rounded-full bg-indigo-500/6 blur-[90px]"
          animate={{
            scale: [1.1, 0.9, 1.1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 5.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Ambient Film Grain Texture */}
        <div className="absolute inset-0 film-grain opacity-15" />

        {/* Vignette Gradient */}
        <div className="absolute inset-0 bg-radial from-transparent via-[#08080a]/50 to-[#08080a]" />
      </div>

      {/* 2. Main Viewfinder Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[340px] xs:max-w-[370px] sm:max-w-[430px] md:max-w-[460px] rounded-2xl sm:rounded-3xl bg-neutral-900/50 backdrop-blur-2xl border border-white/[0.07] p-5 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col items-center"
      >
        {/* Viewfinder HUD Corner Brackets */}
        {showViewfinder && (
          <>
            <span className="absolute -top-[1px] -left-[1px] w-3 sm:w-4 h-3 sm:h-4 border-t-2 border-l-2 border-amber-400/80 rounded-tl transition-all duration-300" />
            <span className="absolute -top-[1px] -right-[1px] w-3 sm:w-4 h-3 sm:h-4 border-t-2 border-r-2 border-amber-400/80 rounded-tr transition-all duration-300" />
            <span className="absolute -bottom-[1px] -left-[1px] w-3 sm:w-4 h-3 sm:h-4 border-b-2 border-l-2 border-amber-400/80 rounded-bl transition-all duration-300" />
            <span className="absolute -bottom-[1px] -right-[1px] w-3 sm:w-4 h-3 sm:h-4 border-b-2 border-r-2 border-amber-400/80 rounded-br transition-all duration-300" />

            {/* Viewfinder Telemetry Header */}
            <div className="w-full flex items-center justify-between pb-3 sm:pb-4 mb-2 sm:mb-3 border-b border-white/[0.05] text-[9px] sm:text-[10px] font-mono tracking-widest text-neutral-400">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                </span>
                <span className="text-neutral-300 font-semibold tracking-wider">REC</span>
                <span className="text-neutral-600 hidden xs:inline">•</span>
                <span className="text-neutral-500 hidden xs:inline">ATELIER</span>
              </div>

              <div className="flex items-center gap-2 text-neutral-500">
                <span className="text-amber-400/80 font-semibold">[RAW]</span>
                <span>•</span>
                <span>AF-C</span>
              </div>
            </div>
          </>
        )}

        {/* 3. Concentric Cine Aperture Ring & Shutter Icon */}
        <div className="relative my-2 sm:my-3 flex items-center justify-center">
          {/* Outer Slow Rotating Dotted Ring */}
          <motion.div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-dashed border-white/15"
            animate={{ rotate: 360 }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear',
            }}
          />

          {/* Middle Glowing Amber Ring */}
          <motion.div
            className="absolute inset-0 m-auto w-12 h-12 sm:w-15 sm:h-15 rounded-full border border-amber-400/40 border-t-amber-400 border-r-transparent"
            animate={{ rotate: -360 }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
          />

          {/* Center Aperture / Lens Core */}
          <motion.div
            className="absolute inset-0 m-auto w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-400/20 via-amber-400/10 to-transparent border border-amber-400/30 flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.15)]"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Aperture className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 animate-pulse" />
          </motion.div>
        </div>

        {/* 4. Brand Hero Logo with Shimmer Reflection */}
        <div className="relative my-3 sm:my-4 flex items-center justify-center">
          {/* Radial Logo Glow */}
          <div className="absolute -inset-3 bg-gradient-to-r from-amber-500/0 via-amber-400/15 to-amber-500/0 rounded-full blur-lg pointer-events-none" />

          {/* High-res White Logo Container */}
          <div className="relative overflow-hidden px-3 sm:px-4 py-1.5 rounded-lg">
            <img
              src="/ex-share-white-logo.png"
              alt="EX SHARE"
              className="h-7 sm:h-9 md:h-10 w-auto max-w-[190px] xs:max-w-[230px] sm:max-w-[270px] object-contain drop-shadow-[0_2px_12px_rgba(255,255,255,0.15)]"
            />

            {/* Smooth Luxury Shimmer Sweep Across Logo */}
            <motion.div
              className="absolute inset-y-0 w-28 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-25 pointer-events-none"
              initial={{ left: '-120%' }}
              animate={{ left: '200%' }}
              transition={{
                repeat: Infinity,
                duration: 2.4,
                ease: [0.4, 0, 0.2, 1],
                repeatDelay: 0.6,
              }}
            />
          </div>

          {/* Golden Star Sparkle Motif (Matching the Star in "EX") */}
          <motion.div
            className="absolute -top-1.5 -right-1 text-amber-400 pointer-events-none"
            animate={{
              scale: [0.8, 1.25, 0.8],
              opacity: [0.5, 1, 0.5],
              rotate: [0, 90, 180, 270, 360],
            }}
            transition={{
              repeat: Infinity,
              duration: 3.5,
              ease: 'easeInOut',
            }}
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
          </motion.div>
        </div>

        {/* 5. Minimalist Animated Progress Bar */}
        <div className="w-40 xs:w-48 sm:w-56 md:w-60 h-1 sm:h-1.5 rounded-full bg-white/[0.08] relative overflow-hidden my-3 sm:my-4 shadow-inner">
          <motion.div
            className="absolute inset-y-0 w-2/3 rounded-full bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_14px_rgba(251,191,36,0.9)]"
            initial={{ left: '-70%' }}
            animate={{ left: '130%' }}
            transition={{
              repeat: Infinity,
              duration: 1.8,
              ease: [0.4, 0, 0.2, 1],
            }}
          />
        </div>

        {/* 6. Dynamic Telemetry Status Text */}
        <div className="h-6 flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={activeMessage}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="text-[10px] sm:text-[11px] font-mono font-medium tracking-[0.22em] text-neutral-300 uppercase text-center"
            >
              {activeMessage}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Submessage */}
        <p className="text-[10px] sm:text-xs text-neutral-500 font-sans tracking-wide text-center mt-1 sm:mt-1.5 line-clamp-1">
          {activeSubmessage}
        </p>

        {/* Viewfinder Telemetry Footer */}
        {showViewfinder && (
          <div className="w-full flex items-center justify-between gap-1 xs:gap-2 pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-white/[0.05] text-[9px] sm:text-[10px] font-mono tracking-wider text-neutral-500">
            <span className="flex items-center gap-1">
              <Camera className="w-3 h-3 text-neutral-400" />
              <span>ƒ/1.4</span>
            </span>
            <span className="text-neutral-400">1/250s</span>
            <span>ISO 100</span>
            <span className="text-amber-400/80 font-medium">99.8% READY</span>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SuspenseLoader;
