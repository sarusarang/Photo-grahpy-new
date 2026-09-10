import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Camera, ArrowRight, ShieldCheck } from 'lucide-react';

export const LandingLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col antialiased">
      {/* Reserved Public Header */}
      <header className="h-20 border-b border-neutral-800/80 px-6 sm:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center text-neutral-950 font-bold">
            <Camera className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-widest text-neutral-400 font-mono block">
              Platform Preview
            </span>
            <span className="font-serif font-bold text-white text-base tracking-wide">
              EX STUDIO
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/dashboard/drive"
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold tracking-wide transition-all shadow-md shadow-amber-500/10 flex items-center gap-1.5"
          >
            <span>Open Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Landing Layout Outlet (Landing Page placeholder) */}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      {/* Reserved Public Footer */}
      <footer className="border-t border-neutral-900 py-8 px-6 text-center text-xs text-neutral-500">
        <p>© 2026 Ex Studio Platform • Professional Photography Cloud Infrastructure</p>
      </footer>
    </div>
  );
};
