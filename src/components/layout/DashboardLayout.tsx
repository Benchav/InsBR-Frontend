import { ReactNode, useState } from 'react';
import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';

interface DashboardLayoutProps {
  children: ReactNode;
}

import { MobileNav } from './MobileNav';

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar mobileOpen={isMobileSidebarOpen} onMobileOpenChange={setIsMobileSidebarOpen} />
      <div className="md:pl-64">
        <TopBar onOpenSidebar={() => setIsMobileSidebarOpen(true)} />
        <main className="p-4 md:p-6 pb-20 md:pb-6"> {/* Added pb-20 for MobileNav space */}
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
