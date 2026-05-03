'use client';

import { useState, useRef, useCallback } from 'react';

interface UseSpeechToTextOptions {
  onTranscript?: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  languageHint?: string; // Language code hint for better transcription (e.g., 'hi', 'bn', 'ta')
}

export function useSpeechToText({ onTranscript, onError, languageHint }: UseSpeechToTextOptions = {}) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [partialTranscript, setPartialTranscript] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const transcriptionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const languageHintRef = useRef<string | undefined>(languageHint);
  
  // Update language hint ref when it changes
  languageHintRef.current = languageHint;

  const stopRecording = useCallback(async () => {
    // Clear interval
    if (transcriptionIntervalRef.current) {
      clearInterval(transcriptionIntervalRef.current);
      transcriptionIntervalRef.current = null;
    }

    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    // Stop all audio tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Process final audio if there are chunks
    if (audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Transcribe final audio
      try {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        if (languageHintRef.current) {
          formData.append('language', languageHintRef.current);
        }
        
        const response = await fetch('/api/speech-to-text', {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.transcript) {
            setTranscript(prev => {
              const newTranscript = prev ? `${prev} ${data.transcript}` : data.transcript;
              return newTranscript;
            });
            onTranscript?.(data.transcript, true);
          }
        }
      } catch (error) {
        console.error('Final transcription error:', error);
      }
      
      audioChunksRef.current = [];
    }
    
    setIsRecording(false);
    setPartialTranscript('');
    mediaRecorderRef.current = null;
  }, [onTranscript]);

  const transcribeChunk = useCallback(async () => {
    if (audioChunksRef.current.length === 0) return;
    
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    
    // Don't clear chunks yet - we need them for final transcription
    // Just create a copy for this transcription
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'chunk.webm');
      formData.append('partial', 'true');
      if (languageHintRef.current) {
        formData.append('language', languageHintRef.current);
      }
      
      const response = await fetch('/api/speech-to-text', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.transcript) {
          setPartialTranscript(data.transcript);
          onTranscript?.(data.transcript, false);
        }
      }
    } catch (error) {
      console.error('Chunk transcription error:', error);
    }
  }, [onTranscript]);

  const startRecording = useCallback(async () => {
    try {
      setIsConnecting(true);
      setTranscript('');
      setPartialTranscript('');
      audioChunksRef.current = [];

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });
      streamRef.current = stream;

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        onError?.('Recording error occurred');
        stopRecording();
      };

      // Start recording with timeslice to get data periodically
      mediaRecorder.start(2000); // Get data every 2 seconds
      
      setIsConnecting(false);
      setIsRecording(true);

      // Set up periodic transcription (every 3 seconds)
      transcriptionIntervalRef.current = setInterval(() => {
        transcribeChunk();
      }, 3000);

    } catch (error) {
      console.error('Error starting recording:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to start recording');
      setIsConnecting(false);
      stopRecording();
    }
  }, [onTranscript, onError, stopRecording, transcribeChunk]);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setPartialTranscript('');
    audioChunksRef.current = [];
  }, []);

  return {
    isConnecting,
    isRecording,
    transcript,
    partialTranscript,
    fullTranscript: transcript + (partialTranscript ? ` ${partialTranscript}` : ''),
    startRecording,
    stopRecording,
    clearTranscript,
  };
}
