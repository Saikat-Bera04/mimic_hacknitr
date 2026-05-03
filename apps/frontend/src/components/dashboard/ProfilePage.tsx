'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { GlowingButton } from '@/components/ui/glowing-button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import {
  Facebook,
  Instagram,
  Linkedin,
  Edit,
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { UserAvatar, useUser } from '@clerk/nextjs';

// Using a custom SVG for the X logo as lucide-react's X is a close icon.
const XLogo = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 1200 1227" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.163 519.284ZM569.165 687.828L521.697 619.934L144.011 79.6902H306.615L611.412 515.685L658.88 583.579L1055.08 1150.31H892.476L569.165 687.828Z" fill="currentColor"/>
    </svg>
);


interface ProfileData {
    instagram: string;
    facebook: string;
    linkedin: string;
    twitter: string;
    profession: string;
    hobbies: string;
    interests: string;
    favColor: string;
    bio: string;
}

interface UserData {
    id: string;
    email: string;
    userName: string;
    profilePhoto?: string;
}


export function ProfilePage() {
    const { toast } = useToast();
    const { user, isLoaded } = useUser();
    const [isEditing, setIsEditing] = useState(false);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [profileData, setProfileData] = useState<ProfileData>({
        instagram: '',
        facebook: '',
        linkedin: '',
        twitter: '',
        profession: '',
        hobbies: '',
        interests: '',
        favColor: '',
        bio: '',
    });
    const [formData, setFormData] = useState<ProfileData>(profileData);

    useEffect(() => {
        if (!isLoaded || !user) return;
        setUserData({
            id: user.id,
            email: user.primaryEmailAddress?.emailAddress || '',
            userName: user.username || user.fullName || user.firstName || 'User',
            profilePhoto: user.imageUrl,
        });
    }, [isLoaded, user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({...prev, [id]: value}));
    }

    const handleCancel = () => {
        setFormData(profileData);
        setIsEditing(false);
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProfileData(formData);
        setIsEditing(false);
        toast({
            title: 'Profile Updated',
            description: 'Your information has been saved successfully.',
        });
    }

  return (
    <div className="space-y-10">
      <div className="border-2 border-foreground bg-background p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="relative border-4 border-foreground p-1 bg-background">
            <UserAvatar/>
          </div>
          <div className="text-center md:text-left space-y-2">
            <h1 className="text-2xl font-mono font-bold uppercase tracking-tighter text-foreground">
                {userData?.userName || 'USER_ID_UNDEFINED'}
            </h1>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em]">{userData?.email || 'AUTH_EMAIL_PENDING'}</p>
            <div className="inline-block px-3 py-1 border-2 border-foreground bg-[#ea580c] text-background font-mono text-[10px] font-bold uppercase tracking-widest mt-2">
                ROLE: ADMINISTRATOR
            </div>
          </div>
        </div>
      </div>

      {isEditing ? (
        <div className="border-2 border-foreground bg-background shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between px-5 py-3 border-b-2 border-foreground bg-foreground/5">
                <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 bg-[#ea580c]" />
                    <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-foreground">PROFILE_MODIFICATION_MODE</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">EDIT_ACTIVE</span>
            </div>
            
            <form onSubmit={handleSubmit}>
                <div className="p-8 space-y-10">
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#ea580c]">SOCIAL_CHANNELS</h3>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            {[
                                { id: 'instagram', icon: Instagram, label: 'INSTAGRAM_USER' },
                                { id: 'facebook', icon: Facebook, label: 'FACEBOOK_URL' },
                                { id: 'linkedin', icon: Linkedin, label: 'LINKEDIN_URL' },
                                { id: 'twitter', icon: XLogo, label: 'X_HANDLE' }
                            ].map((social) => (
                                <div key={social.id} className="space-y-1.5">
                                    <Label htmlFor={social.id} className="text-[9px] font-mono font-bold uppercase tracking-widest text-muted-foreground">{social.label}</Label>
                                    <div className="relative">
                                        <social.icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
                                        <Input 
                                            id={social.id} 
                                            placeholder="UNSET" 
                                            className="pl-10 rounded-none border-2 border-foreground bg-background font-mono text-xs focus:ring-0 focus:border-[#ea580c]" 
                                            value={(formData as any)[social.id]} 
                                            onChange={handleInputChange} 
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#ea580c]">OCCUPATIONAL_DATA</h3>
                            <div className="space-y-1.5">
                                <Label htmlFor="profession" className="text-[9px] font-mono font-bold uppercase tracking-widest text-muted-foreground">PROFESSION</Label>
                                <Input id="profession" placeholder="e.g. SYSTEM_ARCHITECT" className="rounded-none border-2 border-foreground bg-background font-mono text-xs focus:ring-0 focus:border-[#ea580c]" value={formData.profession} onChange={handleInputChange} />
                            </div>
                        </div>
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#ea580c]">PERSONAL_INTERESTS</h3>
                            <div className="space-y-1.5">
                                <Label htmlFor="hobbies" className="text-[9px] font-mono font-bold uppercase tracking-widest text-muted-foreground">HOBBIES_LOG</Label>
                                <Input id="hobbies" placeholder="e.g. DATA_MINING, PHOTOGRAPHY" className="rounded-none border-2 border-foreground bg-background font-mono text-xs focus:ring-0 focus:border-[#ea580c]" value={formData.hobbies} onChange={handleInputChange} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="bio" className="text-[9px] font-mono font-bold uppercase tracking-widest text-muted-foreground">BIOGRAPHICAL_MANIFESTO</Label>
                        <Textarea
                            id="bio"
                            placeholder="INITIALIZE_PERSONA_DESCRIPTION..."
                            className="min-h-32 rounded-none border-2 border-foreground bg-background font-mono text-xs focus:ring-0 focus:border-[#ea580c] resize-none p-4"
                            value={formData.bio} onChange={handleInputChange}
                        />
                    </div>
                </div>
                
                <div className="p-8 border-t-2 border-foreground bg-foreground/5 flex flex-col sm:flex-row justify-end gap-4">
                    <Button 
                        variant="ghost" 
                        onClick={handleCancel}
                        className="rounded-none border-2 border-foreground font-mono text-[10px] uppercase tracking-widest bg-background hover:bg-foreground/5 h-12 px-8"
                    >
                        ABORT_CHANGES
                    </Button>
                    <Button 
                        type="submit"
                        className="bg-foreground hover:bg-foreground/90 text-background rounded-none border-2 border-foreground font-mono text-[10px] uppercase tracking-widest h-12 px-8"
                    >
                        COMMIT_PROFILE_DATA
                    </Button>
                </div>
            </form>
        </div>
      ) : (
        <div className="border-2 border-foreground bg-background shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b-2 border-foreground bg-foreground/5">
                <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 bg-[#ea580c]" />
                    <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-foreground">PERSONA_MANIFEST</span>
                </div>
                <button 
                    onClick={() => { setIsEditing(true); setFormData(profileData); }}
                    className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#ea580c] hover:underline"
                >
                    EDIT_SRC_CODE
                </button>
            </div>

            <div className="p-8">
                {Object.values(profileData).every(val => val === '') ? (
                    <div className='text-center py-20 border-2 border-dashed border-foreground/20 bg-foreground/5'>
                        <p className='text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-8'>MANIFEST_IS_EMPTY. DATA_INPUT_REQUIRED.</p>
                        <Button 
                            onClick={() => { setIsEditing(true); setFormData(profileData); }}
                            className="bg-foreground hover:bg-foreground/90 text-background rounded-none border-2 border-foreground font-mono text-[10px] uppercase tracking-widest h-12 px-10"
                        >
                            INITIALIZE_PROFILE_FLOW
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {profileData.bio && (
                            <div className="border-2 border-foreground/10 bg-foreground/5 p-6 relative">
                                <div className="absolute -top-3 left-6 px-2 bg-background border-2 border-foreground/10 text-[8px] font-mono uppercase tracking-widest text-muted-foreground">BIO_STREAM</div>
                                <p className="text-xs font-mono font-medium uppercase leading-relaxed italic">"{profileData.bio}"</p>
                            </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {[
                                { label: 'PROFESSION', value: profileData.profession },
                                { label: 'HOBBIES', value: profileData.hobbies },
                                { label: 'INTERESTS', value: profileData.interests },
                                { label: 'COLOR_PREF', value: profileData.favColor }
                            ].map((item, idx) => (
                                item.value && (
                                    <div key={idx} className="space-y-2">
                                        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{item.label}</p>
                                        <p className="text-sm font-mono font-bold uppercase border-l-2 border-[#ea580c] pl-4">{item.value}</p>
                                    </div>
                                )
                            ))}
                        </div>

                        <div className="pt-8 border-t-2 border-foreground/5">
                            <h4 className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] mb-6 text-foreground">CONNECTED_CHANNELS</h4>
                            <div className="flex flex-wrap gap-4">
                                {profileData.instagram && <SocialLink platform="Instagram" handle={profileData.instagram} />}
                                {profileData.facebook && <SocialLink platform="Facebook" handle={profileData.facebook} />}
                                {profileData.linkedin && <SocialLink platform="LinkedIn" handle={profileData.linkedin} />}
                                {profileData.twitter && <SocialLink platform="X (Twitter)" handle={profileData.twitter} />}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
}


function SocialLink({ platform, handle }: { platform: string; handle: string }) {
    const platformStyles: { [key: string]: { icon: React.ReactNode; getUrl: (handle: string) => string } } = {
        Instagram: { icon: <Instagram className="h-4 w-4" />, getUrl: (h) => `https://instagram.com/${h.replace(/^@/, '')}` },
        Facebook: { icon: <Facebook className="h-4 w-4" />, getUrl: (h) => h.startsWith('http') ? h : `https://facebook.com/${h}` },
        LinkedIn: { icon: <Linkedin className="h-4 w-4" />, getUrl: (h) => h.startsWith('http') ? h : `https://linkedin.com/in/${h}` },
        "X (Twitter)": { icon: <XLogo className="h-3 w-3" />, getUrl: (h) => `https://x.com/${h.replace(/^@/, '')}` },
    };

    const style = platformStyles[platform];
    if (!style || !handle) return null;
    
    return (
        <a 
            href={style.getUrl(handle)} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-3 border-2 border-foreground bg-background text-foreground hover:bg-foreground hover:text-background px-4 py-2 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
        >
            {style.icon}
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest">{platform.split(' ')[0]}</span>
        </a>
    );
}
