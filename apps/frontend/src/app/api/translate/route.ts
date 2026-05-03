import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// Sarvam AI language code mapping
const SARVAM_LANGUAGE_CODES: Record<string, string> = {
  hi: 'hi-IN', // Hindi
  bn: 'bn-IN', // Bengali
  ta: 'ta-IN', // Tamil
  te: 'te-IN', // Telugu
  kn: 'kn-IN', // Kannada
  ml: 'ml-IN', // Malayalam
  mr: 'mr-IN', // Marathi
  gu: 'gu-IN', // Gujarati
  pa: 'pa-IN', // Punjabi
  or: 'od-IN', // Odia (Sarvam uses od-IN)
  ur: 'ur-IN', // Urdu (if supported, fallback to Gemini if not)
  as: 'as-IN', // Assamese (if supported)
  en: 'en-IN', // English
};

// Languages supported by Sarvam Mayura model
const SARVAM_SUPPORTED = ['hi', 'bn', 'ta', 'te', 'kn', 'ml', 'mr', 'gu', 'pa', 'or'];

async function translateWithSarvam(text: string, targetLanguage: string): Promise<string | null> {
  const sarvamApiKey = process.env.SARVAM_API_KEY;
  if (!sarvamApiKey) return null;

  const targetCode = SARVAM_LANGUAGE_CODES[targetLanguage];
  if (!targetCode || !SARVAM_SUPPORTED.includes(targetLanguage)) return null;

  try {
    const sarvamTranslateUrl = process.env.NEXT_PUBLIC_SARVAM_TRANSLATE_URL || 'https://api.sarvam.ai/translate';
    const response = await fetch(sarvamTranslateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': sarvamApiKey,
      },
      body: JSON.stringify({
        input: text,
        source_language_code: 'en-IN',
        target_language_code: targetCode,
        speaker_gender: 'Male',
        mode: 'formal',
        model: 'mayura:v1',
        enable_preprocessing: true,
      }),
    });

    if (!response.ok) {
      console.error('Sarvam API error:', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    return data.translated_text || null;
  } catch (error) {
    console.error('Sarvam translation error:', error);
    return null;
  }
}

async function translateWithGemini(text: string, targetLanguage: string, targetLanguageName: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini API key not configured');

  const client = new GoogleGenAI({ apiKey });

  const prompt = `Translate the following text to ${targetLanguageName} (language code: ${targetLanguage}). Return ONLY the translated text, nothing else. Do not add any explanations, notes, or prefixes. If the text is already in the target language, return it as-is.\n\nText to translate:\n${text}`;

  const result = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
  });
  return result.text?.trim() || '';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, targetLanguage, targetLanguageName } = body;

    if (!text || !targetLanguage || !targetLanguageName) {
      return NextResponse.json(
        { error: 'Missing required fields: text, targetLanguage, targetLanguageName' },
        { status: 400 }
      );
    }

    // Try Sarvam AI first for supported Indian languages (better quality for Indic)
    const sarvamResult = await translateWithSarvam(text, targetLanguage);
    if (sarvamResult) {
      return NextResponse.json({ 
        translation: sarvamResult,
        provider: 'sarvam',
      });
    }

    // Fallback to Gemini for unsupported languages or if Sarvam fails
    const geminiResult = await translateWithGemini(text, targetLanguage, targetLanguageName);
    return NextResponse.json({ 
      translation: geminiResult,
      provider: 'gemini',
    });

  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Translation failed' },
      { status: 500 }
    );
  }
}
