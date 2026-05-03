"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

import { API_URL } from '@/lib/utils';

export function BackendUserSync() {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  const syncedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId || syncedUserId.current === userId) {
      return;
    }

    let cancelled = false;

    const currentUserId = userId;

    async function syncUser() {
      try {
        const token = await getToken();
        if (!token || cancelled) return;

        const response = await fetch(`${API_URL}/api/auth/clerk/sync`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to sync user with backend");
        }

        syncedUserId.current = currentUserId;
      } catch (error) {
        console.error("Backend user sync failed:", error);
      }
    }

    syncUser();

    return () => {
      cancelled = true;
    };
  }, [getToken, isLoaded, isSignedIn, userId]);

  return null;
}
