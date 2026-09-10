import React from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, GraduationCap, Settings, Eye, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { useGallery } from '../context/GalleryContext';

export const LandingPlaceholder: React.FC = () => {
  const { galleries } = useGallery();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 text-center max-w-5xl mx-auto my-auto">
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-amber-300 text-xs font-mono uppercase tracking-widest mb-6">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>Reserved Public Landing Route (`/`)</span>
      </div>

      <h1 className="text-4xl sm:text-6xl font-serif text-white tracking-tight leading-tight max-w-3xl">
        A Modern, Premium Photography Gallery Management Platform
      </h1>

      <p className="text-sm sm:text-base text-neutral-400 mt-6 max-w-2xl leading-relaxed">
        The public landing page is reserved for future marketing presentation. The full
        photographer SaaS dashboard and client gallery layouts are active and ready to explore.
      </p>

      {/* Main Entry Button */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          to="/dashboard/drive"
          className="px-8 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-widest transition-all shadow-xl shadow-amber-500/20 flex items-center gap-2 hover:scale-105"
        >
          <span>Enter Photographer Workspace</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          to="/login"
          className="px-6 py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-200 text-xs font-bold uppercase tracking-widest transition-colors"
        >
          Photographer Login
        </Link>
      </div>

      {/* Interactive Quick Links into App Features */}
      <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full text-left">
        <Link
          to="/dashboard/drive"
          className="p-6 rounded-3xl bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FolderKanban className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-white group-hover:text-amber-300 transition-colors">
            Cloud Drive & Galleries
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            Manage {galleries.length} high-res client collections, upload RAW/video, and reorder media.
          </p>
        </Link>

        <Link
          to="/dashboard/tutorials"
          className="p-6 rounded-3xl bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <GraduationCap className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-white group-hover:text-sky-300 transition-colors">
            Tutorial & Guides
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            Visual 6-step masterclass on gallery setup, layouts, delivery, and client proofing.
          </p>
        </Link>

        <Link
          to={`/gallery/${galleries[0]?.slug || 'sarang-wedding-editorial'}`}
          target="_blank"
          className="p-6 rounded-3xl bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Eye className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-white group-hover:text-rose-300 transition-colors">
            Client Gallery Experience
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            Preview the live client view with Editorial, Masonry, Cinematic, and Minimal layouts.
          </p>
        </Link>
      </div>
    </div>
  );
};
