
"use client"

import { Button } from "../ui/button";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Check, X, UserCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface InvitationCardProps {
  avatarName: string;
  avatarImageUrl: string;
  fromUserName: string;
  onAccept: () => void;
  onReject: () => void;
}

export function InvitationCard({ avatarName, avatarImageUrl, fromUserName, onAccept, onReject }: InvitationCardProps) {
  const { toast } = useToast();

  const handleAccept = () => {
    toast({ title: "Invitation Accepted!", description: `Complete the questionnaire to begin training ${avatarName}.` });
    onAccept();
  };

  const handleReject = () => {
    toast({ title: "Invitation Rejected", variant: "destructive" });
    onReject();
  };

  return (
    <div className="group border-2 border-foreground bg-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-200 overflow-hidden">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b-2 border-foreground bg-foreground/5">
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 bg-[#ea580c] rounded-full animate-pulse" />
          <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-foreground">INCOMING_INVITATION</span>
        </div>
        <span className="text-[8px] font-mono text-muted-foreground uppercase">01_PENDING</span>
      </div>

      {/* Avatar image area */}
      <div className="relative h-40 w-full border-b-2 border-foreground bg-foreground/5 overflow-hidden">
        <Image 
          src={avatarImageUrl} 
          alt={avatarName} 
          fill 
          className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3">
          <h4 className="text-xs font-mono font-bold text-background uppercase tracking-wider">{avatarName}</h4>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <UserCircle2 className="h-3 w-3 text-[#ea580c]" />
            <p className="text-[10px] font-mono uppercase tracking-widest text-foreground">
              SOURCE: <span className="font-bold">{fromUserName.replace(" ", "_")}</span>
            </p>
          </div>
          <p className="text-[9px] font-mono text-muted-foreground uppercase leading-relaxed tracking-wide">
            INVITATION_TO_CONTRIBUTE_PERSONA_DATA_AND_COGNITIVE_TRAINING_FOR_EVOLUTION.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReject}
            className="flex-1 h-10 rounded-none border-2 border-foreground bg-background hover:bg-red-500 hover:text-white transition-all text-[10px] font-mono font-bold uppercase tracking-widest"
          >
            <X className="h-3.5 w-3.5 mr-1.5" /> REJECT
          </Button>
          <Button
            size="sm"
            onClick={handleAccept}
            className="flex-1 h-10 rounded-none bg-foreground hover:bg-foreground/90 text-background border-2 border-foreground transition-all text-[10px] font-mono font-bold uppercase tracking-widest"
          >
            <Check className="h-3.5 w-3.5 mr-1.5" /> ACCEPT
          </Button>
        </div>
      </div>
    </div>
  );
}
