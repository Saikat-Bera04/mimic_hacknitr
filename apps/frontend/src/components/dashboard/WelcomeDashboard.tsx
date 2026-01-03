
'use client';

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InvitationCard } from "./InvitationCard";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Image from "next/image";
import { useState } from "react";
import { PsychologicalQuestionnaire } from "./PsychologicalQuestionnaire";

const initialInvitations = [
  {
    id: 'invite1',
    avatarName: 'Helios',
    avatarImageUrl: PlaceHolderImages.find(p => p.id === 'avatar-13')?.imageUrl || '',
    fromUserName: 'Aria',
  },
  {
    id: 'invite2',
    avatarName: 'Nyx',
    avatarImageUrl: PlaceHolderImages.find(p => p.id === 'avatar-14')?.imageUrl || '',
    fromUserName: 'Jaxon',
  },
];

const initialActiveAvatars = [
    {
        avatarId: 'morpheus',
        avatarName: 'Morpheus',
        avatarImageUrl: PlaceHolderImages.find(p => p.id === 'avatar-15')?.imageUrl || '',
        status: 'Learning',
    }
]

export function WelcomeDashboard() {
    const [invitations, setInvitations] = useState(initialInvitations);
    const [activeAvatars, setActiveAvatars] = useState(initialActiveAvatars);
    const [showQuestionnaire, setShowQuestionnaire] = useState(false);
    const [selectedAvatar, setSelectedAvatar] = useState<{name: string, imageUrl: string} | null>(null);

    const handleAcceptInvitation = (inviteId: string, avatarName: string, avatarImageUrl: string) => {
        setSelectedAvatar({ name: avatarName, imageUrl: avatarImageUrl });
        setShowQuestionnaire(true);
        setInvitations(invitations.filter(inv => inv.id !== inviteId));
    };

    const handleRejectInvitation = (inviteId: string) => {
        setInvitations(invitations.filter(inv => inv.id !== inviteId));
    }
    
    const handleQuestionnaireSubmit = () => {
        if (selectedAvatar) {
            const newAvatar = {
                avatarId: selectedAvatar.name.toLowerCase() + Date.now(),
                avatarName: selectedAvatar.name,
                avatarImageUrl: selectedAvatar.imageUrl,
                status: 'Learning',
            };
            setActiveAvatars(prevAvatars => [...prevAvatars, newAvatar]);
        }
        setShowQuestionnaire(false);
        setSelectedAvatar(null);
    }

    if (showQuestionnaire && selectedAvatar) {
        return <PsychologicalQuestionnaire avatarName={selectedAvatar.name} onSubmit={handleQuestionnaireSubmit} />;
    }

    return (
        <>
            <div className="space-y-8">
                <div>
                    <h2 className="text-2xl font-headline mb-4" style={{color: 'var(--dynamic-text-color)'}}>Pending Invitations</h2>
                    {invitations.length > 0 ? (
                         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {invitations.map((invite) => (
                                <InvitationCard 
                                    key={invite.id}
                                    {...invite}
                                    onAccept={() => handleAcceptInvitation(invite.id, invite.avatarName, invite.avatarImageUrl)}
                                    onReject={() => handleRejectInvitation(invite.id)}
                                />
                            ))}
                        </div>
                    ) : (
                        <Card className="card-glass">
                            <CardHeader>
                                <CardDescription>You have no pending invitations.</CardDescription>
                            </CardHeader>
                        </Card>
                    )}
                </div>

                 <div>
                    <h2 className="text-2xl font-headline mb-4" style={{color: 'var(--dynamic-text-color)'}}>Active Avatars</h2>
                     {activeAvatars.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {activeAvatars.map((avatar) => (
                            <div key={avatar.avatarId} className="group block text-left">
                                <Card className="card-glass overflow-hidden h-full transition-all duration-300 group-hover:border-primary/80 group-hover:shadow-xl group-hover:shadow-primary/10">
                                    <div className="relative aspect-[4/3]">
                                        <Image src={avatar.avatarImageUrl} alt={avatar.avatarName} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                        <div className="absolute bottom-4 left-4">
                                            <h3 className="text-xl font-bold text-white">{avatar.avatarName}</h3>
                                            <span className="text-xs text-white/80 bg-primary/50 px-2 py-1 rounded-full">{avatar.status}</span>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                            ))}
                        </div>
                    ) : (
                         <Card className="card-glass">
                            <CardHeader>
                                <CardDescription>You have no active avatars.</CardDescription>
                            </CardHeader>
                        </Card>
                    )}
                </div>
            </div>
        </>
    );
}
