import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// Sarvam Saarika ASR supported languages
const SARVAM_ASR_LANGUAGES: Record<string, string> = {
  hi: 'hi-IN',
  bn: 'bn-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  pa: 'pa-IN',
  or: 'od-IN',
  en: 'en-IN',
};

async function transcribeWithSarvam(
  audioBuffer: ArrayBuffer,
  languageCode: string = 'en-IN'
): Promise<string | null> {
  const sarvamApiKey = process.env.SARVAM_API_KEY;
  if (!sarvamApiKey) return null;

  try {
    // Sarvam expects WAV format ideally, but also accepts other formats
    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('language_code', languageCode);
    formData.append('model', 'saarika:v2');
    formData.append('with_timestamps', 'false');

    const sarvamSpeechUrl = process.env.NEXT_PUBLIC_SARVAM_SPEECH_URL || 'https://api.sarvam.ai/speech-to-text';
    const response = await fetch(sarvamSpeechUrl, {
      method: 'POST',
      headers: {
        'api-subscription-key': sarvamApiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      console.error('Sarvam ASR error:', response.status);
      return null;
    }

    const data = await response.json();
    return data.transcript || null;
  } catch (error) {
    console.error('Sarvam ASR error:', error);
    return null;
  }
}

async function transcribeWithGemini(
  base64Audio: string,
  mimeType: string,
  isPartial: boolean
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini API key not configured');

  const client = new GoogleGenAI({ apiKey });

  const prompt = isPartial
    ? 'Transcribe this audio clip. Return ONLY the transcribed text, nothing else. If the audio is unclear or silent, return an empty string.'
    : 'Transcribe this audio recording accurately. Return ONLY the transcribed text with proper punctuation. If the audio is unclear or silent, return an empty string.';

  const result = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      {
        inlineData: {
          mimeType,
          data: base64Audio,
        },
      },
      prompt,
    ],
  });

  const transcript = result.text?.trim() || '';

  // Filter out meta-responses
  const invalidResponses = [
    'i cannot', "i can't", 'unable to', 'no audio', 'silent',
    'empty', 'cannot transcribe', 'no speech', 'inaudible',
  ];
  const lowerTranscript = transcript.toLowerCase();
  const isInvalid = invalidResponses.some(phrase => lowerTranscript.includes(phrase));

  return isInvalid ? '' : transcript;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const isPartial = formData.get('partial') === 'true';
    const languageHint = formData.get('language') as string | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    
    // Determine language code for Sarvam (default to en-IN)
    const sarvamLangCode = languageHint && SARVAM_ASR_LANGUAGES[languageHint]
      ? SARVAM_ASR_LANGUAGES[languageHint]
      : 'en-IN';

    // Try Sarvam AI first (better for Indian languages & accents)
    const sarvamResult = await transcribeWithSarvam(arrayBuffer, sarvamLangCode);
    if (sarvamResult) {
      return NextResponse.json({
        transcript: sarvamResult,
        partial: isPartial,
        provider: 'sarvam',
      });
    }

    // Fallback to Gemini
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');
    const geminiResult = await transcribeWithGemini(
      base64Audio,
      audioFile.type || 'audio/webm',
      isPartial
    );

    return NextResponse.json({
      transcript: geminiResult,
      partial: isPartial,
      provider: 'gemini',
    });

  } catch (error) {
    console.error('Speech-to-text error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Transcription failed' },
      { status: 500 }
    );
  }
}
