
"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "../ui/button";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Check, X } from "lucide-react";

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
        toast({
            title: "Invitation Accepted!",
            description: `Please complete the questionnaire to begin training ${avatarName}.`
        });
        onAccept();
    }

    const handleReject = () => {
         toast({
            title: "Invitation Rejected",
            variant: "destructive",
        });
        onReject();
    }

    return (
        <Card className="card-glass flex flex-col">
            <CardHeader>
                <CardTitle className="font-headline" style={{color: 'var(--dynamic-text-color)'}}>{avatarName}</CardTitle>
                <CardDescription>
                    {fromUserName} has invited you to train this avatar.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center">
                 <div className="relative w-40 h-40 rounded-full overflow-hidden border-2 border-primary/50 shadow-lg shadow-primary/20">
                    <Image src={avatarImageUrl} alt={avatarName} fill className="object-cover" />
                </div>
            </CardContent>
            <CardFooter className="flex justify-center gap-4">
                <Button variant="destructive" onClick={handleReject}>
                    <X className="mr-2 h-4 w-4" /> Reject
                </Button>
                <Button variant="default" onClick={handleAccept}>
                    <Check className="mr-2 h-4 w-4" /> Accept
                </Button>
            </CardFooter>
        </Card>
    );
}
