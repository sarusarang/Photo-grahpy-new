import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  Zap,
  MessageCircle,
  Camera,
  Bike,
} from 'lucide-react';
import { Logo } from '../components/common/Logo';
import { useAuth } from '../context/AuthContext';
import { HeroSection } from '../components/home/HeroSection';

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
    id: 'active-essentials',
    menuLabel: 'New Arrivals',
    tag: 'EDITORIAL COLLECTION',
    name: 'Active Essentials',
    location: 'Studio Vault, Worldwide',
    description:
      'BUILT FOR MASTER ZERO-LOSS RAW FIDELITY AND HIGH-SPEED PROOFING. THE SPEED SERIES DELIVERS RESPONSIVE PERFORMANCE AND STREAMLINED GALLERY DELIVERY TO HELP YOUR CREATIVE STUDIO WORK FASTER AND DELIVER FLAWLESSLY.',
    size: '380 RAW Frames',
    year: '2026',
    client: 'Active Editorial Crew',
    stats: '380 RAW • 4K HDR • 0.8S INGEST',
    image: '/active_editorial_crew.jpg',
    gallerySlug: 'sarang-wedding-editorial',
  },
  {
    id: 'best-sellers',
    menuLabel: 'Best sellers',
    tag: 'DESTINATION NUPTIALS',
    name: 'Villa Balbiano Grand Gala',
    location: 'Lake Como, IT',
    description:
      'AN INTIMATE EDITORIAL WEDDING CAPTURED ALONG THE SHORES OF LAKE COMO, FEATURING VINTAGE RIVA WOODEN BOATS, ITALIAN LACE COUTURE, AND CANDLELIT PALACE COURTYARDS.',
    size: '520 Photos',
    year: '2025',
    client: 'Elena & Julian',
    stats: '520 PHOTOS • VINTAGE RIVA • LAKE COMO',
    image:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=85',
    gallerySlug: 'sarang-wedding-editorial',
  },
  {
    id: 'editorial',
    menuLabel: 'editorial',
    tag: 'RUNWAY & COUTURE',
    name: 'Parisian Autumn Campaign',
    location: 'Paris, FR',
    description:
      'CAPTURING NATURAL SUNLIGHT AND HIGH-SPEED MOTION IN FULL DYNAMIC RANGE. TAILORED PROOFING SUITES AND DIGITAL WATERMARKING PRESERVE EVERY THREAD OF YOUR COUTURE VISION.',
    size: '440 Photos',
    year: '2025',
    client: 'Vogue International',
    stats: '440 FRAMES • LEICA 35MM • PARIS',
    image:
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=2000&q=85',
    gallerySlug: 'sarang-wedding-editorial',
  },
  {
    id: 'documentary',
    menuLabel: 'documentary',
    tag: 'ZERO-LOSS VAULT',
    name: 'Amanpuri Coastal Story',
    location: 'Phuket, TH',
    description:
      'UNCOMPRESSED HIGH-BITRATE INGESTION WITH ZERO QUALITY REDUCTION. DELIVER THOUSANDS OF HIGH-RESOLUTION SONY, CANON, AND FUJIFILM RAW FRAMES DIRECTLY TO CLIENT DEVICES IN UNDER 60 SECONDS.',
    size: '680 RAW Frames',
    year: '2025',
    client: 'Lunaris Atelier',
    stats: '680 RAW • SONY A1 • PHUKET',
    image: '/bento_card1_camera.jpg',
    gallerySlug: 'sarang-wedding-editorial',
  },
  {
    id: 'studio-suites',
    menuLabel: 'studio suites',
    tag: 'CLIENT SUITES',
    name: 'Customized Studio Domains',
    location: 'Worldwide Wildcard DNS',
    description:
      'WHITE-LABEL CLIENT DOMAINS, PASSWORD-PROTECTED PROOFING, AND MULTI-RESOLUTION DOWNLOADS CRAFTED FOR HIGH-PROFILE CELEBRITIES AND LUXURY STUDIOS WORLDWIDE.',
    size: 'Bespoke Subdomains',
    year: '2026',
    client: 'Ex Share Studios',
    stats: 'SUBDOMAINS • PIN ACCESS • QR CODES',
    image: '/bento_card4_atelier.jpg',
    gallerySlug: 'sarang-wedding-editorial',
  },
  {
    id: 'accessories',
    menuLabel: 'accessories',
    tag: 'MUSEUM ARCHIVES',
    name: 'Fine Art Print Proofing',
    location: 'Venice, IT',
    description:
      'PRESERVE NATURAL SKIN TONES AND DEEP SHADOW ACCENTS WITH CUSTOM 3D COLOR LUT PROFILES. INTEGRATE PRINT LAB FULFILLMENT DIRECTLY INTO CLIENT GALLERIES.',
    size: '310 Archival Prints',
    year: '2025',
    client: 'Venice Biennale',
    stats: 'HAHNEMÜHLE RAG • 16-BIT COLOR • VENICE',
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

interface ArticleDeckItem {
  id: string;
  tags: string[];
  title: string;
  excerpt: string;
  image: string;
}

const ARTICLE_DECK: ArticleDeckItem[] = [
  {
    id: 'art-1',
    tags: ['Curation', 'Design'],
    title: 'Curating Galleries That Resonate',
    excerpt:
      'Visual storytelling is more than image grids—it’s about shaping emotional experiences. As editorial standards evolve, modern galleries must celebrate natural light, fluid typography, and bespoke pacing.',
    image:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85',
  },
  {
    id: 'art-2',
    tags: ['Lighting', 'Editorial'],
    title: 'The Architecture of Light & Shadow',
    excerpt:
      'How subtle morning shadows and warm golden apertures transform raw captures into enduring living canvases of serene beauty and haute couture elegance.',
    image:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85',
  },
  {
    id: 'art-3',
    tags: ['Cloud', 'Speed'],
    title: 'High-Speed RAW Ingest & Live Delivery',
    excerpt:
      'Empowering elite photography studios to distribute watermarked, pin-protected collections to event guests in real-time before the reception concludes.',
    image:
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=85',
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
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [activeArticleIndex, setActiveArticleIndex] = useState(0);

  const activeProject = SELECTED_PROJECTS[activeProjectIndex];
  const activeTestimonial = TESTIMONIALS[activeTestimonialIndex];
  const activeArticle = ARTICLE_DECK[activeArticleIndex];

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

  const handleNextArticle = () => {
    setActiveArticleIndex((prev) => (prev + 1) % ARTICLE_DECK.length);
  };

  const handlePrevArticle = () => {
    setActiveArticleIndex((prev) => (prev - 1 + ARTICLE_DECK.length) % ARTICLE_DECK.length);
  };

  const conceptCategories = [
    'Editorial Wedding Suites',
    'Private Client Proofing',
    'Live Event Tethering & QR',
    'Master Cloud RAW Vault',
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
            {/* Brand Monogram Badge (Image 1 Style: C ⚡ F -> EX ⚡ SHARE) */}
            <div className="flex items-center gap-1.5 text-white font-bold tracking-[0.22em] text-sm sm:text-base drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] mb-2 sm:mb-3">
              <span>EX</span>
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
              <span>SHARE</span>
            </div>

            {/* Stacked Categories List (Image 1 exact alignment and arrow) */}
            <div className="flex flex-col gap-1 sm:gap-1.5 w-full lg:w-auto">
              {SELECTED_PROJECTS.map((project, index) => {
                const isActive = index === activeProjectIndex;
                return (
                  <button
                    key={project.id}
                    onClick={() => setActiveProjectIndex(index)}
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
        className="w-full py-12 sm:py-20 lg:py-24 max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 select-none"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 xl:gap-12 items-stretch">
          {/* LEFT COLUMN: HERO TESTIMONIAL CARD */}
          <motion.div
            initial={{ opacity: 0, x: -60, scale: 0.97 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 relative rounded-[32px] sm:rounded-[44px] overflow-hidden shadow-[0_16px_50px_rgba(0,0,0,0.08)] group min-h-[520px] sm:min-h-[580px] lg:min-h-[660px] flex flex-col justify-between p-6 sm:p-9 lg:p-11 will-change-transform bg-neutral-900 select-none"
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
                  Alex Thompson, 32
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
                className="text-4xl sm:text-5xl lg:text-[54px] xl:text-[62px] font-extrabold tracking-tight text-neutral-900 leading-[1.08] mb-6 sm:mb-8 font-sans"
              >
                Turn Up Your Photography
                <br />
                Journey — into Pleasure.
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
                  Whether you&apos;re a first-time shooter or an experienced studio artist, our community will provides useful guidance, opportunities, and connections between photographers.
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

                {/* Typography: "We Believe Photography is More than Clicking." */}
                <div>
                  <span className="text-lg sm:text-xl font-bold text-neutral-500 block mb-1">
                    We Believe
                  </span>
                  <h3 className="text-2xl sm:text-[28px] lg:text-[32px] font-extrabold text-neutral-900 tracking-tight leading-[1.12]">
                    Photography is More
                    <br />
                    than Clicking.
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
                    alt="Take your first shot"
                    className="w-full h-full object-cover object-center group-hover/handlebar:scale-108 transition-transform duration-700 ease-out pointer-events-none"
                  />

                  {/* Gradient Scrim for Button */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                  {/* Glassmorphic Pill Button */}
                  <button
                    type="button"
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[85%] py-2 sm:py-2.5 px-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/35 text-white text-xs sm:text-[13px] font-medium tracking-wide text-center transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    Take your first shot
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* 5. OUR UPCOMING CONCEPT CARD (Image 3 Bottom)                      */}
      {/* ================================================================== */}
      <section className="w-full py-8 sm:py-12 max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14">
        <motion.div
          id="upcoming-concept"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.65 }}
          className="rounded-[36px] bg-[#ebdcd0] p-8 sm:p-14 mt-4 sm:mt-8 shadow-sm"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Concept Title and Category List */}
            <div className="lg:col-span-5 flex flex-col justify-between min-h-[300px]">
              <h3 className="text-3xl sm:text-5xl font-normal tracking-tight text-neutral-900 leading-[1.12]">
                Our
                <br />
                Upcoming
                <br />
                Concept
              </h3>

              {/* Vertical Category Selector */}
              <div className="flex flex-col gap-3 mt-8">
                {conceptCategories.map((cat, idx) => {
                  const isSelected = idx === activeCategoryIndex;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategoryIndex(idx)}
                      className={`text-left transition-all duration-300 py-1 flex items-center cursor-pointer ${isSelected
                          ? 'border-l-2 border-neutral-950 pl-4 font-semibold text-neutral-950 text-sm'
                          : 'border-l-2 border-transparent pl-4 font-normal text-neutral-600 hover:text-neutral-900 text-sm opacity-60'
                        }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: 3-Image Mosaic */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              {/* Mosaic Image 1 (Top Vanity / Terrazzo Countertop) */}
              <div className="rounded-2xl overflow-hidden shadow-sm aspect-[16/6] bg-neutral-200">
                <img
                  src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80"
                  alt="Minimalist vanity with marble"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>

              {/* Mosaic Image 2 (Middle Concrete Architecture with Louvers) */}
              <div className="rounded-2xl overflow-hidden shadow-sm aspect-[16/9] bg-neutral-200">
                <img
                  src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"
                  alt="Modern architectural facade with wooden louvers"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>

              {/* Mosaic Image 3 (Bottom Interior Furniture Texture) */}
              <div className="rounded-2xl overflow-hidden shadow-sm aspect-[16/7] bg-neutral-200">
                <img
                  src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80"
                  alt="Tactile furniture interior detail"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ==================================================================== */}
      {/* 6. BEYOND THE BLUEPRINT (Image 4 Top)                                */}
      {/* ==================================================================== */}
      <section className="w-full py-12 sm:py-16 max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.65 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
        >
          {/* Left Column: Heading, Subtitle & Arrow Controls */}
          <div className="lg:col-span-5">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-neutral-900 leading-[1.08]">
              Beyond the
              <br />
              Blueprint
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 mt-5 max-w-sm leading-relaxed">
              Exploring ideas, inspirations, and innovations that shape the spaces we live in
            </p>

            {/* Circular Arrow Navigation Controls */}
            <div className="flex items-center gap-4 mt-8">
              <button
                onClick={handlePrevArticle}
                className="w-12 h-12 rounded-full bg-white shadow-md border border-neutral-100 flex items-center justify-center text-neutral-800 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                aria-label="Previous article"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNextArticle}
                className="w-12 h-12 rounded-full bg-white shadow-md border border-neutral-100 flex items-center justify-center text-neutral-800 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                aria-label="Next article"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Right Column: 3D Layered Card Deck */}
          <div className="lg:col-span-7 flex justify-center">
            <div className="relative w-full max-w-md aspect-[3/4]">
              {/* Background Card Offset Peeking Out */}
              <div className="absolute inset-0 rounded-[32px] overflow-hidden bg-neutral-800 transform rotate-3 translate-x-4 scale-95 opacity-50 shadow-xl pointer-events-none">
                <img
                  src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80"
                  alt="Card Peeking"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Active Foreground Card with Thick White Ring */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeArticle.id}
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.45 }}
                  className="absolute inset-0 rounded-[32px] ring-4 ring-white shadow-2xl overflow-hidden relative w-full h-full bg-neutral-950"
                >
                  <img
                    src={activeArticle.image}
                    alt={activeArticle.title}
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-900/35 to-transparent flex flex-col justify-end p-7 sm:p-8">
                    {/* Category Pill Tags */}
                    <div className="flex items-center gap-2 mb-3">
                      {activeArticle.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3.5 py-1 rounded-full bg-white text-neutral-900 text-[10px] font-semibold tracking-wide shadow-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <h4 className="text-2xl sm:text-3xl font-normal text-white leading-tight">
                      {activeArticle.title}
                    </h4>
                    <p className="text-xs text-white/80 mt-2.5 line-clamp-3 leading-relaxed">
                      {activeArticle.excerpt}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ==================================================================== */}
      {/* 7. PRE-FOOTER CALL TO ACTION (Image 4 Middle)                         */}
      {/* High Contrast, Bold Visibility, Rich Dark Depth                      */}
      {/* ==================================================================== */}
      <section className="w-full max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 my-10 sm:my-14">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.65 }}
          className="rounded-[36px] bg-[#0e1014] text-white shadow-2xl border border-neutral-800/80 p-12 sm:p-20 text-center relative overflow-hidden group"
        >
          {/* Subtle Ambient Background Lighting Texture */}
          <div className="absolute inset-0 opacity-25 pointer-events-none">
            <img
              src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=80"
              alt="Photography Atelier Atmosphere"
              className="w-full h-full object-cover object-center filter grayscale group-hover:scale-105 transition-transform duration-1000"
            />
          </div>
          {/* Rich Dark Scrim */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0e1014]/90 via-[#0e1014]/80 to-[#0e1014]/95 pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-amber-300 text-[11px] font-medium tracking-wider uppercase mb-5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Elevate Your Studio</span>
            </div>

            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white leading-tight">
              Let's Build Your
              <br />
              Vision Together
            </h2>
            <p className="text-xs sm:text-base text-neutral-300 mt-4 leading-relaxed max-w-xl mx-auto font-light">
              From concept to creation, our team is ready to design bespoke galleries and spaces that inspire your clients.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              {isAuthenticated ? (
                <Link
                  to="/dashboard/overview"
                  className="px-9 py-4 rounded-full bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold tracking-widest uppercase shadow-2xl hover:shadow-amber-500/20 transition-all duration-300 hover:scale-105 active:scale-95 inline-flex items-center gap-2"
                >
                  <span>OPEN DASHBOARD</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/dashboard/gallery"
                    className="px-9 py-4 rounded-full bg-white hover:bg-neutral-100 text-neutral-950 text-xs font-bold tracking-widest uppercase shadow-2xl hover:shadow-white/20 transition-all duration-300 hover:scale-105 active:scale-95 inline-flex items-center gap-2"
                  >
                    <span>START YOUR PROJECT</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/login"
                    className="px-8 py-4 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-semibold tracking-wider uppercase transition-colors"
                  >
                    Login / Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ==================================================================== */}
      {/* 8. MINIMALIST ARCHITECTURAL FOOTER (Image 4 Bottom)                  */}
      {/* ==================================================================== */}
      <footer className="w-full border-t border-neutral-300/70 pt-12 pb-14 max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 text-neutral-700">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10">
          {/* Left Column: Logo, Contact Info, Social Links */}
          <div className="md:col-span-5 flex flex-col justify-between">
            <div>
              <Link to="/" className="inline-block mb-5" title="EX SHARE">
                <Logo variant="light" className="h-6 sm:h-7 w-auto object-contain" />
              </Link>
              <div className="flex flex-col gap-1 text-xs text-neutral-600">
                <p className="font-semibold text-neutral-800">+1 (7635) 547-12-97</p>
                <p className="hover:text-neutral-950 transition-colors cursor-pointer">
                  support@forme.com
                </p>
              </div>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-2.5 mt-6">
              <a
                href="#linkedin"
                className="w-8 h-8 rounded-full bg-white shadow-sm border border-neutral-200/80 flex items-center justify-center text-xs font-bold text-neutral-700 hover:bg-neutral-900 hover:text-white transition-all"
                aria-label="LinkedIn"
              >
                in
              </a>
              <a
                href="#facebook"
                className="w-8 h-8 rounded-full bg-white shadow-sm border border-neutral-200/80 flex items-center justify-center text-xs font-bold text-neutral-700 hover:bg-neutral-900 hover:text-white transition-all"
                aria-label="Facebook"
              >
                f
              </a>
              <a
                href="#twitter"
                className="w-8 h-8 rounded-full bg-white shadow-sm border border-neutral-200/80 flex items-center justify-center text-xs font-bold text-neutral-700 hover:bg-neutral-900 hover:text-white transition-all"
                aria-label="Twitter"
              >
                𝕏
              </a>
            </div>
          </div>

          {/* Middle Column: Studio Info */}
          <div className="md:col-span-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-3.5">
              Studio Info
            </h5>
            <ul className="flex flex-col gap-2.5 text-xs text-neutral-500">
              <li>
                <a href="#about" className="hover:text-neutral-900 transition-colors">
                  About us
                </a>
              </li>
              <li>
                <a href="#philosophy" className="hover:text-neutral-900 transition-colors">
                  Our Philosophy
                </a>
              </li>
              <li>
                <a href="#careers" className="hover:text-neutral-900 transition-colors">
                  Team & Careers
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-neutral-900 transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Right Column: Services */}
          <div className="md:col-span-4">
            <h5 className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-3.5">
              Services
            </h5>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-neutral-500">
              <a href="#arch" className="hover:text-neutral-900 transition-colors">
                Architectural Design
              </a>
              <a href="#urban" className="hover:text-neutral-900 transition-colors">
                Urban Planning
              </a>
              <a href="#interior" className="hover:text-neutral-900 transition-colors">
                Interior Design
              </a>
              <a href="#renovation" className="hover:text-neutral-900 transition-colors">
                Renovation & Restoration
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Strip */}
        <div className="border-t border-neutral-300/60 mt-10 pt-5 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 gap-2">
          <span>© 2026 Flowform • EX SHARE Architecture & Visual Gallery Platform</span>
          <span>All rights reserved</span>
        </div>
      </footer>
    </div>
  );
};
