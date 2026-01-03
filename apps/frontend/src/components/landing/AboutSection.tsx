import { CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
    <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
      <div className="container px-4 md:px-6">
        <div className="grid items-stretch justify-center gap-8 md:grid-cols-2 lg:gap-12">
          
         <div className="w-full h-full flex items-center justify-center">
            <SecurityStatus statuses={statuses} />
         </div>
          
          <Card className="card-glass flex flex-col">
            <CardHeader>
                <div className="inline-block rounded-lg bg-primary/10 text-primary px-3 py-1 text-sm mb-2 w-fit">Our Solution</div>
                <CardTitle className="text-2xl font-bold tracking-tighter sm:text-4xl font-headline" style={{color: 'var(--dynamic-text-color)'}}>One-to-One Connection</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="grid gap-4 text-muted-foreground text-base">
                    <li className="flex items-start gap-3">
                        <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                        <div>
                            <h4 className="font-semibold text-foreground" style={{color: 'var(--dynamic-text-color)'}}>Hyper-Personalization</h4>
                            <span>Strict one-to-one training ensures only you and one approved person shape your avatar.</span>
                        </div>
                    </li>
                     <li className="flex items-start gap-3">
                        <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                        <div>
                            <h4 className="font-semibold text-foreground" style={{color: 'var(--dynamic-text-color)'}}>Adaptive Memory</h4>
                            <span>Continuously evolves through memory-based learning, not model retraining.</span>
                        </div>
                    </li>
                     <li className="flex items-start gap-3">
                        <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                        <div>
                           <h4 className="font-semibold text-foreground" style={{color: 'var(--dynamic-text-color)'}}>Immutable Trust</h4>
                            <span>Your data remains private, building a digital personality that is truly yours.</span>
                        </div>
                    </li>
                </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

    