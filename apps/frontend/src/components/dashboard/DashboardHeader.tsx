
"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Home, Bot, FileText, UserPlus, User, Sparkles, Menu, BrainCircuit, ClipboardList } from "lucide-react";
import { ColorSwitcher } from "../theme/ColorSwitcher";
import { Button } from "../ui/button";
import { ClientOnly } from "../shared/ClientOnly";

const viewMap: Record<string, { title: string; icon: React.ReactElement }> = {
  dashboard:         { title: "Dashboard",       icon: <Home className="h-4 w-4" />         },
  "train-avatar":    { title: "Train Avatar",    icon: <BrainCircuit className="h-4 w-4" /> },
  docs:              { title: "Documentation",   icon: <FileText className="h-4 w-4" />      },
  "create-avatar":   { title: "Create Avatar",   icon: <Sparkles className="h-4 w-4" />     },
  invite:            { title: "Invite Trainer",  icon: <UserPlus className="h-4 w-4" />     },
  "training-results":{ title: "Training Results",icon: <ClipboardList className="h-4 w-4" />},
  profile:           { title: "Profile",         icon: <User className="h-4 w-4" />          },
};

interface DashboardHeaderProps {
  onMobileMenuClick: () => void;
}

export function DashboardHeader({ onMobileMenuClick }: DashboardHeaderProps) {
  const searchParams = useSearchParams();
  const [currentView, setCurrentView] = useState(viewMap.dashboard);

  useEffect(() => {
    const view = searchParams.get("view") || "dashboard";
    setCurrentView(viewMap[view] ?? viewMap.dashboard);
  }, [searchParams]);

  return (
    <header className="flex h-16 items-center justify-between border-b-2 border-foreground bg-background px-6 md:px-8">
      <div className="flex items-center gap-6">
        {/* Mobile menu trigger */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-10 w-10 border-2 border-foreground rounded-none text-foreground hover:bg-foreground/5"
          onClick={onMobileMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Icon badge */}
        <div className="hidden md:flex h-10 w-10 items-center justify-center border-2 border-foreground text-foreground bg-foreground/5">
          {React.cloneElement(currentView.icon as React.ReactElement<any>, { className: "h-5 w-5" })}
        </div>

        {/* Title area */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-mono font-bold tracking-[0.2em] uppercase text-foreground">
              {currentView.title.replace(" ", "_")}
            </h2>
          </div>
          <p className="text-[9px] font-mono text-muted-foreground hidden sm:block tracking-[0.1em] uppercase">
            PATH_ROOT: DASHBOARD / {currentView.title.toUpperCase().replace(" ", "_")}
          </p>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-6">
        <div className="hidden lg:flex items-center gap-2 border-2 border-foreground/10 px-3 py-1.5 bg-foreground/5">
          <div className="h-2 w-2 rounded-full bg-green-600 animate-pulse" />
          <span className="text-[10px] tracking-[0.2em] uppercase font-mono text-foreground font-bold">
            SECURE_CONNECTION
          </span>
        </div>
        <ClientOnly>
          <ColorSwitcher />
        </ClientOnly>
      </div>
    </header>
  );
}
