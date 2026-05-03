'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { DocsPage } from "@/components/dashboard/DocsPage";
import { ProfilePage } from '@/components/dashboard/ProfilePage';
import { WelcomeDashboard } from './WelcomeDashboard';
import { CreateAvatarPage } from './CreateAvatar';
import { InviteParticipantPage } from './InviteParticipant';
import { AvatarTraining } from './AvatarTraining';
import { TrainingResultsPage } from './TrainingResults';

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
      case "training-results":
        return <TrainingResultsPage />;
      default:
        return <WelcomeDashboard />;
    }
  };

  return <div className="w-full h-full flex items-start justify-center py-2 md:py-4">{renderView()}</div>;
}


