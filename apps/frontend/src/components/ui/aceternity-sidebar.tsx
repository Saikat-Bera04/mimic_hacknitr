
'use client';
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Bot,
  BrainCircuit,
  FileText,
  Home,
  MessageSquare,
  ScrollText,
  User,
  UserPlus,
  Palette,
  Sparkles,
  Menu,
  ClipboardList,
  Cpu,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Logo } from '../shared/Logo';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import Image from 'next/image';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from './button';
import { useClerk } from '@clerk/nextjs';

interface SidebarLink {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const links: SidebarLink[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <Home className="h-5 w-5 shrink-0" />,
  },
  {
    label: 'Train Avatar',
    href: '/dashboard?view=train-avatar',
    icon: <Bot className="h-5 w-5 shrink-0" />,
  },
  {
    label: 'Create Avatar',
    href: '/dashboard?view=create-avatar',
    icon: <Sparkles className="h-5 w-5 shrink-0" />,
  },
  {
    label: 'Invite Participant',
    href: '/dashboard?view=invite',
    icon: <UserPlus className="h-5 w-5 shrink-0" />,
  },
  {
    label: 'Training Results',
    href: '/dashboard?view=training-results',
    icon: <ClipboardList className="h-5 w-5 shrink-0" />,
  },
  {
    label: 'Docs',
    href: '/dashboard?view=docs',
    icon: <FileText className="h-5 w-5 shrink-0" />,
  },
];

interface SidebarDemoProps {
  isMobileNavOpen?: boolean;
  setIsMobileNavOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}

export function SidebarDemo({ isMobileNavOpen, setIsMobileNavOpen }: SidebarDemoProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const { signOut } = useClerk();

  const effectiveOpen = isMobile ? isMobileNavOpen : open;
  const setEffectiveOpen = isMobile ? setIsMobileNavOpen : setOpen;

  return (
    <Sidebar open={effectiveOpen || false} setOpen={setEffectiveOpen || (() => { })} isMobile={isMobile}>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          {effectiveOpen ? <SidebarLogoFull /> : <LogoIcon />}
          <div className="mt-8 flex flex-col gap-1">
            {links.map((link, idx) => (
              <SidebarLinkItem key={idx} link={link} open={effectiveOpen || false} />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 mt-auto pt-6 border-t-2 border-foreground/10">
          <SidebarLinkItem
            link={{
              label: 'Profile',
              href: '/dashboard?view=profile',
              icon: <User className="h-5 w-5 shrink-0" />,
            }}
            open={effectiveOpen || false}
          />
          <button
            onClick={() => signOut({ redirectUrl: '/signin' })}
            className={cn(
              'group/link flex items-center justify-start gap-4 px-3 py-3 text-[11px] font-mono tracking-[0.2em] uppercase transition-all duration-200 border-2 border-transparent',
              'text-muted-foreground hover:text-foreground hover:bg-foreground/5 hover:border-foreground/20'
            )}
          >
            <div className="h-7 w-7 border-2 border-foreground bg-foreground/10 flex items-center justify-center shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </div>
            <AnimatePresence>
              {effectiveOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="whitespace-pre overflow-hidden"
                >
                  SIGN_OUT
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </SidebarBody>
    </Sidebar>
  );
}

/* ── Full logo for expanded sidebar ── */
function SidebarLogoFull() {
  return (
    <Link href="/" className="relative z-20 flex items-center gap-3 py-2 px-1">
      <Cpu size={16} strokeWidth={1.5} className="text-foreground" />
      <span className="text-xs font-mono tracking-[0.15em] uppercase font-bold text-foreground">
        MIMIC
      </span>
    </Link>
  );
}

export const LogoIcon = () => {
  return (
    <Link
      href="/"
      className="relative z-20 flex items-center justify-center py-1"
    >
      <Cpu size={20} strokeWidth={1.5} className="text-foreground" />
    </Link>
  );
};

type SidebarProps = {
  children: React.ReactNode;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isMobile: boolean;
};

export const Sidebar = ({ children, open, setOpen, isMobile }: SidebarProps) => {
  if (isMobile) {
    return (
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-foreground/40 backdrop-blur-md z-40"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={cn(
                'fixed top-0 left-0 h-full z-50 flex flex-col justify-between bg-background border-r-4 border-foreground p-6 w-[280px]'
              )}
            >
              {children}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <motion.div
      animate={{
        width: open ? '260px' : '90px',
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 40,
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className={cn(
        'relative z-20 flex h-full flex-col justify-between bg-background border-r-2 border-foreground p-6'
      )}
    >
      {children}
    </motion.div>
  );
};
export const SidebarBody = (props: React.ComponentProps<'div'>) => {
  return (
    <div
      {...props}
      className={cn('flex h-full flex-1 flex-col', props.className)}
    />
  );
};

export const SidebarLinkItem = ({ link, open }: { link: SidebarLink, open: boolean }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const currentView = searchParams.get('view');
    if (link.href === '/dashboard' && !currentView && pathname === '/dashboard') {
      setIsActive(true);
      return;
    }
    if (link.href.includes('?view=')) {
      const linkView = new URLSearchParams(link.href.split('?')[1]).get('view');
      setIsActive(currentView === linkView);
    } else {
      setIsActive(pathname === link.href && !link.href.includes('?'));
    }
  }, [pathname, searchParams, link.href]);


  return (
    <Link
      href={link.href}
      className={cn(
        'group/link flex items-center justify-start gap-4 px-3 py-3 text-[11px] font-mono tracking-[0.2em] uppercase transition-all duration-200 border-2 border-transparent',
        'text-muted-foreground hover:text-foreground hover:bg-foreground/5 hover:border-foreground/20',
        isActive &&
        'bg-foreground text-background font-bold border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-foreground hover:text-background translate-x-[-2px] translate-y-[-2px]'
      )}
    >
      <div className="flex shrink-0 items-center justify-center">
        {React.cloneElement(link.icon as React.ReactElement<{ className?: string }>, {
          className: cn(
            (link.icon as React.ReactElement<{ className?: string }>).props.className,
            'h-5 w-5 transition-colors duration-200',
            isActive ? 'text-background' : 'text-muted-foreground group-hover/link:text-foreground'
          ),
        })}
      </div>

      <AnimatePresence>
        {open && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="whitespace-pre overflow-hidden"
          >
            {link.label.replace(" ", "_")}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
};

// Keep backward compat export
export { SidebarLinkItem as SidebarLink };
