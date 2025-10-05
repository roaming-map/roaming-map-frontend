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
          message.includes('Error') 
            ? 'bg-red-100 text-red-700' 
            : 'bg-green-100 text-green-700'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default AnswerForm;
