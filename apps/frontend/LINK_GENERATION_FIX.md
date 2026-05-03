# Link Generation & URL Configuration Fix

## Overview
Fixed critical issues where link generation was using old deployed URLs instead of the current environment URLs.

## Changes Made

### 1. **Fixed `lib/utils.ts`** 
**Problem:** Hardcoded fallback to old deployed link `https://mimic-xt46.onrender.com`

**Solution:** 
- Removed hardcoded fallback URL
- Added warning message when `NEXT_PUBLIC_BACKEND_URL` is not configured
- Now uses environment variable only - ensures you use the correct URL

**Before:**
```typescript
export const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://mimic-xt46.onrender.com";
```

**After:**
```typescript
if (!process.env.NEXT_PUBLIC_BACKEND_URL) {
  console.warn('NEXT_PUBLIC_BACKEND_URL environment variable is not set...');
}
export const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";
```

### 2. **Made Third-Party APIs Configurable**
**Problem:** Sarvam.ai endpoints were hardcoded with no environment variable support

**Solution:** Added environment variables for all three Sarvam endpoints:

| Route | Environment Variable | Default |
|-------|----------------------|---------|
| `speech-to-text` | `NEXT_PUBLIC_SARVAM_SPEECH_URL` | `https://api.sarvam.ai/speech-to-text` |
| `text-to-speech` | `NEXT_PUBLIC_SARVAM_TTS_URL` | `https://api.sarvam.ai/text-to-speech` |
| `translate` | `NEXT_PUBLIC_SARVAM_TRANSLATE_URL` | `https://api.sarvam.ai/translate` |

### 3. **Updated `.env.local`**
Changed backend URL from old deployed link to local development:
```
# Before
NEXT_PUBLIC_BACKEND_URL=https://mimic-xt46.onrender.com

# After
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 4. **Created `.env.example`**
Comprehensive documentation of all required environment variables with guidance on each one.

## Environment Variables Quick Reference

### Required Variables
- **NEXT_PUBLIC_BACKEND_URL** - Your current backend server URL (local or deployed)
- **NEXT_PUBLIC_BASE_URL** - Frontend base URL (used for generating absolute URLs and invite links)
  - 📝 Production: `https://mimic01.vercel.app`
  - 💻 Local dev: `http://localhost:3000`
- **NEXT_PUBLIC_CONVEX_URL** - Convex database URL
- **NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY** - Clerk auth public key
- **CLERK_SECRET_KEY** - Clerk auth secret
- **SARVAM_API_KEY** - Sarvam AI API key (server-side)
- **GEMINI_API_KEY** - Google Gemini API key (server-side)

### Optional Variables (override defaults)
- **NEXT_PUBLIC_SARVAM_SPEECH_URL** - Custom Sarvam speech-to-text endpoint
- **NEXT_PUBLIC_SARVAM_TTS_URL** - Custom Sarvam text-to-speech endpoint
- **NEXT_PUBLIC_SARVAM_TRANSLATE_URL** - Custom Sarvam translate endpoint

## How to Use

### For Local Development
1. Update `.env.local` with your local backend URL:
   ```
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

2. Ensure your backend is running on `localhost:8000`

3. Restart your development server

### For Production Deployment
1. Update environment variables to use your production URLs:
   ```
   NEXT_PUBLIC_BACKEND_URL=https://your-backend-domain.com
   NEXT_PUBLIC_BASE_URL=https://mimic01.vercel.app
   ```

2. These will be used in:
   - All API calls
   - Link generation (training links, trainer access links, invitations)
   - Absolute URL references

## Testing
All link generation now uses `window.location.origin` or environment variables instead of hardcoded URLs.

Affected components:
- `components/dashboard/AvatarTraining.tsx` - Training links
- `app/chat/[avatarId]/page.tsx` - Chat functionality
- `app/api/invitations/route.ts` - Invitation link generation
- `app/trainer-invite/[token]/page.ts` - Trainer access links

## shadcn/ui Status
✅ **No changes needed** - shadcn/ui is already fully configured and integrated:
- 40+ components installed and ready to use
- Proper component organization in `src/components/ui/`
- All custom components are minimal and justified
- Consistent import patterns across the codebase

The project is already following best practices with shadcn/ui and Tailwind CSS.
