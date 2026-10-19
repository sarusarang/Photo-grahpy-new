import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  Zap,
  MessageCircle,
  Camera,
  Calendar,
  Lightbulb,
  Activity,
  Compass,
  Users,
  Layers,
  QrCode,
  Globe,
  ShieldCheck,
} from 'lucide-react';
import { Logo } from '../components/common/Logo';
import { useAuth } from '../context/AuthContext';
import { HeroSection } from '../components/home/HeroSection';
import { WhatsAppFloatingButton } from '../components/portfolio/WhatsAppFloatingButton';

/* -------------------------------------------------------------------------- */
/* SVG Graphic Motifs from Reference Design (Image 1)                         */
/* -------------------------------------------------------------------------- */

const ConcentricCapsuleSvg: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={`inline-block align-middle transition-transform duration-500 hover:scale-105 ${className}`}
    width="160"
    height="42"
    viewBox="0 0 160 42"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="1"
      y="1"
      width="158"
      height="40"
      rx="20"
      stroke="rgba(255,255,255,0.85)"
      strokeWidth="1.2"
    />
    <rect
      x="14"
      y="8"
      width="132"
      height="26"
      rx="13"
      stroke="rgba(255,255,255,0.85)"
      strokeWidth="1.2"
    />
    <rect
      x="28"
      y="15"
      width="104"
      height="12"
      rx="6"
      stroke="rgba(255,255,255,0.85)"
      strokeWidth="1.2"
    />
  </svg>
);

const DiagonalHatchSvg: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={`inline-block align-middle transition-transform duration-500 hover:scale-105 ${className}`}
    width="140"
    height="38"
    viewBox="0 0 140 38"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {[...Array(14)].map((_, i) => (
      <line
        key={i}
        x1={i * 9 + 4}
        y1="36"
        x2={i * 9 + 24}
        y2="2"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    ))}
  </svg>
);

/* -------------------------------------------------------------------------- */
/* Photography Studio & Gallery Data for EX SHARE Platform                    */
/* -------------------------------------------------------------------------- */

interface ProjectItem {
  id: string;
  menuLabel: string;
  tag: string;
  name: string;
  location: string;
  description: string;
  size: string;
  year: string;
  client: string;
  stats: string;
  image: string;
  gallerySlug?: string;
}

const SELECTED_PROJECTS: ProjectItem[] = [
  {
    id: 'client-galleries',
    menuLabel: 'Client Galleries',
    tag: 'EDITORIAL PROOFING',
    name: 'Bespoke Client Proofing',
    location: 'Magazine & Wedding Suites',
    description:
      'DELIVER HIGH-END CLIENT GALLERIES WITH EDITORIAL LAYOUTS, PIN-PROTECTION, CLIENT FAVORITING, AND INSTANT FULL-RESOLUTION ZIP PACKAGING CRAFTED TO ELEVATE YOUR STUDIO REPUTATION.',
    size: '10,000+ Assets',
    year: '2026',
    client: 'Editorial & Wedding Studios',
    stats: 'PIN PROTECTION • CLIENT FAVORITES • HI-RES ZIP',
    image: '/bento_card4_atelier.jpg',
    gallerySlug: 'sarang-wedding-editorial',
  },
  {
    id: 'ai-facial-discovery',
    menuLabel: 'AI Face Discovery',
    tag: 'NEURAL SEARCH ENGINE',
    name: 'AI Facial Recognition Search',
    location: 'Wedding & Gala Technology',
    description:
      'EVENT GUESTS INSTANTLY FIND EVERY SINGLE PHOTO OF THEMSELVES ACROSS THOUSANDS OF FRAMES JUST BY SCANNING A SELFIE. REVOLUTIONIZE WEDDING AND CORPORATE EVENT GUEST ENGAGEMENT.',
    size: 'Sub-Second AI Search',
    year: '2026',
    client: 'Luxury Galas & Receptions',
    stats: 'SELFIE SCAN • 0.3S LOOKUP • 99.8% PRECISION',
    image: '/bento_card5_liveevent.jpg',
    gallerySlug: 'sarang-wedding-editorial',
  },
  {
    id: 'live-event-tethering',
    menuLabel: 'Live Tethering',
    tag: 'HARDWARE TETHERING',
    name: 'Real-Time Camera-to-Cloud',
    location: 'Direct Camera Ingest',
    description:
      'STREAM RAW AND HIGH-BITRATE FRAMES DIRECT FROM SONY, CANON, AND NIKON CAMERAS TO CLIENT DEVICES IN REAL TIME. GENERATE PRINT-READY TABLE QR STANDS FOR INSTANT GUEST ACCESS.',
    size: 'Direct Ingest',
    year: '2026',
    client: 'Live Event Photographers',
    stats: 'AUTO QR STANDS • LIVE UPLOAD • ZERO LATENCY',
    image: '/bento_card1_camera.jpg',
    gallerySlug: 'sarang-wedding-editorial',
  },
  {
    id: 'ai-smart-culling',
    menuLabel: 'AI Smart Culling',
    tag: 'INTELLIGENT SELECTION',
    name: 'Automated Cull & Grouping',
    location: 'Studio Workflow Engine',
    description:
      'ACCELERATE POST-PRODUCTION BY 80%. OUR NEURAL CULLING ENGINE DETECTS BLINKING, ANALYZES SUBJECT SHARPNESS, CLUSTERS BURST SEQUENCES, AND SUGGESTS THE TOP KEEPER FRAMES.',
    size: 'AI Precision',
    year: '2026',
    client: 'Commercial & Studio Teams',
    stats: 'BLINK DETECT • BURST CLUSTERING • 1-CLICK KEEPER',
    image: '/active_editorial_crew.jpg',
    gallerySlug: 'sarang-wedding-editorial',
  },
  {
    id: 'custom-subdomains',
    menuLabel: 'Custom Portfolios',
    tag: 'WHITE-LABEL BRANDING',
    name: 'Bespoke Studio Subdomains',
    location: 'Worldwide Wildcard DNS',
    description:
      'PUBLISH YOUR PUBLIC PORTFOLIO UNDER YOUR OWN DOMAIN (E.G. YOURSTUDIO.EXSHARE.AI). CAPTURE HIGH-VALUE CLIENT INQUIRIES, SHOWCASE SIGNATURE WORK, AND MANAGE BOOKINGS WITH ELEGANCE.',
    size: 'Bespoke Domains',
    year: '2026',
    client: 'Independent Artists & Agencies',
    stats: 'CUSTOM SUBDOMAIN • INQUIRY PIPELINE • WHITE-LABEL',
    image: '/bento_card2_storytelling.jpg',
    gallerySlug: 'sarang-wedding-editorial',
  },
  {
    id: 'zero-loss-vault',
    menuLabel: 'Zero-Loss Vault',
    tag: 'ENTERPRISE CLOUD',
    name: 'Uncompressed Master RAW Vault',
    location: 'Global Edge Storage',
    description:
      'STORE UNCOMPRESSED RAW ASSETS WITH RESUMABLE CHUNKED INGESTION, DYNAMIC WATERMARK ENGINE, INTEGRATED DIGITAL ASSET MANAGEMENT, AND ROLE-BASED TEAM COLLABORATION.',
    size: 'Tiered Cloud Vault',
    year: '2026',
    client: 'Global Creative Studios',
    stats: 'DYNAMIC WATERMARKS • RESUMABLE UPLOAD • 100% RAW',
    image: '/bento_card3_perfection.jpg',
    gallerySlug: 'sarang-wedding-editorial',
  },
];

