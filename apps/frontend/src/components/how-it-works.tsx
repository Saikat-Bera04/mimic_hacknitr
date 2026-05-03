"use client"

import { motion } from "framer-motion"
import { Upload, Brain, MessageSquare, Sparkles } from "lucide-react"

const ease = [0.22, 1, 0.36, 1] as const

function BlinkDot() {
  return <span className="inline-block h-2 w-2 bg-[#ea580c] animate-blink" />
}

const STEPS = [
  {
    icon: Upload,
    step: "01",
    title: "UPLOAD MEMORIES",
    description:
      "Share photos, stories, voice recordings, and text conversations. The more you share, the more accurate the clone.",
  },
  {
    icon: Brain,
    step: "02",
    title: "TRAIN THE AI",
    description:
      "Our AI processes the data to understand personality patterns, speech style, emotional tone, and unique mannerisms.",
  },
  {
    icon: MessageSquare,
    step: "03",
    title: "START TALKING",
    description:
      "Chat with your digital clone via text or voice. Ask questions, share stories, or simply reminisce together.",
  },
  {
    icon: Sparkles,
    step: "04",
    title: "KEEP GROWING",
    description:
      "The clone evolves with every conversation. Invite friends and family to add their own memories and perspectives.",
  },
]

const TESTIMONIALS = [
  {
    quote: "I trained a clone of my late grandmother. Hearing her stories in her voice again... it changed everything.",
    author: "Sarah K.",
    role: "Early Adopter",
  },
  {
    quote: "We use MIMIC to preserve institutional knowledge from retiring team leads. It's like they never left.",
    author: "Marcus T.",
    role: "CTO, DevScale",
  },
  {
    quote: "My kids can now talk to their great-grandfather who they never met. This technology is pure magic.",
    author: "Priya M.",
    role: "Family Historian",
  },
]

export function HowItWorks() {
  return (
    <section className="w-full px-6 py-20 lg:px-12">
      {/* Section label */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease }}
        className="flex items-center gap-4 mb-8"
      >
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
          {"// SECTION: HOW_IT_WORKS"}
        </span>
        <div className="flex-1 border-t border-border" />
        <BlinkDot />
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
          003
        </span>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease }}
        className="mb-12"
      >
        <h2 className="text-2xl lg:text-3xl font-mono font-bold tracking-tight uppercase text-foreground text-balance">
          Four steps to <span className="text-[#ea580c]">immortality</span>
        </h2>
        <p className="text-xs lg:text-sm font-mono text-muted-foreground leading-relaxed mt-3 max-w-lg">
          Creating a digital clone is simple. Upload, train, and talk — all within minutes.
        </p>
      </motion.div>

      {/* Steps grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-2 border-foreground">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.step}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: i * 0.1, duration: 0.6, ease }}
            className={`group flex flex-col p-6 ${
              i < STEPS.length - 1 ? "border-b-2 md:border-b-0 md:border-r-2 border-foreground" : ""
            } ${i >= 2 ? "lg:border-b-0" : ""} hover:bg-foreground/5 transition-colors duration-300`}
          >
            {/* Step number and icon */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] tracking-[0.2em] uppercase text-[#ea580c] font-mono font-bold">
                STEP_{step.step}
              </span>
              <step.icon
                size={20}
                strokeWidth={1.5}
                className="text-muted-foreground group-hover:text-foreground transition-colors duration-300"
              />
            </div>

            {/* Title */}
            <h3 className="text-sm font-mono font-bold tracking-wider uppercase mb-3 text-foreground">
              {step.title}
            </h3>

            {/* Description */}
            <p className="text-xs font-mono text-muted-foreground leading-relaxed">
              {step.description}
            </p>

            {/* Bottom decorative line */}
            <div className="mt-auto pt-6">
              <div className="h-[2px] w-8 bg-foreground/20 group-hover:w-full group-hover:bg-[#ea580c] transition-all duration-500" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Testimonials */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, delay: 0.2, ease }}
        className="mt-16"
      >
        <div className="flex items-center gap-4 mb-8">
          <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
            {"// USER_FEEDBACK"}
          </span>
          <div className="flex-1 border-t border-border" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-2 border-foreground">
          {TESTIMONIALS.map((testimonial, i) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5, ease }}
              className={`flex flex-col p-6 ${
                i < TESTIMONIALS.length - 1 ? "border-b-2 md:border-b-0 md:border-r-2 border-foreground" : ""
              }`}
            >
              {/* Quote mark */}
              <span className="text-3xl font-mono text-[#ea580c] leading-none mb-3">&ldquo;</span>

              {/* Quote text */}
              <p className="text-xs font-mono text-foreground/80 leading-relaxed flex-1 mb-4">
                {testimonial.quote}
              </p>

              {/* Author */}
              <div className="flex items-center gap-2 pt-3 border-t-2 border-foreground/20">
                <span className="h-1.5 w-1.5 bg-[#ea580c]" />
                <span className="text-[10px] tracking-[0.15em] uppercase font-mono font-bold text-foreground">
                  {testimonial.author}
                </span>
                <span className="text-[10px] tracking-[0.1em] font-mono text-muted-foreground">
                  / {testimonial.role}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
