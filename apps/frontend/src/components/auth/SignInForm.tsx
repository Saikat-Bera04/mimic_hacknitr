'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { useSignIn } from '@clerk/nextjs';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, ArrowRight, Loader2, Cpu } from "lucide-react";
import { GoogleIcon } from "@/components/shared/GoogleIcon";
import { cn } from "@/lib/utils";

type SignInFields = { email: string; password: string };

function getClerkError(error: unknown): string {
  if (typeof error === "object" && error && Array.isArray((error as any).errors)) {
    const messages = (error as any).errors
      .map((err: any) => err?.message || err?.longMessage)
      .filter(Boolean);
    if (messages.length > 0) return messages.join("\n");
  }
  if (error instanceof Error) return error.message;
  return "Unable to sign in. Please try again.";
}

export function SignInForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { isLoaded, signIn, setActive } = useSignIn();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<SignInFields>({ email: "", password: "" });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isLoaded) return;
    setIsLoading(true);
    try {
      const result = await signIn.create({
        identifier: formData.email.trim().toLowerCase(),
        password: formData.password,
      });
      if (result.status !== "complete" || !result.createdSessionId) {
        throw new Error("Sign in requires additional verification.");
      }
      await setActive({ session: result.createdSessionId });
      toast({ title: "Welcome back!", description: "Redirecting to your dashboard." });
      router.push("/dashboard");
    } catch (error) {
      toast({ title: "Sign in failed", description: getClerkError(error), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (!isLoaded) return;
    setIsLoading(true);
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/dashboard",
      });
    } catch (error) {
      setIsLoading(false);
      toast({ title: "Google sign in failed", description: getClerkError(error), variant: "destructive" });
    }
  };

  return (
    <div className="w-full max-w-md px-4">
      <div className="border-2 border-foreground bg-background shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b-2 border-foreground bg-foreground/5">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 bg-[#ea580c]" />
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-foreground">
              AUTHENTICATION_GATEWAY
            </span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">v1.0.4</span>
        </div>

        <div className="p-8">
          <div className="mb-8 flex flex-col items-center">
            <div className="flex items-center gap-2">
              <Cpu size={20} strokeWidth={1.5} className="text-foreground" />
              <span className="text-sm font-mono tracking-[0.2em] uppercase font-bold text-foreground">
                MIMIC
              </span>
            </div>
            <p className="mt-4 text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em] text-center">
              PROVIDE_ACCESS_CREDENTIALS
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[10px] font-mono font-bold uppercase tracking-widest text-foreground">IDENTIFIER_EMAIL</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50 pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="NAME@HOST.DOMAIN"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={isLoading || !isLoaded}
                  className="pl-10 bg-background border-2 border-foreground rounded-none h-12 font-mono text-xs focus:ring-0 focus:border-[#ea580c] transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[10px] font-mono font-bold uppercase tracking-widest text-foreground">SECURE_PASSCODE</Label>
                <Link href="/forgot-password" className="text-[9px] font-mono text-[#ea580c] hover:underline uppercase tracking-widest font-bold">
                  FORGOT_KEY?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50 pointer-events-none" />
                <Input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={isLoading || !isLoaded}
                  className="pl-10 bg-background border-2 border-foreground rounded-none h-12 font-mono text-xs focus:ring-0 focus:border-[#ea580c] transition-colors"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !isLoaded}
              className="w-full bg-foreground hover:bg-foreground/90 text-background rounded-none border-2 border-foreground font-mono text-xs uppercase tracking-widest h-12 mt-2"
            >
              {isLoading ? "AUTHENTICATING..." : "INITIATE_SESSION"}
            </Button>
          </form>

          <div className="relative flex items-center justify-center my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-foreground/10"></div>
            </div>
            <span className="relative px-4 bg-background text-[10px] font-mono text-muted-foreground uppercase tracking-widest">OR_USE</span>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogle}
            disabled={isLoading || !isLoaded}
            className="w-full rounded-none border-2 border-foreground bg-background hover:bg-foreground/5 text-foreground font-mono text-xs uppercase tracking-widest h-12"
          >
            <GoogleIcon className="mr-2 h-4 w-4" />
            GOOGLE_AUTH_LINK
          </Button>

          <div className="mt-8 pt-6 border-t-2 border-foreground/5 text-center">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              NO_ACCOUNT_FOUND?{" "}
              <Link href="/signup" className="text-[#ea580c] hover:underline font-bold">
                ESTABLISH_NEW_IDENTITY
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
