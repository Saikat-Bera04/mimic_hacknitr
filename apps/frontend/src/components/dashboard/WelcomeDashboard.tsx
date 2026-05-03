
'use client';

import { InvitationCard } from "./InvitationCard";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { API_URL } from "@/lib/utils";
import Image from "next/image";
import { useState, useEffect } from "react";
import { PsychologicalQuestionnaire } from "./PsychologicalQuestionnaire";
import { useRouter } from "next/navigation";
import { Bot, CheckCircle, Clock, Cloud, Plus, Sparkles, ArrowRight } from "lucide-react";
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";

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

interface UserAvatar {
  id: string;
  avatarName: string;
  avatarImageUrl?: string;
  status: 'draft' | 'awaiting_trainer' | 'completed';
  finalMasterPrompt?: string;
  createdAt: number;
  completedAt?: number;
  convexPromptId?: string;
}

interface CloudPrompt {
  _id: string;
  avatarId: string;
  avatarName: string;
  avatarImageUrl?: string;
  ownerId: string;
  masterPrompt: string;
  trainerName?: string;
  createdAt: number;
}

const STATUS_CONFIG = {
  completed:       { label: 'TRAINED',          bg: 'bg-emerald-600/10', text: 'text-emerald-700', dot: 'bg-emerald-600', border: 'border-emerald-600/30' },
  awaiting_trainer:{ label: 'AWAITING',         bg: 'bg-amber-600/10',   text: 'text-amber-700',   dot: 'bg-amber-600',   border: 'border-amber-600/30'   },
  draft:           { label: 'DRAFT',            bg: 'bg-foreground/5',   text: 'text-muted-foreground', dot: 'bg-muted-foreground', border: 'border-foreground/20' },
} as const;

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.45, ease: [0.4, 0, 0.2, 1] },
  }),
};

