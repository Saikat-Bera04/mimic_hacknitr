import { Suspense } from 'react';
import { DashboardPageContent } from '@/components/dashboard/DashboardPageContent';
import { Loader2 } from 'lucide-react';

// Prevent static generation for this page since it uses useSearchParams
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="border-2 border-foreground px-6 py-5 flex items-center gap-3 bg-background">
          <Loader2 className="h-5 w-5 animate-spin text-[#ea580c]" />
          <span className="text-xs font-mono text-muted-foreground tracking-wider uppercase">Loading workspace...</span>
        </div>
      </div>
    }>
      <DashboardPageContent />
    </Suspense>
  );
}
