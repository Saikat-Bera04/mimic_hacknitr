'use client';

import { useState, useEffect, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Loader2, User, Mail, FileText, ArrowRight, Check } from 'lucide-react';
import { API_URL } from '@/lib/utils';

const BACKEND_URL = API_URL;

// Psychological MCQ Questions
// Psychological MCQ Questions
const TRAINER_QUESTIONS = [
  {
    id: 'q1',
    question: "When you're stressed or overwhelmed, what do you usually do first?",
    description: 'Reveals coping style and emotional regulation',
    options: [
      'I need time alone to process',
      'I talk to someone I trust',
      'I take immediate action to fix it',
      'I distract myself with activities',
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

type InviteStatus = 'loading' | 'valid' | 'invalid' | 'expired' | 'completed';
type FlowStep = 'acceptance' | 'questionnaire';

interface InvitationData {
  avatarName: string;
  ownerName: string;
  ownerEmail: string;
  ownerResponses: Array<{ question: string; answer: string }>;
  status: string;
  expiresAt: string;
}

export default function TrainerInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const { toast } = useToast();

  const [status, setStatus] = useState<InviteStatus>('loading');
  const [flowStep, setFlowStep] = useState<FlowStep>('acceptance');
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [trainerName, setTrainerName] = useState('');

  // Questionnaire state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<string, { answer: string; note: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/avatar-flow/validate/${token}`);
      const data = await res.json();

      if (!data.valid) {
        if (data.invitation?.status === 'completed') {
          setStatus('completed');
        } else if (data.invitation?.status === 'expired') {
          setStatus('expired');
        } else {
          setStatus('invalid');
        }
        return;
      }

      setInvitationData(data.invitation);

      // If already accepted, go directly to questionnaire
      if (data.invitation.status === 'accepted') {
        setFlowStep('questionnaire');
      }

      setStatus('valid');
    } catch (error) {
      console.error('Validation error:', error);
      setStatus('invalid');
    }
  };

  const handleAcceptInvitation = async () => {
    if (!trainerName.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter your name to continue.',
        variant: 'destructive',
      });
      return;
    }

    setIsAccepting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/avatar-flow/accept/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainerName }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to accept invitation');
      }

      toast({
        title: 'Invitation Accepted!',
        description: 'You can now proceed with the questionnaire.',
      });

      setFlowStep('questionnaire');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsAccepting(false);
    }
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: { answer, note: prev[questionId]?.note || '' },
    }));
  };

  const handleNoteChange = (questionId: string, note: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], answer: prev[questionId]?.answer || '', note },
    }));
  };

  const handleNext = () => {
    const currentQuestionId = TRAINER_QUESTIONS[currentQuestion].id;
    if (!responses[currentQuestionId]?.answer) {
      toast({
        title: 'Answer Required',
        description: 'Please select an answer before continuing.',
        variant: 'destructive',
      });
      return;
    }
    setCurrentQuestion(prev => prev + 1);
  };

  const handlePrevious = () => {
    setCurrentQuestion(prev => prev - 1);
  };

  const handleSubmit = async () => {
    const currentQuestionId = TRAINER_QUESTIONS[currentQuestion].id;
    if (!responses[currentQuestionId]?.answer) {
      toast({
        title: 'Answer Required',
        description: 'Please select an answer before submitting.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formattedResponses = TRAINER_QUESTIONS.map(q => ({
        question: q.question,
        answer: responses[q.id]?.answer || '',
        note: responses[q.id]?.note || undefined,
      }));

      const res = await fetch(`${BACKEND_URL}/api/avatar-flow/submit/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses: formattedResponses }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit responses');
      }

      toast({
        title: 'Success!',
        description: 'Your personality assessment has been submitted and the avatar personality has been created.',
      });

      setIsSubmitted(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.12),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.1),transparent_45%)] pointer-events-none" />
        <Card className="card-glass p-8 max-w-md border border-white/10 z-10">
          <CardContent className="flex flex-col items-center pt-6">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-lg text-muted-foreground">Validating invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid state
  if (status === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.12),transparent_40%)] pointer-events-none" />
        <Card className="card-glass p-8 max-w-md text-center border border-red-400/20 z-10">
          <CardContent className="pt-6">
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Invalid Invitation</h1>
            <p className="text-muted-foreground">This invitation link is not valid or has been removed.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Expired state
  if (status === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.14),transparent_45%)] pointer-events-none" />
        <Card className="card-glass p-8 max-w-md text-center border border-yellow-400/20 z-10">
          <CardContent className="pt-6">
            <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Invitation Expired</h1>
            <p className="text-muted-foreground">This invitation has expired. Please request a new one from the owner.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Already completed state
  if (status === 'completed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.14),transparent_45%)] pointer-events-none" />
        <Card className="card-glass p-8 max-w-md text-center border border-green-400/20 z-10">
          <CardContent className="pt-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Already Completed</h1>
            <p className="text-muted-foreground">This invitation has already been used and cannot be accessed again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state after submission
  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.14),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.12),transparent_42%)] pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="z-10"
        >
          <Card className="card-glass p-8 max-w-md text-center border border-white/10">
            <CardContent className="pt-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Thank You!</h1>
              <p className="text-muted-foreground mb-4">
                Your personality assessment has been submitted successfully. The AI has generated a personalized master prompt for the avatar.
              </p>
              <p className="text-sm text-muted-foreground">
                This link can no longer be used.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Acceptance step - Show owner info and ask for permission
  if (flowStep === 'acceptance' && invitationData) {
    return (
      <div className="min-h-screen bg-background py-8 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.1),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.1),transparent_45%)] pointer-events-none" />
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="card-glass border border-white/10">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Avatar Training Invitation</CardTitle>
                <CardDescription>
                  You've been invited to help train an AI avatar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Owner Info */}
                <div className="bg-secondary/20 rounded-lg p-4 space-y-3 border border-white/10">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Invitation from
                  </h3>
                  <div className="space-y-2 pl-7">
                    <p className="flex items-center gap-2">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{invitationData.ownerName || 'Avatar Owner'}</span>
                    </p>
                    {invitationData.ownerEmail && (
                      <p className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{invitationData.ownerEmail}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Avatar Info */}
                <div className="bg-primary/10 rounded-lg p-4 space-y-3 border border-primary/20">
                  <h3 className="font-semibold text-lg">
                    Avatar: <span className="text-primary">{invitationData.avatarName}</span>
                  </h3>

                  {/* Owner's initial responses */}
                  {invitationData.ownerResponses && invitationData.ownerResponses.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Owner's Configuration
                      </h4>
                      <div className="space-y-2">
                        {invitationData.ownerResponses.map((response, index) => (
                          <div key={index} className="bg-background/50 rounded p-3">
                            <p className="text-sm text-muted-foreground">{response.question}</p>
                            <p className="font-medium mt-1">{response.answer}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* What you'll do */}
                <div className="border border-white/10 bg-black/20 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">What you'll do</h3>
                  <p className="text-sm text-muted-foreground">
                    You'll answer {TRAINER_QUESTIONS.length} personality questions to help shape the avatar's behavior and communication style.
                    Your responses will be used to create a personalized AI personality.
                  </p>
                </div>

                {/* Trainer name input */}
                <div className="space-y-2">
                  <Label htmlFor="trainerName">Your Name</Label>
                  <Input
                    id="trainerName"
                    placeholder="Enter your name"
                    value={trainerName}
                    onChange={(e) => setTrainerName(e.target.value)}
                    className="bg-background/40 border-white/10"
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be shown to the avatar owner in their dashboard.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full shadow-[0_0_20px_rgba(0,102,255,0.25)] hover:shadow-[0_0_28px_rgba(0,102,255,0.35)]"
                  size="lg"
                  onClick={handleAcceptInvitation}
                  disabled={isAccepting}
                >
                  {isAccepting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Accepting...
                    </>
                  ) : (
                    <>
                      Accept & Start Questionnaire
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Questionnaire - main content
  const question = TRAINER_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / TRAINER_QUESTIONS.length) * 100;

  return (
    <div className="min-h-screen bg-background py-8 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.1),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.1),transparent_42%)] pointer-events-none" />
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Personality Assessment</h1>
          <p className="text-muted-foreground">
            Training avatar: <span className="font-semibold text-primary">{invitationData?.avatarName}</span>
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Question {currentQuestion + 1} of {TRAINER_QUESTIONS.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-secondary/50 rounded-full overflow-hidden border border-white/10">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            style={{ pointerEvents: 'auto' }}
          >
            <Card className="card-glass border border-white/10">
              <CardHeader>
                <CardTitle className="text-xl">{question.question}</CardTitle>
                <CardDescription>{question.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Options */}
                <div className="space-y-3">
                  {question.options.map((option, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleAnswerSelect(question.id, option)}
                        className={`w-full p-4 text-left rounded-lg border transition-all cursor-pointer relative z-10 flex items-center gap-3 ${responses[question.id]?.answer === option
                          ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 shadow-sm shadow-cyan-500/20'
                          : 'border-white/10 hover:border-primary/50 hover:bg-secondary/30'
                        }`}
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all flex-shrink-0 ${responses[question.id]?.answer === option
                          ? 'bg-cyan-500 border-cyan-500'
                          : 'border-muted-foreground/50'
                        }`}>
                        {responses[question.id]?.answer === option && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                      </div>
                      <span className="block">{option}</span>
                    </button>
                  ))}
                </div>

                {/* Optional note */}
                <div className="pt-4">
                  <Label htmlFor="note" className="text-sm text-muted-foreground">
                    Additional notes (optional)
                  </Label>
                  <Textarea
                    id="note"
                    placeholder="Any extra context..."
                    value={responses[question.id]?.note || ''}
                    onChange={(e) => handleNoteChange(question.id, e.target.value)}
                    className="mt-2 bg-background/40 border-white/10"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-4 mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="flex-1 border-white/15 bg-background/30 hover:bg-background/50"
          >
            Previous
          </Button>

          {currentQuestion < TRAINER_QUESTIONS.length - 1 ? (
            <Button onClick={handleNext} className="flex-1">
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Avatar Personality...
                </>
              ) : (
                'Submit & Generate Personality'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}