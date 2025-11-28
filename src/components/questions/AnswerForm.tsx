'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface AnswerFormProps {
  questionId: number;
  onSubmit: (content: string) => Promise<void>;
  submitting: boolean;
  message: string;
}

const AnswerForm = ({ questionId, onSubmit, submitting, message }: AnswerFormProps) => {
  const [answerContent, setAnswerContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerContent.trim()) return;

    await onSubmit(answerContent);
    setAnswerContent('');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Post Your Answer</h3>
      
      <form onSubmit={handleSubmit}>
        <textarea
          value={answerContent}
          onChange={(e) => setAnswerContent(e.target.value)}
          placeholder="Share your knowledge about this question..."
          className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          required
        />
        
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            {answerContent.length}/2000 characters
          </p>
          <Button
            type="submit"
            disabled={submitting || !answerContent.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {submitting ? 'Posting...' : 'Post Answer'}
          </Button>
        </div>
      </form>

      {message && (
        <div className={`mt-4 p-3 rounded-lg ${
          message.includes('Error') || message.includes('must be')
            ? 'bg-red-100 text-red-700 border border-red-200' 
            : 'bg-green-100 text-green-700 border border-green-200'
        }`}>
          <div className="flex items-start gap-2">
            {message.includes('Error') || message.includes('must be') ? (
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            <span className="text-sm font-medium">{message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnswerForm;
