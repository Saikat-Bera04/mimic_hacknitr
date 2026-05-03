import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Brain, Database, MessageSquare, Shield } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip-card";

const features = [
  {
    icon: <Brain className="w-5 h-5 text-primary" />,
    title: "Continuous Learning",
    description: "The clone learns and evolves from every text and voice interaction, growing more accurate over time.",
  },
  {
    icon: <Database className="w-5 h-5 text-primary" />,
    title: "Structured Memory",
    description: "Opinions, preferences, and behaviors are stored as structured memories, enabling complex and consistent personality traits.",
  },
  {
    icon: <MessageSquare className="w-5 h-5 text-primary" />,
    title: "Engaging Chat Interface",
    description: "Converse with the clone, provide feedback, and watch its personality unfold in a seamless chat experience.",
  },
  {
    icon: <Shield className="w-5 h-5 text-primary" />,
    title: "Privacy First",
    description: "With a strict training model, the digital identity is shaped only by the memories you provide. No crowdsourcing, no data leaks.",
  },
];

export function FeaturesSection() {
    return (
        <section className="w-full py-24 md:py-32 bg-background">
            <div className="container px-4 md:px-6 mx-auto max-w-6xl">
                <div className="flex flex-col items-start space-y-4 mb-16">
                    <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl text-foreground">
                        A New Era of Digital Cloning
                    </h2>
                    <p className="max-w-[680px] text-muted-foreground text-lg">
                        MIMIC isn't just another chatbot. It's a suite of powerful, privacy-focused features designed to create a true digital clone of anyone you care about.
                    </p>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:gap-8">
                    {features.map((feature, index) => (
                        <div 
                            key={index} 
                            className="group relative rounded-xl border border-border bg-card p-6 sm:p-8 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_4px_16px_rgba(0,0,0,0.5)] hover:border-border/80"
                        >
                            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/50 border border-border/50">
                                {feature.icon}
                            </div>
                            <div className="mb-2 flex items-center gap-2">
                                <h3 className="text-lg font-medium text-foreground">
                                    {feature.title}
                                </h3>
                                {feature.title === "Privacy First" && (
                                    <Tooltip
                                        containerClassName="inline-flex"
                                        content={
                                            <div className="max-w-[220px] space-y-2">
                                                <p className="text-sm font-semibold text-neutral-100">Private by design</p>
                                                <p className="text-xs text-neutral-300 leading-relaxed">
                                                    Only the memories you approve are used. No public training, no crowdsourced identity drift.
                                                </p>
                                            </div>
                                        }
                                    >
                                        <span className="cursor-help rounded-full border border-border/60 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground">
                                            Why?
                                        </span>
                                    </Tooltip>
                                )}
                            </div>
                            <p className="text-sm leading-relaxed text-muted-foreground">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
