import React from 'react';
import { Outlet } from 'react-router-dom';
import { SmoothScrollProvider } from '../components/common/SmoothScroll';

export const LandingLayout: React.FC = () => {
  return (
    <SmoothScrollProvider>
      <div className="min-h-screen bg-[#e8ecef] text-neutral-900 flex flex-col antialiased selection:bg-neutral-900 selection:text-white overflow-x-hidden">
        {/* Full-bleed public landing page outlet */}
        <Outlet />
      </div>
    </SmoothScrollProvider>
  );
};

