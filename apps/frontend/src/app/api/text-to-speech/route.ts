import { NextRequest, NextResponse } from 'next/server';

const SARVAM_TTS_LANGUAGES: Record<string, string> = {
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, language } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const sarvamApiKey = process.env.SARVAM_API_KEY;
    if (!sarvamApiKey) {
      return NextResponse.json(
        { error: 'Sarvam API key not configured' },
        { status: 500 }
      );
    }

    const targetLangCode = language && SARVAM_TTS_LANGUAGES[language]
      ? SARVAM_TTS_LANGUAGES[language]
      : 'en-IN';

    const sarvamTtsUrl = process.env.NEXT_PUBLIC_SARVAM_TTS_URL || 'https://api.sarvam.ai/text-to-speech';
    const response = await fetch(sarvamTtsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': sarvamApiKey,
      },
      body: JSON.stringify({
        inputs: [text],
        target_language_code: targetLangCode,
        speaker: 'dipti',
        pitch: 0,
        pace: 1,
        loudness: 1.5,
        model: 'mirco',
        enable_preprocessing: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Sarvam TTS error:', response.status, errorText);
      return NextResponse.json(
        { error: `TTS failed: ${response.status}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    
    if (!data.audio_data) {
      console.error('No audio data in response:', data);
      return NextResponse.json(
        { error: 'No audio generated' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      audio: data.audio_data,
      language: targetLangCode,
      provider: 'sarvam',
    });

  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'TTS failed' },
      { status: 500 }
    );
  }
}