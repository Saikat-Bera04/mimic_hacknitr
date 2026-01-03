import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { Hero } from "@/components/landing/Hero";
import { AboutSection } from "@/components/landing/AboutSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { Suspense } from "react";
import { MacbookScrollDemo } from "@/components/landing/MacbookScroll";
import { HeroParallaxDemo } from "@/components/landing/HeroParallaxDemo";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col relative bg-background">
      <Suspense>
        <Header />
      </Suspense>
      <main className="flex-1">
        <Hero />
        <AboutSection />
        <div className="relative">
          <MacbookScrollDemo />
        </div>
        <FeaturesSection />
        <div className="relative">
          <HeroParallaxDemo />
        </div>
      </main>
      <Footer />
    </div>
  );
}
