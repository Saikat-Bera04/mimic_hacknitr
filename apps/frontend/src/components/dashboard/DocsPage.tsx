import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText } from "lucide-react";

const docSections = [
  {
    id: 1,
    title: "Getting Started",
    content: "Welcome to EvoAvatar. This guide will walk you through the basic features and functionalities of the application. Start by training your avatar with new memories or chat with it to see its current personality.",
  },
  {
    id: 2,
    title: "Training Your Avatar",
    content: "The 'Train Avatar' section allows you to provide new information to your AI. You can input text or use voice commands to add memories, opinions, and facts. This data is used to build the avatar's structured memory.",
  },
  {
    id: 3,
    title: "Structured Memory",
    content: "Structured memories are how your avatar retains information. Unlike traditional model retraining, memories are stored in a way that allows for dynamic and context-aware responses without altering the base model.",
  },
  {
    id: 4,
    title: "Inviting a Participant",
    content: "You can invite one trusted partner to help train your avatar. This person will have the same ability to add memories as you do, contributing to the avatar's evolving personality.",
  },
];

export function DocsPage() {
  return (
    <div className="space-y-4">
      <Card className="card-glass">
        <CardHeader>
          <CardTitle className="font-headline" style={{color: 'var(--dynamic-text-color)'}}>Documentation</CardTitle>
          <CardDescription>
            Your guide to understanding and using EvoAvatar.
          </CardDescription>
        </CardHeader>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {docSections.map((section) => (
          <Card key={section.id} className="card-glass">
            <CardHeader>
                <div className="flex items-start gap-4">
                    <FileText className="h-6 w-6 text-accent mt-1 flex-shrink-0" />
                    <div className="grid gap-1.5">
                        <h3 className="font-semibold text-foreground">{section.title}</h3>
                        <CardDescription>{section.content}</CardDescription>
                    </div>
                </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
