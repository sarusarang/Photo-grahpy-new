import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Header } from '../components/common/Header';
import { Sidebar } from '../components/common/Sidebar';
import { MobileNav } from '../components/common/MobileNav';
import { UpgradePlanModal } from '../components/common/UpgradePlanModal';
import { CreateGalleryModal } from '../components/gallery/CreateGalleryModal';
import { useAuth } from '../context/AuthContext';
import { X } from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('photo_saas_sidebar_collapsed');
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('photo_saas_sidebar_collapsed', JSON.stringify(next));
      return next;
    });
  };

  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if not authenticated (or show login prompt)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0c0d12] text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-3xl bg-neutral-900 border border-neutral-800 text-center space-y-4">
          <h2 className="text-2xl font-serif">Photographer Sign In Required</h2>
          <p className="text-xs text-neutral-400">
            Please log in with your demo photographer account to access your studio drive.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-wider transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const [templatesSheetOpen, setTemplatesSheetOpen] = useState(false);

  return (
    <div className="h-screen bg-[#f8f9fa] dark:bg-[#0c0d12] text-neutral-900 dark:text-neutral-100 flex flex-col antialiased overflow-hidden transition-colors">
      {/* 1. Full-Width Top Header */}
      <Header
        onOpenMobileMenu={() => setMobileDrawerOpen(true)}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      {/* 2. Main App Body with Sidebar and Scrollable Content */}
      <div
        className={`flex-1 flex min-h-0 overflow-hidden ${
          isSidebarCollapsed ? 'sidebar-collapsed-layout' : 'sidebar-expanded-layout'
        }`}
      >
        {/* Desktop Left Sidebar — animated width container */}
        <div className="hidden md:flex flex-col flex-shrink-0 h-full transition-[width] duration-300 ease-[cubic-bezier(0.2,0,0,1)]">
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={toggleSidebar}
            onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
          />
        </div>

        {/* Mobile Sidebar Drawer */}
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden bg-black/70 backdrop-blur-sm flex overlay-animate">
            <div className="w-[290px] bg-white dark:bg-[#0c0d12] h-full flex flex-col drawer-animate shadow-2xl">
              <div className="p-4 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-500">
                  Studio Menu
                </span>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <Sidebar
                  onOpenUpgradeModal={() => {
                    setMobileDrawerOpen(false);
                    setIsUpgradeModalOpen(true);
                  }}
                  onCloseMobile={() => setMobileDrawerOpen(false)}
                />
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileDrawerOpen(false)} />
          </div>
        )}

        {/* Main Center Stage — smoothly expanding with generous mobile bottom clearance */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-24 md:pb-8 transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)]">
          <main
            key={location.pathname}
            className="flex-1 page-animate transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)]"
          >
            <Outlet context={{ isSidebarCollapsed }} />
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenTemplatesSheet={() => setTemplatesSheetOpen(true)}
      />

      {/* Mobile Templates Bottom Sheet Modal */}
      {templatesSheetOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/70 backdrop-blur-sm flex items-end overlay-animate">
          <div className="w-full bg-white dark:bg-[#121319] border-t border-neutral-200 dark:border-neutral-800 rounded-t-[28px] p-5 pb-safe shadow-2xl max-h-[85vh] overflow-y-auto sheet-animate">
            {/* Grab Handle */}
            <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700 mx-auto mb-4" />

            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800 mb-4">
              <div>
                <h3 className="text-base font-serif font-bold text-neutral-900 dark:text-white">
                  Client Gallery Templates
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Select a fine-art layout to preview client delivery
                </p>
              </div>
              <button
                onClick={() => setTemplatesSheetOpen(false)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {[
                { id: 'editorial', name: 'Editorial Layout', sub: 'High-fashion Vogue spread with serif accents' },
                { id: 'masonry', name: 'Masonry Layout', sub: 'Pinterest-style dynamic Pinterest photography grid' },
                { id: 'cinematic', name: 'Cinematic Layout', sub: 'Darkroom film style with widescreen aspect ratios' },
                { id: 'minimal', name: 'Minimal Layout', sub: 'Ultra-clean Scandinavian negative space exhibition' },
              ].map((tpl) => (
                <a
                  key={tpl.id}
                  href={`/gallery/sarang-wedding-editorial?previewTemplate=${tpl.id}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setTemplatesSheetOpen(false)}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/70 border border-neutral-200 dark:border-neutral-800/80 hover:border-amber-400/60 active:scale-[0.98] transition-all"
                >
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                      {tpl.name}
                    </h4>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {tpl.sub}
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 shrink-0 ml-2">
                    Preview →
                  </span>
                </a>
              ))}
            </div>
          </div>
          <div className="fixed inset-0 -z-10" onClick={() => setTemplatesSheetOpen(false)} />
        </div>
      )}

      {/* Upgrade Plan Modal */}
      <UpgradePlanModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />

      {/* Quick Add Gallery Modal */}
      <CreateGalleryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={(newGal) => {
          navigate(`/dashboard/drive/${newGal.id}`);
        }}
      />
    </div>
  );
};
