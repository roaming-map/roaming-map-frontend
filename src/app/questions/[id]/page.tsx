'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { QuestionDetail } from '@/components/questions/QuestionDetail';
import AnswerForm from '@/components/questions/AnswerForm';
import AnswersList from '@/components/questions/AnswersList';

interface Question {
  id: number;
  question: string;
  isUrgent: boolean;
  createdAt: string;
  createdBy: number | null;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

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
  const questionId = params.id as string;

  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch answers for the question
  const fetchAnswers = async () => {
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
  };

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
        const data = await response.json();
        setMessage('Answer posted successfully!');
        // Refresh answers
        await fetchAnswers();
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
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setMessage('Error submitting answer');
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
  }, [questionId]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return { date: 'Invalid Date', time: 'Invalid Date' };
      }
      return {
        date: date.toLocaleDateString(),
        time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      };
    } catch (error) {
      return { date: 'Invalid Date', time: 'Invalid Date' };
    }
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Image
              src="/short-logo.png"
              alt="Roaming Map Logo"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Roaming Map</h1>
              <p className="text-gray-600">Travel Q&A Platform</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Question */}
        <div className="mb-6">
          <QuestionDetail questionId={parseInt(questionId)} />
        </div>

        <AnswerForm 
          questionId={parseInt(questionId)}
          onSubmit={handleSubmitAnswer}
          submitting={submittingAnswer}
          message={message}
        />

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
