
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
import { GlowingButton } from '../ui/glowing-button';
import { useToast } from '@/hooks/use-toast';
import { AnimatePresence, motion } from 'framer-motion';

const questions = [
  {
    id: 'q1',
    text: 'When you’re stressed or overwhelmed, what do you usually do first?',
    description: 'Reveals coping style and emotional regulation',
  },
  {
    id: 'q2',
    text: 'What kind of activities make you lose track of time?',
    description: 'Shows genuine interests and intrinsic motivation',
  },
  {
    id: 'q3',
    text: 'How do you usually make important decisions—logic, intuition, or advice from others?',
    description: 'Indicates decision-making style and independence',
  },
  {
    id: 'q4',
    text: 'What frustrates you most about working with other people?',
    description: 'Reveals expectations, boundaries, and interpersonal behavior',
  },
  {
    id: 'q5',
    text: 'Do you prefer planning everything in advance or figuring things out as you go? Why?',
    description: 'Shows structure vs flexibility preference',
  },
  {
    id: 'q6',
    text: 'What motivates you more: recognition, personal growth, or helping others?',
    description: 'Uncovers core drivers and values',
  },
  {
    id: 'q7',
    text: 'How do you react when someone strongly disagrees with you?',
    description: 'Reveals conflict handling and emotional maturity',
  },
  {
    id: 'q8',
    text: 'What kind of feedback affects you the most—positive encouragement or constructive criticism?',
    description: 'Shows sensitivity and growth mindset',
  },
  {
    id: 'q9',
    text: 'When you imagine your ideal day, what are you mostly doing and with whom?',
    description: 'Reveals social orientation and lifestyle preferences',
  },
  {
    id: 'q10',
    text: 'What is something you care deeply about that most people don’t notice?',
    description: 'Uncovers deeper interests, empathy, and individuality',
  },
];

interface PsychologicalQuestionnaireProps {
    avatarName: string;
    onSubmit: () => void;
}

export function PsychologicalQuestionnaire({ avatarName, onSubmit }: PsychologicalQuestionnaireProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const { toast } = useToast();

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (!answers[questions[currentQuestionIndex].id]) {
      toast({
        title: 'Please answer the question',
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
    if (!answers[questions[currentQuestionIndex].id]) {
      toast({
        title: 'Please answer the last question',
        variant: 'destructive',
      });
      return;
    }
    
    // In a real app, you would send these answers to a backend/AI flow
    console.log('Submitted Answers:', answers);

    toast({
      title: 'Questionnaire Complete!',
      description: `Thank you for training ${avatarName}.`,
    });
    onSubmit();
  };
  
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <Card className="card-glass w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle style={{ color: 'var(--dynamic-text-color)' }}>
          Personality Analysis for {avatarName}
        </CardTitle>
        <CardDescription>
          Your answers will help shape the avatar's core personality. ({currentQuestionIndex + 1}/{questions.length})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
            <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
            >
                <div className="space-y-4">
                    <Label htmlFor={currentQuestion.id} className="text-lg">
                        {currentQuestion.text}
                    </Label>
                    <p className="text-sm text-muted-foreground italic">
                        {currentQuestion.description}
                    </p>
                    <Textarea
                        id={currentQuestion.id}
                        value={answers[currentQuestion.id] || ''}
                        onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                        placeholder="Your thoughts..."
                        className="bg-transparent min-h-[150px]"
                    />
                </div>
            </motion.div>
        </AnimatePresence>
      </CardContent>
      <CardFooter className="flex justify-between">
        <GlowingButton
          text="Back"
          onClick={handleBack}
          disabled={currentQuestionIndex === 0}
          className={currentQuestionIndex === 0 ? 'opacity-50' : ''}
        />
        {currentQuestionIndex < questions.length - 1 ? (
          <GlowingButton text="Next" onClick={handleNext} />
        ) : (
          <GlowingButton text="Submit" onClick={handleSubmit} />
        )}
      </CardFooter>
    </Card>
  );
}
