'use client';

import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { SignedIn, SignedOut } from '@clerk/nextjs';
import { useState } from "react";
import Image from "next/image";
import Header from '@/components/Header';
import QuestionBox from '@/components/QuestionBox';
import AnswersBox from '@/components/AnswersBox';
import { useQuestions, useCreateQuestion } from "@/hooks/api";

export default function Home() {
  const [question, setQuestion] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [message, setMessage] = useState('');

  // TanStack Query hooks
  const { data: questions, isLoading, error } = useQuestions();
  const createQuestionMutation = useCreateQuestion();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    try {
      await createQuestionMutation.mutateAsync({
        question,
        isUrgent,
      });
      
      setMessage('✅ Question submitted successfully!');
      setQuestion('');
      setIsUrgent(false);
    } catch (error) {
      setMessage('❌ Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  return (
    <div className="font-sans min-h-screen">
      <Navigation />
      <div className="p-8 pb-20 gap-16 sm:p-20">
        <main className="max-w-2xl mx-auto">
          <Header />
          
          <QuestionBox 
            question={question}
            isUrgent={isUrgent}
            setQuestion={setQuestion}
            setIsUrgent={setIsUrgent}
            handleSubmit={handleSubmit}
            submitting={createQuestionMutation.isPending}
            message={message}
          />

          {/* Show sign-in prompt for anonymous users */}
          <SignedOut>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <p className="text-blue-800 mb-2">Sign in to track your questions and get personalized recommendations!</p>
              <div className="text-blue-600 text-sm">Authentication powered by Clerk</div>
            </div>
          </SignedOut>

          <AnswersBox 
            questions={questions || []}
            loading={isLoading}
          />
        </main>
      </div>
    </div>
  );
}
