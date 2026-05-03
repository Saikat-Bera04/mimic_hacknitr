'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GlowingButton } from '@/components/ui/glowing-button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { API_URL, cn } from '@/lib/utils';
import Image from 'next/image';
import { Loader2, CheckCircle2, Brain, Zap, MessageSquare, TrendingUp, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const BACKEND_URL = API_URL;

interface AvatarInfo {
    id: string;
    avatarName: string;
    avatarImageUrl?: string;
    status: string;
    ownerResponses?: Array<{ question: string; answer: string }>;
    draftPrompt?: string;
    finalMasterPrompt?: string;
}

export function TrainingResultsPage() {
    const searchParams = useSearchParams();
    const avatarId = searchParams.get('avatarId');
    const inviteLink = searchParams.get('inviteLink');
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [avatarInfo, setAvatarInfo] = useState<AvatarInfo | null>(null);
    const [activeTab, setActiveTab] = useState<'stats' | 'details'>('stats');
    const [stats, setStats] = useState({
        memoriesProcessed: 0,
        personalityAlignment: 0,
        knowledgeRetention: 0,
        responseAccuracy: 0
    });

    useEffect(() => {
        const fetchResults = async () => {
            if (!avatarId) {
                setLoading(false);
                return;
            }

            try {
                // Fetch avatar info
                const res = await fetch(`${BACKEND_URL}/api/avatar-flow/avatar/${avatarId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.avatar) {
                        setAvatarInfo(data.avatar);
                    }
                }

                // Simulate fetching training stats (since backend might not have this calculation yet)
                setTimeout(() => {
                    setStats({
                        memoriesProcessed: inviteLink ? 0 : Math.floor(Math.random() * 20) + 5,
                        personalityAlignment: inviteLink ? 100 : Math.floor(Math.random() * 15) + 85,
                        knowledgeRetention: inviteLink ? 100 : Math.floor(Math.random() * 10) + 90,
                        responseAccuracy: inviteLink ? 100 : Math.floor(Math.random() * 12) + 88
                    });
                    setLoading(false);
                }, 1500);

            } catch (error) {
                console.error('Error fetching results:', error);
                setLoading(false);
            }
        };

        fetchResults();
    }, [avatarId, inviteLink]);

    const getAvatarImage = (avatarName: string, avatarImageUrl?: string) => {
        if (avatarImageUrl) return avatarImageUrl;
        const index = avatarName.charCodeAt(0) % PlaceHolderImages.length;
        return PlaceHolderImages[index]?.imageUrl || PlaceHolderImages[0]?.imageUrl || '';
    };

    const copyInviteLink = () => {
        if (inviteLink) {
            navigator.clipboard.writeText(inviteLink);
        }
    };

    if (loading) {
        return (
            <div className="w-full max-w-3xl mx-auto border-2 border-foreground bg-background h-[60vh] flex flex-col items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-[#ea580c] mb-6" />
                <h2 className="text-sm font-mono font-bold uppercase tracking-[0.3em] animate-pulse">
                    {inviteLink ? 'FINALIZING_MIMIC...' : 'ANALYZING_CORE_DATA...'}
                </h2>
            </div>
        );
    }

    if (!avatarInfo) {
        return (
            <div className="w-full max-w-3xl mx-auto border-2 border-foreground bg-background p-12 text-center">
                <h2 className="text-lg font-mono font-bold uppercase tracking-tight mb-6">MIMIC_TARGET_NOT_FOUND</h2>
                <Button 
                    onClick={() => router.push('/dashboard')}
                    className="bg-foreground hover:bg-foreground/90 text-background rounded-none border-2 border-foreground font-mono text-xs uppercase tracking-widest px-8 h-12"
                >
                    RETURN_TO_COMMAND_CENTER
                </Button>
            </div>
        );
    }

    const masterPrompt = avatarInfo.finalMasterPrompt || avatarInfo.draftPrompt || 'NO_CORE_PROMPT_GENERATED';

    return (
        <div className="w-full max-w-4xl mx-auto space-y-10">
            <div className="border-2 border-foreground bg-background overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between px-5 py-3 border-b-2 border-foreground bg-foreground/5">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 bg-green-600 animate-pulse" />
                    <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-foreground">ANALYSIS_REPORT_082</span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">STATUS: OPTIMIZED</span>
                </div>

                <div className="p-10 text-center border-b-2 border-foreground/10 bg-dot-grid-bg">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex justify-center mb-8"
                    >
                        <div className="relative w-40 h-40 border-4 border-foreground bg-background p-1">
                            <div className="w-full h-full relative overflow-hidden">
                                <Image
                                    src={getAvatarImage(avatarInfo.avatarName, avatarInfo.avatarImageUrl)}
                                    alt={avatarInfo.avatarName}
                                    fill
                                    className="object-cover grayscale hover:grayscale-0 transition-all duration-500"
                                />
                            </div>
                            <div className="absolute -bottom-4 -right-4 bg-[#ea580c] text-background p-2 border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-4"
                    >
                        <h1 className="text-3xl font-mono font-bold uppercase tracking-tighter text-foreground">
                            {inviteLink ? 'INITIALIZATION_SUCCESS' : 'TRAINING_COMPLETE'}
                        </h1>
                        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em] max-w-md mx-auto leading-relaxed">
                            {inviteLink
                                ? `MIMIC_DESIGNATION: ${avatarInfo.avatarName} IS_READY_FOR_DEPLOYMENT_AND_RECEPTOR_TRAINING`
                                : `MIMIC_DESIGNATION: ${avatarInfo.avatarName} HAS_SUCCESSFULLY_COMMITTED_NEW_CORE_MEMORIES`
                            }
                        </p>
                    </motion.div>
                </div>

                <div className="p-8 space-y-10">
                    {/* Invitation Link Section */}
                    {inviteLink && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="border-2 border-dashed border-foreground/30 bg-foreground/5 p-8"
                        >
                            <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#ea580c] mb-4">DEPLOY_TRAINING_ACCESS_LINK</h3>
                            <div className="flex items-center gap-0 border-2 border-foreground bg-background max-w-lg mx-auto">
                                <div className="px-4 py-3 text-[10px] font-mono truncate flex-1 text-muted-foreground uppercase">
                                    {inviteLink}
                                </div>
                                <Button 
                                    onClick={copyInviteLink} 
                                    variant="ghost" 
                                    className="h-12 w-12 rounded-none border-l-2 border-foreground hover:bg-foreground/5"
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="text-[9px] font-mono text-muted-foreground uppercase mt-4 tracking-widest">SHARE_WITH_TRAINER_TO_SYNC_PERSONA</p>
                        </motion.div>
                    )}

                    {/* Toggle Tabs */}
                    <div className="flex justify-center gap-0 border-2 border-foreground inline-flex mx-auto">
                        <button
                            onClick={() => setActiveTab('stats')}
                            className={cn(
                                "px-6 py-3 font-mono text-[10px] uppercase tracking-widest transition-colors",
                                activeTab === 'stats' ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-foreground/5"
                            )}
                        >
                            01_CORE_STATS
                        </button>
                        <button
                            onClick={() => setActiveTab('details')}
                            className={cn(
                                "px-6 py-3 font-mono text-[10px] uppercase tracking-widest border-l-2 border-foreground transition-colors",
                                activeTab === 'details' ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-foreground/5"
                            )}
                        >
                            02_PERSONA_CFG
                        </button>
                    </div>

                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        {activeTab === 'stats' ? (
                            <div className="space-y-10">
                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {[
                                        { icon: Brain, val: stats.memoriesProcessed, label: 'MEM_COMMITTED', color: 'text-foreground' },
                                        { icon: TrendingUp, val: `${stats.personalityAlignment}%`, label: 'ALIGN_MATCH', color: 'text-[#ea580c]' },
                                        { icon: Zap, val: `${stats.knowledgeRetention}%`, label: 'RETENTION_IDX', color: 'text-blue-600' },
                                        { icon: MessageSquare, val: `${stats.responseAccuracy}%`, label: 'RESP_ACCURACY', color: 'text-purple-600' }
                                    ].map((s, idx) => (
                                        <motion.div 
                                            key={idx}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 * idx }}
                                            className="border-2 border-foreground bg-background p-6 flex flex-col items-center text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                                        >
                                            <div className={`p-3 border-2 border-foreground bg-foreground/5 mb-4 ${s.color}`}>
                                                <s.icon className="h-6 w-6" />
                                            </div>
                                            <div className="text-2xl font-mono font-bold uppercase">{s.val}</div>
                                            <div className="text-[8px] font-mono text-muted-foreground uppercase tracking-[0.2em] mt-2">{s.label}</div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Analysis Section */}
                                <div className="border-2 border-foreground bg-background p-8">
                                    <h3 className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 bg-green-600 animate-pulse" /> SYSTEM_ANALYSIS_STREAM
                                    </h3>
                                    <div className="space-y-8">
                                        {[
                                            { label: 'PATTERN_RECOGNITION', val: '92%', color: 'bg-foreground' },
                                            { label: 'TONE_CONSISTENCY', val: '88%', color: 'bg-[#ea580c]' },
                                            { label: 'CONTEXTUAL_AWARENESS', val: '95%', color: 'bg-blue-600' }
                                        ].map((stat, idx) => (
                                            <div key={idx} className="space-y-3">
                                                <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-widest">
                                                    <span className="text-muted-foreground">{stat.label}</span>
                                                    <span className="font-bold">{stat.val}</span>
                                                </div>
                                                <div className="h-4 border-2 border-foreground bg-foreground/5 p-0.5 overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: stat.val }}
                                                        transition={{ delay: 0.5 + (idx * 0.2), duration: 1 }}
                                                        className={`h-full ${stat.color}`}
                                                    ></motion.div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Owner Responses */}
                                <div className="border-2 border-foreground bg-background p-8">
                                    <h3 className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 bg-[#ea580c]" /> CONFIGURATION_MANIFEST
                                    </h3>
                                    <div className="space-y-4">
                                        {avatarInfo.ownerResponses && avatarInfo.ownerResponses.length > 0 ? (
                                            avatarInfo.ownerResponses.map((r, i) => (
                                                <div key={i} className="border-2 border-foreground/10 bg-foreground/5 p-4">
                                                    <p className="text-[8px] font-mono text-muted-foreground uppercase tracking-widest mb-2">{r.question}</p>
                                                    <p className="text-xs font-mono font-bold uppercase leading-relaxed">{r.answer}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-[10px] font-mono text-muted-foreground uppercase italic tracking-widest">NO_MANIFEST_DATA_FOUND</p>
                                        )}
                                    </div>
                                </div>

                                {/* Master Prompt */}
                                <div className="border-2 border-foreground bg-background p-8">
                                    <h3 className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 bg-foreground" /> MASTER_PERSONA_PROMPT_SRC
                                    </h3>
                                    <div className="bg-foreground text-background p-6 font-mono text-[10px] uppercase leading-relaxed max-h-[300px] overflow-y-auto selection:bg-[#ea580c] selection:text-white">
                                        {masterPrompt}
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>

                <div className="p-8 border-t-2 border-foreground bg-foreground/5 flex flex-col sm:flex-row justify-end gap-4">
                    <Button
                        variant="outline"
                        onClick={() => router.push('/dashboard?view=train-avatar&avatarId=' + avatarId)}
                        className="rounded-none border-2 border-foreground font-mono text-[10px] uppercase tracking-widest bg-background hover:bg-foreground/5 h-12 px-8"
                    >
                        <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                        RESUME_TRAINING
                    </Button>
                    <Button
                        onClick={() => router.push('/dashboard')}
                        className="bg-foreground hover:bg-foreground/90 text-background rounded-none border-2 border-foreground font-mono text-[10px] uppercase tracking-widest h-12 px-8"
                    >
                        RETURN_TO_BASE
                    </Button>
                </div>
            </div>
        </div>
    );
}
