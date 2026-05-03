"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BookOpen,
  Brain,
  Users,
  Rocket,
  UserPlus,
  MessageCircle,
  Database,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Search,
  Lock
} from "lucide-react";
import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function DocsPage() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-10 pb-12">
      {/* Header */}
      <div className="border-2 border-foreground bg-background overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b-2 border-foreground bg-foreground/5">
          <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
            GUIDE_INIT
          </span>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 bg-[#ea580c] animate-pulse" />
            <span className="text-[10px] tracking-[0.2em] uppercase text-[#ea580c] font-mono">
              VERIFIED
            </span>
          </div>
        </div>
        <div className="p-8 text-center">
          <div className="mx-auto w-12 h-12 border-2 border-foreground flex items-center justify-center mb-6">
            <BookOpen className="h-6 w-6 text-foreground" />
          </div>
          <h1 className="text-3xl font-mono font-bold tracking-tight uppercase mb-4 text-foreground">
            Mimic — User Guide
          </h1>
          <p className="text-xs lg:text-sm font-mono text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Welcome to Mimic, a platform where you can create a personal AI avatar that represents you and evolves over time using explicit, trusted memory.
          </p>
        </div>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-10"
      >
        {/* What is Mimic */}
        <motion.div variants={item}>
          <div className="border-2 border-foreground bg-background overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3 border-b-2 border-foreground bg-foreground/5">
              <Brain className="h-5 w-5 text-foreground" />
              <span className="text-xs font-mono font-bold tracking-wider uppercase">What Is Mimic?</span>
            </div>
            <div className="p-6">
              <p className="text-xs font-mono text-muted-foreground mb-6 uppercase tracking-wider">
                Mimic lets you create an AI version of yourself that is grounded in reality.
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-0 border-t-2 border-l-2 border-foreground">
                {[
                  "Learns only from information you approve",
                  "Does not hallucinate or guess",
                  "Answers questions using stored memories",
                  "Reflects your personality, preferences, and opinions",
                  "Refuses to guess if memory is missing"
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-3 border-r-2 border-b-2 border-foreground p-4 bg-background hover:bg-foreground/5 transition-colors">
                    <CheckCircle2 className="h-4 w-4 text-[#ea580c] mt-0.5 flex-shrink-0" />
                    <span className="text-xs font-mono tracking-tight">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        {/* User Roles */}
        <motion.div variants={item}>
          <div className="border-2 border-foreground bg-background overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3 border-b-2 border-foreground bg-foreground/5">
              <Users className="h-5 w-5 text-foreground" />
              <span className="text-xs font-mono font-bold tracking-wider uppercase">User Roles</span>
            </div>
            <div className="p-0 grid grid-cols-1 md:grid-cols-2">
              <div className="p-6 border-b-2 md:border-b-0 md:border-r-2 border-foreground hover:bg-foreground/5 transition-colors">
                <h3 className="text-sm font-mono font-bold text-foreground flex items-center gap-3 mb-6 uppercase tracking-wider">
                  <span className="bg-foreground text-background w-6 h-6 flex items-center justify-center text-[10px]">01</span>
                  Avatar Owner (You)
                </h3>
                <ul className="space-y-4 text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                  <li className="flex items-center gap-2"><span className="h-1 w-1 bg-[#ea580c]" /> The person whose AI avatar is created</li>
                  <li className="flex items-center gap-2"><span className="h-1 w-1 bg-[#ea580c]" /> Full control over identity and memory</li>
                  <li className="flex items-center gap-2"><span className="h-1 w-1 bg-[#ea580c]" /> Can invite one trusted trainer</li>
                  <li className="flex items-center gap-2"><span className="h-1 w-1 bg-[#ea580c]" /> Approves the final personality</li>
                </ul>
              </div>

              <div className="p-6 hover:bg-foreground/5 transition-colors">
                <h3 className="text-sm font-mono font-bold text-[#ea580c] flex items-center gap-3 mb-6 uppercase tracking-wider">
                  <span className="bg-[#ea580c] text-background w-6 h-6 flex items-center justify-center text-[10px]">02</span>
                  Trainer (Optional)
                </h3>
                <ul className="space-y-4 text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                  <li className="flex items-center gap-2"><span className="h-1 w-1 bg-foreground" /> A trusted person who helps define you</li>
                  <li className="flex items-center gap-2"><span className="h-1 w-1 bg-foreground" /> Accessed via a one‑time link</li>
                  <li className="flex items-center gap-2"><span className="h-1 w-1 bg-foreground" /> Can answer setup questions once</li>
                  <li className="flex items-center gap-2"><span className="h-1 w-1 bg-foreground" /> No long‑term access rights</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Getting Started & Process */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <motion.div variants={item} className="h-full">
            <div className="border-2 border-foreground bg-background h-full overflow-hidden flex flex-col">
              <div className="flex items-center gap-3 px-5 py-3 border-b-2 border-foreground bg-foreground/5">
                <Rocket className="h-5 w-5 text-foreground" />
                <span className="text-xs font-mono font-bold tracking-wider uppercase">Getting Started</span>
              </div>
              <div className="p-6 space-y-8 flex-1">
                <div>
                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#ea580c] mb-3">STEP_01: SIGN_IN</h4>
                  <p className="text-xs font-mono text-muted-foreground leading-relaxed">Log in using the available authentication method. You will land on your dashboard.</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#ea580c] mb-3">STEP_02: CREATE_AVATAR</h4>
                  <p className="text-xs font-mono text-muted-foreground mb-4 leading-relaxed">Click "Create Avatar" and enter:</p>
                  <ul className="space-y-2 text-[10px] font-mono text-foreground uppercase tracking-widest bg-foreground/5 p-4 border-l-2 border-[#ea580c]">
                    <li>● Avatar name</li>
                    <li>● Identity description</li>
                  </ul>
                  <div className="flex items-center gap-2 mt-6">
                    <span className="h-1.5 w-1.5 bg-green-600 animate-pulse" />
                    <p className="text-[10px] font-mono text-green-700 font-bold uppercase tracking-wider">Ready for interaction.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={item} className="h-full">
            <div className="border-2 border-foreground bg-background h-full overflow-hidden flex flex-col">
              <div className="flex items-center gap-3 px-5 py-3 border-b-2 border-foreground bg-foreground/5">
                <UserPlus className="h-5 w-5 text-foreground" />
                <span className="text-xs font-mono font-bold tracking-wider uppercase">Trainer (Optional)</span>
              </div>
              <div className="p-6 space-y-6 flex-1">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1" className="border-b-2 border-foreground/20">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-foreground">How It Works</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-[11px] font-mono text-muted-foreground space-y-3 pb-4 uppercase tracking-wider">
                      <p>01. Click "Invite Trainer"</p>
                      <p>02. A one‑time link is generated</p>
                      <p>03. Share link with friend/family</p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2" className="border-b-2 border-foreground/20">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-foreground">Trainer Actions</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-[11px] font-mono text-muted-foreground space-y-3 pb-4 uppercase tracking-wider">
                      <p>• Verifies identity</p>
                      <p>• Completes personality form</p>
                      <p>• Submits once (read-only after)</p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                <div className="bg-[#ea580c]/10 p-4 border-2 border-[#ea580c]/30">
                  <p className="text-[10px] font-mono text-[#ea580c] font-bold uppercase tracking-widest leading-relaxed">
                    <strong>Final Approval:</strong> You review the input, edit if needed, and lock the final personality.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Interaction Features */}
        <motion.div variants={item}>
          <div className="border-2 border-foreground bg-background overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3 border-b-2 border-foreground bg-foreground/5">
              <MessageCircle className="h-5 w-5 text-foreground" />
              <span className="text-xs font-mono font-bold tracking-wider uppercase">Interaction & Learning</span>
            </div>
            <div className="p-0 grid grid-cols-1 md:grid-cols-2">
              <div className="p-6 border-b-2 md:border-b-0 md:border-r-2 border-foreground">
                <h3 className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-[#ea580c] mb-6 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 bg-[#ea580c]" /> CHATTING
                </h3>
                <ul className="space-y-4 text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                  <li>• Ask questions naturally</li>
                  <li>• Responses <strong>only</strong> from memory</li>
                  <li>• Context remains ephemeral</li>
                  <li className="bg-foreground text-background p-4 border-2 border-foreground">
                    If it says <em>"I don't know"</em>, no relevant memory exists.
                  </li>
                </ul>
              </div>

              <div className="p-6">
                <h3 className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-foreground mb-6 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 bg-foreground" /> ADDING_MEMORY
                </h3>
                <p className="text-[11px] font-mono text-muted-foreground mb-4 uppercase tracking-wider">Avatar learns only with explicit permission.</p>
                <div className="space-y-4">
                  <div className="p-4 bg-foreground/5 border-l-2 border-foreground">
                    <p className="text-[10px] font-mono text-foreground font-bold uppercase tracking-widest mb-1">METHOD</p>
                    <p className="text-[11px] font-mono text-muted-foreground uppercase">Select "Save as Memory" during chat.</p>
                  </div>
                  <div className="p-4 bg-foreground/5 border-l-2 border-foreground">
                    <p className="text-[10px] font-mono text-foreground font-bold uppercase tracking-widest mb-1">CONTENT</p>
                    <p className="text-[11px] font-mono text-muted-foreground uppercase">Preferences, Facts, Experiences.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Summary Footer */}
        <motion.div variants={item} className="text-center py-12 border-t-2 border-foreground/10">
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.3em]">
            Mimic: Memory‑based AI • Total Control • Verified Accuracy
          </p>
        </motion.div>

      </motion.div>
    </div>
  );
}
