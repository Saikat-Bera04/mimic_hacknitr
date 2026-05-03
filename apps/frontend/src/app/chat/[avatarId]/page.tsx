'use client';

import { useState, useEffect, useRef, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowLeft, Loader2, Copy, Link2, Share2, Bot, User, BrainCircuit, Mic, MicOff, Languages, ChevronDown, Volume2, VolumeX } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useUser } from '@clerk/nextjs';
import { useSpeechToText } from '@/hooks/use-speech-to-text';
import { API_URL } from '@/lib/utils';

const BACKEND_URL = API_URL;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface AvatarData {
  id: string;
  avatarName: string;
  avatarImageUrl?: string;
  status: 'draft' | 'awaiting_trainer' | 'completed';
  finalMasterPrompt?: string;
  ownerName?: string;
  ownerEmail?: string;
  createdAt: number;
}

export default function AvatarChatPage({ params }: { params: Promise<{ avatarId: string }> }) {
  const resolvedParams = use(params);
  const { avatarId } = resolvedParams;
  
  const router = useRouter();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  
  const [avatar, setAvatar] = useState<AvatarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [generatingLink, setGeneratingLink] = useState(false);
  const [sessionId, setSessionId] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const existing = localStorage.getItem(`chatSession:${avatarId}`);
    return existing || '';
  });

  // Translation state (defined before voice input to use in language hint)
  const INDIAN_LANGUAGES = [
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు' },
    { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
    { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
    { code: 'mr', name: 'Marathi', native: 'मराठी' },
    { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
    { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
    { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ' },
    { code: 'ur', name: 'Urdu', native: 'اردو' },
    { code: 'as', name: 'Assamese', native: 'অসমীয়া' },
    { code: 'en', name: 'English', native: 'English' },
  ];

  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [translatingMsgId, setTranslatingMsgId] = useState<string | null>(null);
  const [translations, setTranslations] = useState<Record<string, string>>({});

  // Voice input (with language hint for Sarvam AI transcription)
  const {
    isRecording,
    isConnecting: isVoiceConnecting,
    fullTranscript,
    startRecording,
    stopRecording: stopVoiceRecording,
    clearTranscript,
  } = useSpeechToText({
    languageHint: selectedLanguage, // Pass selected language for better Sarvam ASR
    onTranscript: (text, isFinal) => {
      if (isFinal && text) {
        setInputMessage(prev => prev ? `${prev} ${text}` : text);
      }
    },
  });

  // Handle voice recording toggle
  const handleVoiceToggle = async () => {
    if (isRecording) {
      await stopVoiceRecording();
      // After stopping, transcript should already be in inputMessage via onTranscript
    } else {
      clearTranscript();
      await startRecording();
    }
  };

  // Translate a message
  const translateMessage = async (messageId: string, text: string) => {
    if (selectedLanguage === 'en') {
      // Remove any existing translation for this message
      setTranslations(prev => {
        const next = { ...prev };
        delete next[messageId];
        return next;
      });
      return;
    }

    setTranslatingMsgId(messageId);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          targetLanguage: selectedLanguage,
          targetLanguageName: INDIAN_LANGUAGES.find(l => l.code === selectedLanguage)?.name || selectedLanguage,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.translation) {
          setTranslations(prev => ({ ...prev, [messageId]: data.translation }));
        }
      } else {
        toast({ title: 'Translation failed', description: 'Could not translate the message.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Translation error', description: 'Network error during translation.', variant: 'destructive' });
    } finally {
      setTranslatingMsgId(null);
    }
  };

  // TTS state
  const [playingMsgId, setPlayingMsgId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play message as speech
  const playMessage = async (messageId: string, text: string) => {
    const textToSpeak = translations[messageId] || text;
    
    setPlayingMsgId(messageId);
    try {
      const res = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSpeak,
          language: selectedLanguage,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audio) {
          if (audioRef.current) {
            audioRef.current.pause();
          }
          const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
          audioRef.current = audio;
          
          audio.onended = () => setPlayingMsgId(null);
          audio.onerror = () => {
            setPlayingMsgId(null);
            toast({ title: 'Playback error', description: 'Failed to play audio', variant: 'destructive' });
          };
          
          await audio.play();
        }
      } else {
        throw new Error('TTS failed');
      }
    } catch {
      setPlayingMsgId(null);
      toast({ title: 'Speech error', description: 'Failed to generate speech', variant: 'destructive' });
    }
  };

  // Stop playing
  const stopPlaying = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingMsgId(null);
  };

  useEffect(() => {
    const loadConversation = async () => {
      if (!sessionId) return;
      try {
        const res = await fetch(`${BACKEND_URL}/api/avatar-flow/conversation/${avatarId}?sessionId=${encodeURIComponent(sessionId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.messages)) {
            const restored = (data.messages as any[]).map((m, idx) => ({
              id: `${m.role}-${m.timestamp || idx}-${idx}`,
              role: m.role,
              content: m.content,
              timestamp: m.timestamp || Date.now(),
            })) as Message[];
            setMessages(restored);
          }
        }
      } catch (err) {
        console.error('Failed to load conversation', err);
      }
    };

    loadConversation();
  }, [sessionId, avatarId]);

  // Fetch avatar data
  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        // Try to get from local avatar flow first
        const res = await fetch(`${BACKEND_URL}/api/avatar-flow/avatar/${avatarId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.avatar) {
            setAvatar(data.avatar);
          }
        }
        
        // Also try to get from cloud storage
        const cloudRes = await fetch(`${BACKEND_URL}/api/avatar-flow/master-prompt/${avatarId}`);
        if (cloudRes.ok) {
          const cloudData = await cloudRes.json();
          if (cloudData.success) {
            setAvatar(prev => ({
              ...prev,
              id: avatarId,
              avatarName: cloudData.avatarName || prev?.avatarName || 'Avatar',
              avatarImageUrl: prev?.avatarImageUrl,
              status: 'completed' as const,
              finalMasterPrompt: cloudData.masterPrompt,
              createdAt: prev?.createdAt || Date.now(),
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching avatar:', error);
        toast({
          title: 'Error',
          description: 'Failed to load avatar data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAvatar();
  }, [avatarId, toast]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Get avatar image
  const getAvatarImage = (avatarName: string, avatarImageUrl?: string) => {
    if (avatarImageUrl) return avatarImageUrl;
    const index = avatarName.charCodeAt(0) % PlaceHolderImages.length;
    return PlaceHolderImages[index]?.imageUrl || PlaceHolderImages[0]?.imageUrl || '';
  };

  // Send message to avatar
  const sendMessage = async () => {
    if (!inputMessage.trim() || sending) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setSending(true);

    try {
      // Call backend to chat with avatar using its master prompt
      const res = await fetch(`${BACKEND_URL}/api/avatar-flow/chat/${avatarId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          sessionId: sessionId || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.sessionId && data.sessionId !== sessionId) {
          setSessionId(data.sessionId);
          if (typeof window !== 'undefined') {
            localStorage.setItem(`chatSession:${avatarId}`, data.sessionId);
          }
        }
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response || "I'm still learning. Please try again later.",
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      // Add a fallback message
      const fallbackMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: avatar?.status !== 'completed' 
          ? "I'm not fully trained yet. Please complete my training first!"
          : "Sorry, I encountered an error. Please try again.",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setSending(false);
    }
  };

  // Generate trainer invite link
  const generateTrainerLink = async () => {
    if (!avatar) return;
    
    setGeneratingLink(true);
    try {
      if (!user) {
        toast({
          title: 'Sign in required',
          description: 'Please sign in before generating a trainer link.',
          variant: 'destructive',
        });
        setGeneratingLink(false);
        return;
      }

      const ownerId = user.id;

      const res = await fetch(`${BACKEND_URL}/api/avatar-flow/generate-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatarId: avatar.id,
          avatarName: avatar.avatarName,
          ownerId,
          expiresInHours: 2,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setInviteLink(data.invitation.inviteUrl);
        toast({
          title: 'Trainer Link Generated!',
          description: 'Share this link with someone to train your avatar.',
        });
      } else {
        throw new Error('Failed to generate link');
      }
    } catch (error) {
      console.error('Generate link error:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate trainer link',
        variant: 'destructive',
      });
    } finally {
      setGeneratingLink(false);
    }
  };

  // Copy invite link
  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast({ title: 'Copied!', description: 'Trainer link copied to clipboard' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading avatar...</p>
        </div>
      </div>
    );
  }

  if (!avatar) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="card-glass max-w-md">
          <CardHeader>
            <CardTitle>Avatar Not Found</CardTitle>
            <CardDescription>This avatar doesn't exist or has been removed.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/dashboard')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden perspective-container">
      {/* Ambient glowing background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse-ring mix-blend-screen" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[150px] animate-pulse-ring mix-blend-screen" style={{animationDelay: '1s'}} />
      </div>

      {/* Header */}
      <header className="border-b border-white/10 bg-background/40 backdrop-blur-xl sticky top-0 z-50 card-3d z-shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')} className="hover:bg-primary/20 hover:text-primary transition-all duration-300">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-primary/50 shadow-[0_0_15px_rgba(0,102,255,0.3)] hover:scale-105 transition-transform duration-300">
                <Image 
                  src={getAvatarImage(avatar.avatarName, avatar.avatarImageUrl)} 
                  alt={avatar.avatarName} 
                  fill 
                  className="object-cover" 
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-lg neon-text tracking-tight" style={{ color: 'var(--dynamic-text-color)' }}>
                    {avatar.avatarName}
                  </h1>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                  {avatar.status === 'completed' ? (
                    <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full border border-primary/30 flex items-center gap-1 shadow-[0_0_10px_rgba(0,102,255,0.2)]">
                      <BrainCircuit className="h-3 w-3" /> Trained
                    </span>
                  ) : '🟡 ' + (avatar.status === 'awaiting_trainer' ? 'Awaiting Trainer' : 'Draft')}
                </div>
              </div>
            </div>
          </div>

          {/* Trainer Link Section */}
          <div className="flex items-center gap-2">
            {/* Training Link - for text/voice training */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
                const link = `${baseUrl}/dashboard?view=train-avatar&avatarId=${avatarId}`;
                navigator.clipboard.writeText(link);
                toast({ title: 'Training Link Copied!', description: 'Share this link with a trainer to add memories.' });
              }}
            >
              <BrainCircuit className="h-4 w-4 mr-2" />
              Training Link
            </Button>

            {/* MCQ Invite Link - for initial personality training */}
            {inviteLink ? (
              <div className="flex items-center gap-2">
                <Input 
                  value={inviteLink} 
                  readOnly 
                  className="w-48 text-xs bg-secondary/50" 
                />
                <Button size="icon" variant="outline" onClick={copyInviteLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            ) : avatar.status !== 'completed' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={generateTrainerLink}
                disabled={generatingLink}
              >
                {generatingLink ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Share2 className="h-4 w-4 mr-2" />
                )}
                MCQ Setup
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin relative z-10">
        <div className="container mx-auto max-w-3xl space-y-6 pb-24">
          {/* Welcome message if no messages */}
          {messages.length === 0 && (
            <div className="text-center py-20 animate-fade-in card-3d">
              <div className="relative w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-4 border-primary/30 shadow-[0_0_30px_rgba(0,102,255,0.4)] holographic-border">
                <Image 
                  src={getAvatarImage(avatar.avatarName, avatar.avatarImageUrl)} 
                  alt={avatar.avatarName} 
                  fill 
                  className="object-cover" 
                />
              </div>
              <h2 className="text-3xl font-bold mb-3 neon-text" style={{ color: 'var(--dynamic-text-color)' }}>
                Chat with {avatar.avatarName}
              </h2>
              <div className="max-w-md mx-auto backdrop-blur-sm bg-black/20 p-5 rounded-2xl border border-white/5 shadow-2xl">
                <p className="text-muted-foreground text-lg">
                  {avatar.status === 'completed' 
                    ? `Start a conversation with ${avatar.avatarName}. This avatar has been tailored with a unique personality!`
                    : `${avatar.avatarName} is not fully configured yet. Generate a trainer link to complete the persona.`
                  }
                </p>
              </div>
              {avatar.status !== 'completed' && !inviteLink && (
                <Button 
                  className="mt-4"
                  onClick={generateTrainerLink}
                  disabled={generatingLink}
                >
                  {generatingLink ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Link2 className="h-4 w-4 mr-2" />
                  )}
                  Generate Trainer Link
                </Button>
              )}
            </div>
          )}

          {/* Messages */}
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-primary/50 shadow-[0_0_10px_rgba(0,102,255,0.2)] flex-shrink-0 self-end mb-1">
                    <Image 
                      src={getAvatarImage(avatar.avatarName, avatar.avatarImageUrl)} 
                      alt={avatar.avatarName} 
                      fill 
                      className="object-cover" 
                    />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-3xl px-5 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-sm shadow-[0_4px_15px_rgba(0,102,255,0.3)]'
                      : 'card-glass rounded-bl-sm border border-white/10 text-foreground'
                  }`}
                >
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  {translations[message.id] && (
                    <div className="mt-2 pt-2 border-t border-current/20 animate-slide-up">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        {INDIAN_LANGUAGES.find(l => l.code === selectedLanguage)?.native || 'Translation'}:
                      </p>
                      <p className="text-sm whitespace-pre-wrap opacity-90">{translations[message.id]}</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs opacity-50">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                    <div className="flex items-center gap-2">
                      {message.role === 'assistant' && (
                        <button
                          type="button"
                          onClick={() => playingMsgId === message.id ? stopPlaying() : playMessage(message.id, message.content)}
                          disabled={playingMsgId === message.id && playingMsgId !== null}
                          className="text-xs opacity-50 hover:opacity-100 transition-opacity flex items-center gap-1"
                        >
                          {playingMsgId === message.id ? (
                            <VolumeX className="h-3 w-3" />
                          ) : (
                            <Volume2 className="h-3 w-3" />
                          )}
                          {playingMsgId === message.id ? 'Stop' : 'Listen'}
                        </button>
                      )}
                      {selectedLanguage !== 'en' && message.role === 'assistant' && (
                        <button
                          type="button"
                          onClick={() => translateMessage(message.id, message.content)}
                          disabled={translatingMsgId === message.id}
                          className="text-xs opacity-50 hover:opacity-100 transition-opacity flex items-center gap-1"
                        >
                          {translatingMsgId === message.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Languages className="h-3 w-3" />
                          )}
                          Translate
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {message.role === 'user' && (
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 self-end mb-1 shadow-[0_0_10px_rgba(0,102,255,0.2)]">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {sending && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 justify-start"
            >
              <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-primary/50 shadow-[0_0_10px_rgba(0,102,255,0.2)] flex-shrink-0 self-end mb-1">
                <Image 
                  src={getAvatarImage(avatar.avatarName, avatar.avatarImageUrl)} 
                  alt={avatar.avatarName} 
                  fill 
                  className="object-cover" 
                />
              </div>
              <div className="card-glass border border-white/10 rounded-3xl rounded-bl-sm px-5 py-4 flex items-center h-12">
                <div className="flex gap-1.5 align-middle">
                  <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="absolute pl-10 bottom-0 left-0 w-full p-4 backdrop-blur-xl border-t border-white/5 z-20 z-shadow-lg">
        <div className="container mx-auto max-w-3xl space-y-2">
          {/* Voice Recording Indicator */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 text-red-500 font-medium text-sm px-4 bg-red-500/10 border border-red-500/20 rounded-full py-1.5 w-max shadow-[0_0_15px_rgba(239,68,68,0.2)]"
              >
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-voice-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                Listening... {fullTranscript && <span className="text-white/80 font-normal truncate max-w-xs ml-1">"{fullTranscript}"</span>}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Language Selector Row */}
          <div className="flex items-center justify-between pb-1">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-background/50 border border-white/10 hover:bg-white/10 hover:border-primary/50 transition-all shadow-sm"
              >
                <Languages className="h-3.5 w-3.5 text-primary" />
                <span>{INDIAN_LANGUAGES.find(l => l.code === selectedLanguage)?.native || 'English'}</span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </button>
              
              <AnimatePresence>
                {showLanguageMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-full left-0 mb-2 w-48 max-h-60 overflow-y-auto card-glass border border-white/10 rounded-xl shadow-xl z-50 p-1"
                  >
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground border-b border-white/10 sticky top-0 bg-background/80 backdrop-blur-md z-10">
                      Speaking & Output
                    </div>
                    {INDIAN_LANGUAGES.map(lang => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => { setSelectedLanguage(lang.code); setShowLanguageMenu(false); }}
                        className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-white/10 transition-colors flex items-center justify-between mt-1 ${
                          selectedLanguage === lang.code ? 'bg-primary/20 text-primary font-medium' : ''
                        }`}
                      >
                        <span>{lang.name}</span>
                        <span className="text-xs opacity-70">{lang.native}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {selectedLanguage !== 'en' && messages.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  messages
                    .filter(m => m.role === 'assistant' && !translations[m.id])
                    .forEach(m => translateMessage(m.id, m.content));
                }}
                className="text-xs text-primary/80 hover:text-primary transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-primary/10"
              >
                <Languages className="h-3.5 w-3.5" />
                Translate All Responses
              </button>
            )}
          </div>

          {/* Input Form */}
          <form 
            onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
            className="flex items-end gap-3 bg-secondary/20 p-2 rounded-3xl border border-white/10 shadow-inner"
          >
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={isRecording ? 'Listening carefully...' : `Message ${avatar.avatarName}...`}
              className="flex-1 bg-transparent border-0 rounded-2xl px-5 py-6 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
              disabled={sending}
            />
            
            <div className="flex gap-2 pb-1 pr-1">
              <Button
                type="button"
                variant={isRecording ? "destructive" : "secondary"}
                size="icon"
                onClick={handleVoiceToggle}
                disabled={sending || isVoiceConnecting}
                className={`h-12 w-12 rounded-full transition-all duration-300 ${
                  isRecording 
                    ? 'animate-voice-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]' 
                    : 'hover:bg-primary/20 hover:text-primary hover:shadow-[0_0_15px_rgba(0,102,255,0.3)] bg-background/50 border border-white/5'
                }`}
              >
                {isVoiceConnecting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isRecording ? (
                  <MicOff className="h-5 w-5 text-white" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </Button>
              
              <Button 
                type="submit" 
                disabled={!inputMessage.trim() || sending}
                size="icon"
                className="h-12 w-12 rounded-full shadow-[0_0_15px_rgba(0,102,255,0.4)] hover:shadow-[0_0_25px_rgba(0,102,255,0.6)] hover:scale-105 transition-all duration-300 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {sending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5 ml-1" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
