'use client';

import { useState } from 'react';
import { useQuestion, useUpdateQuestion, useDeleteQuestion } from '@/hooks/api';
import { Button } from '@/components/ui/button';

interface QuestionDetailProps {
  questionId: number;
}

export function QuestionDetail({ questionId }: QuestionDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editQuestion, setEditQuestion] = useState('');
  const [editIsUrgent, setEditIsUrgent] = useState(false);

  const { data: question, isLoading, error } = useQuestion(questionId);
  const updateQuestionMutation = useUpdateQuestion();
  const deleteQuestionMutation = useDeleteQuestion();

  const handleUpdate = async () => {
    if (!question) return;

    try {
      await updateQuestionMutation.mutateAsync({
        id: questionId,
        data: {
          question: editQuestion,
          isUrgent: editIsUrgent,
        },
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update question:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      await deleteQuestionMutation.mutateAsync(questionId);
    } catch (error) {
      console.error('Failed to delete question:', error);
    }
  };

  if (isLoading) return <div>Loading question...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!question) return <div>Question not found</div>;

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
      {isEditing ? (
        <div className="space-y-4">
          <textarea
            value={editQuestion}
            onChange={(e) => setEditQuestion(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md"
            rows={3}
          />
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={editIsUrgent}
              onChange={(e) => setEditIsUrgent(e.target.checked)}
              className="mr-2"
            />
            <label className="text-sm">This is urgent</label>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleUpdate}
              disabled={updateQuestionMutation.isPending}
            >
              {updateQuestionMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-gray-800 mb-2">{question.question}</p>
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <span>ID: {question.id}</span>
            <span className="mx-2">•</span>
            <span>{new Date(question.createdAt).toLocaleDateString()}</span>
            {question.isUrgent && (
              <>
                <span className="mx-2">•</span>
                <span className="text-red-600 font-medium">🚨 Urgent</span>
              </>
            )}
            {question.user && (
              <>
                <span className="mx-2">•</span>
                <span>By: {question.user.name || `${question.user.firstName} ${question.user.lastName}`}</span>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditing(true);
                setEditQuestion(question.question);
                setEditIsUrgent(question.isUrgent);
              }}
            >
              Edit
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteQuestionMutation.isPending}
            >
              {deleteQuestionMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
