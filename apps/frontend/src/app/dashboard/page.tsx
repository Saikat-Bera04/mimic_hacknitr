'use client';

import React from 'react';
import { DashboardPageContent } from '@/components/dashboard/DashboardPageContent';

export default function DashboardPage() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <DashboardPageContent />
    </React.Suspense>
  );
}
