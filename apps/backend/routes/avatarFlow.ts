import { Express, Request, Response } from "express";
import { nanoid } from "nanoid";
import { GoogleGenAI } from "@google/genai";
import {
  GEMINI_EMBEDDING_MODEL,
  SHORT_GEMINI_RESPONSE_CONFIG,
  buildMemoryGroundedAvatarPrompt,
  generateContentWithFallback,
  getGeminiText,
} from "../lib/gemini";
import {
  expandMemoryContext,
  renderGraphContextForPrompt,
} from "../lib/memory-graph";

interface AvatarDraft {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  avatarName: string;
  avatarImageUrl?: string;  // Selected avatar image URL
  ownerResponses: Array<{ question: string; answer: string }>;
  draftPrompt: string;
  createdAt: number;
  status: 'draft' | 'awaiting_trainer' | 'completed';
  trainerResponses?: Array<{ question: string; answer: string; note?: string }>;
  finalMasterPrompt?: string;
  completedAt?: number;
  convexPromptId?: string;  
}

interface TrainerInvitation {
  id: string;
  token: string;
  avatarId: string;
  avatarName: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  createdAt: number;
  expiresAt: number;
  status: 'pending' | 'accepted' | 'completed' | 'expired';
  trainerId?: string;
  trainerName?: string;
  acceptedAt?: number;
  submittedAt?: number;
  responses?: Array<{
    question: string;
    answer: string;
    note?: string;
  }>;
}

// WARNING: in-memory only — all avatar drafts and invitations are lost on server restart.
// TODO: migrate both maps to Convex (avatarFlowConversations / trainerInvitations tables).
const avatars = new Map<string, AvatarDraft>();
const invitations = new Map<string, TrainerInvitation>();

// Psychological MCQ Questions for personality analysis
const TRAINER_QUESTIONS = [
  {
    id: 'q1',
    question: "When you're stressed or overwhelmed, what do you usually do first?",
    description: 'Reveals coping style and emotional regulation',
    options: [
      'Take a short break to calm down',
      'Distract myself with entertainment or social media',
      'Talk to someone I trust',
      'Try to organize tasks or make a plan',
      'Push through and deal with it later',
      'Withdraw or rest until it passes',
    ]
  },
  {
    id: 'q2',
    question: 'What kind of activities make you lose track of time?',
    description: 'Shows genuine interests and intrinsic motivation',
    options: [
      'Creative work (designing, writing, music, art)',
      'Learning or researching new topics',
      'Coding, problem-solving, or building things',
      'Social activities and conversations',
      'Gaming, watching content, or entertainment',
      'Physical activities or sports',
    ]
  },
  {
    id: 'q3',
    question: 'How do you usually make important decisions?',
    description: 'Indicates decision-making style and independence',
    options: [
      'Mostly logical analysis and facts',
      'Strong intuition or gut feeling',
      'Advice from people I trust',
      'A balance of logic and intuition',
      'Trial and error - learn as I go',
      'I delay decisions until I feel confident',
    ]
  },
  {
    id: 'q4',
    question: 'What frustrates you most about working with other people?',
    description: 'Reveals expectations, boundaries, and interpersonal behavior',
    options: [
      'Lack of clear communication',
      'Missed deadlines or unreliability',
      'Ego or unwillingness to listen',
      'Unequal effort or responsibility',
      'Too many opinions slowing progress',
      'I rarely get frustrated working with others',
    ]
  },
  {
    id: 'q5',
    question: 'Do you prefer planning everything in advance or figuring things out as you go?',
    description: 'Shows structure vs flexibility preference',
    options: [
      'Detailed planning before starting',
      'Light planning with flexibility',
      'Mostly figuring things out as I go',
      'Adapting plans frequently based on situations',
      'Avoid planning unless necessary',
      'Depends on the task or context',
    ]
  },
  {
    id: 'q6',
    question: 'What motivates you more?',
    description: 'Uncovers core drivers and values',
    options: [
      'Recognition and appreciation',
      'Personal growth and learning',
      'Helping others or making an impact',
      'Financial stability or rewards',
      'Solving meaningful problems',
      'Freedom and independence',
    ]
  },
  {
    id: 'q7',
    question: 'How do you react when someone strongly disagrees with you?',
    description: 'Reveals conflict handling and emotional maturity',
    options: [
      'Listen and try to understand their view',
      'Defend my point with logic',
      'Reflect privately before responding',
      'Compromise if possible',
      'Get emotionally affected but calm down later',
      'Avoid the conflict altogether',
    ]
  },
  {
    id: 'q8',
    question: 'What kind of feedback affects you the most?',
    description: 'Shows sensitivity and growth mindset',
    options: [
      'Positive encouragement',
      'Constructive criticism with solutions',
      'Honest and direct feedback',
      'Feedback from people I respect',
      'Written or detailed feedback',
      "I'm affected by all types equally",
    ]
  },
  {
    id: 'q9',
    question: 'When you imagine your ideal day, what are you mostly doing and with whom?',
    description: 'Reveals social orientation and lifestyle preferences',
    options: [
      'Working deeply on something I love, alone',
      'Creating or building with a small team',
      'Learning or exploring new ideas',
      'Spending time with close friends or family',
      'Leading or contributing to a community',
      'Relaxing and enjoying personal time',
    ]
  },
  {
    id: 'q10',
    question: "What is something you care deeply about that most people don't notice?",
    description: 'Uncovers deeper interests, empathy, and individuality',
    options: [
      'Small design or aesthetic details',
      'Fairness and how people are treated',
      'Learning systems and how things work',
      'Emotional well-being of others',
      'Long-term impact over short-term results',
      'Personal values and integrity',
    ]
  },
];

