
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { GlowingButton } from '../ui/glowing-button';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn, API_URL } from '@/lib/utils';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { UploadCloud, Copy, Clock, Check, Mail } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useUser } from '@clerk/nextjs';

const avatars = PlaceHolderImages.filter(p => p.id.startsWith('avatar-'));

const questions = [
    { id: 'q1', label: 'What is the avatar\'s primary function or purpose?', placeholder: 'e.g., A helpful assistant, a creative partner, a guardian...' },
    { id: 'q2', label: 'Describe the avatar\'s personality in three words.', placeholder: 'e.g., Curious, witty, and loyal' },
    { id: 'q3', label: 'What is a core value or principle the avatar follows?', placeholder: 'e.g., Always seek the truth, protect its user at all costs...' },
];

export function CreateAvatarPage() {
    const [step, setStep] = useState(1);
    const [avatarName, setAvatarName] = useState('');
    const [ownerName, setOwnerName] = useState('');
    const [ownerEmail, setOwnerEmail] = useState('');
    const [ownerId, setOwnerId] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState('');
    const [uploadedAvatar, setUploadedAvatar] = useState<string | null>(null);
    const [answers, setAnswers] = useState({ q1: '', q2: '', q3: '' });
    const [invitationLink, setInvitationLink] = useState('');

    const [expirationHours, setExpirationHours] = useState("2");
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    // Auto-fill owner identity from the signed-in Clerk user.
    const { user, isLoaded } = useUser();
    useEffect(() => {
        if (!isLoaded || !user) return;
        setOwnerEmail((prev) => prev || user.primaryEmailAddress?.emailAddress || '');
        setOwnerName((prev) => prev || user.username || user.fullName || '');
        setOwnerId((prev) => prev || user.id);
    }, [isLoaded, user]);

    const handleBack = () => setStep(prev => prev - 1);
    const handleNext = () => setStep(prev => prev + 1);


    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                setUploadedAvatar(dataUrl);
                setSelectedAvatar(dataUrl);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerateLink = async () => {
        if (!avatarName || !selectedAvatar || !ownerName || Object.values(answers).some(a => !a)) {
            toast({
                title: "Incomplete Form",
                description: "Please fill out all fields including your name before generating.",
                variant: "destructive",
            });
            return;
        }

        setIsGenerating(true);
        toast({
            title: "Generating Invitation Link...",
            description: "Creating the avatar draft...",
        });

        try {
            const backendUrl = API_URL;

            // Derive owner identity from the signed-in Clerk user
            const finalOwnerId = ownerId || ownerEmail || 'owner-' + Date.now();

            // Step 1: Create draft avatar with owner's responses
            const ownerResponses = [
                { question: questions[0].label, answer: answers.q1 },
                { question: questions[1].label, answer: answers.q2 },
                { question: questions[2].label, answer: answers.q3 },
            ];

            const draftRes = await fetch(`${backendUrl}/api/avatar-flow/create-draft`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ownerId: finalOwnerId,
                    ownerName,
                    ownerEmail,
                    avatarName,
                    avatarImageUrl: selectedAvatar,
                    ownerResponses,
                }),
            });

            const draftData = await draftRes.json();

            if (!draftRes.ok) {
                throw new Error(draftData.error || 'Failed to create draft');
            }

            // Step 2: Generate trainer invitation link
            const inviteRes = await fetch(`${backendUrl}/api/avatar-flow/generate-invite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    avatarId: draftData.avatarId,
                    avatarName: draftData.avatarName,
                    ownerId: finalOwnerId,
                    expiresInHours: parseFloat(expirationHours),
                }),
            });

            const inviteData = await inviteRes.json();

            if (!inviteRes.ok) {
                throw new Error(inviteData.error || 'Failed to generate invite');
            }

            setInvitationLink(inviteData.invitation.inviteUrl);
            const encodedInviteLink = encodeURIComponent(inviteData.invitation.inviteUrl);

            toast({
                title: "Invitation Ready!",
                description: "Redirecting to training analysis...",
            });

            // Redirect to training results page with styling and params
            router.push(`/dashboard?view=training-results&avatarId=${draftData.avatarId}&inviteLink=${encodedInviteLink}`);
        } catch (error) {
            console.error('Generation error:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to generate invitation link.",
                variant: "destructive",
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(invitationLink);
        toast({
            title: "Copied!",
            description: "Invitation link copied to clipboard.",
        });
    };

    const handleRestart = () => {
        setStep(1);
        setAvatarName('');
        // Don't reset ownerName, ownerEmail, ownerId - they're from the logged-in user
        setSelectedAvatar('');
        setUploadedAvatar(null);
        setAnswers({ q1: '', q2: '', q3: '' });
        setInvitationLink('');
        setIsGenerating(false);
    }

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
                        <div className="flex items-center justify-between px-5 py-3 border-b-2 border-foreground bg-foreground/5">
                          <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 bg-[#ea580c]" />
                            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-foreground">STEP_01: IDENTITY</span>
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">INITIALIZING...</span>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-1.5">
                                <Label htmlFor="ownerEmail" className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
                                    USER_ID_EMAIL
                                </Label>
                                <Input
                                    id="ownerEmail"
                                    type="email"
                                    value={ownerEmail}
                                    readOnly
                                    disabled
                                    className="bg-foreground/5 border-2 border-foreground/20 rounded-none h-12 font-mono text-xs cursor-not-allowed"
                                />
                                <p className="text-[10px] font-mono text-muted-foreground uppercase">SYSTEM_GENERATED_LOCKED</p>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="ownerName" className="text-[10px] font-mono font-bold uppercase tracking-widest text-foreground">OWNER_NAME_MANIFEST *</Label>
                                <Input
                                    id="ownerName"
                                    value={ownerName}
                                    onChange={(e) => setOwnerName(e.target.value)}
                                    placeholder="e.g., JOHN_SMITH"
                                    className="bg-background border-2 border-foreground rounded-none h-12 font-mono text-xs focus:ring-0 focus:border-[#ea580c] transition-colors"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="avatarName" className="text-[10px] font-mono font-bold uppercase tracking-widest text-foreground">AVATAR_DESIGNATION *</Label>
                                <Input
                                    id="avatarName"
                                    value={avatarName}
                                    onChange={(e) => setAvatarName(e.target.value)}
                                    placeholder="e.g., NEO_AURA"
                                    className="bg-background border-2 border-foreground rounded-none h-12 font-mono text-xs focus:ring-0 focus:border-[#ea580c] transition-colors"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t-2 border-foreground bg-foreground/5 flex justify-end">
                            <Button 
                              onClick={handleNext} 
                              disabled={!avatarName || !ownerName || !ownerEmail}
                              className="bg-foreground hover:bg-foreground/90 text-background rounded-none border-2 border-foreground font-mono text-xs uppercase tracking-widest px-8"
                            >
                                NEXT_PHASE
                            </Button>
                        </div>
                    </motion.div>
                );
            case 2:
                return (
                    <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
                        <div className="flex items-center justify-between px-5 py-3 border-b-2 border-foreground bg-foreground/5">
                          <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 bg-[#ea580c]" />
                            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-foreground">STEP_02: VISUAL_FORM</span>
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">LOADING_MODELS...</span>
                        </div>
                        <div className="p-8">
                            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em] mb-6">SELECT_BASE_VISUAL_OR_UPLOAD_CUSTOM</p>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[50vh] overflow-y-auto pr-2">
                                <label htmlFor="avatar-upload" className="relative aspect-square w-full border-2 border-dashed border-foreground/30 flex flex-col items-center justify-center text-muted-foreground hover:bg-foreground/5 hover:border-foreground cursor-pointer transition-all">
                                    <UploadCloud className="h-6 w-6 mb-2" />
                                    <span className="text-[8px] font-mono uppercase tracking-widest text-center">UPLOAD_SRC</span>
                                    <input id="avatar-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} />
                                </label>
                                {uploadedAvatar && (
                                    <button
                                        onClick={() => setSelectedAvatar(uploadedAvatar)}
                                        className={cn("relative aspect-square w-full border-2 transition-all overflow-hidden",
                                            selectedAvatar === uploadedAvatar ? 'border-[#ea580c] ring-2 ring-[#ea580c]/50' : 'border-foreground/20 hover:border-foreground'
                                        )}
                                    >
                                        <Image src={uploadedAvatar} alt="Uploaded Avatar" fill className="object-cover" />
                                        {selectedAvatar === uploadedAvatar && <div className="absolute inset-0 bg-[#ea580c]/20" />}
                                    </button>
                                )}
                                {avatars.map(avatar => (
                                    <button
                                        key={avatar.id}
                                        onClick={() => setSelectedAvatar(avatar.imageUrl)}
                                        className={cn("relative aspect-square w-full border-2 transition-all overflow-hidden",
                                            selectedAvatar === avatar.imageUrl ? 'border-[#ea580c] ring-2 ring-[#ea580c]/50' : 'border-foreground/20 hover:border-foreground'
                                        )}
                                    >
                                        <Image src={avatar.imageUrl} alt={avatar.imageHint || 'Avatar image'} fill className="object-cover" unoptimized />
                                        {selectedAvatar === avatar.imageUrl && <div className="absolute inset-0 bg-[#ea580c]/20" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="p-6 border-t-2 border-foreground bg-foreground/5 flex justify-between">
                            <Button 
                              variant="outline" 
                              onClick={handleBack}
                              className="rounded-none border-2 border-foreground font-mono text-xs uppercase tracking-widest px-8 bg-background hover:bg-foreground/5"
                            >
                              PREV
                            </Button>
                            <Button 
                              onClick={handleNext} 
                              disabled={!selectedAvatar}
                              className="bg-foreground hover:bg-foreground/90 text-background rounded-none border-2 border-foreground font-mono text-xs uppercase tracking-widest px-8"
                            >
                              NEXT_PHASE
                            </Button>
                        </div>
                    </motion.div>
                );
            case 3:
                return (
                    <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
                        <div className="flex items-center justify-between px-5 py-3 border-b-2 border-foreground bg-foreground/5">
                          <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 bg-[#ea580c]" />
                            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-foreground">STEP_03: COGNITIVE_CFG</span>
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">CALIBRATING...</span>
                        </div>
                        <div className="p-8 space-y-8">
                            {questions.map(q => (
                                <div key={q.id} className="space-y-2">
                                    <Label htmlFor={q.id} className="text-[10px] font-mono font-bold uppercase tracking-widest text-foreground">{q.label}</Label>
                                    <Textarea 
                                      id={q.id} 
                                      value={answers[q.id as keyof typeof answers]} 
                                      onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} 
                                      placeholder={q.placeholder} 
                                      className="bg-background border-2 border-foreground rounded-none min-h-[100px] font-mono text-xs focus:ring-0 focus:border-[#ea580c] transition-colors" 
                                    />
                                </div>
                            ))}

                            <div className="pt-8 border-t-2 border-foreground/10">
                                <Label htmlFor="expiration" className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-foreground mb-3">
                                    <Clock className="h-3 w-3" /> LINK_TTL_EXPIRATION
                                </Label>
                                <Select value={expirationHours} onValueChange={setExpirationHours}>
                                    <SelectTrigger className="w-full bg-background border-2 border-foreground rounded-none h-12 font-mono text-xs">
                                        <SelectValue placeholder="Select duration" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-none border-2 border-foreground font-mono text-xs">
                                        <SelectItem value="0.5" className="focus:bg-foreground/5 rounded-none">30_MINUTES</SelectItem>
                                        <SelectItem value="1" className="focus:bg-foreground/5 rounded-none">01_HOUR</SelectItem>
                                        <SelectItem value="1.5" className="focus:bg-foreground/5 rounded-none">1.5_HOURS</SelectItem>
                                        <SelectItem value="2" className="focus:bg-foreground/5 rounded-none">02_HOURS</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-[10px] font-mono text-muted-foreground uppercase mt-2">INVITATION_LOCKED_AFTER_EXPIRY</p>
                            </div>
                        </div>
                        <div className="p-6 border-t-2 border-foreground bg-foreground/5 flex justify-between">
                            <Button 
                              variant="outline" 
                              onClick={handleBack} 
                              disabled={isGenerating}
                              className="rounded-none border-2 border-foreground font-mono text-xs uppercase tracking-widest px-8 bg-background hover:bg-foreground/5"
                            >
                              PREV
                            </Button>
                            <Button
                                onClick={handleGenerateLink}
                                disabled={isGenerating || !avatarName || !selectedAvatar || !answers.q1 || !answers.q2 || !answers.q3}
                                className="bg-foreground hover:bg-foreground/90 text-background rounded-none border-2 border-foreground font-mono text-xs uppercase tracking-widest px-8"
                            >
                                {isGenerating ? "GEN_PROCESS..." : "INIT_MIMIC_LINK"}
                            </Button>
                        </div>
                    </motion.div>
                );
            case 4:
                return (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                        <div className="flex items-center justify-between px-5 py-3 border-b-2 border-foreground bg-foreground/5">
                          <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 bg-green-600" />
                            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-foreground">MIMIC_SYNC_SUCCESS</span>
                          </div>
                          <span className="text-[10px] font-mono text-green-700 uppercase tracking-widest">DEPLOYED</span>
                        </div>
                        <div className="p-8">
                          <h2 className="text-xl font-mono font-bold uppercase tracking-tight mb-4 text-foreground">Invitation Ready!</h2>
                          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-8">AVATAR_{avatarName}_INITIALIZED</p>
                          
                          <div className="relative aspect-square max-w-[200px] mx-auto border-2 border-foreground mb-8">
                              {selectedAvatar && <Image src={selectedAvatar} alt="Final Avatar" fill className="object-cover" unoptimized />}
                          </div>
                          
                          <div className='flex flex-col items-center gap-6 w-full max-w-sm mx-auto'>
                              <p className='text-[10px] font-mono text-muted-foreground uppercase tracking-widest'>SHARE_SECURE_ACCESS_LINK:</p>

                              <div className="flex items-center w-full gap-0 border-2 border-foreground bg-background">
                                  <Input value={invitationLink} readOnly className="border-0 rounded-none bg-transparent font-mono text-xs h-12 focus-visible:ring-0" />
                                  <Button size="icon" variant="ghost" onClick={copyToClipboard} className="h-12 w-12 rounded-none border-l-2 border-foreground hover:bg-foreground/5">
                                      <Copy className="h-4 w-4" />
                                  </Button>
                              </div>

                              <Button 
                                variant="outline" 
                                onClick={handleRestart} 
                                className="rounded-none border-2 border-foreground font-mono text-[10px] uppercase tracking-widest px-8 bg-background hover:bg-foreground/5"
                              >
                                CREATE_ANOTHER_MIMIC
                              </Button>
                          </div>
                        </div>
                    </motion.div>
                );
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto border-2 border-foreground bg-background shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <AnimatePresence mode="wait">
                <motion.div key={step}>
                    {renderStep()}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

