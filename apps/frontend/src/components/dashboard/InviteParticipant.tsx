
"use client"

import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GlowingButton } from '../ui/glowing-button';
import { useToast } from '@/hooks/use-toast';

export function InviteParticipantPage() {
    const searchParams = useSearchParams();
    const code = searchParams.get('code');
    const { toast } = useToast();

    const handleCopyLink = () => {
        const link = window.location.href;
        navigator.clipboard.writeText(link);
        toast({
            title: "Link Copied!",
            description: "The invitation link has been copied to your clipboard.",
        });
    };
    
    return (
        <Card className="card-glass w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="font-headline" style={{color: 'var(--dynamic-text-color)'}}>Invite a Participant</CardTitle>
                <CardDescription>
                    Share this unique link with the person you want to invite to train the avatar.
                </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
                {code ? (
                    <div className='space-y-4'>
                        <p className='text-muted-foreground'>This page is a placeholder for where your friend would land.</p>
                        <div className="p-4 bg-secondary/50 rounded-md border border-border">
                            <p className="text-sm font-mono break-all text-muted-foreground">{window.location.href}</p>
                        </div>
                        <GlowingButton text="Copy Link" onClick={handleCopyLink} />
                    </div>
                ) : (
                    <p className='text-muted-foreground py-8'>
                        Generate an invitation link from the 'Create Avatar' page first.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

    