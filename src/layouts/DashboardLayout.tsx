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

  return (
    <div className="h-screen bg-[#f8f9fa] dark:bg-[#0c0d12] text-neutral-900 dark:text-neutral-100 flex flex-col antialiased overflow-hidden transition-colors">
      {/* 1. Full-Width Top Header (Exact match to screenshot) */}
      <Header
        onOpenMobileMenu={() => setMobileDrawerOpen(true)}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      {/* 2. Main App Body with Sidebar and Scrollable Content */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Desktop Left Sidebar — fixed width, independent scroll */}
        <div className="hidden md:flex flex-col flex-shrink-0 h-full overflow-y-auto">
          <Sidebar onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)} />
        </div>

        {/* Mobile Sidebar Drawer */}
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden bg-black/70 backdrop-blur-sm flex overlay-animate">
            <div className="w-72 bg-white dark:bg-[#0c0d12] h-full flex flex-col drawer-animate">
              <div className="p-4 flex justify-end border-b border-neutral-200 dark:border-neutral-800">
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white"
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

        {/* Main Center Stage — animated on every route change */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-20 md:pb-8">
          <main key={location.pathname} className="flex-1 page-animate">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav />

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
