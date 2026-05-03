"use client"

import Link from "next/link"
import { Button } from "../ui/button"
import TerminalDemo from "@/components/terminal-demo"
import { ArrowRight, Sparkles } from "lucide-react"

export function Hero() {
  return (
    <section className="relative px-4 sm:px-6 pt-32 sm:pt-48 pb-24 sm:pb-32 flex flex-col items-center justify-center text-center min-h-[85vh] overflow-hidden">
      {/* Dot grid background */}
      <div className="pointer-events-none absolute inset-0 dot-grid opacity-40" />

      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-primary/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-1/3 left-1/4 w-[300px] h-[300px] rounded-full bg-violet-600/8 blur-[100px]" />

      <div className="relative mx-auto max-w-4xl space-y-8">
        <div className="space-y-6 animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-sm px-4 py-1.5 text-xs font-medium text-white/60">
            <Sparkles className="h-3 w-3 text-primary" />
            MIMIC v1.0 — now available
            <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse ml-0.5" />
          </div>

          {/* Headline */}
          <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl leading-[1.08]">
            <span className="gradient-text">Clone anyone,</span>
            <br className="hidden sm:block" />
            <span className="text-white/35">share their memories.</span>
          </h1>

          {/* Subtext */}
          <p className="mx-auto max-w-xl text-base sm:text-lg leading-relaxed text-white/45">
            Create a digital clone of your friends, relatives, or anyone. Preserve their
            memories, communication style, and interact with them anytime.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/signup" passHref>
            <Button
              className="group h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium shadow-[0_0_24px_rgba(0,102,255,0.35)] hover:shadow-[0_0_32px_rgba(0,102,255,0.5)] transition-all duration-200 border-0 w-full sm:w-auto"
            >
              Get started free
              <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Button>
          </Link>
          <Link href="/signin" passHref>
            <Button
              variant="outline"
              className="h-11 px-6 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20 text-white/70 hover:text-white font-medium transition-all duration-200 w-full sm:w-auto"
            >
              Sign in
            </Button>
          </Link>
        </div>

        {/* Social proof micro-line */}
        <p className="text-xs text-white/25 tracking-wide">
          No credit card required &nbsp;·&nbsp; Free to get started
        </p>
      </div>

      {/* Terminal preview */}
      <div className="relative mt-24 w-full max-w-5xl mx-auto">
        <div className="absolute inset-x-0 -top-12 h-32 bg-gradient-to-b from-transparent to-primary/5 blur-2xl -z-10 rounded-full" />
        <div className="rounded-2xl border border-white/[0.07] shadow-[0_0_0_1px_rgba(0,0,0,0.3),0_32px_80px_rgba(0,0,0,0.6)] overflow-hidden">
          <TerminalDemo />
        </div>
      </div>
    </section>
  )
}
