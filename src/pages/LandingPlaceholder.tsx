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
} from 'lucide-react';
import { Logo } from '../components/common/Logo';
import { useAuth } from '../context/AuthContext';

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
  name: string;
  location: string;
  description: string;
  size: string;
  year: string;
  client: string;
  image: string;
  gallerySlug?: string;
}

const SELECTED_PROJECTS: ProjectItem[] = [
  {
    id: 'casa-lumen',
    name: 'Villa Balbiano Editorial',
    location: 'Lake Como, IT',
    description:
      'An intimate editorial wedding captured along the shores of Lake Como, featuring vintage Riva wooden boat arrivals, Italian lace couture, and candlelit courtyards.',
    size: '380 Photos',
    year: '2024',
    client: 'Elena & Julian',
    image:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=85',
    gallerySlug: 'sarang-wedding-editorial',
  },
  {
    id: 'lunaris-estate',
    name: 'Amanpuri Coastal Campaign',
    location: 'Phuket, TH',
    description:
      'Tropical haute couture fashion editorial highlighting natural coconut palm shadows, sheer linen silhouettes, and private oceanfront villa pavilions.',
    size: '520 Photos',
    year: '2024',
    client: 'Vogue International',
    image:
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1800&q=85',
    gallerySlug: 'sarang-wedding-editorial',
  },
  {
    id: 'haven-point',
    name: 'Château de Tourreau',
    location: 'Provence, FR',
    description:
      'Classic French countryside celebration framed by blooming lavender fields, 17th-century cypress groves, and timeless neoclassical grandeur.',
    size: '440 Photos',
    year: '2024',
    client: 'Camille & Antoine',
    image:
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1800&q=85',
    gallerySlug: 'sarang-wedding-editorial',
  },
  {
    id: 'silverleaf',
    name: 'Katikies Aegean Bride',
    location: 'Santorini, GR',
    description:
      'Sun-drenched Aegean bridal portraits framed by pristine whitewashed Caldera terraces, deep cobalt Mediterranean waters, and pure volcanic light.',
    size: '310 Photos',
    year: '2025',
    client: 'Private Atelier',
    image:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1800&q=85',
    gallerySlug: 'sarang-wedding-editorial',
  },
  {
    id: 'casa-verde',
    name: 'Lunaris Desert Editorial',
    location: 'Dubai, UAE',
    description:
      'Monolithic desert fashion campaign capturing warm travertine colonnades, dramatic dusk dunes, and floor-to-ceiling mirror installations.',
    size: '680 Photos',
    year: '2025',
    client: 'Lunaris Atelier',
    image:
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1800&q=85',
    gallerySlug: 'sarang-wedding-editorial',
  },
  {
    id: 'azure-horizon',
    name: 'Palazzo Venart Grand Gala',
    location: 'Venice, IT',
    description:
      'Atmospheric Venetian ball documented under misty Grand Canal lanterns, private gondola processions, and Renaissance frescoed salons.',
    size: '490 Photos',
    year: '2025',
    client: 'Isabella & Lorenzo',
    image:
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1800&q=85',
    gallerySlug: 'sarang-wedding-editorial',
  },
  {
    id: 'serenity-estate',
    name: 'Amangiri Canyon Serenity',
    location: 'Utah, US',
    description:
      'Fine-art bridal session celebrating raw canyon sandstone, geometric negative space, and celestial sunset lighting in the American Southwest.',
    size: '410 Photos',
    year: '2025',
    client: 'Soma Living',
    image:
      'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1800&q=85',
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
  const [activeTestimonialIndex, setActiveTestimonialIndex] = useState(2); // Center card (Jean Smicelle)
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [activeArticleIndex, setActiveArticleIndex] = useState(0);

  const activeProject = SELECTED_PROJECTS[activeProjectIndex];
  const activeTestimonial = TESTIMONIALS[activeTestimonialIndex];
  const activeArticle = ARTICLE_DECK[activeArticleIndex];

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
      {/* 1. HERO SECTION & TRANSPARENT FLOATING NAVBAR (Image 1)              */}
      {/* Only Black Inset - No Whitish Haze                                   */}
      {/* ==================================================================== */}
      <section className="relative w-full h-[640px] sm:h-[740px] lg:h-[840px] overflow-hidden shadow-[inset_0_0_120px_rgba(0,0,0,0.85)]">
        {/* Hero Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2600&q=85"
            alt="Editorial Photography Villa Atmosphere"
            className="w-full h-full object-cover object-center transform scale-105"
          />
          {/* Pure Crisp Black Inset & Cinema Scrim - NO whitish milky fade */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90 pointer-events-none" />
          <div className="absolute inset-0 shadow-[inset_0_0_140px_rgba(0,0,0,0.9)] pointer-events-none" />
        </div>

        {/* Floating Transparent Navigation Bar */}
        <header className="relative z-30 max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 pt-7 sm:pt-9 flex items-center justify-between">
          {/* Brand Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 group transition-transform duration-300 hover:scale-105"
            title="EX SHARE"
          >
            <Logo variant="dark" className="h-7 sm:h-8 w-auto object-contain drop-shadow-md" />
          </Link>

          {/* Desktop Capsule Pill Navigation Bar */}
          <nav className="hidden md:flex items-center gap-1.5 sm:gap-2.5 text-[11px] sm:text-xs font-medium tracking-wide">
            <Link
              to="/"
              className="px-4 py-1.5 rounded-full bg-white text-neutral-900 font-semibold shadow-sm transition-transform duration-200 hover:scale-105"
            >
              HOME
            </Link>
            <a
              href="#selected-projects"
              className="px-4 py-1.5 rounded-full text-white/90 hover:text-white hover:bg-white/15 transition-all duration-200"
            >
              STUDIO
            </a>
            <a
              href="#selected-projects"
              className="px-4 py-1.5 rounded-full text-white/90 hover:text-white hover:bg-white/15 transition-all duration-200"
            >
              PROJECTS
            </a>
            <a
              href="#upcoming-concept"
              className="px-4 py-1.5 rounded-full text-white/90 hover:text-white hover:bg-white/15 transition-all duration-200"
            >
              SERVICES
            </a>
            <a
              href="#testimonials"
              className="px-4 py-1.5 rounded-full text-white/90 hover:text-white hover:bg-white/15 transition-all duration-200"
            >
              ABOUT
            </a>

            {/* Dynamic Auth Button: Login / Sign In or Dashboard */}
            {isAuthenticated ? (
              <Link
                to="/dashboard/overview"
                className="px-5 py-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold transition-all duration-300 shadow-md shadow-amber-500/20 flex items-center gap-1.5 hover:scale-105"
              >
                <span>DASHBOARD</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-5 py-1.5 rounded-full border border-white/70 text-white hover:bg-white hover:text-neutral-900 transition-all duration-300 font-semibold shadow-sm hover:scale-105"
              >
                LOGIN / SIGN IN
              </Link>
            )}
          </nav>

          {/* Mobile Hamburger Trigger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/20 hover:bg-black/60 transition-all"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-50 md:hidden bg-neutral-950/95 backdrop-blur-2xl flex flex-col justify-between p-6"
            >
              <div className="flex items-center justify-between">
                <Logo variant="dark" className="h-7 w-auto object-contain" />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-6 text-2xl font-light text-white my-auto">
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
                  STUDIO
                </a>
                <a
                  href="#selected-projects"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-neutral-300 hover:text-white"
                >
                  PROJECTS
                </a>
                <a
                  href="#upcoming-concept"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-neutral-300 hover:text-white"
                >
                  SERVICES
                </a>
                <a
                  href="#testimonials"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-neutral-300 hover:text-white"
                >
                  ABOUT
                </a>
              </div>

              <div className="flex flex-col gap-3">
                {isAuthenticated ? (
                  <Link
                    to="/dashboard/overview"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-4 rounded-full bg-amber-400 text-neutral-950 text-center font-bold text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-amber-300 transition-all"
                  >
                    <span>Open Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-4 rounded-full bg-white text-neutral-950 text-center font-bold text-xs uppercase tracking-widest shadow-xl"
                    >
                      Login / Sign In
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-3.5 rounded-full border border-white/30 text-white text-center text-xs font-semibold uppercase tracking-wider hover:bg-white/10"
                    >
                      Create Account
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero Headline Typography (Exact Layout from Image 1 with Motion Animation) */}
        <div className="relative z-20 max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 pt-14 sm:pt-20 lg:pt-24 text-white">
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-5xl"
          >
            {/* Line 1 */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[88px] font-normal tracking-[-0.03em] leading-[1.08] text-white">
              Infinite
            </h1>

            {/* Line 2 with Concentric Capsule SVG */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-1 sm:mt-2">
              <ConcentricCapsuleSvg className="w-28 sm:w-40 md:w-44 h-auto" />
              <span className="text-4xl sm:text-6xl md:text-7xl lg:text-[88px] font-normal tracking-[-0.03em] leading-[1.08] text-white">
                Sharing,
              </span>
            </div>

            {/* Line 3 */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-1 sm:mt-2">
              <span className="text-4xl sm:text-6xl md:text-7xl lg:text-[88px] font-normal tracking-[-0.03em] leading-[1.08] text-white">
                Instant
              </span>
            </div>

            {/* Line 4 with Diagonal Hatch Lines SVG */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-1 sm:mt-2">
              <span className="text-4xl sm:text-6xl md:text-7xl lg:text-[88px] font-normal tracking-[-0.03em] leading-[1.08] text-white">
                Connections
              </span>
              <DiagonalHatchSvg className="w-24 sm:w-32 md:w-36 h-auto" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 2. OVERLAPPING BENTO GRID CONTAINER (Image 1)                        */}
      {/* Wide Container, Reduced Gaps, Framer Motion Stagger                  */}
      {/* ==================================================================== */}
      <section className="relative z-20 max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 -mt-24 sm:-mt-36 lg:-mt-48 pb-12 sm:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6"
        >
          {/* Card 1: Large Frosted Glass Card (Top Left) */}
          <div className="md:col-span-6 bg-white/90 backdrop-blur-2xl rounded-[32px] p-8 sm:p-12 border border-white/70 shadow-[0_20px_45px_rgba(0,0,0,0.06)] flex flex-col justify-between transition-transform duration-300 hover:translate-y-[-2px]">
            <div>
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400">
                ABOUT FORMAT
              </span>
              <h2 className="text-4xl sm:text-5xl font-normal tracking-tight text-neutral-900 mt-6 leading-[1.12]">
                Spaces
                <br />
                that speak
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-neutral-600 mt-8 sm:mt-14 leading-relaxed max-w-sm">
              Our work is rooted in the human experience, crafting spaces that evoke emotion, invite
              interaction, and leave lasting impressions.
            </p>
          </div>

          {/* Card 2: Vertical Pure White Card (Top Center-Right) */}
          <div className="md:col-span-3 bg-white rounded-[32px] p-7 sm:p-8 shadow-[0_12px_32px_rgba(0,0,0,0.04)] border border-neutral-100 flex flex-col justify-between min-h-[290px] transition-transform duration-300 hover:translate-y-[-2px]">
            <div>
              <h3 className="text-2xl font-normal tracking-tight text-neutral-900 leading-snug">
                Contemporary
                <br />
                Visioning
              </h3>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed mt-auto pt-8">
              Creating modern spaces that feel warm and personal.
            </p>
          </div>

          {/* Card 3: Vertical Pure White Card (Top Right) */}
          <div className="md:col-span-3 bg-white rounded-[32px] p-7 sm:p-8 shadow-[0_12px_32px_rgba(0,0,0,0.04)] border border-neutral-100 flex flex-col justify-between min-h-[290px] transition-transform duration-300 hover:translate-y-[-2px]">
            <div>
              <h3 className="text-2xl font-normal tracking-tight text-neutral-900 leading-snug">
                Artistic Form
                <br />
                Balance
              </h3>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed mt-auto pt-8">
              Combining vision and detail to perfect every space.
            </p>
          </div>

          {/* Card 4: Wide Card with Architectural Canopy (Bottom Left) */}
          <div className="md:col-span-8 bg-white rounded-[32px] overflow-hidden shadow-[0_12px_32px_rgba(0,0,0,0.04)] border border-neutral-100 relative min-h-[320px] flex flex-col sm:flex-row justify-between transition-transform duration-300 hover:translate-y-[-2px] group">
            <div className="p-8 sm:p-10 flex flex-col justify-between z-10 sm:max-w-xs">
              <h3 className="text-2xl sm:text-3xl font-normal tracking-tight text-neutral-900 leading-tight">
                Customized
                <br />
                Design
              </h3>
              <p className="text-xs text-neutral-500 mt-8 sm:mt-auto leading-relaxed">
                Creating unique interiors that reflect client's lifestyle.
              </p>
            </div>
            {/* White Canopy Facade Image */}
            <div className="relative sm:w-1/2 min-h-[200px] sm:min-h-full overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=85"
                alt="Customized Minimalist Canopy"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>

          {/* Card 5: Dark Architectural Building Photo Card (Bottom Right) */}
          <div className="md:col-span-4 rounded-[32px] overflow-hidden relative shadow-[0_12px_32px_rgba(0,0,0,0.04)] min-h-[320px] flex flex-col justify-between p-8 group transition-transform duration-300 hover:translate-y-[-2px]">
            {/* Monochrome High-Contrast Architecture Background */}
            <img
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=85"
              alt="Monochrome Architectural Building"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            {/* Contrast Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-900/40 to-neutral-950/60" />

            <div className="relative z-10">
              <h3 className="text-2xl sm:text-3xl font-normal tracking-tight text-white leading-tight">
                Elegant Living
                <br />
                Design
              </h3>
            </div>
            <div className="relative z-10 mt-auto pt-8">
              <p className="text-xs text-white/80 leading-relaxed">
                Transforming interiors into daily experiences.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ==================================================================== */}
      {/* 3. SELECTED PROJECTS SECTION (Image 2)                               */}
      {/* Wide Container, Reduced Gaps, Framer Motion                          */}
      {/* ==================================================================== */}
      <section
        id="selected-projects"
        className="w-full py-12 sm:py-16 max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.65 }}
        >
          {/* Centered Heading */}
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-neutral-900 text-center mb-12 sm:mb-14">
            Selected Projects
          </h2>

          {/* Two-Column Interactive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: 7-Item Vertical Text List */}
            <div className="lg:col-span-4 flex flex-col gap-3.5 sm:gap-4.5">
              {SELECTED_PROJECTS.map((project, index) => {
                const isActive = index === activeProjectIndex;
                return (
                  <button
                    key={project.id}
                    onClick={() => setActiveProjectIndex(index)}
                    className={`text-left transition-all duration-300 py-1 flex flex-col cursor-pointer ${
                      isActive
                        ? 'border-l-2 border-neutral-950 pl-5 opacity-100'
                        : 'border-l-2 border-transparent pl-5 opacity-40 hover:opacity-80'
                    }`}
                  >
                    <span
                      className={`text-base sm:text-lg tracking-tight ${
                        isActive ? 'font-semibold text-neutral-950' : 'font-normal text-neutral-700'
                      }`}
                    >
                      {project.name}
                    </span>
                    <span className="text-xs text-neutral-500 mt-0.5">{project.location}</span>
                  </button>
                );
              })}
            </div>

            {/* Right Column: Large Curved Project Photo Card with Floating Info */}
            <div className="lg:col-span-8">
              <div className="rounded-[36px] overflow-hidden relative aspect-[4/3] sm:aspect-[16/10] shadow-2xl bg-neutral-950 group">
                {/* Active Image with smooth crossfade */}
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeProject.id}
                    src={activeProject.image}
                    alt={activeProject.name}
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="w-full h-full object-cover object-center"
                  />
                </AnimatePresence>

                {/* Dark Gradient Scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-black/30 pointer-events-none" />

                {/* Floating Frosted White Card in Top-Left */}
                <motion.div
                  key={`card-${activeProject.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute top-6 left-6 sm:top-8 sm:left-8 bg-white/95 backdrop-blur-md rounded-2xl p-6 sm:p-7 max-w-xs sm:max-w-sm shadow-xl border border-white/70"
                >
                  <h4 className="text-xl sm:text-2xl font-normal tracking-tight text-neutral-900">
                    {activeProject.name}
                  </h4>
                  <p className="text-xs text-neutral-600 mt-2.5 leading-relaxed">
                    {activeProject.description}
                  </p>
                  <Link
                    to={activeProject.gallerySlug ? `/gallery/${activeProject.gallerySlug}` : '/dashboard/gallery'}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase text-neutral-900 hover:text-neutral-600 mt-4 transition-colors group/link"
                  >
                    <span>READ MORE</span>
                    <ArrowRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>

                {/* Bottom Metadata Overlay Strip */}
                <div className="absolute bottom-6 left-6 right-6 sm:bottom-8 sm:left-8 sm:right-8 flex items-center justify-between text-white border-t border-white/20 pt-4 backdrop-blur-[2px]">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-white/70">Size</div>
                    <div className="text-xl sm:text-2xl font-light tracking-tight text-white mt-0.5">
                      {activeProject.size}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-white/70">
                      Completion
                    </div>
                    <div className="text-xl sm:text-2xl font-light tracking-tight text-white mt-0.5">
                      {activeProject.year}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-white/70">Client</div>
                    <div className="text-xl sm:text-2xl font-light tracking-tight text-white mt-0.5">
                      {activeProject.client}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ==================================================================== */}
      {/* 4. VOICES FROM THOSE WE'VE BUILT WITH (Image 3 Top)                  */}
      {/* Wide Container, Reduced Gaps, Framer Motion Animations               */}
      {/* ==================================================================== */}
      <section
        id="testimonials"
        className="w-full py-12 sm:py-16 max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.65 }}
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-neutral-900 text-center mb-12 sm:mb-16">
            Voices from those we've
            <br />
            built with.
          </h2>

          {/* 5-Card Perspective Fan Carousel */}
          <div className="relative flex items-center justify-center min-h-[340px] sm:min-h-[400px] overflow-visible py-4">
            <div className="relative flex items-center justify-center w-full max-w-2xl mx-auto">
              {TESTIMONIALS.map((item, idx) => {
                const diff = idx - activeTestimonialIndex;
                const isActive = diff === 0;

                // Perspective Fan Stack Transformations
                let styleTransform: string;
                let zIndex: number;
                let opacity: number;

                if (diff === 0) {
                  styleTransform = 'translate(0px, 0px) rotate(0deg) scale(1.05)';
                  zIndex = 30;
                  opacity = 1;
                } else if (diff === -1) {
                  styleTransform = 'translate(-70px, 15px) rotate(-6deg) scale(0.92)';
                  zIndex = 20;
                  opacity = 0.85;
                } else if (diff === 1) {
                  styleTransform = 'translate(70px, 15px) rotate(6deg) scale(0.92)';
                  zIndex = 20;
                  opacity = 0.85;
                } else if (diff === -2) {
                  styleTransform = 'translate(-140px, 35px) rotate(-12deg) scale(0.82)';
                  zIndex = 10;
                  opacity = 0.6;
                } else if (diff === 2) {
                  styleTransform = 'translate(140px, 35px) rotate(12deg) scale(0.82)';
                  zIndex = 10;
                  opacity = 0.6;
                } else {
                  styleTransform = diff < 0 ? 'translate(-180px, 50px) scale(0.7)' : 'translate(180px, 50px) scale(0.7)';
                  zIndex = 5;
                  opacity = 0.2;
                }

                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveTestimonialIndex(idx)}
                    style={{
                      transform: styleTransform,
                      zIndex,
                      opacity,
                    }}
                    className={`absolute transition-all duration-500 ease-out cursor-pointer select-none ${
                      isActive
                        ? 'w-44 sm:w-56 aspect-[3/4] ring-4 ring-white shadow-2xl rounded-2xl overflow-hidden'
                        : 'w-40 sm:w-48 aspect-[3/4] rounded-2xl overflow-hidden shadow-lg hover:opacity-100'
                    }`}
                  >
                    <img
                      src={item.photo}
                      alt={item.name}
                      className="w-full h-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-4 text-center">
                      <span className="text-white text-xs sm:text-sm font-semibold">{item.name}</span>
                      <span className="text-white/70 text-[10px] mt-0.5">{item.location}</span>
                    </div>

                    {/* Hanging Circular Quote Mark on Center Card */}
                    {isActive && (
                      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center font-serif text-xl font-bold text-neutral-900 border border-neutral-100">
                        ”
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Testimonial Quote Content Below Stack */}
          <div className="text-center max-w-2xl mx-auto mt-10 sm:mt-14">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
              {activeTestimonial.headline}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 mt-2.5 leading-relaxed font-normal">
              {activeTestimonial.quote}
            </p>
          </div>
        </motion.div>

        {/* ================================================================== */}
        {/* 5. OUR UPCOMING CONCEPT CARD (Image 3 Bottom)                      */}
        {/* ================================================================== */}
        <motion.div
          id="upcoming-concept"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.65 }}
          className="rounded-[36px] bg-[#ebdcd0] p-8 sm:p-14 mt-12 sm:mt-16 shadow-sm"
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
                      className={`text-left transition-all duration-300 py-1 flex items-center cursor-pointer ${
                        isSelected
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
