import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// API_URL points to the Express backend server (used for all /api/* calls).
// NEXT_PUBLIC_BASE_URL is the *frontend's own* origin (used for invite links) and
// must NOT be used here, otherwise API requests will 404 against the frontend itself.
if (!process.env.NEXT_PUBLIC_BACKEND_URL) {
  console.warn(
    'NEXT_PUBLIC_BACKEND_URL environment variable is not set. '
    + 'Set this to your Express backend URL (e.g. http://localhost:8000 locally, '
    + 'or your deployed backend URL in production). Without it, API calls will fail.'
  );
}

export const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";
