export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center dot-grid-bg p-4">
      <div className="absolute top-8 flex items-center gap-2 border-2 border-foreground px-4 py-2 bg-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <span className="h-1.5 w-1.5 bg-[#ea580c] animate-pulse" />
        <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-foreground">
          MIMIC_SECURE_GATEWAY_v1.0.4
        </span>
      </div>
      {children}
      <div className="absolute bottom-8">
        <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">
          ENCRYPTION_LEVEL: AES-256_ACTIVE
        </span>
      </div>
    </div>
  );
}
