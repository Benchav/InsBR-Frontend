import { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';
import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';

interface DashboardLayoutProps {
  children: ReactNode;
}

import { MobileNav } from './MobileNav';

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarVisible, setIsDesktopSidebarVisible] = useState(true);

  const layoutPadding = cn(
    'transition-all duration-200',
    isDesktopSidebarVisible ? 'md:pl-64' : 'md:pl-0'
  );

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar
        mobileOpen={isMobileSidebarOpen}
        onMobileOpenChange={setIsMobileSidebarOpen}
        desktopVisible={isDesktopSidebarVisible}
      />
      <div className={layoutPadding}>
        <TopBar
          onOpenSidebar={() => setIsMobileSidebarOpen(true)}
          isDesktopSidebarVisible={isDesktopSidebarVisible}
          onToggleDesktopSidebar={() =>
            setIsDesktopSidebarVisible((prev) => !prev)
          }
        />
        <main className="p-4 md:p-6 pb-20 md:pb-6"> {/* Added pb-20 for MobileNav space */}
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
