"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Button } from "../ui/button"

const navItems = [
  { label: "Home", href: "/" },
  { label: "Dashboard", href: "/dashboard" },
]

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()

  if (pathname.startsWith('/dashboard')) {
    return null;
  }

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-200 ease-out flex items-center",
        isScrolled ? "border-b border-border bg-background/80 backdrop-blur-md" : "bg-transparent",
      )}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                M
            </div>
            <span className="text-foreground font-semibold tracking-tight">
                Mimic
            </span>
        </Link>
          
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-colors rounded-md",
                  isActive(item.href)
                    ? "text-foreground bg-secondary/50"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/30",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          
          <div className="h-4 w-px bg-border" />
          
          <div className="flex items-center gap-3">
            <Link href="/signin" passHref>
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/signup" passHref>
              <Button variant="default" size="sm">Get Started</Button>
            </Link>
          </div>
        </div>

        {/* Mobile Menu Toggle (simplified for brevity) */}
        <div className="md:hidden flex items-center gap-4">
            <Link href="/signin" passHref>
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
        </div>
      </div>
    </header>
  )
}
