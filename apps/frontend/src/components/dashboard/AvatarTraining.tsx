'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { GlowingButton } from '@/components/ui/glowing-button';
import { useToast } from '@/hooks/use-toast';
import { useSpeechToText } from '@/hooks/use-speech-to-text';
import { Mic, MicOff, Loader2, Trash2, Wand2, Bot, Copy, Link2, AlertCircle, Activity } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { cn, API_URL } from '@/lib/utils';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser } from '@clerk/nextjs';

const BACKEND_URL = API_URL;

interface AvatarInfo {
  id: string;
  avatarName: string;
  avatarImageUrl?: string;
  status: 'draft' | 'awaiting_trainer' | 'completed';
  ownerName?: string;
}

interface UserAvatar {
  id: string;
  avatarName: string;
  avatarImageUrl?: string;
  status: string;
}

export function AvatarTraining() {
  const searchParams = useSearchParams();
  const avatarIdFromUrl = searchParams.get('avatarId');

  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [avatarInfo, setAvatarInfo] = useState<AvatarInfo | null>(null);
  const [userAvatars, setUserAvatars] = useState<UserAvatar[]>([]);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>(avatarIdFromUrl || '');
  const [loading, setLoading] = useState(true);
  const [trainingLink, setTrainingLink] = useState('');
  const [memoriesAdded, setMemoriesAdded] = useState(0);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, isLoaded } = useUser();

  const {
    isConnecting,
    isRecording,
    fullTranscript,
    startRecording,
    stopRecording,
    clearTranscript,
  } = useSpeechToText({
    onTranscript: (transcriptText, isFinal) => {
      if (isFinal && transcriptText) {
        setText(prev => prev ? `${prev} ${transcriptText}` : transcriptText);
      }
    },
    onError: (error) => {
      toast({
        title: 'Transcription Error',
        description: error,
        variant: 'destructive',
      });
    },
  });

  // Fetch user's avatars if no avatarId in URL (owner view)
  useEffect(() => {
    const fetchUserAvatars = async () => {
      if (avatarIdFromUrl) {
        setLoading(false);
        return;
      }

      if (!isLoaded) {
        return;
      }

      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${BACKEND_URL}/api/avatar-flow/dashboard/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.avatars) {
            const completedAvatars = data.avatars.filter((a: UserAvatar) => a.status === 'completed');
            setUserAvatars(completedAvatars);

            if (completedAvatars.length > 0 && !selectedAvatarId) {
              setSelectedAvatarId(completedAvatars[0].id);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching avatars:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAvatars();
  }, [avatarIdFromUrl, isLoaded, selectedAvatarId, user]);

  // Fetch avatar info when avatarId changes
  useEffect(() => {
    const fetchAvatarInfo = async () => {
      if (!selectedAvatarId) return;

      try {
        const res = await fetch(`${BACKEND_URL}/api/avatar-flow/avatar/${selectedAvatarId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.avatar) {
            setAvatarInfo(data.avatar);
          }
        }
      } catch (error) {
        console.error('Error fetching avatar info:', error);
      }
    };

    fetchAvatarInfo();
  }, [selectedAvatarId]);

  // Get avatar image
  const getAvatarImage = (avatarName: string, avatarImageUrl?: string) => {
    if (avatarImageUrl) return avatarImageUrl;
    const index = avatarName.charCodeAt(0) % PlaceHolderImages.length;
    return PlaceHolderImages[index]?.imageUrl || PlaceHolderImages[0]?.imageUrl || '';
  };

  // Generate embedding using Gemini
  const generateEmbedding = async (inputText: string): Promise<number[]> => {
    const res = await fetch(`${BACKEND_URL}/api/avatar-flow/generate-embedding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: inputText }),
    });

    if (!res.ok) {
      throw new Error('Failed to generate embedding');
    }

    const data = await res.json();
    return data.embedding;
  };

  const handleStartRecording = async () => {
    clearTranscript();
    await startRecording();
    toast({ title: 'Recording started...', description: 'Speak clearly into your microphone.' });
  };

  const handleStopRecording = () => {
    stopRecording();
    toast({ title: 'Recording stopped.' });
  };

  const handleClear = () => {
    setText('');
    clearTranscript();
    toast({
      title: 'Input Cleared',
      description: 'The text has been removed.',
    });
  };

  const handleSubmit = async () => {
    if (!text) {
      toast({
        title: 'No input provided',
        description: 'Please provide text or use voice recording.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedAvatarId) {
      toast({
        title: 'No avatar selected',
        description: 'Please select an avatar to train.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    toast({ title: 'Processing memory...', description: 'Generating embedding and saving...' });

    try {
      // Step 1: Generate embedding
      const embedding = await generateEmbedding(text);

      // Step 2: Determine source based on context
      const isOwner = !avatarIdFromUrl;
      const source = isRecording ? 'voice_input' : (isOwner ? 'user_saved' : 'trainer_added');

      // Step 3: Save memory to backend
      const res = await fetch(`${BACKEND_URL}/api/avatar/${selectedAvatarId}/memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 'trainer',
          text,
          embedding,
          category: 'personality',
          source,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save memory');
      }

      const data = await res.json();
      console.log('Memory saved:', data);

      // Store access token if returned (for trainers)
      if (data.accessToken && !accessToken) {
        setAccessToken(data.accessToken);
      }

      setMemoriesAdded(prev => prev + 1);
      toast({
        title: 'Memory Added!',
        description: `${avatarInfo?.avatarName || 'Avatar'} has learned something new. (${memoriesAdded + 1} memories this session)`,
      });
      setText('');
      clearTranscript();
    } catch (error: any) {
      console.error('Failed to create memory:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add memory to the avatar.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate shareable training link
  const generateTrainingLink = () => {
    if (!selectedAvatarId) return;

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${baseUrl}/dashboard?view=train-avatar&avatarId=${selectedAvatarId}`;
    setTrainingLink(link);

    navigator.clipboard.writeText(link);
    toast({
      title: 'Training Link Copied!',
      description: 'Share this link with a trainer to let them add memories to this avatar.',
    });
  };

  const hasInput = !!text;
  const isRecordingActive = isRecording || isConnecting;

  // Loading state
  if (loading) {
    return (
      <div className="w-full max-w-3xl mx-auto border-2 border-foreground bg-background p-12 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#ea580c]" />
        <span className="mt-4 text-[10px] font-mono uppercase tracking-[0.2em]">INITIALIZING_SYNC...</span>
      </div>
    );
  }

  // No completed avatars
  if (!avatarIdFromUrl && userAvatars.length === 0) {
    return (
      <div className="w-full max-w-3xl mx-auto border-2 border-foreground bg-background">
        <div className="flex items-center justify-between px-5 py-3 border-b-2 border-foreground bg-foreground/5">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-[#ea580c]" />
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-foreground">TRAINING_ABORTED</span>
          </div>
        </div>
        <div className="p-12 text-center">
          <h3 className="text-lg font-mono font-bold uppercase tracking-tight mb-4">No Trained Avatars Detected</h3>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-8 leading-relaxed max-w-sm mx-auto">
            You need to initialize an avatar and complete its identity phase before adding advanced memories.
          </p>
          <Button 
            onClick={() => window.location.href = '/dashboard?view=create-avatar'}
            className="bg-foreground hover:bg-foreground/90 text-background rounded-none border-2 border-foreground font-mono text-xs uppercase tracking-widest px-8"
          >
            CREATE_AVATAR_NOW
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-10">
      {/* Avatar Selection / Info Card */}
      <div className="border-2 border-foreground bg-background overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b-2 border-foreground bg-foreground/5">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-foreground" />
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-foreground">
              {avatarIdFromUrl ? 'MIMIC_TARGET' : 'SELECT_MIMIC_TARGET'}
            </span>
          </div>
          {selectedAvatarId && (
            <div className="flex gap-4">
              <button 
                onClick={() => window.location.href = `/dashboard?view=training-results&avatarId=${selectedAvatarId}`}
                className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#ea580c] hover:underline flex items-center gap-1"
              >
                <Activity className="h-3 w-3" /> ANALYZE
              </button>
              <button 
                onClick={generateTrainingLink}
                className="text-[9px] font-mono font-bold uppercase tracking-widest text-foreground hover:underline flex items-center gap-1"
              >
                <Link2 className="h-3 w-3" /> SHARE_ACCESS
              </button>
            </div>
          )}
        </div>
        <div className="p-6">
          {avatarIdFromUrl && avatarInfo ? (
            // Trainer view - show fixed avatar
            <div className="flex items-center gap-6 p-4 border-2 border-foreground bg-foreground/5">
              <div className="relative w-16 h-16 border-2 border-foreground overflow-hidden">
                <Image
                  src={getAvatarImage(avatarInfo.avatarName, avatarInfo.avatarImageUrl)}
                  alt={avatarInfo.avatarName}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground mb-1">
                  {avatarInfo.avatarName}
                </h3>
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                  MODE: ACTIVE_RECEPTOR_TRAINING
                </p>
                {memoriesAdded > 0 && (
                  <p className="text-[10px] font-mono text-green-700 font-bold uppercase mt-2 tracking-widest">
                    ✓ {memoriesAdded} MEMORIES_UPLOADED_LOCAL_SESSION
                  </p>
                )}
              </div>
            </div>
          ) : (
            // Owner view - avatar selector
            <div className="space-y-6">
              <Select value={selectedAvatarId} onValueChange={setSelectedAvatarId}>
                <SelectTrigger className="rounded-none border-2 border-foreground bg-background h-12 font-mono text-xs">
                  <SelectValue placeholder="Select an avatar to train" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-2 border-foreground font-mono text-xs">
                  {userAvatars.map((avatar) => (
                    <SelectItem key={avatar.id} value={avatar.id} className="focus:bg-foreground/5 rounded-none">
                      <div className="flex items-center gap-2">
                        <Bot className="h-3 w-3" />
                        {avatar.avatarName}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {avatarInfo && (
                <div className="flex items-center gap-6 p-4 border-2 border-foreground/10 bg-foreground/5">
                  <div className="relative w-12 h-12 border-2 border-foreground/20 overflow-hidden">
                    <Image
                      src={getAvatarImage(avatarInfo.avatarName, avatarInfo.avatarImageUrl)}
                      alt={avatarInfo.avatarName}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-widest">{avatarInfo.avatarName}</h4>
                    <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mt-1">
                      STATUS: {avatarInfo.status === 'completed' ? 'READY' : avatarInfo.status.toUpperCase()}
                    </p>
                  </div>
                  {memoriesAdded > 0 && (
                    <span className="text-[10px] font-mono text-green-700 font-bold uppercase">+{memoriesAdded}_SRC</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Training Link Display */}
          {trainingLink && (
            <div className="mt-6 flex items-center gap-0 border-2 border-foreground bg-background">
              <Input value={trainingLink} readOnly className="border-0 rounded-none bg-transparent font-mono text-[10px] h-10 focus-visible:ring-0" />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(trainingLink);
                  toast({ title: 'Copied!' });
                }}
                className="h-10 w-10 rounded-none border-l-2 border-foreground hover:bg-foreground/5"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Training Input Card */}
      <div className="border-2 border-foreground bg-background overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b-2 border-foreground bg-foreground/5">
          <div className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-foreground" />
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-foreground">MEMORY_INPUT_BUFFER</span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">WAITING_FOR_DATA...</span>
        </div>
        <div className="p-8 space-y-8">
          <div className="space-y-4">
            <Textarea
              placeholder="Type a memory, personality trait, preference, or example conversation... or use the microphone for voice input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="bg-background border-2 border-foreground rounded-none min-h-[160px] font-mono text-xs focus:ring-0 focus:border-[#ea580c] transition-colors p-6"
              disabled={isProcessing || !selectedAvatarId}
            />
            {/* Real-time transcription preview */}
            {isRecording && fullTranscript && (
              <div className="p-4 border-2 border-[#ea580c]/30 bg-[#ea580c]/5">
                <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-[#ea580c] uppercase tracking-widest mb-2">
                  <Activity className="h-3 w-3 animate-pulse" />
                  <span>LIVE_TRANSCRIPTION_STREAM</span>
                </div>
                <p className="text-[11px] font-mono text-foreground leading-relaxed uppercase">{fullTranscript}</p>
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-foreground/20 bg-foreground/5 space-y-6">
            <div className="text-center">
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">
                {isRecording ? 'STREAMING_AUDIO... SPEAK_NOW' : 'INPUT_VOICE_VIA_MIC'}
              </p>
            </div>
            
            <div className='relative'>
              <button
                onClick={isRecordingActive ? handleStopRecording : handleStartRecording}
                disabled={isProcessing || isConnecting || !selectedAvatarId}
                className={cn('w-20 h-20 flex items-center justify-center transition-all duration-300 relative z-10',
                  isRecordingActive ? 'bg-[#ea580c] text-background' : 'bg-background border-2 border-foreground text-foreground hover:bg-foreground/5',
                  isRecording && 'scale-110 shadow-[0_0_30px_rgba(234,88,12,0.4)]',
                  (isProcessing || isConnecting || !selectedAvatarId) && 'opacity-50 grayscale'
                )}
              >
                {isConnecting ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : isRecording ? (
                  <MicOff className="h-8 w-8" />
                ) : (
                  <Mic className="h-8 w-8" />
                )}
              </button>
              {isRecording && (
                <div className="absolute inset-0 -m-4 border-2 border-[#ea580c] animate-ping opacity-20 pointer-events-none" />
              )}
            </div>

            {isConnecting && (
              <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground uppercase tracking-widest animate-pulse">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>LINKING_RECOGNITION_SRV...</span>
              </div>
            )}
          </div>
        </div>
        <div className="p-6 border-t-2 border-foreground bg-foreground/5 flex justify-end gap-4">
          <Button 
            variant="outline" 
            onClick={handleClear} 
            disabled={!hasInput || isProcessing || isRecordingActive}
            className="rounded-none border-2 border-foreground font-mono text-[10px] uppercase tracking-widest bg-background hover:bg-foreground/5 h-12 px-6"
          >
            <Trash2 className="mr-2 h-3 w-3" />
            CLEAR_BUFFER
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!hasInput || isProcessing || isRecordingActive || !selectedAvatarId}
            className="bg-foreground hover:bg-foreground/90 text-background rounded-none border-2 border-foreground font-mono text-[10px] uppercase tracking-widest h-12 px-8"
          >
            {isProcessing ? "PROCESSING_CORE..." : "COMMIT_MEMORY_SRC"}
          </Button>
        </div>
      </div>

      {/* Access Token Display (for trainers) */}
      {accessToken && (
        <div className="border-2 border-green-600 bg-green-600/5 overflow-hidden">
          <div className="px-5 py-3 border-b-2 border-green-600 bg-green-600/10">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-green-700" />
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-green-700">TRAINER_PERSISTENT_LINK</span>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-[10px] font-mono text-green-700 uppercase tracking-widest">SECURE_ACCESS_TOKEN_GENERATED</p>
            <div className="flex items-center gap-0 border-2 border-green-600 bg-background">
              <Input
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/trainer/view?token=${accessToken}`}
                readOnly
                className="border-0 rounded-none bg-transparent font-mono text-[10px] h-10 focus-visible:ring-0"
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/trainer/view?token=${accessToken}`;
                  navigator.clipboard.writeText(link);
                  toast({ title: 'Copied!' });
                }}
                className="h-10 w-10 rounded-none border-l-2 border-green-600 hover:bg-green-600/10"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest leading-relaxed">
              💡 THIS_LINK_PERMITS_READ_ONLY_ACCESS_TO_CORE_CONTRIBUTIONS_NO_CHAT_AUTH
            </p>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="border-2 border-foreground bg-background p-6">
        <h4 className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <span className="h-1.5 w-1.5 bg-[#ea580c]" /> TRAINING_PROTOCOL_TIPS
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1 text-[9px] font-mono text-muted-foreground uppercase tracking-wider">
            <p>● Add personality traits: "I am creative"</p>
            <p>● Add preferences: "I like concise answers"</p>
          </div>
          <div className="space-y-1 text-[9px] font-mono text-muted-foreground uppercase tracking-wider">
            <p>● Add example responses: "Talk about hiking"</p>
            <p>● Add facts: "I am a web developer"</p>
          </div>
        </div>
      </div>
    </div>
  );
}
