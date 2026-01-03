
"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Home, Bot, ScrollText, UserPlus, User, FileText, Sparkles, Menu, BrainCircuit } from "lucide-react";
import { ColorSwitcher } from "../theme/ColorSwitcher";
import { Button } from "../ui/button";
import { ClientOnly } from "../shared/ClientOnly";

const viewMap: { [key: string]: { title: string; icon: React.ReactElement } } = {
  dashboard: { title: "Dashboard", icon: <Home className="h-5 w-5" /> },
  "train-avatar": { title: "Train Avatar", icon: <BrainCircuit className="h-5 w-5" /> },
  docs: { title: "Documentation", icon: <FileText className="h-5 w-5" /> },
  "create-avatar": { title: "Create Avatar", icon: <Sparkles className="h-5 w-5" /> },
  "invite": { title: "Invite Participant", icon: <UserPlus className="h-5 w--5" /> },
  profile: { title: "User Profile", icon: <User className="h-5 w-5" /> },
};

interface DashboardHeaderProps {
  onMobileMenuClick: () => void;
}

export function DashboardHeader({ onMobileMenuClick }: DashboardHeaderProps) {
  const searchParams = useSearchParams();
  const [currentView, setCurrentView] = useState<{ title: string; icon: React.ReactElement }>({
    title: "Dashboard",
    icon: <Home className="h-5 w-5" />,
  });

  useEffect(() => {
    const view = searchParams.get("view") || "dashboard";
    setCurrentView(viewMap[view] || viewMap.dashboard);
  }, [searchParams]);

  return (
    <header className="flex h-12 items-center justify-between bg-neutral-900/80 backdrop-blur-sm px-4 md:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-foreground"
          onClick={onMobileMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="text-primary hidden md:block">{currentView.icon}</div>
        <h1 className="text-md font-semibold text-foreground" style={{color: 'var(--dynamic-text-color)'}}>
          {currentView.title}
        </h1>
      </div>
      <div className="flex items-center">
        <ClientOnly>
          <ColorSwitcher />
        </ClientOnly>
      </div>
    </header>
  );
}
