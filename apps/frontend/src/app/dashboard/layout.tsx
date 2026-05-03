'use client';
import { SidebarDemo } from '@/components/ui/aceternity-sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import React, { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { BackendUserSync } from '@/components/auth/BackendUserSync';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMobile = useIsMobile();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="h-screen w-full overflow-hidden dot-grid-bg">
      <BackendUserSync />
      <div className={cn("relative z-10 flex h-full w-full", isMobile && 'flex-col')}>
        <SidebarDemo isMobileNavOpen={isMobileNavOpen} setIsMobileNavOpen={setIsMobileNavOpen} />
        <div className={cn(
          "flex flex-1 flex-col overflow-hidden bg-transparent transition-all duration-300",
          isMobileNavOpen && isMobile && "blur-sm"
        )}>
          <DashboardHeader onMobileMenuClick={() => setIsMobileNavOpen(true)} />
          <main className="flex-1 overflow-y-auto p-6 md:p-10">
            <div className="mx-auto max-w-7xl w-full min-h-full border-2 border-foreground bg-background p-6 md:p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
              {/* Terminal-style header bar */}
              <div className="flex items-center justify-between px-6 py-3 border-b-2 border-foreground mb-10 -mx-6 md:-mx-10 -mt-6 md:-mt-10 bg-foreground/5">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 bg-[#ea580c]" />
                  <span className="text-[10px] tracking-[0.2em] uppercase text-foreground font-mono font-bold">
                    MIMIC_OS_v1.0.0
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
                    STATUS: ACTIVE
                  </span>
                  <span className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
              </div>
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
