import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from "@/components/ui/toaster";
import { CursorGlow } from '@/components/shared/CursorGlow';
import { ThemeProvider as NextThemesProvider } from '@/components/theme-provider';
import { ClerkProvider } from '@clerk/nextjs';

export const metadata: Metadata = {
  title: 'MIMIC',
  description: 'Create a digital clone of your friends, relatives, or anyone to share their memories.',
};

import { JetBrains_Mono } from 'next/font/google';
import { GeistPixelGrid } from 'geist/font/pixel';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      
    
      <html lang="en" className={`${jetbrainsMono.variable} ${GeistPixelGrid.variable}`} suppressHydrationWarning>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
        </head>
        <body className="font-mono antialiased" suppressHydrationWarning>
          <NextThemesProvider attribute="class" forcedTheme="light" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
            <ThemeProvider>
              <CursorGlow />
              {children}
              <Toaster />
            </ThemeProvider>
          </NextThemesProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
