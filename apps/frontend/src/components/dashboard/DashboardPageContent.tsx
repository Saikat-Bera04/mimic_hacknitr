
'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { DocsPage } from "@/components/dashboard/DocsPage";
import { ProfilePage } from '@/components/dashboard/ProfilePage';
import { WelcomeDashboard } from './WelcomeDashboard';
import { CreateAvatarPage } from './CreateAvatar';
import { InviteParticipantPage } from './InviteParticipant';
import { AvatarTraining } from './AvatarTraining';

export function DashboardPageContent() {
  const searchParams = useSearchParams();
  const view = searchParams.get('view');
  
  const renderView = () => {
    switch (view) {
      case "train-avatar":
        return <AvatarTraining />;
      case "docs":
        return <DocsPage />;
      case "create-avatar":
        return <CreateAvatarPage />;
      case "profile":
        return <ProfilePage />;
      case "invite":
        return <InviteParticipantPage />;
      default:
        return <WelcomeDashboard />;
    }
  };

  return <div className="w-full h-full">{renderView()}</div>;
}

    
