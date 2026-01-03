import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { KeyRound } from "lucide-react";
import { ColorChangingDots } from "@/components/shared/ColorChangingDots";

const features = [
  {
    icon: <ColorChangingDots />,
    title: "Continuous Learning",
    description: "Your avatar learns and evolves from every text and voice interaction, growing more personalized over time.",
  },
  {
    icon: <ColorChangingDots />,
    title: "Structured Memory",
    description: "Opinions, preferences, and behaviors are stored as structured memories, enabling complex and consistent personality traits.",
  },
  {
    icon: <ColorChangingDots />,
    title: "Engaging Chat Interface",
    description: "Converse with your avatar, provide feedback, and watch its personality unfold in a seamless chat experience.",
  },
  {
    icon: <ColorChangingDots />,
    title: "Privacy First",
    description: "With a strict one-to-one training model, your digital identity is shaped only by those you trust. No crowdsourcing, no data leaks.",
  },
];


export function FeaturesSection() {
    return (
        <section className="w-full py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                    <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Key Features</div>
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline" style={{color: 'var(--dynamic-text-color)'}}>A New Era of Digital Identity</h2>
                    <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                        EvoAvatar isn't just another chatbot. It's a suite of powerful, privacy-focused features designed to create a true digital extension of yourself.
                    </p>
                </div>
                <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none">
                    {features.map((feature, index) => (
                        <Card key={index} className="bg-background/50 hover:bg-background/80 transition-colors hover:shadow-lg hover:shadow-primary/10">
                            <CardHeader className="flex flex-row items-start gap-4">
                                <div className="h-8 w-8 flex items-center justify-center">{feature.icon}</div>
                                <div className="grid gap-1">
                                    <CardTitle className="font-headline" style={{color: 'var(--dynamic-text-color)'}}>{feature.title}</CardTitle>
                                    <CardDescription className="text-muted-foreground">{feature.description}</CardDescription>
                                </div>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