interface TestimonialItem {
  id: string;
  name: string;
  location: string;
  role: string;
  photo: string;
  headline: string;
  quote: string;
}

const TESTIMONIALS: TestimonialItem[] = [
  {
    id: '1',
    name: 'Elena Rostova',
    location: 'Milan, Italy',
    role: 'Editorial Wedding Atelier',
    photo:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    headline: 'Timeless curation with unmatched prestige.',
    quote:
      'From high-res RAW ingests to client proofing, the editorial presentation has elevated our studio prestige. Our high-net-worth couples are consistently stunned by the magazine-quality delivery.',
  },
  {
    id: '2',
    name: 'Marcus Vance',
    location: 'Sydney, Australia',
    role: 'Commercial & Fashion Director',
    photo:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    headline: 'Fast, flawless, and extraordinarily refined.',
    quote:
      'The speed of 50MB RAW files loading on mobile and the seamless proofing experience set a new industry benchmark. It reduced client revision cycles from weeks to single days.',
  },
  {
    id: '3',
    name: 'Jean Smicelle',
    location: 'Jakarta, Indonesia',
    role: 'Luxury Destination Event Producer',
    photo:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
    headline: 'Visionary aesthetics with practical execution.',
    quote:
      'Our multi-day destination weddings have thousands of guests and demanding timelines. EX SHARE delivers beyond expectations — instant live QR distribution and an iconic gallery layout that wows every client.',
  },
  {
    id: '4',
    name: 'Clara Delacroix',
    location: 'Paris, France',
    role: 'Editorial Haute Couture Editor',
    photo:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
    headline: 'Bespoke gallery storytelling that inspires.',
    quote:
      'The typography, generous negative space, and magazine pairings elevate digital photography into something that feels like a published print monograph on an iPad or cinema display.',
  },
  {
    id: '5',
    name: 'David Chen',
    location: 'Singapore',
    role: 'Architectural & Fine-Art Master',
    photo:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    headline: 'Flawless balance of technology & form.',
    quote:
      'The master cloud storage, seamless watermarking, and instant client favoriting allow my studio to operate globally with complete peace of mind and bulletproof security.',
  },
];

/* -------------------------------------------------------------------------- */
/* Main Landing Page Component                                                */
/* -------------------------------------------------------------------------- */

