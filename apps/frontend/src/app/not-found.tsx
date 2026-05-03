import Link from 'next/link';
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center dot-grid-bg px-4 relative overflow-hidden">
      <div className="w-full max-w-xl border-2 border-foreground bg-background z-10">
        {/* Terminal header */}
        <div className="flex items-center justify-between px-5 py-3 border-b-2 border-foreground">
          <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
            ERROR_404
          </span>
          <span className="text-[10px] tracking-[0.2em] uppercase text-[#ea580c] font-mono">
            NOT_FOUND
          </span>
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          <div className="mx-auto mb-4 h-12 w-12 border-2 border-[#ea580c] flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-[#ea580c]" />
          </div>
          <h1 className="text-2xl md:text-3xl font-mono font-bold tracking-tight uppercase mb-2 text-foreground">
            Page Not Found
          </h1>
          <p className="text-xs font-mono text-muted-foreground leading-relaxed mb-6">
            The page you are trying to open does not exist or may have been moved.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="outline" className="border-2 border-foreground bg-background hover:bg-foreground/5 text-foreground font-mono text-xs tracking-wider uppercase rounded-none">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back Home
              </Link>
            </Button>
            <Button asChild className="bg-foreground text-background hover:bg-foreground/90 font-mono text-xs tracking-wider uppercase rounded-none border-2 border-foreground">
              <Link href="/dashboard">
                <Home className="h-4 w-4 mr-2" />
                Open Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
