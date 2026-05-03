'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle, Clock, AlertTriangle, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const questions = [
  {
    id: 'q1',
    text: 'When you\'re stressed or overwhelmed, what do you usually do first?',
    options: [
      { value: 'withdraw', label: 'I need time alone to process' },
      { value: 'talk', label: 'I talk to someone I trust' },
      { value: 'action', label: 'I take immediate action to fix it' },
      { value: 'distract', label: 'I distract myself with activities' },
    ],
  },
  {
    id: 'q2',
    text: 'What kind of activities make you lose track of time?',
    options: [
      { value: 'creative', label: 'Creative projects (art, writing, music)' },
      { value: 'problem_solving', label: 'Problem-solving and puzzles' },
      { value: 'social', label: 'Deep conversations with others' },
      { value: 'learning', label: 'Learning something new' },
    ],
  },
  {
    id: 'q3',
    text: 'How do you usually make important decisions?',
    options: [
      { value: 'logic', label: 'Careful analysis of facts and data' },
      { value: 'intuition', label: 'Trust my gut feeling' },
      { value: 'advice', label: 'Seek advice from people I respect' },
      { value: 'mixed', label: 'A combination of all approaches' },
    ],
  },
  {
    id: 'q4',
    text: 'What frustrates you most about working with other people?',
    options: [
      { value: 'inefficiency', label: 'Inefficiency and wasted time' },
      { value: 'conflict', label: 'Unresolved conflicts and tension' },
      { value: 'communication', label: 'Poor communication' },
      { value: 'control', label: 'Lack of autonomy or micromanagement' },
    ],
  },
  {
    id: 'q5',
    text: 'Do you prefer planning everything in advance or figuring things out as you go?',
    options: [
      { value: 'planner', label: 'I plan everything meticulously' },
      { value: 'flexible', label: 'I prefer spontaneity and flexibility' },
      { value: 'balanced', label: 'I plan the big picture, improvise details' },
      { value: 'situational', label: 'Depends on the situation' },
    ],
  },
  {
    id: 'q6',
    text: 'What motivates you more?',
    options: [
      { value: 'recognition', label: 'Recognition and achievement' },
      { value: 'growth', label: 'Personal growth and learning' },
      { value: 'helping', label: 'Helping and supporting others' },
      { value: 'security', label: 'Stability and security' },
    ],
  },
  {
    id: 'q7',
    text: 'How do you react when someone strongly disagrees with you?',
    options: [
      { value: 'debate', label: 'I enjoy the intellectual challenge' },
      { value: 'understand', label: 'I try to understand their perspective' },
      { value: 'avoid', label: 'I tend to avoid confrontation' },
      { value: 'stand_ground', label: 'I stand firm on my position' },
    ],
  },
  {
    id: 'q8',
    text: 'What kind of feedback affects you the most?',
    options: [
      { value: 'positive', label: 'Positive encouragement motivates me' },
      { value: 'constructive', label: 'Constructive criticism helps me grow' },
      { value: 'both', label: 'I value both equally' },
      { value: 'neither', label: 'I rely more on self-assessment' },
    ],
  },
  {
    id: 'q9',
    text: 'When you imagine your ideal day, what are you mostly doing?',
    options: [
      { value: 'solo', label: 'Peaceful alone time with my hobbies' },
      { value: 'social', label: 'Surrounded by friends and family' },
      { value: 'productive', label: 'Accomplishing meaningful work' },
      { value: 'adventure', label: 'Exploring something new' },
    ],
  },
  {
    id: 'q10',
    text: 'What is something you care deeply about that most people don\'t notice?',
    options: [
      { value: 'details', label: 'Small details that make things perfect' },
      { value: 'emotions', label: 'How people around me are feeling' },
      { value: 'fairness', label: 'Fairness and justice' },
      { value: 'environment', label: 'The environment and nature' },
    ],
  },
];

