import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Logo } from '../components/common/Logo';

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
/* Data Definitions Tailored to EX SHARE Visual Platform & Reference Design  */
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
    name: 'Casa Lumen',
    location: 'Ubud, ID',
    description:
      'A tranquil sanctuary in Ubud, Bali, where stone, teak, and open courtyards connect interior and landscape.',
    size: '450m²',
    year: '2022',
    client: 'Private',
    image:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85',
    gallerySlug: 'sarang-wedding-editorial',
  },
  {
    id: 'lunaris-estate',
    name: 'Lunaris Estate',
    location: 'Dubai, AE',
    description:
      'Monolithic desert villa framed with travertine colonnades, reflecting pools, and floor-to-ceiling glass pavilions.',
    size: '1,200m²',
    year: '2023',
    client: 'Al-Mansoor',
    image:
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=85',
    gallerySlug: 'sarang-wedding-editorial',
  },
  {
    id: 'haven-point',
    name: 'Haven Point',
    location: 'Uluwatu, Bali',
    description:
      'Cliffside residence featuring cantilevered timber decks and panoramic infinity vistas suspended above the Indian Ocean.',
    size: '620m²',
    year: '2023',
    client: 'Private Estate',
    image:
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=85',
    gallerySlug: 'sarang-wedding-editorial',
  },
  {
    id: 'silverleaf',
    name: 'Silverleaf',
    location: 'Uluwatu, Bali',
    description:
      'Eco-luxury retreat blending brutalist raw concrete textures with lush vertical jungle gardens and open-air bathing atriums.',
    size: '510m²',
    year: '2024',
    client: 'Silverleaf Club',
    image:
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1600&q=85',
    gallerySlug: 'sarang-wedding-editorial',
  },
  {
    id: 'casa-verde',
    name: 'Casa Verde',
    location: 'Uluwatu, Bali',
    description:
      'Biophilic pavilion integrating living green roofs, passive geothermal breezes, and handcrafted volcanic rock masonry.',
    size: '380m²',
    year: '2024',
    client: 'Verde Group',
    image:
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1600&q=85',
    gallerySlug: 'sarang-wedding-editorial',
  },
  {
    id: 'azure-horizon',
    name: 'Azure Horizon',
    location: 'Canggu, ID',
    description:
      'Contemporary coastal residence showcasing curved bamboo ceilings, terrazzo surfaces, and sun-drenched sunken seating lounges.',
    size: '720m²',
    year: '2025',
    client: 'Private',
    image:
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=85',
    gallerySlug: 'sarang-wedding-editorial',
  },
  {
    id: 'serenity-estate',
    name: 'Serenity Estate',
    location: 'Uluwatu, Bali',
    description:
      'Minimalist private sanctuary celebrating pure geometric massing, warm limewashed walls, and serene internal courtyards.',
    size: '890m²',
    year: '2025',
    client: 'Soma Living',
    image:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=85',
    gallerySlug: 'sarang-wedding-editorial',
  },
];

interface TestimonialItem {
  id: string;
  name: string;
  location: string;
  photo: string;
  headline: string;
  quote: string;
}

const TESTIMONIALS: TestimonialItem[] = [
  {
    id: '1',
    name: 'Elena Rostova',
    location: 'Milan, Italy',
    photo:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    headline: 'Timeless architectural precision.',
    quote:
      'From initial sketches to final delivery, the meticulous attention to light, volume, and material texture delivered an environment of quiet grandeur.',
  },
  {
    id: '2',
    name: 'Marcus Vance',
    location: 'Sydney, Australia',
    photo:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    headline: 'Elegance without compromise.',
    quote:
      'Every space flows effortlessly into the next. They balanced complex structural engineering with pure aesthetic restraint and effortless grace.',
  },
  {
    id: '3',
    name: 'Jean Smicelle',
    location: 'Jakarta, Indonesia',
    photo:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
    headline: 'Visionary design with practical execution.',
    quote:
      'Our mixed-use development had complex needs, and Forme delivered beyond expectations. Their team balanced bold architectural ideas with real-world constraints — and the final result is both iconic and efficient.',
  },
  {
    id: '4',
    name: 'Clara Delacroix',
    location: 'Paris, France',
    photo:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
    headline: 'Bespoke spaces that inspire daily.',
    quote:
      'The interplay of natural illumination, organic textures, and acoustic serenity makes our studio a sanctuary for creative work.',
  },
  {
    id: '5',
    name: 'David Chen',
    location: 'Singapore',
    photo:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    headline: 'Flawless balance of technology & form.',
    quote:
      'Their forward-thinking methodology brought our hospitality retreat to life with unprecedented luxury and sustainable craftsmanship.',
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
    tags: ['Article', 'Design'],
    title: 'Designing Spaces That Inspire',
    excerpt:
      'Architecture is more than walls and roofs—it’s about shaping experiences. As cities evolve and lifestyles change, modern spaces must elevate the human spirit through natural light and tactile harmony.',
    image:
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'art-2',
    tags: ['Perspective', 'Light'],
    title: 'The Poetry of Natural Illumination',
    excerpt:
      'How subtle morning shadows and warm golden apertures transform brutalist concrete walls into living canvases of serene contemplation and beauty.',
    image:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'art-3',
    tags: ['Editorial', 'Materiality'],
    title: 'Limestone, Timber & Timeless Air',
    excerpt:
      'Rediscovering ancient Mediterranean stone masonry and sustainable harvested teak for ultra-contemporary private sanctuaries.',
    image:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80',
  },
];

