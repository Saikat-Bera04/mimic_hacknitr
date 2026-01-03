
'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { GlowingButton } from '@/components/ui/glowing-button';
import { useToast } from '@/hooks/use-toast';
import { createMemory } from '@/ai/flows/evolving-avatar-memories';
import { Mic, MicOff, Loader2, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

export function AvatarTraining() {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setAudioBlob(null);
      toast({ title: 'Recording started...' });
    } catch (err) {
      console.error('Error accessing microphone:', err);
      toast({
        title: 'Microphone Error',
        description: 'Could not access the microphone. Please check permissions.',
        variant: 'destructive',
      });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast({ title: 'Recording stopped.' });
    }
  };

  const handleClear = () => {
    setText('');
    setAudioBlob(null);
    toast({
        title: 'Input Cleared',
        description: 'The text and audio recording have been removed.',
    })
  }

  const handleSubmit = async () => {
    if (!text && !audioBlob) {
      toast({
        title: 'No input provided',
        description: 'Please provide text or a voice recording.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    toast({ title: 'Submitting memory to avatar...' });

    let voiceDataUri: string | undefined = undefined;
    if (audioBlob) {
      voiceDataUri = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(audioBlob);
      });
    }

    try {
      const result = await createMemory({ text, voiceDataUri });
      console.log('Memory created:', result.structuredMemory);
      toast({
        title: 'Memory Added!',
        description: 'Your avatar has learned something new.',
      });
      setText('');
      setAudioBlob(null);
    } catch (error) {
      console.error('Failed to create memory:', error);
      toast({
        title: 'Error',
        description: 'Failed to add memory to the avatar.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const hasInput = !!text || !!audioBlob;

  return (
    <Card className="card-glass w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle style={{ color: 'var(--dynamic-text-color)' }}>Train Your Avatar</CardTitle>
        <CardDescription>
          Add a new memory, thought, or piece of information for your avatar to learn. You can use text, voice, or both.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Textarea
            placeholder="Type a memory, thought, or fact..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="bg-transparent min-h-[120px]"
            disabled={isProcessing}
          />
        </div>
        <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">Or record your voice</p>
            <div className='flex flex-col items-center justify-center gap-4'>
                <Button
                    size="icon"
                    variant={isRecording ? "destructive" : "outline"}
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    disabled={isProcessing}
                    className={cn('w-16 h-16 rounded-full relative', 
                        isRecording && 'animate-pulse ring-4 ring-destructive/50'
                    )}
                >
                    {isRecording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </Button>
                
                {isRecording && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                        <div className="h-2 w-2 rounded-full bg-destructive animate-pulse"></div>
                        <span>Recording...</span>
                    </div>
                )}
                
                {audioBlob && !isRecording && (
                    <audio src={URL.createObjectURL(audioBlob)} controls className="w-full max-w-sm" />
                )}
            </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="ghost" onClick={handleClear} disabled={!hasInput || isProcessing || isRecording}>
            <Trash2 className="mr-2 h-4 w-4" />
            Remove
        </Button>
        <GlowingButton onClick={handleSubmit} disabled={!hasInput || isProcessing || isRecording} text="Submit">
            {isProcessing ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                </>
            ) : (
                'Submit'
            )}
        </GlowingButton>
      </CardFooter>
    </Card>
  );
}
