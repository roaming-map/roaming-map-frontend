'use client';

import { Button } from '@/components/ui/button';

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
}

const AnswersList = ({ answers, loading }: AnswersListProps) => {
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

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Answers ({answers.length})
      </h3>
      
      {answers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No answers yet. Be the first to help!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {answers.map((answer) => {
            const { date: answerDate, time: answerTime } = formatDate(answer.createdAt);
            
            return (
              <div key={answer.id} className="border border-gray-200 rounded-lg p-4">
                <p className="text-gray-900 mb-3">{answer.content}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div>
                    Answered by {answer.user?.firstName || 'Anonymous'} on {answerDate} at {answerTime}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">
                      👍 {answer.helpfulCount} helpful
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => {
                        // TODO: Implement mark helpful functionality
                        console.log('Mark helpful:', answer.id);
                      }}
                    >
                      Mark Helpful
                    </Button>
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
