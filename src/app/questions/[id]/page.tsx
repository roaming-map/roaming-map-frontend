'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { SignedIn, SignedOut, UserButton, SignInButton } from '@clerk/nextjs';
import { QuestionDetail } from '@/components/questions/QuestionDetail';
import AnswerForm from '@/components/questions/AnswerForm';
import AnswersList from '@/components/questions/AnswersList';

interface Answer {
  id: number;
  content: string;
  questionId: number;
  createdBy: number | null;
  createdAt: string;
  isHelpful: boolean;
  helpfulCount: number;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

const QuestionDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const questionId = params.id as string;

  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch answers for the question
  const fetchAnswers = useCallback(async () => {
    try {
      const response = await fetch(`/api/questions/${questionId}/answers`);
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Fetched answers:', data);
        setAnswers(data);
      } else {
        console.error('❌ Failed to fetch answers:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching answers:', error);
    }
  }, [questionId]);

  // Submit new answer
  const handleSubmitAnswer = async (content: string) => {
    setSubmittingAnswer(true);
    setMessage('');

    try {
      const response = await fetch(`/api/questions/${questionId}/answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          questionId: parseInt(questionId),
        }),
      });

      if (response.ok) {
        setMessage('Answer posted successfully!');
        // Refresh answers
        await fetchAnswers();
        
        // Auto-dismiss success message after 3 seconds
        setTimeout(() => {
          setMessage('');
        }, 3000);
      } else {
        const errorData = await response.json();
        
        // Extract user-friendly error message
        let errorMessage = 'Error submitting answer';
        
        if (errorData.details && Array.isArray(errorData.details) && errorData.details.length > 0) {
          // Show the first validation error message
          errorMessage = errorData.details[0].message || errorMessage;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
        
        setMessage(`Error: ${errorMessage}`);
        
        // Auto-dismiss error message after 5 seconds
        setTimeout(() => {
          setMessage('');
        }, 5000);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setMessage('Error submitting answer');
      
      // Auto-dismiss error message after 5 seconds
      setTimeout(() => {
        setMessage('');
      }, 5000);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Load answers on component mount
  useEffect(() => {
    const loadAnswers = async () => {
      setLoading(true);
      await fetchAnswers();
      setLoading(false);
    };
    
    if (questionId) {
      loadAnswers();
    }
  }, [questionId, fetchAnswers]);


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar - Matching Homepage */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <Image
                  src="/short-logo.png"
                  alt="Roaming Map Logo"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
                <span className="text-xl font-semibold text-[#046cb8]">Roaming Map</span>
              </button>
            </div>
            <div className="flex items-center gap-6">
              <button 
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
              >
                ← Back to Home
              </button>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="bg-[#046cb8] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#046cb8]/90 transition-colors">
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content - Matching Homepage Layout */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Question Card - Matching Homepage Style */}
        <div className="mb-6">
          <QuestionDetail questionId={parseInt(questionId)} />
        </div>

        {/* Answer Form */}
        <AnswerForm 
          questionId={parseInt(questionId)}
          onSubmit={handleSubmitAnswer}
          submitting={submittingAnswer}
          message={message}
        />

        {/* Answers List */}
        <AnswersList 
          answers={answers}
          loading={loading}
          onAnswerUpdate={fetchAnswers}
        />
      </div>
    </div>
  );
};

export default QuestionDetailPage;
