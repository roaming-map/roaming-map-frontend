'use client';

import { useState } from 'react';

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
    firstName: string | null;
    lastName: string | null;
  };
}

interface AnswersListProps {
  answers: Answer[];
  loading: boolean;
  onAnswerUpdate?: () => void;
}

const AnswersList = ({ answers, loading, onAnswerUpdate }: AnswersListProps) => {
  const [votingAnswerId, setVotingAnswerId] = useState<number | null>(null);
  
  // Debug: Log state changes
  console.log('AnswersList rendered', { votingAnswerId, answersCount: answers.length });
  const handleMarkHelpful = async (answerId: number, currentIsHelpful: boolean) => {
    console.log('Button clicked!', { answerId, currentIsHelpful });
    setVotingAnswerId(answerId);
    
    try {
      console.log('Making API call...');
      const response = await fetch(`/api/answers/${answerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isHelpful: !currentIsHelpful, // Toggle helpful status
        }),
      });

      console.log('Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Success:', data);
        // Refresh answers list
        if (onAnswerUpdate) {
          onAnswerUpdate();
        }
      } else {
        const errorData = await response.json();
        console.error('Error marking helpful:', errorData.error);
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error marking helpful:', error);
      alert(`Error: ${error}`);
    } finally {
      setVotingAnswerId(null);
    }
  };

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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading answers...</p>
        </div>
      </div>
    );
  }

  console.log('📋 AnswersList rendering with:', { 
    answersCount: answers.length, 
    answers: answers.map(a => ({ id: a.id, content: a.content.substring(0, 50) }))
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Answers ({answers.length})
      </h3>
      
      {answers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No answers yet. Be the first to help!</p>
          <p className="text-xs mt-2 text-gray-400">(Post an answer to see the "Mark Helpful" button)</p>
        </div>
      ) : (
        <div className="space-y-4">
          {answers.map((answer) => {
            const { date: answerDate, time: answerTime } = formatDate(answer.createdAt);
            
            return (
              <div 
                key={answer.id} 
                className="border border-gray-200 rounded-lg p-4"
                style={{ position: 'relative' }}
              >
                <p className="text-gray-900 mb-3">{answer.content}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-500" style={{ position: 'relative', zIndex: 1 }}>
                  <div>
                    Answered by {answer.user?.firstName || 'Anonymous'} on {answerDate} at {answerTime}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${answer.helpfulCount > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                      {answer.helpfulCount} helpful
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        console.log('🔵 BUTTON CLICKED!', { 
                          answerId: answer.id, 
                          isHelpful: answer.isHelpful
                        });
                        e.preventDefault();
                        e.stopPropagation();
                        if (votingAnswerId !== answer.id) {
                          handleMarkHelpful(answer.id, answer.isHelpful);
                        }
                      }}
                      disabled={votingAnswerId === answer.id}
                      className={`
                        px-3 py-1.5 rounded-md text-xs font-medium transition-all
                        ${answer.isHelpful 
                          ? 'bg-[#046cb8] text-white hover:bg-[#035a9e]' 
                          : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }
                        ${votingAnswerId === answer.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                      `}
                    >
                      {votingAnswerId === answer.id 
                        ? '...' 
                        : answer.isHelpful 
                          ? 'Marked Helpful' 
                          : 'Mark Helpful'
                      }
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AnswersList;
