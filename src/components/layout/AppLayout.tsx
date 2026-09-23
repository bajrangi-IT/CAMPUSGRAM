import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SidebarLeft } from './SidebarLeft';
import { SidebarRight } from './SidebarRight';
import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';
import { CreateModal } from './CreateModal';
import { Drawer, DrawerContent } from '@/components/ui/Drawer';

export const AppLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const location = useLocation();

  // Pages where right sidebar is hidden to give full focus (e.g. settings, messages)
  const isFullWidthPage =
    location.pathname.startsWith('/settings') ||
    location.pathname.startsWith('/messages') ||
    location.pathname.startsWith('/onboarding');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Top Mobile Navbar */}
      <Navbar
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onCreateClick={() => setIsCreateModalOpen(true)}
      />

      {/* Mobile Slide-out Navigation Drawer */}
      <Drawer open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <DrawerContent side="left" className="p-0 w-80 max-w-[85vw]">
          <div className="h-full overflow-y-auto">
            <SidebarLeft
              onCreateClick={() => {
                setIsMobileMenuOpen(false);
                setIsCreateModalOpen(true);
              }}
            />
          </div>
        </DrawerContent>
      </Drawer>

      {/* Main Grid Shell */}
      <div className="mx-auto flex max-w-7xl justify-center">
        {/* Left Column (Desktop) */}
        <SidebarLeft onCreateClick={() => setIsCreateModalOpen(true)} />

        {/* Center Primary Content Column */}
        <main
          className={`flex-1 min-w-0 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 pb-24 lg:pb-12 ${
            isFullWidthPage ? 'max-w-4xl' : 'max-w-3xl xl:max-w-2xl'
          }`}
        >
          <Outlet />
        </main>

        {/* Right Column (Desktop Contextual Column) */}
        {!isFullWidthPage && <SidebarRight />}
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Global Create Action Hub Modal */}
      <CreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};
