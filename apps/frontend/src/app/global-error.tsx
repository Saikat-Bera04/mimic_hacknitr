'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { AlertOctagon, RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.14),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.1),transparent_42%)] pointer-events-none" />
          <Card className="card-glass w-full max-w-xl border border-red-500/20 z-10">
            <CardHeader className="text-center">
              <div className="mx-auto mb-3 h-12 w-12 rounded-full border border-red-400/30 bg-red-500/10 flex items-center justify-center">
                <AlertOctagon className="h-6 w-6 text-red-400" />
              </div>
              <CardTitle className="text-2xl md:text-3xl">Something Went Wrong</CardTitle>
              <CardDescription>
                An unexpected error occurred. You can retry safely or return to the dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-center gap-3">
              <Button onClick={reset}>
                <RefreshCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button asChild variant="outline" className="border-white/20 bg-background/30 hover:bg-background/50">
                <Link href="/dashboard">
                  <Home className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  );
}