// Helper: Generate draft prompt from owner responses
function generateDraftPrompt(
  avatarName: string,
  ownerResponses: Array<{ question: string; answer: string }>
): string {
  const ownerInputs = ownerResponses
    .map(r => `- ${r.question}\n  ${r.answer}`)
    .join('\n\n');

  return `You are ${avatarName}, an AI assistant configured with the following requirements:

## Core Configuration (Owner Input)
${ownerInputs}

## Behavioral Guidelines
- Always stay in character as ${avatarName}
- Follow the purpose and expertise defined above
- Respect all restrictions and limitations
- Maintain the specified tone and communication style
- Prioritize user needs while staying within your defined scope`;
}

// Helper: Generate trainer prompt addition
function generateTrainerPromptAddition(
  trainerResponses: Array<{ question: string; answer: string; note?: string }>
): string {
  const traits = trainerResponses
    .map(r => `- ${r.question}\n  Selected: ${r.answer}${r.note ? `\n  Note: ${r.note}` : ''}`)
    .join('\n\n');

  return `## Personality & Communication Style (Trainer Input)
${traits}

Apply these personality traits consistently while maintaining the core configuration.`;
}

export const avatarFlowRoute = (app: Express) => {

  // Get trainer questions
  app.get("/api/avatar-flow/questions", (req: Request, res: Response) => {
    res.json({ questions: TRAINER_QUESTIONS });
  });

  // Create draft avatar with owner's questions
  app.post("/api/avatar-flow/create-draft", async (req: Request, res: Response) => {
    try {
      const { ownerId, ownerName, ownerEmail, avatarName, avatarImageUrl, ownerResponses } = req.body;

      if (!ownerId || !avatarName || !ownerResponses) {
        return res.status(400).json({
          error: "ownerId, avatarName, and ownerResponses are required",
        });
      }

      // Generate draft master prompt from owner responses
      const draftPrompt = generateDraftPrompt(avatarName, ownerResponses);
      const avatarId = nanoid();

      // Store avatar draft
      const avatarDraft: AvatarDraft = {
        id: avatarId,
        ownerId,
        ownerName: ownerName || 'Avatar Owner',
        ownerEmail: ownerEmail || '',
        avatarName,
        avatarImageUrl: avatarImageUrl || '',
        ownerResponses,
        draftPrompt,
        createdAt: Date.now(),
        status: 'draft',
      };
      avatars.set(avatarId, avatarDraft);

      res.json({
        success: true,
        avatarId,
        avatarName,
        draftPrompt,
      });
    } catch (error: any) {
      console.error("Create draft error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Generate one-time trainer invitation link
  app.post("/api/avatar-flow/generate-invite", async (req: Request, res: Response) => {
    try {
      const { avatarId, avatarName, ownerId, expiresInHours = 24 } = req.body;

      if (!avatarId || !avatarName) {
        return res.status(400).json({ error: "avatarId and avatarName are required" });
      }

      // Update avatar status
      const avatar = avatars.get(avatarId);
      if (avatar) {
        avatar.status = 'awaiting_trainer';
        avatars.set(avatarId, avatar);
      }

      const token = nanoid(32);
      const now = Date.now();
      const expiresAt = now + expiresInHours * 60 * 60 * 1000;

      const invitation: TrainerInvitation = {
        id: nanoid(),
        token,
        avatarId,
        avatarName,
        ownerId: ownerId || avatar?.ownerId || 'unknown',
        ownerName: avatar?.ownerName || 'Avatar Owner',
        ownerEmail: avatar?.ownerEmail || '',
        createdAt: now,
        expiresAt,
        status: 'pending',
      };

      invitations.set(token, invitation);

      const frontendUrl = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
      const inviteUrl = `${frontendUrl}/trainer-invite/${token}`;

      res.json({
        success: true,
        invitation: {
          id: invitation.id,
          token: invitation.token,
          inviteUrl,
          expiresAt: new Date(expiresAt).toISOString(),
        },
      });
    } catch (error: any) {
      console.error("Generate invite error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Validate invitation token - returns owner info for acceptance
  app.get("/api/avatar-flow/validate/:token", async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const tokenValue = Array.isArray(token) ? token[0] : token;
      const invitation = invitations.get(tokenValue);

      if (!invitation) {
        return res.status(404).json({
          valid: false,
          error: "Invitation not found"
        });
      }

      const now = Date.now();
      const isExpired = now > invitation.expiresAt;
      const isCompleted = invitation.status === 'completed';

      // Update expired status
      if (isExpired && invitation.status === 'pending') {
        invitation.status = 'expired';
        invitations.set(tokenValue, invitation);
      }

      // Get avatar for owner responses
      const avatar = avatars.get(invitation.avatarId);

      res.json({
        valid: !isExpired && !isCompleted,
        invitation: {
          avatarName: invitation.avatarName,
          ownerName: invitation.ownerName,
          ownerEmail: invitation.ownerEmail,
          ownerResponses: avatar?.ownerResponses || [],
          status: invitation.status,
          expiresAt: new Date(invitation.expiresAt).toISOString(),
        },
      });
    } catch (error: any) {
      console.error("Validate invite error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Accept invitation - called after trainer accepts
  app.post("/api/avatar-flow/accept/:token", async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const { trainerName } = req.body;
      const tokenValue = Array.isArray(token) ? token[0] : token;
      const invitation = invitations.get(tokenValue);

      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }

      if (invitation.status === 'completed') {
        return res.status(400).json({ error: "This invitation has already been used" });
      }

      if (invitation.status === 'expired') {
        return res.status(400).json({ error: "This invitation has expired" });
      }

      const now = Date.now();
      invitation.status = 'accepted';
      invitation.trainerId = nanoid();
      invitation.trainerName = trainerName || 'Anonymous Trainer';
      invitation.acceptedAt = now;
      invitations.set(tokenValue, invitation);

      res.json({
        success: true,
        message: "Invitation accepted. You can now proceed with the questionnaire.",
      });
    } catch (error: any) {
      console.error("Accept invite error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Submit trainer questionnaire responses
  app.post("/api/avatar-flow/submit/:token", async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const { responses } = req.body;
      const tokenValue = Array.isArray(token) ? token[0] : token;

      const invitation = invitations.get(tokenValue);

      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }

      if (invitation.status === 'completed') {
        return res.status(400).json({ error: "This invitation has already been used" });
      }

      if (invitation.status === 'expired') {
        return res.status(400).json({ error: "This invitation has expired" });
      }

      // Get the avatar draft
      const avatar = avatars.get(invitation.avatarId);

      if (!avatar) {
        return res.status(404).json({ error: "Avatar not found" });
      }

      // Generate personalized master prompt using Gemini
      let finalMasterPrompt = '';
      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          throw new Error("GEMINI_API_KEY environment variable is not set");
        }

        const client = new GoogleGenAI({ apiKey });

        // Format owner responses
        const ownerContext = avatar.ownerResponses
          .map(r => `Q: ${r.question}\nA: ${r.answer}`)
          .join('\n\n');

        // Format trainer responses (psychological profile)
        const trainerContext = responses
          .map((r: any) => `Q: ${r.question}\nA: ${r.answer}${r.note ? ` (Note: ${r.note})` : ''}`)
          .join('\n\n');

        const prompt = `You are an expert AI personality designer. Based on the following information, create a comprehensive, personalized master prompt (system prompt) for an AI avatar named "${avatar.avatarName}".

## Owner's Configuration (Purpose & Role):
${ownerContext}

## Psychological Profile (from personality assessment):
${trainerContext}

Create a detailed, cohesive master prompt that:
1. Defines the avatar's core identity and purpose
2. Incorporates the psychological traits revealed by the assessment
3. Specifies communication style, tone, and behavior patterns
4. Includes guidelines for emotional intelligence and empathy
5. Sets boundaries and interaction preferences
6. Is written in second person ("You are...")

Write the master prompt as a single, well-structured paragraph or short set of paragraphs. Make it personalized and natural, not a bullet list. Focus on creating a genuine personality profile.`;

        const { result } = await generateContentWithFallback(client, {
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        });
        finalMasterPrompt = getGeminiText(result) || JSON.stringify(result);
        console.log("Gemini generated master prompt successfully");

      } catch (geminiError: any) {
        console.error("Gemini API error:", geminiError.message || geminiError);
        // Fallback to simple concatenation if Gemini fails
        const trainerPromptAddition = generateTrainerPromptAddition(responses);
        finalMasterPrompt = `${avatar.draftPrompt}\n\n${trainerPromptAddition}`;
        console.log("Using fallback prompt generation");
      }

      // Update avatar with trainer responses and final prompt
      avatar.trainerResponses = responses;
      avatar.finalMasterPrompt = finalMasterPrompt;
      avatar.status = 'completed';
      avatar.completedAt = Date.now();
      avatars.set(invitation.avatarId, avatar);

      // Save master prompt to Convex cloud storage
      let convexPromptId = null;
      try {
        const convexResult = await globalThis.convex.mutation("trainers:storeAvatarMasterPrompt", {
          avatarId: avatar.id,
          avatarName: avatar.avatarName,
          avatarImageUrl: avatar.avatarImageUrl || '',
          ownerId: avatar.ownerId,
          ownerName: avatar.ownerName || 'Avatar Owner',
          ownerEmail: avatar.ownerEmail || '',
          masterPrompt: finalMasterPrompt,
          trainerName: invitation.trainerName,
          ownerResponses: avatar.ownerResponses,
          trainerResponses: responses,
        });

        if (convexResult.success) {
          convexPromptId = convexResult.promptId;
          console.log("Master prompt saved to Convex:", convexPromptId);
        } else {
          console.error("Convex save returned error:", convexResult);
        }
      } catch (convexError: any) {
        console.error("Failed to save to Convex:", convexError.message || convexError);
        // Continue anyway - we still have local storage
      }

      // Mark invitation as completed - BURN THE LINK!
      invitation.responses = responses;
      invitation.submittedAt = Date.now();
      invitation.status = 'completed';
      invitations.set(tokenValue, invitation);

      // Update avatar with convex ID
      avatar.convexPromptId = convexPromptId || undefined;
      avatars.set(invitation.avatarId, avatar);

      res.json({
        success: true,
        avatarId: invitation.avatarId,
        avatarName: avatar.avatarName,
        finalMasterPrompt,
        trainerName: invitation.trainerName,
        convexPromptId,  // Include Convex ID in response
        savedToCloud: !!convexPromptId,
        message: "Responses submitted successfully. Personalized master prompt created!",
      });
    } catch (error: any) {
      console.error("Submit responses error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all invitations for an avatar (owner use)
  app.get("/api/avatar-flow/invitations/:avatarId", async (req: Request, res: Response) => {
    try {
      const { avatarId } = req.params;
      const avatarIdValue = Array.isArray(avatarId) ? avatarId[0] : avatarId;

      const avatarInvitations = Array.from(invitations.values())
        .filter(inv => inv.avatarId === avatarIdValue);

      res.json({ invitations: avatarInvitations });
    } catch (error: any) {
      console.error("Get invitations error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all avatars and their training status for owner dashboard
  app.get("/api/avatar-flow/dashboard/:ownerId", async (req: Request, res: Response) => {
    try {
      const { ownerId } = req.params;
      const ownerIdValue = Array.isArray(ownerId) ? ownerId[0] : ownerId;

      // Get all avatars for this owner
      const ownerAvatars = Array.from(avatars.values())
        .filter(av => av.ownerId === ownerIdValue);

      // Get invitations for each avatar
      const avatarsWithInvitations = ownerAvatars.map(avatar => {
        const avatarInvitations = Array.from(invitations.values())
          .filter(inv => inv.avatarId === avatar.id);

        return {
          ...avatar,
          invitations: avatarInvitations,
        };
      });

      res.json({
        success: true,
        avatars: avatarsWithInvitations
      });
    } catch (error: any) {
      console.error("Get dashboard error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all invitations for owner (to see trainer info)
  app.get("/api/avatar-flow/trainer-info/:ownerId", async (req: Request, res: Response) => {
    try {
      const { ownerId } = req.params;
      const ownerIdValue = Array.isArray(ownerId) ? ownerId[0] : ownerId;

      // Get all invitations for this owner's avatars
      const ownerInvitations = Array.from(invitations.values())
        .filter(inv => inv.ownerId === ownerIdValue);

      // Get completed invitations with trainer responses
      const completedTrainings = ownerInvitations
        .filter(inv => inv.status === 'completed')
        .map(inv => {
          const avatar = avatars.get(inv.avatarId);
          return {
            invitationId: inv.id,
            avatarId: inv.avatarId,
            avatarName: inv.avatarName,
            status: inv.status,
            submittedAt: inv.submittedAt ? new Date(inv.submittedAt).toISOString() : null,
            trainerResponses: inv.responses,
            finalMasterPrompt: avatar?.finalMasterPrompt,
            ownerResponses: avatar?.ownerResponses,
          };
        });

      // Get pending invitations
      const pendingInvitations = ownerInvitations
        .filter(inv => inv.status === 'pending' || inv.status === 'accepted')
        .map(inv => ({
          invitationId: inv.id,
          avatarId: inv.avatarId,
          avatarName: inv.avatarName,
          status: inv.status,
          trainerName: inv.trainerName,
          acceptedAt: inv.acceptedAt ? new Date(inv.acceptedAt).toISOString() : null,
          expiresAt: new Date(inv.expiresAt).toISOString(),
          token: inv.token,
        }));

      res.json({
        success: true,
        completedTrainings,
        pendingInvitations,
      });
    } catch (error: any) {
      console.error("Get trainer info error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get single avatar details with all info
  app.get("/api/avatar-flow/avatar/:avatarId", async (req: Request, res: Response) => {
    try {
      const { avatarId } = req.params;
      const avatarIdValue = Array.isArray(avatarId) ? avatarId[0] : avatarId;

      const avatar = avatars.get(avatarIdValue);

      if (!avatar) {
        return res.status(404).json({ error: "Avatar not found" });
      }

      const avatarInvitations = Array.from(invitations.values())
        .filter(inv => inv.avatarId === avatarIdValue);

      res.json({
        success: true,
        avatar: {
          ...avatar,
          invitations: avatarInvitations,
        }
      });
    } catch (error: any) {
      console.error("Get avatar error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Save master prompt to Convex (called from frontend with valid userId)
  app.post("/api/avatar-flow/save-to-convex", async (req: Request, res: Response) => {
    try {
      const { avatarId, convexUserId } = req.body;

      if (!avatarId || !convexUserId) {
        return res.status(400).json({
          error: "avatarId and convexUserId are required"
        });
      }

      const avatar = avatars.get(avatarId);

      if (!avatar) {
        return res.status(404).json({ error: "Avatar not found" });
      }

      if (!avatar.finalMasterPrompt) {
        return res.status(400).json({
          error: "Avatar does not have a finalized master prompt yet"
        });
      }

      
      const backendUrl = `http://localhost:${process.env.PORT || 8000}`;
      const masterPromptResponse = await fetch(
        `${backendUrl}/api/master-prompt`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: convexUserId,
            masterPrompt: avatar.finalMasterPrompt,
          }),
        }
      );

      const mpResult = await masterPromptResponse.json();

      if (!masterPromptResponse.ok) {
        return res.status(500).json({
          error: "Failed to save to Convex",
          details: mpResult.error
        });
      }

      res.json({
        success: true,
        message: "Master prompt saved to Convex successfully",
        convexResult: mpResult,
      });
    } catch (error: any) {
      console.error("Save to Convex error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get master prompt for an avatar (to use in chat)
  app.get("/api/avatar-flow/master-prompt/:avatarId", async (req: Request, res: Response) => {
    try {
      const { avatarId } = req.params;
      const avatarIdValue = Array.isArray(avatarId) ? avatarId[0] : avatarId;

      // First try to get from Convex cloud
      try {
        const convexPrompt = await globalThis.convex.query("trainers:getAvatarMasterPrompt", {
          avatarId: avatarIdValue,
        });

        if (convexPrompt) {
          return res.json({
            success: true,
            avatarId: convexPrompt.avatarId,
            avatarName: convexPrompt.avatarName,
            masterPrompt: convexPrompt.masterPrompt,
            trainerName: convexPrompt.trainerName,
            source: 'convex',
            convexId: convexPrompt._id,
          });
        }
      } catch (convexError) {
        console.log("Convex lookup failed, falling back to local storage");
      }

      // Fall back to local storage
      const avatar = avatars.get(avatarIdValue);

      if (!avatar) {
        return res.status(404).json({ error: "Avatar not found" });
      }

      if (!avatar.finalMasterPrompt) {
        return res.status(400).json({
          error: "Avatar does not have a finalized master prompt yet",
          status: avatar.status,
        });
      }

      res.json({
        success: true,
        avatarId: avatar.id,
        avatarName: avatar.avatarName,
        masterPrompt: avatar.finalMasterPrompt,
        status: avatar.status,
        source: 'local',
      });
    } catch (error: any) {
      console.error("Get master prompt error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all master prompts from Convex for an owner
  app.get("/api/avatar-flow/cloud-prompts/:ownerId", async (req: Request, res: Response) => {
    try {
      const { ownerId } = req.params;
      const ownerIdValue = Array.isArray(ownerId) ? ownerId[0] : ownerId;

      const cloudPrompts = await globalThis.convex.query("trainers:getOwnerMasterPrompts", {
        ownerId: ownerIdValue,
      });

      res.json({
        success: true,
        prompts: cloudPrompts || [],
        count: cloudPrompts?.length || 0,
      });
    } catch (error: any) {
      console.error("Get cloud prompts error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Chat with avatar using its master prompt + RAG from training memories
  app.post("/api/avatar-flow/chat/:avatarId", async (req: Request, res: Response) => {
    try {
      const { avatarId } = req.params;
      const avatarIdValue = Array.isArray(avatarId) ? avatarId[0] : avatarId;
      const { message, history = [], sessionId: incomingSessionId } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Stable session id for grouping messages (use provided or generate)
      const sessionId = incomingSessionId || `sess_${avatarIdValue}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      // Get master prompt for this avatar
      let masterPrompt = '';
      let avatarName = 'Avatar';

      // Try to get from Convex first
      try {
        const convexPrompt = await globalThis.convex.query("trainers:getAvatarMasterPrompt", {
          avatarId: avatarIdValue,
        });

        if (convexPrompt) {
          masterPrompt = convexPrompt.masterPrompt;
          avatarName = convexPrompt.avatarName;
        }
      } catch (convexError) {
        console.log("Convex lookup failed, falling back to local storage");
      }

      // Fall back to local storage
      if (!masterPrompt) {
        const avatar = avatars.get(avatarIdValue);
        if (avatar?.finalMasterPrompt) {
          masterPrompt = avatar.finalMasterPrompt;
          avatarName = avatar.avatarName;
        }
      }

      if (!masterPrompt) {
        return res.status(400).json({
          error: "Avatar is not trained yet. Please complete the training first.",
        });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not set");
      }

      const client = new GoogleGenAI({ apiKey });

      // === RAG: Fetch relevant training memories ===
      let relevantMemories: Array<{ id?: string; text: string; trustWeight: string; score: number }> = [];

      try {
        // Generate embedding for the user's message
        const embeddingResult = await client.models.embedContent({
          model: GEMINI_EMBEDDING_MODEL,
          contents: message,
        });

        if (embeddingResult?.embeddings?.[0]?.values) {
          // Query relevant memories from Convex
          const memories = await globalThis.convex.query("trainers:getRelevantTrainingMemories", {
            avatarId: avatarIdValue,
            queryEmbedding: embeddingResult.embeddings[0].values,
            topK: 3,
          });

          if (memories && memories.length > 0) {
            relevantMemories = memories
              .map((m: any) => ({
                id: m._id || m.id,
                text: m.text,
                trustWeight: m.trustWeight,
                score: m.score,
              }))
              .filter((memory: { score: number }) => typeof memory.score !== "number" || memory.score >= 0.35)
              .slice(0, 3);
            console.log(`Found ${relevantMemories.length} relevant memories for avatar ${avatarIdValue}`);
          }
        }
      } catch (ragError) {
        console.log("RAG lookup failed (non-critical):", ragError);
        // Continue without memories - not a critical failure
      }

      // Build grounded prompt with master prompt style + memory facts
      const groundedMemories = [...relevantMemories];
      let augmentedPrompt = "";

      if (relevantMemories.length > 0) {
        augmentedPrompt += "\n\n## Additional Context (from training):\n";
        relevantMemories.forEach((memory) => {
          const trustLabel = memory.trustWeight === "owner" ? "⭐" : memory.trustWeight === "trainer" ? "🎓" : "📝";
          augmentedPrompt += `- ${trustLabel} ${memory.text}\n`;
        });
      }

      // === GraphRAG: expand memory context from Neo4j (best-effort) ===
      let graphContext: Awaited<ReturnType<typeof expandMemoryContext>> | null = null;
      try {
        const startingIds = Array.isArray((relevantMemories as any))
          ? ((relevantMemories as any)
              .map((m: any) => m?._id ?? m?.id)
              .filter((id: any): id is string => typeof id === "string" && id.length > 0))
          : [];
        if (startingIds.length > 0) {
          graphContext = await expandMemoryContext(startingIds, { includeContradictions: true });
          const graphBlock = renderGraphContextForPrompt(graphContext);
          if (graphBlock) {
            groundedMemories.push({
              id: "graph-context",
              text: graphBlock,
              trustWeight: "derived",
              score: 0,
            });
          }
        }
      } catch (gErr) {
        console.warn("[neo4j] expandMemoryContext (flow) failed (non-critical):",
          gErr instanceof Error ? gErr.message : String(gErr));
      }

      // Build conversation history for context
      const conversationHistory = history.map((msg: { role: string; content: string }) =>
        `${msg.role === 'user' ? 'User' : avatarName}: ${msg.content}`
      ).join('\n');

      const recentMessages = history.map((msg: { role: string; content: string }) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      }));

      const prompt = buildMemoryGroundedAvatarPrompt({
        avatarName,
        personality: masterPrompt,
        memories: groundedMemories,
        recentMessages,
        userMessage: message,
      });

      const { result } = await generateContentWithFallback(client, {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        config: SHORT_GEMINI_RESPONSE_CONFIG,
      });
      const response = getGeminiText(result);

      // Persist both user and assistant messages to Convex (avatar-flow conversations)
      try {
        await fetch(`${process.env.CONVEX_URL}/api/mutation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: "conversations:appendFlowMessages",
            args: {
              avatarId: avatarIdValue,
              sessionId,
              newMessages: [
                { role: "user", content: message, timestamp: Date.now() },
                { role: "assistant", content: response, timestamp: Date.now() },
              ],
            },
          }),
        });
      } catch (persistErr) {
        console.error("Failed to persist flow conversation", persistErr);
      }

      res.json({
        success: true,
        response: response.trim(),
        avatarName,
        memoriesUsed: relevantMemories.length,
        sessionId,
        graphContextUsed: graphContext && graphContext.enabled
          ? {
              relatedMemoryCount: graphContext.relatedMemories.length,
              entities: graphContext.entities.slice(0, 8),
              traits: graphContext.traits.slice(0, 8),
            }
          : undefined,
        graphMemoryIdsUsed: graphContext && graphContext.enabled
          ? graphContext.relatedMemories.map((m) => m.id)
          : undefined,
        contradictions: graphContext && graphContext.enabled
          ? graphContext.contradictions
          : undefined,
      });
    } catch (error: any) {
      console.error("Chat error:", error);
      res.status(500).json({ error: error.message || "Failed to generate response" });
    }
  });

  // Fetch persisted conversation messages for a given session (avatar-flow)
  app.get("/api/avatar-flow/conversation/:avatarId", async (req: Request, res: Response) => {
    try {
      const { avatarId } = req.params;
      const { sessionId } = req.query as { sessionId?: string };

      if (!sessionId) {
        return res.status(400).json({ error: "sessionId is required" });
      }

      const convo = await globalThis.convex.query("conversations:getFlowConversation", {
        sessionId,
      });

      if (!convo || convo.avatarId !== avatarId) {
        return res.status(200).json({ success: true, messages: [] });
      }

      return res.status(200).json({ success: true, messages: convo.messages || [] });
    } catch (error: any) {
      console.error("Get conversation error:", error);
      res.status(500).json({ error: error.message || "Failed to load conversation" });
    }
  });

  // Generate embedding for text (used by training interface)
  app.post("/api/avatar-flow/generate-embedding", async (req: Request, res: Response) => {
    try {
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not set");
      }

      const client = new GoogleGenAI({ apiKey });
      const embeddingResult = await client.models.embedContent({
        model: GEMINI_EMBEDDING_MODEL,
        contents: text,
      });

      if (!embeddingResult?.embeddings?.[0]?.values) {
        throw new Error("Failed to generate embedding");
      }

      res.json({
        success: true,
        embedding: embeddingResult.embeddings[0].values,
        dimensions: embeddingResult.embeddings[0].values.length,
      });
    } catch (error: any) {
      console.error("Embedding generation error:", error);
      res.status(500).json({ error: error.message || "Failed to generate embedding" });
    }
  });
};