type InvitationStatus = 'loading' | 'valid' | 'invalid' | 'expired' | 'used' | 'submitted';

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const { toast } = useToast();

  const [status, setStatus] = useState<InvitationStatus>('loading');
  const [avatarName, setAvatarName] = useState('');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [additionalNotes, setAdditionalNotes] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    validateInvitation();
  }, [token]);

  const validateInvitation = async () => {
    try {
      const response = await fetch(`/api/invitations/${token}`);
      const data = await response.json();

      if (data.valid) {
        setStatus('valid');
        setAvatarName(data.avatarName);
        setExpiresAt(data.expiresAt);
      } else if (data.expired) {
        setStatus('expired');
      } else if (data.used) {
        setStatus('used');
      } else {
        setStatus('invalid');
      }
    } catch (error) {
      console.error('Error validating invitation:', error);
      setStatus('invalid');
    }
  };

  const handleAnswerSelect = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleCustomAnswerChange = (questionId: string, value: string) => {
    setCustomAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNotesChange = (questionId: string, value: string) => {
    setAdditionalNotes(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!answers[currentQuestion.id]) {
      toast({
        title: 'Please select an answer',
        variant: 'destructive',
      });
      return;
    }

    // validtion for custom answer
    if (answers[currentQuestion.id] === 'custom' && !customAnswers[currentQuestion.id]?.trim()) {
      toast({
        title: 'Please type your answer',
        variant: 'destructive',
      });
      return;
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!answers[currentQuestion.id]) {
      toast({
        title: 'Please select an answer',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    // Combine answers with additional notes
    const combinedResponses: Record<string, string> = {};
    questions.forEach(q => {
      const answer = answers[q.id];
      const note = additionalNotes[q.id];

      let responseText = '';

      if (answer === 'custom') {
        responseText = customAnswers[q.id] || '';
      } else {
        const selectedOption = q.options.find(opt => opt.value === answer);
        if (selectedOption) responseText = selectedOption.label;
      }

      if (responseText) {
        combinedResponses[q.id] = `${responseText}${note ? `. Additional context: ${note}` : ''}`;
      }
    });

    try {
      const response = await fetch(`/api/invitations/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses: combinedResponses }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus('submitted');
        toast({
          title: 'Thank you!',
          description: 'Your responses have been submitted successfully.',
        });
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to submit responses',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error submitting:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit responses. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render different states
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Validating invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <XCircle className="h-16 w-16 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid Invitation</h2>
            <p className="text-muted-foreground text-center">
              This invitation link is not valid. Please check the link or request a new one.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-16 w-16 text-yellow-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invitation Expired</h2>
            <p className="text-muted-foreground text-center">
              This invitation link has expired. Please request a new invitation.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'used') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Already Completed</h2>
            <p className="text-muted-foreground text-center">
              This invitation has already been used. Each link can only be used once.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'submitted') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Thank You!</h2>
            <p className="text-muted-foreground text-center mb-4">
              Your responses have been submitted successfully. The personality profile for <strong>{avatarName}</strong> has been generated and locked.
            </p>
            <p className="text-sm text-muted-foreground">
              You can close this window now.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main questionnaire UI
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Personality Assessment</h1>
          <p className="text-muted-foreground">
            Help train <strong>{avatarName}</strong> by answering these questions
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Expires: {new Date(expiresAt).toLocaleString()}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-secondary rounded-full h-2 mb-8">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Question {currentQuestionIndex + 1} of {questions.length}
            </CardTitle>
            <CardDescription>{currentQuestion.text}</CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* MCQ Options */}
                <div className="space-y-3">
                  {currentQuestion.options.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleAnswerSelect(currentQuestion.id, option.value)}
                      className={`w-full p-4 text-left rounded-lg border transition-all flex items-center gap-3 ${answers[currentQuestion.id] === option.value
                          ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 shadow-sm shadow-cyan-500/20'
                          : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                        }`}
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all flex-shrink-0 ${answers[currentQuestion.id] === option.value
                          ? 'bg-cyan-500 border-cyan-500'
                          : 'border-muted-foreground/50'
                        }`}>
                        {answers[currentQuestion.id] === option.value && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                      </div>
                      <span className="text-sm">{option.label}</span>
                    </button>
                  ))}

                  {/* Custom 'Other' Option */}
                  <button
                    onClick={() => handleAnswerSelect(currentQuestion.id, 'custom')}
                    className={`w-full p-4 text-left rounded-lg border transition-all flex items-center gap-3 ${answers[currentQuestion.id] === 'custom'
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 shadow-sm shadow-cyan-500/20'
                        : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                      }`}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all flex-shrink-0 ${answers[currentQuestion.id] === 'custom'
                        ? 'bg-cyan-500 border-cyan-500'
                        : 'border-muted-foreground/50'
                      }`}>
                      {answers[currentQuestion.id] === 'custom' && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </div>
                    <span className="text-sm">Other (Type your own answer)</span>
                  </button>

                  {answers[currentQuestion.id] === 'custom' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="pt-2"
                    >
                      <Label htmlFor={`custom-${currentQuestion.id}`} className="text-sm text-cyan-600 font-medium mb-1.5 block">
                        Your Answer
                      </Label>
                      <Textarea
                        id={`custom-${currentQuestion.id}`}
                        placeholder="Type your answer here..."
                        value={customAnswers[currentQuestion.id] || ''}
                        onChange={(e) => handleCustomAnswerChange(currentQuestion.id, e.target.value)}
                        className="bg-background border-cyan-500/50 focus-visible:ring-cyan-500"
                        rows={3}
                        autoFocus
                      />
                    </motion.div>
                  )}
                </div>

                {/* Optional additional notes */}
                <div className="pt-4">
                  <Label htmlFor="notes" className="text-sm text-muted-foreground">
                    Want to add more context? (Optional)
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any additional thoughts..."
                    value={additionalNotes[currentQuestion.id] || ''}
                    onChange={(e) => handleNotesChange(currentQuestion.id, e.target.value)}
                    className="mt-2 bg-transparent"
                    rows={2}
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentQuestionIndex === 0}
          >
            Back
          </Button>

          {currentQuestionIndex < questions.length - 1 ? (
            <Button onClick={handleNext}>Next</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Responses'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
