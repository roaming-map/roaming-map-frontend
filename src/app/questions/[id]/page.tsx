'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SignedIn, SignedOut, UserButton, SignInButton } from '@clerk/nextjs';
import { QuestionDetail } from '@/components/questions/QuestionDetail';
import AnswerForm from '@/components/questions/AnswerForm';
import AnswersList from '@/components/questions/AnswersList';
import { NotificationBell } from '@/components/NotificationBell';
import type { Answer } from '@/types/answer';

const QuestionDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id;
  const questionId = typeof rawId === 'string' ? rawId : '';

  const idNum = parseInt(questionId, 10);
  const isValidId = questionId !== '' && !isNaN(idNum) && idNum >= 1;

  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [message, setMessage] = useState('');
  const [replyTo, setReplyTo] = useState<{ answerId: number; name: string } | null>(null);

  // Fetch answers for the question
  const fetchAnswers = useCallback(async () => {
    try {
      const response = await fetch(`/api/questions/${questionId}/answers`);
      if (response.ok) {
        const data = await response.json();
        setAnswers(data);
      }
    } catch {
      setAnswers([]);
    }
  }, [questionId]);

  // Submit new answer (optionally as a reply to another answer)
  const handleSubmitAnswer = async (content: string, parentId?: number) => {
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
          ...(parentId != null && { parentId }),
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
    } catch {
      setMessage('Error submitting answer');
      
      // Auto-dismiss error message after 5 seconds
      setTimeout(() => {
        setMessage('');
      }, 5000);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  useEffect(() => {
    if (!isValidId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      await fetchAnswers();
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [questionId, fetchAnswers, isValidId]);


  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar – clean centered title like reference */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-3 sm:px-4">
          <div className="flex items-center h-14 sm:h-16 relative">
            {/* Left: back arrow */}
            <button
              onClick={goBack}
              className="flex items-center gap-1 text-gray-700 hover:text-gray-900 transition-colors absolute left-0 z-10"
              aria-label="Go back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            {/* Center: title */}
            <span className="text-sm sm:text-base font-semibold text-gray-900 mx-auto">Question Detail</span>
            {/* Right: user button */}
            <div className="absolute right-0 z-10 flex items-center gap-2">
              <SignedIn>
                <NotificationBell />
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="bg-[#046cb8] text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[#046cb8]/90 transition-colors">
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {!isValidId ? (
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 text-center text-gray-500">
            <p className="text-sm">Invalid question.</p>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="mt-3 text-sm font-medium text-[#046cb8] hover:text-[#035a9e]"
            >
              Back to home
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <QuestionDetail questionId={idNum} answersCount={answers.length} />
            </div>
            <AnswerForm
              onSubmit={handleSubmitAnswer}
              submitting={submittingAnswer}
              message={message}
              replyTo={replyTo}
              onClearReply={() => setReplyTo(null)}
            />
            <div id="answers">
              <AnswersList
                answers={answers}
                loading={loading}
                onAnswerUpdate={fetchAnswers}
                onReply={(answerId, name) => setReplyTo({ answerId, name })}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default QuestionDetailPage;
