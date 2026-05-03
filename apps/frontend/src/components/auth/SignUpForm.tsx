'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { useSignUp } from '@clerk/nextjs';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { GoogleIcon } from "@/components/shared/GoogleIcon";

type SignUpFields = { username: string; email: string; password: string };

function getClerkError(error: unknown): string {
  if (typeof error === "object" && error && Array.isArray((error as any).errors)) {
    const messages = (error as any).errors
      .map((err: any) => err?.message)
      .filter(Boolean);
    if (messages.length > 0) return messages.join("\n");
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export function SignUpForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { isLoaded, signUp, setActive } = useSignUp();
  const [isLoading, setIsLoading] = useState(false);
  const [isVerificationStep, setIsVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [formData, setFormData] = useState<SignUpFields>({ username: "", email: "", password: "" });

  const updateField = (field: keyof SignUpFields, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isLoaded) return;
    setIsLoading(true);
    try {
      const attempt = await signUp.create({
        username: formData.username.trim(),
        emailAddress: formData.email.trim(),
        password: formData.password,
      });
      if (attempt.status === "complete") {
        await setActive({ session: attempt.createdSessionId });
        toast({ title: "Success!", description: "Your account is ready." });
        router.push("/dashboard");
        return;
      }
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setIsVerificationStep(true);
      toast({ title: "Verify your email", description: "We sent a 6-digit code to your inbox." });
    } catch (error) {
      toast({ title: "Sign up failed", description: getClerkError(error), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isLoaded) return;
    setIsLoading(true);
    try {
      const verification = await signUp.attemptEmailAddressVerification({ code: verificationCode });
      if (verification.status === "complete") {
        await setActive({ session: verification.createdSessionId });
        toast({ title: "Email verified", description: "Welcome aboard!" });
        router.push("/dashboard");
        return;
      }
      toast({ title: "Verification pending", description: "Please complete the remaining steps in your email." });
    } catch (error) {
      toast({ title: "Verification failed", description: getClerkError(error), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded) return;
    setIsLoading(true);
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      toast({ title: "Code resent", description: "Check your email for a fresh verification code." });
    } catch (error) {
      toast({ title: "Unable to resend", description: getClerkError(error), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (!isLoaded) return;
    setIsLoading(true);
    try {
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/dashboard",
      });
    } catch (error) {
      setIsLoading(false);
      toast({ title: "Google sign up failed", description: getClerkError(error), variant: "destructive" });
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="border-2 border-foreground bg-background shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b-2 border-foreground bg-foreground/5">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 bg-[#ea580c]" />
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-foreground">
              {isVerificationStep ? "VERIFICATION_PROTOCOL" : "REGISTRATION_INITIALIZE"}
            </span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">v1.0.4</span>
        </div>

        <div className="p-8">
          <div className="mb-8 flex flex-col items-center">
            <Logo />
            <p className="mt-4 text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em] text-center">
              {isVerificationStep 
                ? "INPUT_6_DIGIT_SECURE_TOKEN" 
                : "ESTABLISH_NEW_USER_CREDENTIALS"}
            </p>
          </div>

          {isVerificationStep ? (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div className="space-y-1.5">
                <Label htmlFor="code" className="text-[10px] font-mono font-bold uppercase tracking-widest text-foreground">SECURE_TOKEN_CODE</Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50 pointer-events-none" />
                  <Input
                    id="code"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    placeholder="000000"
                    required
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    disabled={isLoading || !isLoaded}
                    className="pl-10 bg-background border-2 border-foreground rounded-none h-12 font-mono text-lg tracking-[0.4em] text-center focus:ring-0 focus:border-[#ea580c] transition-colors"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !isLoaded || verificationCode.length === 0}
                className="w-full bg-foreground hover:bg-foreground/90 text-background rounded-none border-2 border-foreground font-mono text-xs uppercase tracking-widest h-12"
              >
                {isLoading ? "VERIFYING_TOKEN..." : "VALIDATE_IDENTITY"}
              </Button>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={isLoading || !isLoaded}
                className="w-full text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground hover:underline transition-all"
              >
                RESEND_ACCESS_CODE
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-[10px] font-mono font-bold uppercase tracking-widest text-foreground">DESIGNATION_ID</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50 pointer-events-none" />
                    <Input
                      id="username"
                      placeholder="USER_NAME"
                      required
                      value={formData.username}
                      onChange={(e) => updateField("username", e.target.value)}
                      disabled={isLoading || !isLoaded}
                      className="pl-10 bg-background border-2 border-foreground rounded-none h-12 font-mono text-xs focus:ring-0 focus:border-[#ea580c] transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-[10px] font-mono font-bold uppercase tracking-widest text-foreground">COMM_CHANNEL_EMAIL</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50 pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="NAME@HOST.DOMAIN"
                      required
                      value={formData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      disabled={isLoading || !isLoaded}
                      className="pl-10 bg-background border-2 border-foreground rounded-none h-12 font-mono text-xs focus:ring-0 focus:border-[#ea580c] transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-[10px] font-mono font-bold uppercase tracking-widest text-foreground">SECURE_ACCESS_PASS</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50 pointer-events-none" />
                    <Input
                      id="password"
                      type="password"
                      required
                      minLength={8}
                      value={formData.password}
                      onChange={(e) => updateField("password", e.target.value)}
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
                  {isLoading ? "INITIALIZING_USER..." : "CREATE_CORE_ACCOUNT"}
                </Button>
              </form>

              <div className="relative flex items-center justify-center">
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
            </div>
          )}

          <div className="mt-8 pt-6 border-t-2 border-foreground/5 text-center">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              ALREADY_REGISTERED?{" "}
              <Link href="/signin" className="text-[#ea580c] hover:underline font-bold">
                PROCEED_TO_LOGIN
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