export function WelcomeDashboard() {
  const router = useRouter();
  const [invitations, setInvitations] = useState(initialInvitations);
  const [userAvatars, setUserAvatars] = useState<UserAvatar[]>([]);
  const [cloudAvatars, setCloudAvatars] = useState<CloudPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<{name: string; imageUrl: string} | null>(null);
  const [userName, setUserName] = useState<string>('');
  const { user, isLoaded } = useUser();

  useEffect(() => {
    const fetchUserAvatars = async () => {
      if (!isLoaded) return;
      if (!user) { setLoading(false); return; }
      try {
        setUserName(user.username || user.fullName || 'User');
        const backendUrl = API_URL;
        const [dashRes, cloudRes] = await Promise.all([
          fetch(`${backendUrl}/api/avatar-flow/dashboard/${user.id}`),
          fetch(`${backendUrl}/api/avatar-flow/cloud-prompts/${user.id}`),
        ]);
        if (dashRes.ok) {
          const d = await dashRes.json();
          if (d.success && d.avatars) setUserAvatars(d.avatars);
        }
        if (cloudRes.ok) {
          const d = await cloudRes.json();
          if (d.success && d.prompts) setCloudAvatars(d.prompts);
        }
      } catch (error) {
        console.error('Error fetching avatars:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserAvatars();
  }, [isLoaded, user]);

  const handleAcceptInvitation = (inviteId: string, avatarName: string, avatarImageUrl: string) => {
    setSelectedAvatar({ name: avatarName, imageUrl: avatarImageUrl });
    setShowQuestionnaire(true);
    setInvitations(invitations.filter(inv => inv.id !== inviteId));
  };

  const handleRejectInvitation = (inviteId: string) =>
    setInvitations(invitations.filter(inv => inv.id !== inviteId));

  const handleQuestionnaireSubmit = () => {
    setShowQuestionnaire(false);
    setSelectedAvatar(null);
  };

  const getAvatarImage = (avatarName: string, avatarImageUrl?: string) => {
    if (avatarImageUrl) return avatarImageUrl;
    const index = avatarName.charCodeAt(0) % PlaceHolderImages.length;
    return PlaceHolderImages[index]?.imageUrl || PlaceHolderImages[0]?.imageUrl || '';
  };

  if (showQuestionnaire && selectedAvatar) {
    return <PsychologicalQuestionnaire avatarName={selectedAvatar.name} onSubmit={handleQuestionnaireSubmit} />;
  }

  const totalAvatars = userAvatars.length + cloudAvatars.filter(c => !userAvatars.some(l => l.id === c.avatarId)).length;
  const completedAvatars = userAvatars.filter(a => a.status === 'completed').length + cloudAvatars.filter(c => !userAvatars.some(l => l.id === c.avatarId)).length;
  const pendingAvatars = userAvatars.filter(a => a.status === 'awaiting_trainer' || a.status === 'draft').length;

  const stats = [
    { label: 'TOTAL_AVATARS',  value: totalAvatars,       icon: Bot          },
    { label: 'TRAINED',        value: completedAvatars,   icon: CheckCircle  },
    { label: 'IN_PROGRESS',    value: pendingAvatars,     icon: Clock        },
    { label: 'CLOUD_SYNCED',   value: cloudAvatars.length,icon: Cloud        },
  ];

  return (
    <div className="space-y-10 w-full max-w-6xl">

      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-xl font-mono font-bold tracking-tight uppercase text-foreground">
          {userName ? `Welcome, ${userName}` : 'Welcome back'}
          <span className="text-muted-foreground"> — </span>
          <span className="text-[#ea580c]">your workspace</span>
        </h2>
        <p className="text-xs font-mono text-muted-foreground mt-1">Manage your avatars, training, and memories from one place.</p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border-2 border-foreground">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} custom={i} variants={cardVariants} initial="hidden" animate="visible"
            className={i < stats.length - 1 ? 'border-b-2 sm:border-b-0 sm:border-r-2 border-foreground' : ''}
          >
            <div className="p-4 hover:bg-foreground/5 transition-colors duration-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">{stat.label}</span>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-mono font-bold tracking-tight text-foreground">
                {loading ? <span className="inline-block w-6 h-6 bg-foreground/10 animate-pulse" /> : stat.value}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* My Avatars */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-mono font-bold tracking-wider uppercase text-foreground">My Avatars</h3>
            <p className="text-[10px] font-mono text-muted-foreground mt-0.5 tracking-wider uppercase">Click any avatar to start chatting</p>
          </div>
          <Button
            size="sm"
            onClick={() => router.push('/dashboard?view=create-avatar')}
            className="h-8 px-3 rounded-none bg-foreground hover:bg-foreground/90 text-background text-[10px] font-mono tracking-wider uppercase border-2 border-foreground transition-all"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New Avatar
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border-2 border-foreground/20 bg-foreground/5 aspect-[4/3] animate-pulse" />
            ))}
          </div>
        ) : userAvatars.length > 0 || cloudAvatars.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {/* Local avatars */}
            {userAvatars.map((avatar, idx) => {
              const s = STATUS_CONFIG[avatar.status] ?? STATUS_CONFIG.draft;
              return (
                <motion.div
                  key={avatar.id}
                  custom={idx}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="group cursor-pointer"
                  onClick={() => router.push(`/chat/${avatar.id}`)}
                >
                  <div className="relative border-2 border-foreground overflow-hidden aspect-[4/3] bg-background hover:bg-foreground/5 transition-all duration-200">
                    <Image
                      src={getAvatarImage(avatar.avatarName, avatar.avatarImageUrl)}
                      alt={avatar.avatarName}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/20 to-transparent" />

                    {/* Top-right badges */}
                    <div className="absolute top-3 right-3 flex gap-1.5">
                      {avatar.convexPromptId && (
                        <span className="status-pill bg-purple-500/20 text-purple-300 border border-purple-500/20">
                          <Cloud className="h-2.5 w-2.5" /> Cloud
                        </span>
                      )}
                    </div>

                    {/* Bottom info */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h4 className="text-sm font-mono font-bold tracking-wider uppercase text-background leading-tight">{avatar.avatarName}</h4>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`status-pill border ${s.bg} ${s.text} ${s.border}`}>
                          <span className={`status-pill-dot ${s.dot}`} />
                          {s.label}
                        </span>
                        <span className="text-[10px] font-mono text-background/50">{new Date(avatar.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Hover arrow */}
                    <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="h-7 w-7 bg-[#ea580c] flex items-center justify-center">
                        <ArrowRight className="h-3.5 w-3.5 text-background" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Cloud-only avatars */}
            {cloudAvatars
              .filter(c => !userAvatars.some(l => l.id === c.avatarId))
              .map((avatar, idx) => (
                <motion.div
                  key={avatar._id}
                  custom={userAvatars.length + idx}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="group cursor-pointer"
                  onClick={() => router.push(`/chat/${avatar.avatarId}`)}
                >
                  <div className="relative border-2 border-foreground overflow-hidden aspect-[4/3] bg-background hover:bg-foreground/5 transition-all duration-200">
                    <Image
                      src={getAvatarImage(avatar.avatarName, avatar.avatarImageUrl)}
                      alt={avatar.avatarName}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/20 to-transparent" />
                    <div className="absolute top-3 right-3 flex gap-1.5">
                      <span className="status-pill bg-purple-500/20 text-purple-300 border border-purple-500/20">
                        <Cloud className="h-2.5 w-2.5" /> Cloud
                      </span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h4 className="text-sm font-mono font-bold tracking-wider uppercase text-background leading-tight">{avatar.avatarName}</h4>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="status-pill border bg-emerald-500/15 text-emerald-400 border-emerald-500/20">
                          <span className="status-pill-dot bg-emerald-400" />
                          Trained
                        </span>
                        {avatar.trainerName && (
                          <span className="text-xs text-white/35">by {avatar.trainerName}</span>
                        )}
                      </div>
                    </div>
                    <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="h-7 w-7 bg-[#ea580c] flex items-center justify-center">
                        <ArrowRight className="h-3.5 w-3.5 text-background" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>
        ) : (
          /* Empty state */
          <div className="border-2 border-dashed border-foreground/30 p-10 flex flex-col items-center justify-center text-center gap-4">
            <div className="h-12 w-12 border-2 border-foreground flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-[#ea580c]" />
            </div>
            <div>
              <p className="text-sm font-mono font-bold uppercase text-foreground">No avatars yet</p>
              <p className="text-xs font-mono text-muted-foreground mt-1 max-w-xs">Create your first avatar to begin personalised AI training and memory preservation.</p>
            </div>
            <Button
              size="sm"
              onClick={() => router.push('/dashboard?view=create-avatar')}
              className="h-8 px-4 rounded-none bg-foreground hover:bg-foreground/90 text-background text-[10px] font-mono tracking-wider uppercase border-2 border-foreground"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Create Avatar
            </Button>
          </div>
        )}
      </section>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <section>
          <div className="mb-4">
            <h3 className="text-sm font-mono font-bold tracking-wider uppercase text-foreground">Pending Invitations</h3>
            <p className="text-[10px] font-mono text-muted-foreground mt-0.5 tracking-wider uppercase">{invitations.length} invitation{invitations.length !== 1 ? 's' : ''} waiting</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {invitations.map((invite) => (
              <InvitationCard
                key={invite.id}
                {...invite}
                onAccept={() => handleAcceptInvitation(invite.id, invite.avatarName, invite.avatarImageUrl)}
                onReject={() => handleRejectInvitation(invite.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
