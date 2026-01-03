import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const cardVariants = cva("rounded-xl border", {
  variants: {
    intent: {
      success: "border-green-500/40 text-green-300",
      warning: "border-yellow-500/40 text-yellow-300",
      destructive: "border-red-500/40 text-red-300",
      secondary: "border-border/40 text-muted-foreground",
    },
  },
  defaultVariants: {
    intent: "secondary",
  },
});

interface DashboardCardProps extends VariantProps<typeof cardVariants> {
  title: string;
  addon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function DashboardCard({
  title,
  addon,
  children,
  intent,
  className,
}: DashboardCardProps) {
  return (
    <div className={cn(cardVariants({ intent }), "bg-card/70 p-3 card-glass", className)}>
      <div className="flex justify-between items-center border-b border-current/30 pb-1 mb-2">
        <h3 className="text-xs font-bold uppercase tracking-widest text-current">
          {title}
        </h3>
        {addon}
      </div>
      {children}
    </div>
  );
}
