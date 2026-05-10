"use client"

import { Cpu, Menu } from "lucide-react"
import { motion } from "framer-motion"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"

export function Navbar() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full px-4 pt-4 lg:px-8 lg:pt-8"
    >
      <nav className="w-full border-2 border-foreground bg-background px-6 py-4 lg:px-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="flex items-center gap-3 group cursor-pointer"
            >
              <div className="p-1.5 border-2 border-foreground bg-foreground/5 group-hover:bg-[#ea580c] group-hover:text-background transition-colors">
                <Cpu size={18} strokeWidth={2} />
              </div>
              <span className="text-sm font-mono tracking-[0.2em] uppercase font-bold text-foreground">
                MIMIC
              </span>
            </motion.div>
          </Link>

          {/* Center nav links */}
          <div className="hidden md:flex items-center gap-10">
            {["Platform", "Pricing", "Enterprise", "Resources", "Company"].map((link, i) => (
              <motion.a
                key={link}
                href={link === "Pricing" ? "/pricing" : "#"}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="text-[10px] font-mono tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-all duration-200 hover:underline underline-offset-4 decoration-2"
              >
                {link}
              </motion.a>
            ))}
          </div>

          {/* Right side: Login + CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="flex items-center gap-6"
          >
            <div className="hidden sm:block h-10 w-px bg-foreground/10 mx-2" />
            
            <Link
              href="/signin"
              className="hidden sm:block text-[10px] font-mono tracking-[0.2em] uppercase text-foreground font-bold hover:text-[#ea580c] transition-colors duration-200"
            >
              LOG_IN
            </Link>
            
            <Link
              href="/signup"
              className="bg-foreground text-background px-6 py-2.5 text-[10px] font-mono tracking-[0.2em] uppercase font-bold border-2 border-foreground hover:bg-[#ea580c] hover:border-[#ea580c] transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-y-0 active:translate-y-1"
            >
              GET_STARTED
            </Link>
          </motion.div>
        </div>
      </nav>
    </motion.div>
  )
}
