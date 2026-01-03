
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

  const effectiveOpen = isMobile ? isMobileNavOpen : open;
  const setEffectiveOpen = isMobile ? setIsMobileNavOpen : setOpen;

  return (
    <Sidebar open={effectiveOpen || false} setOpen={setEffectiveOpen || (() => {})} isMobile={isMobile}>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          {effectiveOpen ? <Logo /> : <LogoIcon />}
          <div className="mt-8 flex flex-col gap-2">
            {links.map((link, idx) => (
              <SidebarLink key={idx} link={link} open={effectiveOpen || false} />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <SidebarLink
            link={{
              label: 'Profile',
              href: '/dashboard?view=profile',
              icon: <User className="h-5 w-5 shrink-0" />,
            }}
            open={effectiveOpen || false}
          />
           <SidebarLink
            link={{
              label: 'Sign Out',
              href: '/signin',
              icon: (
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarImage src="https://picsum.photos/seed/user1/200/200" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              ),
            }}
            open={effectiveOpen || false}
          />
        </div>
      </SidebarBody>
    </Sidebar>
  );
}
export const LogoIcon = () => {
  return (
    <Link
      href="/"
      className="relative z-20 flex items-center justify-center py-1"
    >
      <Image src="/mimic.png" alt="Mimic Logo" width={32} height={32} className="h-8 w-8" />
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
                    className="fixed inset-0 bg-black/50 z-40"
                />
                <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className={cn(
                        'fixed top-0 left-0 h-full z-50 flex flex-col justify-between bg-neutral-900 p-5 w-[240px]'
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
        width: open ? '240px' : '80px',
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 40,
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className={cn(
        'relative z-20 flex h-full flex-col justify-between bg-neutral-900 p-5'
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

export const SidebarLink = ({ link, open }: { link: SidebarLink, open: boolean }) => {
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
        'group/link flex items-center justify-start gap-2 rounded-md px-2 py-2 text-sm text-neutral-200 hover:bg-neutral-700',
        isActive &&
          'bg-neutral-700 font-medium text-white'
      )}
    >
      {React.cloneElement(link.icon as React.ReactElement, {
        className: cn(
          (link.icon as React.ReactElement).props.className,
          'text-neutral-200',
          isActive && 'text-white'
        ),
      })}

      <AnimatePresence>
        {open && (
            <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="font-medium whitespace-pre text-white overflow-hidden"
          >
            {link.label}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
};
