import { CheckCircle2 } from 'lucide-react';
import SecurityStatus from '../dashboard/SecurityStatus';
import type { SecurityStatus as SecurityStatusType } from '@/types/dashboard';

const statuses: SecurityStatusType[] = [
    {
      title: "GUARD BOTS",
      value: "124/124",
      status: "[RUNNING...]",
      variant: "success",
    },
    {
      title: "FIREWALL",
      value: "99.9%",
      status: "[BLOCKED]",
      variant: "success",
    },
    {
      title: "HTML WARNINGS",
      value: "12042",
      status: "[ACCESSIBILITY]",
      variant: "warning",
    },
];

export function AboutSection() {
  return (
    <section className="w-full py-24 md:py-32 bg-background border-t border-border/50">
      <div className="container px-4 md:px-6 mx-auto max-w-6xl">
        <div className="grid items-center gap-16 md:grid-cols-2">
          
         <div className="w-full flex items-center justify-center">
            <SecurityStatus statuses={statuses} />
         </div>
          
          <div className="flex flex-col space-y-8">
            <div className="space-y-4">
                <div className="inline-flex items-center rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                    Our Solution
                </div>
                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl text-foreground">
                    Clone Anyone You Know
                </h2>
                <p className="text-lg text-muted-foreground max-w-[480px]">
                    We believe you should be able to preserve the memories and personality of anyone you care about. Create a digital clone of your friends, relatives, or partner.
                </p>
            </div>
            
            <ul className="grid gap-6 text-muted-foreground">
                <li className="flex items-start gap-4">
                    <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <h4 className="text-base font-medium text-foreground mb-1">Hyper-Personalization</h4>
                        <p className="text-sm leading-relaxed">Train the clone with their specific memories, chat history, and communication style.</p>
                    </div>
                </li>
                 <li className="flex items-start gap-4">
                    <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <h4 className="text-base font-medium text-foreground mb-1">Adaptive Memory</h4>
                        <p className="text-sm leading-relaxed">The clone continuously evolves through memory-based learning, capturing their essence.</p>
                    </div>
                </li>
                 <li className="flex items-start gap-4">
                    <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                       <h4 className="text-base font-medium text-foreground mb-1">Immutable Trust</h4>
                        <p className="text-sm leading-relaxed">Your data remains private, building a digital personality that is truly authentic to them.</p>
                    </div>
                </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

    