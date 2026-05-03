"use client"

import Image from "next/image"
import { motion } from "framer-motion"

const ease = [0.22, 1, 0.36, 1] as const

const AVATARS = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  src: `/avators/${i + 1}.png`,
  name: `Clone #${String(i + 1).padStart(3, "0")}`,
}))

/* split into two rows for marquee */
const ROW_1 = AVATARS.slice(0, 10)
const ROW_2 = AVATARS.slice(10, 20)

function BlinkDot() {
  return <span className="inline-block h-2 w-2 bg-[#ea580c] animate-blink" />
}

function AvatarCard({ avatar, index }: { avatar: typeof AVATARS[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.03, duration: 0.5, ease }}
      className="group relative flex-shrink-0 w-[140px] h-[180px] md:w-[160px] md:h-[200px] border-2 border-foreground overflow-hidden bg-background cursor-pointer"
    >
      {/* Avatar image */}
      <div className="relative w-full h-[140px] md:h-[160px] overflow-hidden">
        <Image
          src={avatar.src}
          alt={avatar.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="160px"
        />
        {/* Scanline overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-foreground/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {/* Status indicator */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="h-1.5 w-1.5 bg-[#ea580c] animate-pulse" />
          <span className="text-[8px] tracking-[0.2em] uppercase font-mono text-[#ea580c]">
            ACTIVE
          </span>
        </div>
      </div>

      {/* Bottom label */}
      <div className="flex items-center justify-between px-3 py-2 border-t-2 border-foreground">
        <span className="text-[9px] tracking-[0.15em] uppercase font-mono text-foreground">
          {avatar.name}
        </span>
        <span className="text-[9px] tracking-[0.1em] font-mono text-muted-foreground">
          ●
        </span>
      </div>
    </motion.div>
  )
}

function MarqueeRow({ avatars, direction = "left" }: { avatars: typeof AVATARS; direction?: "left" | "right" }) {
  const doubled = [...avatars, ...avatars]
  return (
    <div className="flex overflow-hidden">
      <motion.div
        className="flex gap-0"
        animate={{
          x: direction === "left" ? [0, -(avatars.length * 162)] : [-(avatars.length * 162), 0],
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: 40,
            ease: "linear",
          },
        }}
      >
        {doubled.map((avatar, i) => (
          <AvatarCard key={`${avatar.id}-${i}`} avatar={avatar} index={i % avatars.length} />
        ))}
      </motion.div>
    </div>
  )
}

export function AvatarShowcase() {
  return (
    <section className="w-full py-20 overflow-hidden">
      {/* Section label */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease }}
        className="flex items-center gap-4 mb-8 px-6 lg:px-12"
      >
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
          {"// SECTION: AVATAR_GALLERY"}
        </span>
        <div className="flex-1 border-t border-border" />
        <BlinkDot />
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
          007
        </span>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease }}
        className="flex flex-col items-center text-center mb-12 px-6"
      >
        <h2 className="text-2xl lg:text-4xl font-pixel tracking-tight uppercase text-foreground mb-3">
          Meet the <span className="text-[#ea580c]">clones</span>
        </h2>
        <p className="text-xs lg:text-sm font-mono text-muted-foreground max-w-lg leading-relaxed">
          Each avatar is a unique digital persona — trained on real memories, real voices, and real personalities. Browse our growing community of digital clones.
        </p>
      </motion.div>

      {/* Marquee rows */}
      <div className="flex flex-col gap-0 border-y-2 border-foreground">
        <MarqueeRow avatars={ROW_1} direction="left" />
        <MarqueeRow avatars={ROW_2} direction="right" />
      </div>

      {/* Bottom stats bar */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3, duration: 0.5, ease }}
        className="flex flex-wrap items-center justify-center gap-8 mt-8 px-6"
      >
        {[
          { label: "TOTAL_CLONES", value: "24,789" },
          { label: "COUNTRIES", value: "42" },
          { label: "MEMORIES_STORED", value: "1.2M" },
        ].map((stat) => (
          <div key={stat.label} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 bg-[#ea580c]" />
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
              {stat.label}:
            </span>
            <span className="text-sm font-mono font-bold text-foreground">
              {stat.value}
            </span>
          </div>
        ))}
      </motion.div>
    </section>
  )
}
