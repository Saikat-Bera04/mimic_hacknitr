'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Check, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const questions = [
  {
    id: 'q1',
    text: 'When you’re stressed or overwhelmed, what do you usually do first?',
    description: 'COGNITIVE_COPING_REACTION',
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
    text: 'What kind of activities make you lose track of time?',
    description: 'INTRINSIC_FLOW_DRIVERS',
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
    text: 'How do you usually make important decisions?',
    description: 'DECISION_LOGIC_WEIGHTING',
    options: [
      'Mostly logical analysis and facts',
      'Strong intuition or gut feeling',
      'Advice from people I trust',
      'A balance of logic and intuition',
      'Trial and error—learn as I go',
      'I delay decisions until I feel confident',
    ]
  },
  {
    id: 'q4',
    text: 'What frustrates you most about working with other people?',
    description: 'INTERPERSONAL_CONFLICT_TRIGGERS',
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
    text: 'Do you prefer planning everything in advance or figuring things out as you go?',
    description: 'STRUCTURAL_ADAPTABILITY_PREF',
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
    text: 'What motivates you more?',
    description: 'CORE_VALUE_INCENTIVES',
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
    text: 'How do you react when someone strongly disagrees with you?',
    description: 'CONFLICT_RESOLUTION_BEHAVIOR',
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
    text: 'What kind of feedback affects you the most?',
    description: 'EXTERNAL_STIMULI_SENSITIVITY',
    options: [
      'Positive encouragement',
      'Constructive criticism with solutions',
      'Honest and direct feedback',
      'Feedback from people I respect',
      'Written or detailed feedback',
      'I’m affected by all types equally',
    ]
  },
  {
    id: 'q9',
    text: 'When you imagine your ideal day, what are you mostly doing and with whom?',
    description: 'SOCIAL_ORIENTATION_SCHEMA',
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
    text: 'What is something you care deeply about that most people don’t notice?',
    description: 'DEEP_VALUE_RECOGNITION',
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

interface PsychologicalQuestionnaireProps {
  avatarName: string;
  onSubmit: () => void;
}

export function PsychologicalQuestionnaire({ avatarName, onSubmit }: PsychologicalQuestionnaireProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const { toast } = useToast();

  const handleOptionSelect = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleCustomInputChange = (questionId: string, value: string) => {
    setCustomInputs((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    const currentQ = questions[currentQuestionIndex];
    const selectedOption = answers[currentQ.id];

    if (!selectedOption) {
      toast({
        title: 'DATA_INPUT_MISSING',
        description: 'Please select an option to proceed with calibration.',
        variant: 'destructive',
      });
      return;
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    const currentQ = questions[currentQuestionIndex];
    const selectedOption = answers[currentQ.id];

    if (!selectedOption) {
      toast({
        title: 'DATA_INPUT_MISSING',
        variant: 'destructive',
      });
      return;
    }

    // Prepare final answers
    const finalAnswers = { ...answers };
    Object.keys(finalAnswers).forEach(key => {
      if (finalAnswers[key] === 'Other') {
        finalAnswers[key] = customInputs[key] || 'Other';
      }
    });

    toast({
      title: 'CALIBRATION_COMPLETE',
      description: `Persona mapping for ${avatarName} finalized.`,
    });
    onSubmit();
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="w-full max-w-2xl mx-auto border-2 border-foreground bg-background shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b-2 border-foreground bg-foreground/5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#ea580c]" />
          <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-foreground">
            PSYCH_MAPPING_PROTOCOL
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-24 h-1.5 border border-foreground/20 bg-background overflow-hidden hidden sm:block">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-[#ea580c]" 
            />
          </div>
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
            {currentQuestionIndex + 1}/{questions.length}
          </span>
        </div>
      </div>

      <div className="p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            <div>
              <span className="text-[9px] font-mono font-bold text-[#ea580c] uppercase tracking-[0.2em] mb-2 block">
                {currentQuestion.description}
              </span>
              <h3 className="text-lg font-mono font-bold uppercase leading-snug text-foreground">
                {currentQuestion.text}
              </h3>
            </div>

            <div className="grid gap-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleOptionSelect(currentQuestion.id, option)}
                  className={cn(
                    "w-full p-4 text-left border-2 transition-all flex items-center gap-4 font-mono text-xs uppercase tracking-wider",
                    answers[currentQuestion.id] === option
                      ? 'border-foreground bg-foreground text-background shadow-[4px_4px_0px_0px_rgba(234,88,12,0.4)]'
                      : 'border-foreground/10 bg-background hover:border-foreground/40 hover:bg-foreground/5 text-foreground'
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 border-2 flex items-center justify-center shrink-0",
                    answers[currentQuestion.id] === option ? 'border-background bg-background' : 'border-foreground/20'
                  )}>
                    {answers[currentQuestion.id] === option && <Check className="w-3 h-3 text-foreground stroke-[4]" />}
                  </div>
                  {option}
                </button>
              ))}

              <button
                onClick={() => handleOptionSelect(currentQuestion.id, 'Other')}
                className={cn(
                  "w-full p-4 text-left border-2 transition-all flex items-center gap-4 font-mono text-xs uppercase tracking-wider",
                  answers[currentQuestion.id] === 'Other'
                    ? 'border-foreground bg-foreground text-background shadow-[4px_4px_0px_0px_rgba(234,88,12,0.4)]'
                    : 'border-foreground/10 bg-background hover:border-foreground/40 hover:bg-foreground/5 text-foreground'
                )}
              >
                <div className={cn(
                  "w-4 h-4 border-2 flex items-center justify-center shrink-0",
                  answers[currentQuestion.id] === 'Other' ? 'border-background bg-background' : 'border-foreground/20'
                )}>
                  {answers[currentQuestion.id] === 'Other' && <Check className="w-3 h-3 text-foreground stroke-[4]" />}
                </div>
                CUSTOM_SPECIFICATION
              </button>

              {answers[currentQuestion.id] === 'Other' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="pt-2"
                >
                  <Textarea
                    placeholder="INITIALIZE_CUSTOM_RESPONSE..."
                    value={customInputs[currentQuestion.id] || ''}
                    onChange={(e) => handleCustomInputChange(currentQuestion.id, e.target.value)}
                    className="bg-background border-2 border-foreground rounded-none font-mono text-xs focus:ring-0 focus:border-[#ea580c] min-h-[100px] p-4"
                    autoFocus
                  />
                </motion.div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="p-6 border-t-2 border-foreground bg-foreground/5 flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentQuestionIndex === 0}
          className="rounded-none border-2 border-foreground font-mono text-[10px] uppercase tracking-widest px-6 h-12 bg-background disabled:opacity-30"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-2" /> PREV
        </Button>
        {currentQuestionIndex < questions.length - 1 ? (
          <Button 
            onClick={handleNext}
            className="rounded-none border-2 border-foreground bg-foreground hover:bg-foreground/90 text-background font-mono text-[10px] uppercase tracking-widest px-8 h-12"
          >
            NEXT_PHASE <ArrowRight className="h-3.5 w-3.5 ml-2" />
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit}
            className="rounded-none border-2 border-foreground bg-[#ea580c] hover:bg-[#ea580c]/90 text-background font-mono text-[10px] uppercase tracking-widest px-8 h-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all"
          >
            COMMIT_PERSONA <Check className="h-3.5 w-3.5 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
