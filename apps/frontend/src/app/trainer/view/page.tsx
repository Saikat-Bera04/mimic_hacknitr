'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, Lock, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

interface AvatarSummary {
  avatarId: string;
  avatarName: string;
  avatarImageUrl?: string;
  masterPrompt: string;
  createdAt: number;
}

interface TrainerMemory {
  text: string;
  createdAt: number;
  source: string;
}

function TrainerViewContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [avatarSummary, setAvatarSummary] = useState<AvatarSummary | null>(null);
  const [memories, setMemories] = useState<TrainerMemory[]>([]);
  const [memoryCount, setMemoryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [trainerAccessToken, setTrainerAccessToken] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('No access token provided');
      setLoading(false);
      return;
    }

    validateAndFetchData();
  }, [token]);

  // Load any saved token for this avatar on mount
  useEffect(() => {
    if (avatarSummary?.avatarId) {
      const saved = localStorage.getItem(`trainerAccessToken:${avatarSummary.avatarId}`);
      if (saved) setTrainerAccessToken(saved);
    }
  }, [avatarSummary?.avatarId]);

  const validateAndFetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate token and get avatar summary
      const avatarRes = await fetch(`${CONVEX_URL}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: 'trainerAccess:validateToken',
          args: { token },
        }),
      });

      const avatarData = await avatarRes.json();
      
      if (!avatarData.data) {
        setError('Invalid or expired access token');
        setLoading(false);
        return;
      }

      setAvatarSummary(avatarData.data);

      // Get trainer memories
      const memoriesRes = await fetch(`${CONVEX_URL}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: 'trainerAccess:getTrainerMemories',
          args: { token },
        }),
      });

      const memoriesData = await memoriesRes.json();
      if (memoriesData.data) {
        setMemories(memoriesData.data);
      }

      // Get memory count
      const countRes = await fetch(`${CONVEX_URL}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: 'trainerAccess:getMemoryCount',
          args: { token },
        }),
      });

      const countData = await countRes.json();
      if (countData.data !== undefined) {
        setMemoryCount(countData.data);
      }

    } catch (err) {
      console.error('Error fetching trainer data:', err);
      setError('Failed to load avatar information');
    } finally {
      setLoading(false);
    }
  };

  const getAvatarImage = (avatarName: string, avatarImageUrl?: string) => {
    if (avatarImageUrl) return avatarImageUrl;
    
    const defaultImage = PlaceHolderImages.find(img => img.id === 'user-avatar-1');
    return defaultImage?.imageUrl || '/default-avatar.png';
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center p-4">
        <Card className="card-glass w-full max-w-2xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Validating access token...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !avatarSummary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center p-4">
        <Card className="card-glass w-full max-w-2xl border-red-500/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <div>
                <CardTitle className="text-red-500">Access Denied</CardTitle>
                <CardDescription>
                  {error || 'Unable to access avatar information'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              This could be because:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• The access token is invalid or has expired</li>
              <li>• The avatar no longer exists</li>
              <li>• You don't have permission to view this avatar</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state - show avatar summary
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--dynamic-text-color)' }}>
            Trainer View
          </h1>
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            <Lock className="h-4 w-4" />
            Read-only access to avatar you contributed to
          </p>
        </div>

        {/* Avatar Summary Card */}
        <Card className="card-glass border-primary/30">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-primary/50 shadow-lg">
                <Image
                  src={getAvatarImage(avatarSummary.avatarName, avatarSummary.avatarImageUrl)}
                  alt={avatarSummary.avatarName}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl" style={{ color: 'var(--dynamic-text-color)' }}>
                  {avatarSummary.avatarName}
                </CardTitle>
                <CardDescription className="text-sm mt-1">
                  Created on {formatDate(avatarSummary.createdAt)}
                </CardDescription>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{memoryCount}</div>
                <div className="text-xs text-muted-foreground">Total Memories</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <p className="font-semibold text-green-600 dark:text-green-400">
                  This avatar was created using your input
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Thank you for contributing to this AI avatar's personality and knowledge!
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Bot className="h-4 w-4" />
                Personality Summary
              </h3>
              <div className="p-4 bg-background/50 rounded-lg border border-border">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {avatarSummary.masterPrompt}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Memories Card */}
        {memories.length > 0 && (
          <Card className="card-glass">
            <CardHeader>
              <CardTitle>Your Contributions</CardTitle>
              <CardDescription>
                Memories and training inputs you added to this avatar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {memories.map((memory, index) => (
                  <div
                    key={index}
                    className="p-3 bg-background/30 rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <p className="text-sm mb-2">{memory.text}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{formatDate(memory.createdAt)}</span>
                      <span>•</span>
                      <span className="capitalize">{memory.source.replace('_', ' ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Restrictions Notice */}
        <Card className="card-glass border-yellow-500/30 bg-yellow-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lock className="h-4 w-4 text-yellow-500" />
              Access Restrictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-2">
              As a trainer, you have read-only access. You cannot:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 ml-4">
              <li>• Chat with this avatar</li>
              <li>• Edit the master prompt or personality</li>
              <li>• Add or delete memories</li>
              <li>• Invite others or change permissions</li>
              <li>• View or access other avatars</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-3">
              If you need additional access, please contact the avatar owner.
            </p>
          </CardContent>
        </Card>

        {/* Trainer Access Token Link */}
        {trainerAccessToken && (
          <Card className="card-glass border-muted/30 bg-muted/5">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                Trainer View Link
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-2">
                This is your personal link to access the trainer view for this avatar:
              </div>
              <code className="block break-all text-xs font-mono mb-2">
                {`${window.location.origin}/trainer/view?token=${trainerAccessToken}`}
              </code>
              <Button
                size="sm"
                onClick={() =>
                  navigator.clipboard.writeText(
                    `${window.location.origin}/trainer/view?token=${trainerAccessToken}`
                  )
                }
              >
                Copy Link
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-4">
          This is a secure, token-based view. Your access token is tied to this specific avatar only.
        </div>
      </div>
    </div>
  );
}

  export default function TrainerViewPage() {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center p-4">
            <Card className="card-glass w-full max-w-2xl">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading trainer view...</p>
              </CardContent>
            </Card>
          </div>
        }
      >
        <TrainerViewContent />
      </Suspense>
    );
  }