export const LandingPlaceholder: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeProjectIndex, setActiveProjectIndex] = useState(0);
  const [isProjectHovered, setIsProjectHovered] = useState(false);
  const [activeTestimonialIndex, setActiveTestimonialIndex] = useState(2); // Center card (Jean Smicelle)
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      setNewsletterStatus('error');
      return;
    }
    setNewsletterStatus('success');
    setNewsletterEmail('');
    setTimeout(() => {
      setNewsletterStatus('idle');
    }, 4500);
  };

  const activeProject = SELECTED_PROJECTS[activeProjectIndex];
  const activeTestimonial = TESTIMONIALS[activeTestimonialIndex];

  // Slow, silky cinematic auto-rotation (pauses when user hovers over section)
  useEffect(() => {
    if (isProjectHovered) return;
    const timer = setInterval(() => {
      setActiveProjectIndex((prev) => (prev + 1) % SELECTED_PROJECTS.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [isProjectHovered]);

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const benefits = [
    {
      icon: Zap,
      title: 'High-Speed Chunked Ingestion',
      description:
        'Upload multi-gigabyte collections of Sony, Canon, Nikon, and Fuji RAW frames with zero dropouts and automated background processing.',
    },
    {
      icon: Sparkles,
      title: 'AI Facial Recognition & Search',
      description:
        'Guests scan a selfie and immediately find every frame they appear in across 10,000+ photo event archives in less than 300ms.',
    },
    {
      icon: Layers,
      title: 'Luxury Editorial Client Proofing',
      description:
        'Present your work in bespoke editorial layouts with PIN protection, client favoriting, frame notes, and one-click ZIP packaging.',
    },
    {
      icon: QrCode,
      title: 'Live Tethering & QR Stand Generator',
      description:
        'Ingest live camera feeds during receptions with auto-generated, print-ready branded QR stand cards for guest banquet tables.',
    },
    {
      icon: Globe,
      title: 'Custom Subdomains & Inquiry CRM',
      description:
        'Showcase your portfolio on your bespoke domain (e.g., studio.exshare.ai) with integrated lead capture and client booking management.',
    },
    {
      icon: ShieldCheck,
      title: 'Zero-Loss Storage & Watermarks',
      description:
        'Protect your creative intellectual property with customized logo watermarks, tile overlays, and enterprise cloud storage vaults.',
    },
  ];

  return (
    <div className="w-full bg-[#e8ecef] text-neutral-900 font-sans antialiased overflow-x-hidden selection:bg-neutral-900 selection:text-white">
      {/* ==================================================================== */}
      {/* 1. HERO SECTION (Identical UI Layout from Reference Image)           */}
      {/* ==================================================================== */}
      <HeroSection
        headlineLine1="FRAME EVERY MOMENT"
        headlineLine2="EVERY MASTERPIECE!"
        primaryCtaText="EXPLORE VAULT"
        primaryCtaLink="/signup"
        secondaryCtaText="EXPLORE ALL"
        secondaryCtaLink="#selected-projects"
        photographerImage="/hero-photographer.png"
        videoPreviewImage="/hero-video-still.jpg"
        descriptionText="Ultra-fast RAW proofing without compromising original dynamic range. Our AI face tethering and cloud vault are built for high-stakes editorial and luxury wedding studios."
      />

      {/* ==================================================================== */}
      {/* ==================================================================== */}
      {/* 2. OVERLAPPING BENTO GRID CONTAINER (Image 1)                        */}
      {/* Wide Container, Reduced Gaps, Framer Motion Stagger                  */}
      {/* ==================================================================== */}
      <section className="relative z-20 max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-14 mt-4 sm:mt-8 lg:mt-12 pb-10 sm:pb-16 overflow-x-clip">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-4 sm:gap-6">
          {/* Card 1: Large Card with Studio Camera Gear (Top Left) - Enters from LEFT */}
          <motion.div
            initial={{ opacity: 0, x: -70, scale: 0.96 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 1.1, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -4, transition: { duration: 0.35, ease: 'easeOut' } }}
            className="col-span-1 sm:col-span-2 md:col-span-6 rounded-[28px] sm:rounded-[32px] p-6 sm:p-9 md:p-12 border border-white/10 shadow-[0_20px_45px_rgba(0,0,0,0.12)] flex flex-col justify-between active:scale-[0.99] relative overflow-hidden group min-h-[380px] sm:min-h-[420px] md:min-h-[460px] bg-neutral-950 will-change-transform"
          >
            {/* Photography Studio Camera Gear Background */}
            <img
              src="/bento_card1_camera.jpg"
              alt="EX SHARE Professional Photography Studio Gear"
              className="absolute inset-0 w-full h-full object-cover object-[75%_center] group-hover:scale-105 transition-transform duration-700 pointer-events-none"
            />
            {/* Directional Gradient Scrim: ensures sharp text legibility while camera on right remains 100% visible */}
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/95 via-neutral-950/50 to-neutral-950/30 sm:bg-gradient-to-r sm:from-neutral-950/95 sm:via-neutral-950/55 sm:to-transparent pointer-events-none" />

            <div className="relative z-10">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase text-amber-400 block mb-2 sm:mb-3">
                ABOUT EX SHARE
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-white mt-2 sm:mt-4 leading-[1.12]">
                Moments
                <br />
                that speak
              </h2>
            </div>
            <p className="relative z-10 text-xs sm:text-sm text-neutral-200 mt-6 sm:mt-10 md:mt-12 leading-relaxed max-w-sm font-normal">
              Our platform is rooted in the photographer&apos;s craft, delivering high-resolution client galleries, AI face discovery, and seamless proofing that evoke emotion and leave lasting impressions.
            </p>
          </motion.div>

          {/* Card 2: Vertical Card - Contemporary Storytelling (Top Center-Right) - Enters from UP (TOP) */}
          <motion.div
            initial={{ opacity: 0, y: -70, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 1.1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -4, transition: { duration: 0.35, ease: 'easeOut' } }}
            className="col-span-1 sm:col-span-1 md:col-span-3 rounded-[28px] sm:rounded-[32px] p-6 sm:p-7 md:p-8 shadow-[0_16px_36px_rgba(0,0,0,0.12)] border border-white/10 flex flex-col justify-between min-h-[360px] sm:min-h-[400px] md:min-h-[460px] active:scale-[0.99] group relative overflow-hidden bg-neutral-950 will-change-transform"
          >
            {/* Rooftop Editorial Photographer Background */}
            <img
              src="/bento_card2_storytelling.jpg"
              alt="Contemporary Storytelling Photography"
              className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 pointer-events-none"
            />
            {/* Cinematic Gradient Scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/40 to-neutral-950/60 pointer-events-none" />

            <div className="relative z-10">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase text-amber-300 block mb-3">
                CURATION
              </span>
              <h3 className="text-2xl sm:text-2xl md:text-3xl font-light tracking-tight text-white leading-snug">
                Contemporary
                <br />
                Storytelling
              </h3>
            </div>
            <div className="relative z-10 mt-auto pt-6 border-t border-white/15">
              <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed font-normal">
                Creating modern client galleries that feel warm, cinematic, and deeply personal.
              </p>
            </div>
          </motion.div>

          {/* Card 3: Vertical Card - Artistic Frame Balance (Top Right) - Enters from RIGHT */}
          <motion.div
            initial={{ opacity: 0, x: 70, scale: 0.96 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 1.1, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -4, transition: { duration: 0.35, ease: 'easeOut' } }}
            className="col-span-1 sm:col-span-1 md:col-span-3 rounded-[28px] sm:rounded-[32px] p-6 sm:p-7 md:p-8 shadow-[0_16px_36px_rgba(0,0,0,0.12)] border border-white/10 flex flex-col justify-between min-h-[360px] sm:min-h-[400px] md:min-h-[460px] active:scale-[0.99] group relative overflow-hidden bg-neutral-950 will-change-transform"
          >
            {/* Leica Noctilux Precision Optical Element Background */}
            <img
              src="/bento_card3_perfection.jpg"
              alt="Artistic Frame Balance & Optical Precision"
              className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 pointer-events-none"
            />
            {/* Cinematic Gradient Scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/40 to-neutral-950/60 pointer-events-none" />

            <div className="relative z-10">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase text-amber-300 block mb-3">
                PERFECTION
              </span>
              <h3 className="text-2xl sm:text-2xl md:text-3xl font-light tracking-tight text-white leading-snug">
                Artistic Frame
                <br />
                Balance
              </h3>
            </div>
            <div className="relative z-10 mt-auto pt-6 border-t border-white/15">
              <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed font-normal">
                Combining master zero-loss RAW preservation with high-speed delivery to perfect every space.
              </p>
            </div>
          </motion.div>

          {/* Card 4: Wide Card with European Palace Atelier Image (Bottom Left) - Enters from DOWN / BOTTOM */}
          <motion.div
            initial={{ opacity: 0, y: 70, x: -30, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 1.15, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -4, transition: { duration: 0.35, ease: 'easeOut' } }}
            className="col-span-1 sm:col-span-2 md:col-span-8 rounded-[28px] sm:rounded-[32px] overflow-hidden shadow-[0_16px_36px_rgba(0,0,0,0.12)] border border-white/10 relative min-h-[340px] sm:min-h-[380px] md:min-h-[400px] flex flex-col justify-between p-6 sm:p-9 md:p-11 active:scale-[0.99] group bg-neutral-950 will-change-transform"
          >
            {/* European Palace Wedding Editorial Background */}
            <img
              src="/bento_card4_atelier.jpg"
              alt="Customized Atelier Luxury Wedding Editorial"
              className="absolute inset-0 w-full h-full object-cover object-[70%_center] group-hover:scale-105 transition-transform duration-700 pointer-events-none"
            />
            {/* Directional Gradient Scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/95 via-neutral-950/50 to-neutral-950/30 sm:bg-gradient-to-r sm:from-neutral-950/95 sm:via-neutral-950/60 sm:to-transparent pointer-events-none" />

            <div className="relative z-10 sm:max-w-xs md:max-w-sm">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase text-amber-300 block mb-3">
                BESPOKE GALLERIES
              </span>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-light tracking-tight text-white leading-tight">
                Customized
                <br />
                Ateliers
              </h3>
            </div>
            <p className="relative z-10 text-xs sm:text-sm text-neutral-200 mt-6 sm:mt-auto leading-relaxed max-w-sm font-normal">
              Creating unique client suites and custom domains that reflect your studio&apos;s signature style.
            </p>
          </motion.div>

          {/* Card 5: Dark Event Celebration Photo Card (Bottom Right) - Enters from RIGHT & DOWN */}
          <motion.div
            initial={{ opacity: 0, y: 70, x: 40, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 1.15, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -4, transition: { duration: 0.35, ease: 'easeOut' } }}
            className="col-span-1 sm:col-span-2 md:col-span-4 rounded-[28px] sm:rounded-[32px] overflow-hidden relative shadow-[0_16px_36px_rgba(0,0,0,0.12)] border border-white/10 min-h-[340px] sm:min-h-[380px] md:min-h-[400px] flex flex-col justify-between p-6 sm:p-9 md:p-11 group active:scale-[0.99] bg-neutral-950 will-change-transform"
          >
            {/* High-Contrast Luxury Evening Celebration Background */}
            <img
              src="/bento_card5_liveevent.jpg"
              alt="Real-Time Event Ingestion and Live Guest Sharing"
              className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 pointer-events-none"
            />
            {/* Contrast Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/45 to-neutral-950/60 pointer-events-none" />

            <div className="relative z-10">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase text-amber-300 block mb-3">
                LIVE DELIVERY
              </span>
              <h3 className="text-2xl sm:text-3xl font-light tracking-tight text-white leading-tight">
                Real-Time
                <br />
                Guest Sharing
              </h3>
            </div>
            <div className="relative z-10 mt-auto pt-6 border-t border-white/15">
              <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed font-normal">
                Transforming live event captures into instant guest experiences before the celebration ends.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* ==================================================================== */}
      {/* 3. FULL-SCREEN EDITORIAL CINEMATIC SHOWCASE (Edge-to-Edge)           */}
      {/* 100vh Full Screen, No Rounded Corners, Slow Cinematic Animation      */}
      {/* ==================================================================== */}
      <section
        id="selected-projects"
        onMouseEnter={() => setIsProjectHovered(true)}
        onMouseLeave={() => setIsProjectHovered(false)}
        className="w-full min-h-[100dvh] lg:h-screen lg:max-h-[100dvh] relative overflow-hidden bg-neutral-950 flex flex-col justify-between px-6 sm:px-10 lg:px-16 xl:px-24 py-8 sm:py-10 lg:py-12 select-none"
      >
        {/* Full-Bleed Edge-to-Edge Background Image with Smooth Crossfade & Cinematic Drift */}
        <div className="absolute inset-0 overflow-hidden bg-neutral-950 pointer-events-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeProject.id}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 w-full h-full"
            >
              <motion.img
                src={activeProject.image}
                alt={activeProject.name}
                animate={{ scale: [1, 1.03] }}
                transition={{
                  duration: 16,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  ease: 'easeInOut',
                }}
                className="w-full h-full object-cover object-center"
              />
            </motion.div>
          </AnimatePresence>

          {/* Clean, Bright Photo Presentation - Minimal Soft Gradient (Cleared Photo) */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/15 pointer-events-none" />
        </div>

        {/* Top-Left: Bullet Tag & Large Headline */}
        <div className="relative z-10 max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={`tag-${activeProject.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-2 text-white text-[11px] sm:text-xs font-semibold tracking-[0.25em] uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-pulse" />
              <span>• {activeProject.tag}</span>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.h2
              key={`title-${activeProject.id}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-white mt-1.5 leading-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)]"
            >
              {activeProject.name}
            </motion.h2>
          </AnimatePresence>
        </div>

        {/* Bottom Grid: Left Narrative + Right Monogram & Categories */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-end mt-auto pt-6">
          {/* Left Column: All-Caps Wide-Tracked Narrative + Quick CTA */}
          <div className="lg:col-span-7 flex flex-col justify-end">
            <AnimatePresence mode="wait">
              <motion.p
                key={`desc-${activeProject.id}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.65, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="text-xs sm:text-[13px] font-normal tracking-[0.12em] uppercase text-white max-w-lg lg:max-w-xl leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]"
              >
                {activeProject.description}
              </motion.p>
            </AnimatePresence>

            {/* Action Link & Pill Stats */}
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <Link
                to={activeProject.gallerySlug ? `/gallery/${activeProject.gallerySlug}` : '/dashboard/gallery'}
                target="_blank"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 hover:bg-white text-white hover:text-neutral-950 backdrop-blur-md border border-white/35 text-[11px] font-semibold tracking-wider uppercase transition-all duration-300 group/btn shadow-lg"
              >
                <span>EXPLORE VAULT</span>
                <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
              <div className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/15 text-white/90 text-[10px] font-mono tracking-wider uppercase shadow-md">
                {activeProject.stats}
              </div>
            </div>
          </div>

          {/* Right Column: Monogram & Stacked Category Menu */}
          <div className="lg:col-span-5 flex flex-col items-start lg:items-end justify-end">
            {/* Official EX SHARE Brand Logo */}
            <div className="mb-2.5 sm:mb-3 flex items-center justify-start lg:justify-end">
              <Logo
                variant="dark"
                className="h-5 sm:h-6 lg:h-6.5 w-auto object-contain drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]"
                alt="EX SHARE"
              />
            </div>

            {/* Stacked Categories List (Image 1 exact alignment and arrow) */}
            <div className="flex flex-col gap-1 sm:gap-1.5 w-full lg:w-auto">
              {SELECTED_PROJECTS.map((project, index) => {
                const isActive = index === activeProjectIndex;
                return (
                  <button
                    key={project.id}
                    onClick={() => {
                      setIsProjectHovered(true);
                      setActiveProjectIndex(index);
                    }}
                    onMouseEnter={() => {
                      setIsProjectHovered(true);
                      setActiveProjectIndex(index);
                    }}
                    className={`group text-left lg:text-right transition-all duration-300 flex items-center justify-start lg:justify-end gap-2.5 cursor-pointer py-0.5 ${
                      isActive
                        ? 'text-white'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <span
                      className={`text-xl sm:text-2xl lg:text-[24px] xl:text-[28px] tracking-tight transition-all duration-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] ${
                        isActive
                          ? 'font-medium text-white'
                          : 'font-normal'
                      }`}
                    >
                      {project.menuLabel}
                    </span>

                    {/* Smooth Arrow for Active Category */}
                    {isActive && (
                      <motion.span
                        layoutId="activeCollectionArrow"
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="inline-block text-white text-xl sm:text-2xl lg:text-[26px] leading-none font-light drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]"
                      >
                        →
                      </motion.span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 4. TESTIMONIALS & PHOTOGRAPHY JOURNEY (Adapted to EX SHARE Site)    */}
      {/* Exact replica of the reference design with photography craft assets  */}
      {/* ==================================================================== */}
      <section
        id="testimonials"
        className="w-full pt-10 sm:pt-16 lg:pt-20 pb-3 sm:pb-5 lg:pb-6 max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 select-none"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 xl:gap-12 items-stretch">
          {/* LEFT COLUMN: HERO TESTIMONIAL CARD */}
          <motion.div
            initial={{ opacity: 0, x: -60, scale: 0.97 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 relative rounded-[32px] sm:rounded-[44px] overflow-hidden shadow-[0_16px_50px_rgba(0,0,0,0.08)] group min-h-[440px] sm:min-h-[540px] lg:min-h-[660px] flex flex-col justify-between p-6 sm:p-9 lg:p-11 will-change-transform bg-neutral-900 select-none"
          >
            {/* Background Image: Smiling Photographer Alex Thompson with Camera */}
            <img
              src="/photographer_alex_studio.jpg"
              alt="Alex Thompson - Studio Photographer"
              className="absolute inset-0 w-full h-full object-cover object-[center_18%] group-hover:scale-105 transition-transform duration-1000 ease-out pointer-events-none"
            />

            {/* Gradient Scrim for Contrast & Legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10 pointer-events-none" />

            {/* Top Badge: "What they said" with Speech Bubble */}
            <div className="relative z-10 self-start">
              <motion.div
                initial={{ opacity: 0, y: -15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/35 text-white text-xs sm:text-[13px] font-medium tracking-wide transition-all shadow-sm"
              >
                <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2] opacity-90" />
                <span>What they said</span>
              </motion.div>
            </div>

            {/* Bottom Content: Bold Quote, Divider & Author Tag */}
            <div className="relative z-10 mt-auto pt-10">
              <motion.blockquote
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.25, ease: 'easeOut' }}
                className="text-2xl sm:text-3xl lg:text-[34px] xl:text-[38px] font-bold text-white tracking-tight leading-[1.18]"
              >
                “Never thought client proofing and gallery delivery could be this fast. Now, our studio shares every shoot in seconds!”
              </motion.blockquote>

              <div className="w-full h-[1px] bg-white/25 my-4 sm:my-5" />

              <div className="flex justify-end">
                <span className="text-white/90 text-xs sm:text-sm font-medium tracking-wide font-sans">
                  Alex Thompson, Studio Director
                </span>
              </div>
            </div>
          </motion.div>

          {/* RIGHT COLUMN: HEADLINE, COMMUNITY & FEATURE CARD */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-8 sm:gap-10">
            {/* Top Area: Badge, Giant Title, Community Avatar Row */}
            <div className="flex flex-col pt-1 sm:pt-3">
              {/* Badge: TESTIMONIALS */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="self-start mb-4 sm:mb-6"
              >
                <span className="inline-block px-3.5 py-1.5 rounded-full border border-neutral-300/90 bg-white/90 text-[10px] sm:text-[11px] font-bold tracking-[0.16em] text-neutral-800 uppercase shadow-2xs">
                  TESTIMONIALS
                </span>
              </motion.div>

              {/* Main Headline */}
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.85, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="text-3xl sm:text-4xl lg:text-[52px] xl:text-[60px] font-extrabold tracking-tight text-neutral-900 leading-[1.1] mb-5 sm:mb-8 font-sans"
              >
                Elevate Your Studio Delivery —
                <br />
                Into Pure Artistry.
              </motion.h2>

              {/* Community Avatars & Guidance Description */}
              <motion.div
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.85, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6"
              >
                {/* 3 Overlapping Avatars */}
                <div className="flex -space-x-3 shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80"
                    alt="Photographer Community Member"
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full ring-2 ring-white object-cover shadow-sm hover:scale-110 transition-transform cursor-pointer"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80"
                    alt="Photographer Community Member"
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full ring-2 ring-white object-cover shadow-sm hover:scale-110 transition-transform cursor-pointer"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80"
                    alt="Photographer Community Member"
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full ring-2 ring-white object-cover shadow-sm hover:scale-110 transition-transform cursor-pointer"
                  />
                </div>

                <p className="text-xs sm:text-[13px] text-neutral-600 leading-relaxed font-normal max-w-md">
                  From high-resolution proofing to real-time event tethering and AI face search, EX SHARE equips your studio to impress discerning clients and deliver magazine-quality galleries in seconds.
                </p>
              </motion.div>
            </div>

            {/* Bottom Card: Split Feature & Take Your First Shot CTA */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white rounded-[32px] sm:rounded-[38px] p-6 sm:p-8 lg:p-9 border border-neutral-200/80 shadow-[0_12px_40px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6 overflow-hidden hover:shadow-[0_16px_50px_rgba(0,0,0,0.07)] transition-shadow duration-500"
            >
              {/* Left Sub-Section: Teal Camera Icon & Philosophy Headline */}
              <div className="flex flex-col justify-between sm:pr-4">
                {/* Circular Teal Camera Icon Badge */}
                <div className="w-12 h-12 rounded-full bg-[#0d8487] text-white flex items-center justify-center shadow-md mb-6 sm:mb-8 group-hover:scale-105 transition-transform">
                  <Camera className="w-6 h-6 stroke-[2.2]" />
                </div>

                {/* Typography: "We Believe Client Delivery is More than Storage." */}
                <div>
                  <span className="text-lg sm:text-xl font-bold text-neutral-500 block mb-1">
                    We Believe
                  </span>
                  <h3 className="text-2xl sm:text-[28px] lg:text-[32px] font-extrabold text-neutral-900 tracking-tight leading-[1.12]">
                    Client Delivery is More
                    <br />
                    than Storage.
                  </h3>
                </div>
              </div>

              {/* Right Sub-Section: /04 Index and Interactive Camera Lens Card */}
              <div className="flex flex-col items-end shrink-0 sm:w-52 md:w-56 lg:w-60">
                <span className="text-xs sm:text-sm font-semibold font-mono text-neutral-400 mb-2 self-start sm:self-end">
                  /04
                </span>

                <div className="relative rounded-3xl overflow-hidden w-full aspect-[4/5] shadow-sm group/handlebar select-none">
                  <img
                    src="/camera_hands_lens.jpg"
                    alt="Experience Live Proofing"
                    className="w-full h-full object-cover object-center group-hover/handlebar:scale-108 transition-transform duration-700 ease-out pointer-events-none"
                  />

                  {/* Gradient Scrim for Button */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                  {/* Glassmorphic Pill Button */}
                  <Link
                    to="/gallery/sarang-wedding-editorial"
                    target="_blank"
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[85%] py-2 sm:py-2.5 px-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/35 text-white text-xs sm:text-[13px] font-medium tracking-wide text-center transition-all shadow-sm active:scale-95 cursor-pointer block"
                  >
                    Experience Live Proofing
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* 5. BENEFITS SECTION: WHAT YOU'LL GAIN WITH US (Reference Image 2)  */}
      {/* Exact UI & design: (2) BENEFITS, dual-column layout, cross dividers */}
      {/* ================================================================== */}
      <section id="community-benefits" className="w-full pt-3 sm:pt-5 lg:pt-6 pb-10 sm:pb-16 lg:pb-20 max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-14">
        <div id="upcoming-concept" className="rounded-[28px] sm:rounded-[36px] lg:rounded-[42px] bg-white p-5 sm:p-9 lg:p-14 border border-neutral-200/80 shadow-[0_16px_50px_rgba(0,0,0,0.035)]">
          {/* Centered Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 lg:mb-14">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-neutral-800 block mb-2"
            >
              (2) PLATFORM CAPABILITIES
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="text-2xl sm:text-4xl lg:text-[44px] font-extrabold tracking-tight text-neutral-950 leading-tight"
            >
              Engineered for High-End Studios
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="text-xs sm:text-sm lg:text-base text-neutral-600 font-normal mt-3 max-w-2xl mx-auto leading-relaxed"
            >
              EX SHARE provides an end-to-end cloud ecosystem built specifically for professional wedding, editorial, and commercial studios. From high-speed bulk ingestion to guest face-matching and white-label delivery, every tool is designed to elevate your client experience.
            </motion.p>
          </div>

          {/* Main Content Grid: Left Portrait Image + Right 2x3 Cross-Divider Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            {/* Left Column: Authentic Photographer Duo Shoot Portrait */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm bg-neutral-100 group min-h-[320px] sm:min-h-[440px] lg:min-h-full aspect-[3/4] lg:aspect-auto select-none"
            >
              <img
                src="/photographers_duo_shoot.jpg"
                alt="EX SHARE Photography Community Members Outdoors"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out pointer-events-none"
              />
              {/* Subtle natural vignetting & inner border */}
              <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-2xl sm:rounded-3xl pointer-events-none" />
            </motion.div>

            {/* Right Column: 2x3 Structured Grid with Subtle Cross Dividers */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <div className="grid grid-cols-1 sm:grid-cols-2">
                {benefits.map((item, idx) => {
                  const isLeftCol = idx % 2 === 0;
                  const isTopTwoRows = idx < 4;
                  const isNotLast = idx < benefits.length - 1;

                  return (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 22 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.15 }}
                      transition={{ duration: 0.65, delay: 0.07 * idx, ease: [0.16, 1, 0.3, 1] }}
                      className={`p-4 sm:p-6 lg:p-7 flex flex-col justify-start group hover:bg-neutral-50/80 transition-colors duration-300 rounded-xl sm:rounded-none ${
                        isNotLast ? 'border-b border-neutral-200/80 sm:border-b-0' : ''
                      } ${
                        isTopTwoRows ? 'sm:border-b sm:border-neutral-200/80' : ''
                      } ${
                        isLeftCol ? 'sm:border-r sm:border-neutral-200/80' : ''
                      }`}
                    >
                      {/* Dark Squircle Icon Badge */}
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-sm mb-3.5 group-hover:scale-110 group-hover:bg-neutral-950 transition-all duration-300">
                        <item.icon className="w-5 h-5 stroke-[2]" />
                      </div>

                      {/* Benefit Title */}
                      <h3 className="text-base sm:text-lg font-bold text-neutral-900 mb-1.5 tracking-tight group-hover:text-black transition-colors">
                        {item.title}
                      </h3>

                      {/* Benefit Description */}
                      <p className="text-xs sm:text-[13px] text-neutral-500 leading-relaxed font-normal">
                        {item.description}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 7. PANORAMIC HERO CTA & DEEP DARK STUDIO FOOTER (Reference Image 1)  */}
      {/* Seamless blend from scenic shoot photo into ultra-rich dark footer   */}
      {/* ==================================================================== */}
      <div className="relative w-full overflow-hidden bg-[#090a0f] text-white">
        {/* Soft top gradient transition from the page above */}
        <div className="w-full h-12 sm:h-16 bg-gradient-to-b from-[#e8ecef] via-[#e8ecef]/40 to-transparent absolute top-0 inset-x-0 z-20 pointer-events-none" />

        {/* --- Top Panoramic CTA Section: Scenic Majestic Height --- */}
        <section className="relative w-full min-h-[440px] sm:min-h-[540px] lg:min-h-[640px] flex items-center justify-center overflow-hidden">
          {/* Panoramic Shoot Image */}
          <motion.div
            initial={{ scale: 1.05, opacity: 0.9 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 w-full h-full"
          >
            <img
              src="/photographers_group_shoot.jpg"
              alt="EX SHARE Photography Creative Community Shoot"
              className="w-full h-full object-cover object-[center_42%] sm:object-[center_45%] select-none"
            />
          </motion.div>

          {/* Scrim Gradients: top overlay + radial depth + seamless downward gradient into footer */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/35 to-[#090a0f] pointer-events-none" />
          <div className="absolute inset-0 bg-radial-at-c from-transparent via-black/25 to-black/60 pointer-events-none" />

          {/* Centered CTA Content */}
          <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-10 text-center flex flex-col items-center justify-center pt-20 pb-16 sm:py-24">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
              className="text-3xl sm:text-5xl lg:text-[74px] font-bold tracking-tight text-white leading-[1.1] drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)]"
            >
              Deliver Flawlessly with EX SHARE
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.85, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
              className="text-sm sm:text-base lg:text-lg text-white/95 font-normal mt-4 max-w-2xl leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]"
            >
              Join thousands of luxury wedding, editorial, and commercial photography studios delivering high-resolution client galleries, AI facial discovery, and instant zero-loss proofing.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.85, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 sm:mt-9"
            >
              <Link
                to={isAuthenticated ? '/dashboard/overview' : '/register'}
                className="inline-flex items-center gap-2.5 px-7 sm:px-8 py-3.5 sm:py-4 rounded-full bg-white text-neutral-950 font-semibold text-xs sm:text-sm shadow-[0_12px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_16px_40px_rgba(255,255,255,0.25)] hover:bg-neutral-100 transition-all duration-300 hover:scale-105 active:scale-95 group"
              >
                <span>Start Free Studio Trial</span>
                <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* --- Deep Dark Footer Section: Cohesive Balanced Layout & Tight Bottom Gap --- */}
        <footer className="relative w-full max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 pt-4 sm:pt-6 pb-5 sm:pb-6 text-white">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-8 lg:gap-12">
            {/* Left Column: Brand Logo, Headline, Newsletter & Studio Mission */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="w-full lg:max-w-md flex flex-col"
            >
              {/* Brand Logo */}
              <Link to="/" className="inline-flex items-center gap-2 w-fit mb-4 group">
                <Logo variant="dark" className="h-6 sm:h-7 w-auto object-contain transition-transform duration-300 group-hover:scale-105" />
              </Link>

              {/* Refined Community Heading */}
              <h3 className="text-base sm:text-lg lg:text-[19px] font-bold tracking-tight text-white leading-snug mb-3">
                Stay Connected with
                <br />
                EX SHARE Atelier
              </h3>

              {/* Newsletter Form */}
              <form onSubmit={handleNewsletterSubmit} className="max-w-sm w-full mb-3.5">
                <div className="flex items-center border-b border-white/20 hover:border-white/40 focus-within:border-white pb-2 transition-colors gap-3">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Studio Email Address"
                    className="w-full bg-transparent text-white placeholder:text-neutral-500 text-xs sm:text-sm focus:outline-none pr-2"
                    required
                  />
                  <button
                    type="submit"
                    className="whitespace-nowrap px-5 py-2 rounded-full bg-white text-neutral-950 font-semibold text-xs hover:bg-neutral-200 transition-all duration-200 hover:scale-105 active:scale-95 shadow-md flex-shrink-0 cursor-pointer"
                  >
                    {newsletterStatus === 'success' ? (
                      <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                        <Check className="w-3.5 h-3.5" /> Subscribed
                      </span>
                    ) : (
                      'Stay Connected'
                    )}
                  </button>
                </div>
                {newsletterStatus === 'success' && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-emerald-400 mt-2 font-medium flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" /> Welcome! You are now connected to EX SHARE.
                  </motion.p>
                )}
                {newsletterStatus === 'error' && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-rose-400 mt-2 font-medium"
                  >
                    Please enter a valid email address.
                  </motion.p>
                )}
              </form>

              {/* Studio Platform Mission Paragraph */}
              <p className="text-xs text-neutral-400 leading-relaxed max-w-sm font-light">
                Receive platform updates, new luxury gallery templates, and AI workflow releases. Engineered for professional wedding studios, commercial creators, and independent visual artists worldwide.
              </p>
            </motion.div>

            {/* Right Column: 3 Structured Link Columns with Policies under Policy Title */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.8, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap sm:flex-nowrap gap-8 sm:gap-10 lg:gap-14 pt-1 lg:pt-2"
            >
              {/* Directory Column 1: Platform Features */}
              <div className="flex flex-col gap-2.5 text-xs sm:text-sm">
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-white/90 mb-0.5">
                  Platform
                </h5>
                <a href="#selected-projects" className="text-neutral-300 hover:text-white transition-colors duration-200">
                  Client Galleries
                </a>
                <a href="#selected-projects" className="text-neutral-300 hover:text-white transition-colors duration-200">
                  AI Face Discovery
                </a>
                <a href="#selected-projects" className="text-neutral-300 hover:text-white transition-colors duration-200">
                  Live Event Tethering
                </a>
                <a href="#selected-projects" className="text-neutral-300 hover:text-white transition-colors duration-200">
                  Smart AI Culling
                </a>
                <a href="#selected-projects" className="text-neutral-300 hover:text-white transition-colors duration-200">
                  Custom Subdomains
                </a>
              </div>

              {/* Directory Column 2: Studio Resources */}
              <div className="flex flex-col gap-2.5 text-xs sm:text-sm">
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-white/90 mb-0.5">
                  Studio Suite
                </h5>
                <Link to="/gallery/sarang-wedding-editorial" target="_blank" className="text-neutral-300 hover:text-white transition-colors duration-200">
                  Live Gallery Demo
                </Link>
                <Link to="/dashboard/overview" className="text-neutral-300 hover:text-white transition-colors duration-200">
                  Studio Dashboard
                </Link>
                <Link to="/register" className="text-neutral-300 hover:text-white transition-colors duration-200">
                  Storage & Pricing
                </Link>
                <a href="#community-benefits" className="text-neutral-300 hover:text-white transition-colors duration-200">
                  QR Stand Cards
                </a>
                <a href="#community-benefits" className="text-neutral-300 hover:text-white transition-colors duration-200">
                  Zero-Loss Storage
                </a>
              </div>

              {/* Directory Column 3: Policies (Under dedicated Policy Title) */}
              <div className="flex flex-col gap-2.5 text-xs sm:text-sm">
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-white/90 mb-0.5">
                  Policies
                </h5>
                <Link to="/privacy" className="text-neutral-300 hover:text-white transition-colors duration-200">
                  Privacy Policy
                </Link>
                <Link to="/terms" className="text-neutral-300 hover:text-white transition-colors duration-200">
                  Terms of Use
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Social Icons Strip (Aligned to Right, Tight Vertical Gap, Prominent Icons) */}
          <div className="flex items-center justify-end mt-5 sm:mt-6 mb-3">
            <div className="flex items-center gap-3 sm:gap-3.5 text-neutral-300">
              {/* Facebook */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-white/[0.06] border border-white/10 hover:border-white/35 hover:bg-white/20 text-neutral-300 hover:text-white transition-all duration-200 hover:scale-110 shadow-xs"
              >
                <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-white/[0.06] border border-white/10 hover:border-white/35 hover:bg-white/20 text-neutral-300 hover:text-white transition-all duration-200 hover:scale-110 shadow-xs"
              >
                <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>

              {/* X (formerly Twitter) */}
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                aria-label="X (Twitter)"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-white/[0.06] border border-white/10 hover:border-white/35 hover:bg-white/20 text-neutral-300 hover:text-white transition-all duration-200 hover:scale-110 shadow-xs"
              >
                <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>

              {/* LinkedIn */}
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-white/[0.06] border border-white/10 hover:border-white/35 hover:bg-white/20 text-neutral-300 hover:text-white transition-all duration-200 hover:scale-110 shadow-xs"
              >
                <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-white/[0.06] border border-white/10 hover:border-white/35 hover:bg-white/20 text-neutral-300 hover:text-white transition-all duration-200 hover:scale-110 shadow-xs"
              >
                <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Bottom Copyright Pill Bar */}
          <div className="w-full rounded-xl sm:rounded-2xl bg-white/[0.04] border border-white/[0.07] py-2.5 px-4 text-center text-[11px] sm:text-xs text-neutral-400 font-normal tracking-wide hover:border-white/15 transition-colors">
            <span>© 2026 EX SHARE. All Rights Reserved. Built for Creative Photographers.</span>
          </div>
        </footer>
      </div>

      {/* ─── FLOATING WHATSAPP BUTTON ON HOMEPAGE ─── */}
      <WhatsAppFloatingButton
        whatsappNumber={import.meta.env.VITE_WHATSAPP_NUMBER || "+919876543210"}
        prefillMessage="Hello! I would like to inquire about EX SHARE photography studio platform."
        iconOnly={true}
        enabled={true}
      />
    </div>
  );
};
