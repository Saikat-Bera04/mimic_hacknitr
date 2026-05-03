import { NextResponse } from 'next/server';
import crypto from 'crypto';

// WARNING: in-memory store — all invitations are lost on server restart / redeploy.
// TODO: migrate to Convex (trainerInvitations table) for persistence.
export const invitations = new Map<string, {
  id: string;
  avatarId: string;
  avatarName: string;
  createdBy: string;
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
  usedAt?: Date;
  responses?: Record<string, string>;
  masterPrompt?: string;
}>();

// Generate a unique invitation token
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { avatarId, avatarName, createdBy, expiresInHours = 24, masterPrompt } = body;

    if (!avatarId || !avatarName) {
      return NextResponse.json(
        { error: 'Avatar ID and name are required' },
        { status: 400 }
      );
    }

    const token = generateToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInHours * 60 * 60 * 1000);

    const invitation = {
      id: token,
      avatarId,
      avatarName,
      createdBy: createdBy || 'anonymous',
      createdAt: now,
      expiresAt,
      used: false,
      masterPrompt,
    };

    invitations.set(token, invitation);

    // Generate the invitation URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const inviteUrl = `${baseUrl}/invite/${token}`;

    return NextResponse.json({
      success: true,
      token,
      inviteUrl,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    );
  }
}

// GET endpoint to list all invitations (for dashboard)
export async function GET() {
  const now = new Date();
  const invitationList = Array.from(invitations.values())
    .filter(inv => inv.expiresAt > now)
    .map(inv => ({
      id: inv.id.substring(0, 8) + '...',
      avatarName: inv.avatarName,
      createdAt: inv.createdAt,
      expiresAt: inv.expiresAt,
      used: inv.used,
      usedAt: inv.usedAt,
      hasResponses: !!inv.responses,
      hasMasterPrompt: !!inv.masterPrompt,
    }));

  return NextResponse.json({ invitations: invitationList });
}
