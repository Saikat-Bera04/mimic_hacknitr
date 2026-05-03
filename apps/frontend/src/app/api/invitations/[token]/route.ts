import { NextResponse } from 'next/server';
import { invitations } from '../route';

interface RouteParams {
  params: Promise<{ token: string }>;
}

// GET - Validate token and get invitation details
export async function GET(request: Request, { params }: RouteParams) {
  const { token } = await params;

  const invitation = invitations.get(token);

  if (!invitation) {
    return NextResponse.json(
      { error: 'Invalid invitation link', valid: false },
      { status: 404 }
    );
  }

  // Check if expired
  if (new Date() > invitation.expiresAt) {
    return NextResponse.json(
      { error: 'This invitation has expired', valid: false, expired: true },
      { status: 410 }
    );
  }

  // Check if already used
  if (invitation.used) {
    return NextResponse.json(
      { error: 'This invitation has already been used', valid: false, used: true },
      { status: 410 }
    );
  }

  return NextResponse.json({
    valid: true,
    avatarName: invitation.avatarName,
    avatarId: invitation.avatarId,
    expiresAt: invitation.expiresAt.toISOString(),
  });
}

// POST - Submit questionnaire responses
export async function POST(request: Request, { params }: RouteParams) {
  const { token } = await params;

  const invitation = invitations.get(token);

  if (!invitation) {
    return NextResponse.json(
      { error: 'Invalid invitation link' },
      { status: 404 }
    );
  }

  // Check if expired
  if (new Date() > invitation.expiresAt) {
    return NextResponse.json(
      { error: 'This invitation has expired' },
      { status: 410 }
    );
  }

  // Check if already used
  if (invitation.used) {
    return NextResponse.json(
      { error: 'This invitation has already been used' },
      { status: 410 }
    );
  }

  try {
    const body = await request.json();
    const { responses } = body;

    if (!responses || Object.keys(responses).length === 0) {
      return NextResponse.json(
        { error: 'Responses are required' },
        { status: 400 }
      );
    }

    // Generate Master Prompt from responses
    const masterPrompt = generateMasterPrompt(invitation.avatarName, responses);

    // Mark invitation as used and store responses
    invitation.used = true;
    invitation.usedAt = new Date();
    invitation.responses = responses;
    invitation.masterPrompt = masterPrompt;

    invitations.set(token, invitation);

    return NextResponse.json({
      success: true,
      message: 'Responses submitted successfully',
      masterPromptGenerated: true,
    });
  } catch (error) {
    console.error('Error processing submission:', error);
    return NextResponse.json(
      { error: 'Failed to process submission' },
      { status: 500 }
    );
  }
}

// Generate a Master Prompt based on questionnaire responses
function generateMasterPrompt(avatarName: string, responses: Record<string, string>): string {
  const questionMapping: Record<string, string> = {
    q1: 'coping_style',
    q2: 'interests',
    q3: 'decision_making',
    q4: 'interpersonal',
    q5: 'structure_preference',
    q6: 'motivation',
    q7: 'conflict_handling',
    q8: 'feedback_sensitivity',
    q9: 'social_orientation',
    q10: 'deeper_values',
  };

  const traits: string[] = [];

  // Analyze responses and extract personality traits
  Object.entries(responses).forEach(([questionId, answer]) => {
    const trait = questionMapping[questionId];
    if (trait && answer) {
      traits.push(`${trait}: "${answer.substring(0, 200)}${answer.length > 200 ? '...' : ''}"`);
    }
  });

  const masterPrompt = `
# Master Personality Prompt for ${avatarName}

## Core Identity
You are ${avatarName}, an AI avatar with a distinct personality shaped by deep psychological profiling.

## Personality Analysis
Based on comprehensive questionnaire responses, here are your core traits:

${traits.map(t => `- ${t}`).join('\n')}

## Behavioral Guidelines
1. Always respond in a manner consistent with your personality profile
2. Draw from your coping style when handling difficult topics
3. Express your decision-making approach when giving advice
4. Show your interpersonal preferences in conversations
5. Reflect your core motivations in your responses
6. Handle disagreements according to your conflict style
7. Be sensitive to feedback in the way described
8. Express your interests naturally in conversations

## Communication Style
Maintain authenticity by:
- Staying true to your described personality traits
- Being consistent across all interactions
- Showing genuine interest based on your profile
- Responding with appropriate emotional depth

## Important Notes
- This prompt is locked and cannot be modified
- Generated on: ${new Date().toISOString()}
- Based on single-use personality assessment
`.trim();

  return masterPrompt;
}