/* -------------------------------------------------------------------------- */
/* Main Landing Page Component                                                */
/* -------------------------------------------------------------------------- */

export const LandingPlaceholder: React.FC = () => {
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
    'Residential Design',
    'Commercial Interiors',
    'Hospitality Spaces',
    'Retail Environments',
  ];

  return (
    <div className="w-full bg-[#e8ecef] text-neutral-900 font-sans antialiased overflow-x-hidden selection:bg-neutral-900 selection:text-white">
      {/* ==================================================================== */}
      {/* 1. HERO SECTION & TRANSPARENT FLOATING NAVBAR (Image 1)              */}
      {/* ==================================================================== */}
      <section className="relative w-full h-[620px] sm:h-[720px] lg:h-[820px] overflow-hidden">
        {/* Hero Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2600&q=85"
            alt="Architectural Villa Facade"
            className="w-full h-full object-cover object-center transform scale-105"
          />
          {/* Subtle dusk overlay for text contrast while preserving sky hue */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#2e475d]/60 via-[#263c50]/35 to-[#e8ecef]/90" />
        </div>

        {/* Floating Transparent Navigation Bar */}
        <header className="relative z-30 max-w-7xl mx-auto px-6 sm:px-12 pt-7 sm:pt-9 flex items-center justify-between">
          {/* Brand Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 group transition-transform duration-300 hover:scale-105"
            title="EX SHARE"
          >
            <Logo variant="dark" className="h-7 sm:h-8 w-auto object-contain drop-shadow-md" />
          </Link>

          {/* Desktop Capsule Pill Navigation Bar */}
          <nav className="hidden md:flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-medium tracking-wide">
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
            <Link
              to="/dashboard/drive"
              className="px-4 py-1.5 rounded-full border border-white/60 text-white hover:bg-white hover:text-neutral-900 transition-all duration-300 font-semibold shadow-sm"
            >
              CONTACT US
            </Link>
          </nav>

          {/* Mobile Hamburger Trigger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-full bg-white/15 backdrop-blur-md text-white hover:bg-white/25 transition-all"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden bg-neutral-950/85 backdrop-blur-xl flex flex-col justify-between p-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <Logo variant="dark" className="h-7 w-auto object-contain" />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-6 text-xl font-light text-white my-auto">
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
              <Link
                to="/dashboard/drive"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3.5 rounded-full bg-white text-neutral-950 text-center font-bold text-xs uppercase tracking-widest shadow-xl"
              >
                Enter Photographer Workspace
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 rounded-full border border-white/30 text-white text-center text-xs font-semibold uppercase tracking-wider"
              >
                Photographer Sign In
              </Link>
            </div>
          </div>
        )}

        {/* Hero Headline Typography (Exact Layout from Image 1) */}
        <div className="relative z-20 max-w-7xl mx-auto px-6 sm:px-12 pt-14 sm:pt-20 lg:pt-24 text-white">
          <div className="max-w-4xl">
            {/* Line 1 */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[84px] font-normal tracking-[-0.03em] leading-[1.08] text-white">
              Designing spaces
            </h1>

            {/* Line 2 with Concentric Capsule SVG */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-1 sm:mt-2">
              <ConcentricCapsuleSvg className="w-28 sm:w-40 md:w-44 h-auto" />
              <span className="text-4xl sm:text-6xl md:text-7xl lg:text-[84px] font-normal tracking-[-0.03em] leading-[1.08] text-white">
                that shape
              </span>
            </div>

            {/* Line 3 with Diagonal Hatch Lines SVG */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-1 sm:mt-2">
              <span className="text-4xl sm:text-6xl md:text-7xl lg:text-[84px] font-normal tracking-[-0.03em] leading-[1.08] text-white">
                experiences
              </span>
              <DiagonalHatchSvg className="w-24 sm:w-32 md:w-36 h-auto" />
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 2. OVERLAPPING BENTO GRID CONTAINER (Image 1)                        */}
      {/* ==================================================================== */}
      <section className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 -mt-24 sm:-mt-36 lg:-mt-48 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6">
          {/* Card 1: Large Frosted Glass Card (Top Left) */}
          <div className="md:col-span-6 bg-white/90 backdrop-blur-xl rounded-[32px] p-8 sm:p-12 border border-white/70 shadow-[0_20px_45px_rgba(0,0,0,0.06)] flex flex-col justify-between transition-transform duration-300 hover:translate-y-[-2px]">
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
            <p className="text-xs sm:text-sm text-neutral-600 mt-10 sm:mt-16 leading-relaxed max-w-sm">
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
            {/* Architectural White Canopy Facade Image */}
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
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/85 via-neutral-900/40 to-neutral-950/60" />

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
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 3. SELECTED PROJECTS SECTION (Image 2)                               */}
      {/* ==================================================================== */}
      <section id="selected-projects" className="w-full py-20 sm:py-28 max-w-6xl mx-auto px-4 sm:px-6">
        {/* Centered Heading */}
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-neutral-900 text-center mb-16 sm:mb-20">
          Selected Projects
        </h2>

        {/* Two-Column Interactive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: 7-Item Vertical Text List */}
          <div className="lg:col-span-4 flex flex-col gap-4 sm:gap-6">
            {SELECTED_PROJECTS.map((project, index) => {
              const isActive = index === activeProjectIndex;
              return (
                <button
                  key={project.id}
                  onClick={() => setActiveProjectIndex(index)}
                  className={`text-left transition-all duration-300 py-1.5 flex flex-col ${
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
            <div className="rounded-[36px] overflow-hidden relative aspect-[4/3] sm:aspect-[16/11] shadow-2xl bg-neutral-950 group">
              {/* Active Image with smooth crossfade */}
              <img
                key={activeProject.id}
                src={activeProject.image}
                alt={activeProject.name}
                className="w-full h-full object-cover object-center transition-all duration-700 animate-in fade-in"
              />

              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/70 via-transparent to-black/20" />

              {/* Floating Frosted White Card in Top-Left */}
              <div className="absolute top-6 left-6 sm:top-8 sm:left-8 bg-white/95 backdrop-blur-md rounded-2xl p-6 sm:p-7 max-w-xs sm:max-w-sm shadow-xl border border-white/70 animate-in fade-in zoom-in-95 duration-500">
                <h4 className="text-xl sm:text-2xl font-normal tracking-tight text-neutral-900">
                  {activeProject.name}
                </h4>
                <p className="text-xs text-neutral-600 mt-3 leading-relaxed">
                  {activeProject.description}
                </p>
                <Link
                  to={activeProject.gallerySlug ? `/gallery/${activeProject.gallerySlug}` : '/dashboard/drive'}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase text-neutral-900 hover:text-neutral-600 mt-5 transition-colors group/link"
                >
                  <span>READ MORE</span>
                  <ArrowRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>

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
      </section>

      {/* ==================================================================== */}
      {/* 4. VOICES FROM THOSE WE'VE BUILT WITH (Image 3 Top)                  */}
      {/* ==================================================================== */}
      <section id="testimonials" className="w-full py-20 sm:py-28 max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-neutral-900 text-center mb-16 sm:mb-20">
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
              let styleTransform = '';
              let zIndex = 10;
              let opacity = 0.5;

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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4 text-center">
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
        <div className="text-center max-w-2xl mx-auto mt-12 sm:mt-16 animate-in fade-in duration-500">
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
            {activeTestimonial.headline}
          </h3>
          <p className="text-xs sm:text-sm text-neutral-600 mt-3 leading-relaxed font-normal">
            {activeTestimonial.quote}
          </p>
        </div>

        {/* ================================================================== */}
        {/* 5. OUR UPCOMING CONCEPT CARD (Image 3 Bottom)                      */}
        {/* ================================================================== */}
        <div id="upcoming-concept" className="rounded-[36px] bg-[#ebdcd0] p-8 sm:p-14 mt-20 sm:mt-28 shadow-sm">
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
              <div className="flex flex-col gap-3 mt-10">
                {conceptCategories.map((cat, idx) => {
                  const isSelected = idx === activeCategoryIndex;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategoryIndex(idx)}
                      className={`text-left transition-all duration-300 py-1 flex items-center ${
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
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 6. BEYOND THE BLUEPRINT (Image 4 Top)                                */}
      {/* ==================================================================== */}
      <section className="w-full py-20 sm:py-28 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Heading, Subtitle & Arrow Controls */}
          <div className="lg:col-span-5">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-neutral-900 leading-[1.08]">
              Beyond the
              <br />
              Blueprint
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 mt-6 max-w-sm leading-relaxed">
              Exploring ideas, inspirations, and innovations that shape the spaces we live in
            </p>

            {/* Circular Arrow Navigation Controls */}
            <div className="flex items-center gap-4 mt-8 sm:mt-10">
              <button
                onClick={handlePrevArticle}
                className="w-12 h-12 rounded-full bg-white shadow-md border border-neutral-100 flex items-center justify-center text-neutral-800 hover:scale-110 active:scale-95 transition-all"
                aria-label="Previous article"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNextArticle}
                className="w-12 h-12 rounded-full bg-white shadow-md border border-neutral-100 flex items-center justify-center text-neutral-800 hover:scale-110 active:scale-95 transition-all"
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
              <div
                key={activeArticle.id}
                className="absolute inset-0 rounded-[32px] ring-4 ring-white shadow-2xl overflow-hidden relative w-full h-full bg-neutral-950 animate-in fade-in zoom-in-95 duration-500"
              >
                <img
                  src={activeArticle.image}
                  alt={activeArticle.title}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/85 via-neutral-900/30 to-transparent flex flex-col justify-end p-7 sm:p-8">
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
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 7. PRE-FOOTER CALL TO ACTION (Image 4 Middle)                         */}
      {/* ==================================================================== */}
      <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 my-10 sm:my-16">
        <div className="rounded-[36px] bg-white/95 backdrop-blur-md shadow-sm border border-neutral-200/60 p-10 sm:p-20 text-center relative overflow-hidden transition-all duration-300 hover:shadow-md">
          {/* Subtle Architectural Texture in Background */}
          <div className="absolute inset-0 opacity-15 pointer-events-none">
            <img
              src="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=80"
              alt="Architectural structure texture"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-normal tracking-tight text-neutral-900 leading-tight">
              Let's Build Your
              <br />
              Vision Together
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 mt-4 leading-relaxed max-w-md mx-auto">
              From concept to creation, our team is ready to design spaces that inspire.
            </p>

            <div className="mt-8 flex justify-center">
              <Link
                to="/dashboard/drive"
                className="px-8 py-4 rounded-full bg-[#111317] hover:bg-neutral-800 text-white text-xs font-bold tracking-widest uppercase shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 inline-flex items-center gap-2"
              >
                <span>START YOUR PROJECT</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 8. MINIMALIST ARCHITECTURAL FOOTER (Image 4 Bottom)                  */}
      {/* ==================================================================== */}
      <footer className="w-full border-t border-neutral-300/70 pt-16 pb-16 max-w-6xl mx-auto px-4 sm:px-6 text-neutral-700">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Left Column: Logo, Contact Info, Social Links */}
          <div className="md:col-span-5 flex flex-col justify-between">
            <div>
              <Link to="/" className="inline-block mb-6" title="EX SHARE">
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
            <div className="flex items-center gap-2.5 mt-8">
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
            <h5 className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-4">
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
            <h5 className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-4">
              Services
            </h5>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs text-neutral-500">
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
        <div className="border-t border-neutral-300/60 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 gap-2">
          <span>© 2026 Flowform • EX SHARE Architecture & Visual Gallery Platform</span>
          <span>All rights reserved</span>
        </div>
      </footer>
    </div>
  );
};
