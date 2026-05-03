"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import { Copy, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';

interface Invitation {
    token: string;
    avatarName: string;
    createdAt: string;
    expiresAt: string;
    used: boolean;
    masterPrompt?: string;
}

export function InviteParticipantPage() {
    const { toast } = useToast();
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchInvitations();
    }, []);

    const fetchInvitations = async () => {
        try {
            const response = await fetch('/api/invitations');
            const data = await response.json();
            setInvitations(data.invitations || []);
        } catch (error) {
            console.error('Error fetching invitations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (token: string) => {
        const link = `${window.location.origin}/invite/${token}`;
        navigator.clipboard.writeText(link);
        toast({
            title: "Link Copied!",
            description: "The invitation link has been copied to your clipboard.",
        });
    };

    const getInvitationStatus = (invitation: Invitation) => {
        if (invitation.used) {
            return { status: 'completed', icon: CheckCircle, color: 'text-green-500', label: 'Completed' };
        }
        if (new Date(invitation.expiresAt) < new Date()) {
            return { status: 'expired', icon: XCircle, color: 'text-red-500', label: 'Expired' };
        }
        return { status: 'pending', icon: Clock, color: 'text-yellow-500', label: 'Pending' };
    };

    const formatTimeRemaining = (expiresAt: string) => {
        const now = new Date();
        const expiry = new Date(expiresAt);
        const diff = expiry.getTime() - now.getTime();

        if (diff <= 0) return 'Expired';

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) return `${hours}h ${minutes}m remaining`;
        return `${minutes}m remaining`;
    };

    return (
        <div className="space-y-10 w-full max-w-4xl mx-auto">
            {/* Existing Invitations */}
            <div className="border-2 border-foreground bg-background overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b-2 border-foreground bg-foreground/5">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 bg-[#ea580c]" />
                    <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-foreground">INVITATION_REGISTRY</span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">ACTIVE_MONITOR</span>
                </div>
                
                <div className="p-8">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-[#ea580c]" />
                            <span className="ml-3 text-[10px] font-mono uppercase tracking-widest">SCANNING...</span>
                        </div>
                    ) : invitations.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-foreground/20 bg-foreground/5">
                          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em]">
                              NO_INVITATIONS_DETECTED
                          </p>
                          <p className="text-[9px] font-mono text-muted-foreground uppercase mt-2">Initialize new mimic from the create avatar page.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {invitations.map((invitation) => {
                                const statusInfo = getInvitationStatus(invitation);
                                const StatusIcon = statusInfo.icon;

                                return (
                                    <div
                                        key={invitation.token}
                                        className="border-2 border-foreground bg-background hover:bg-foreground/5 transition-colors overflow-hidden"
                                    >
                                        <div className="flex items-center justify-between px-4 py-2 border-b-2 border-foreground/10 bg-foreground/5">
                                          <span className="text-[8px] font-mono text-muted-foreground uppercase tracking-widest">TOKEN_{invitation.token.slice(0,8)}</span>
                                          <div className={`flex items-center gap-1.5 px-2 py-0.5 border border-foreground/20 bg-background`}>
                                            <StatusIcon className={`h-2.5 w-2.5 ${statusInfo.color}`} />
                                            <span className={`text-[8px] font-mono font-bold uppercase tracking-widest ${statusInfo.color}`}>{statusInfo.label}</span>
                                          </div>
                                        </div>
                                        
                                        <div className="p-4 flex items-center justify-between gap-6">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground mb-1 truncate">
                                                  {invitation.avatarName}
                                                </h4>
                                                <div className="flex items-center gap-4">
                                                  <p className="text-[9px] font-mono text-muted-foreground uppercase">
                                                      INIT: {new Date(invitation.createdAt).toLocaleDateString()}
                                                  </p>
                                                  {statusInfo.status === 'pending' && (
                                                      <p className="text-[9px] font-mono text-[#ea580c] font-bold uppercase">
                                                          {formatTimeRemaining(invitation.expiresAt)}
                                                      </p>
                                                  )}
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2">
                                                {statusInfo.status === 'pending' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => copyToClipboard(invitation.token)}
                                                        className="rounded-none border-2 border-foreground font-mono text-[10px] uppercase tracking-widest bg-background hover:bg-foreground h-9 px-4 hover:text-background transition-colors"
                                                    >
                                                        <Copy className="h-3.5 w-3.5 mr-2" />
                                                        COPY_SRC
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {invitation.masterPrompt && (
                                            <details className="border-t-2 border-foreground/10">
                                                <summary className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground cursor-pointer hover:bg-foreground/5 px-4 py-2 transition-colors list-none flex items-center gap-2">
                                                    <span className="h-1 w-1 bg-foreground" /> VIEW_MASTER_PROMPT
                                                </summary>
                                                <div className="p-4 bg-foreground/5 text-[10px] font-mono text-muted-foreground leading-relaxed whitespace-pre-wrap border-t-2 border-foreground/10">
                                                    {invitation.masterPrompt}
                                                </div>
                                            </details>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

