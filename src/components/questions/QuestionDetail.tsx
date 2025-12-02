'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuestion, useUpdateQuestion, useDeleteQuestion } from '@/hooks/api';
import { useCurrentUser } from '@/hooks/api';
import { Button } from '@/components/ui/button';
import { getCategoryColors } from '@/lib/category-colors';

interface QuestionDetailProps {
  questionId: number;
}

export function QuestionDetail({ questionId }: QuestionDetailProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editQuestion, setEditQuestion] = useState('');
  const [editIsUrgent, setEditIsUrgent] = useState(false);

  const { data: question, isLoading, error } = useQuestion(questionId);
  const { data: currentUser } = useCurrentUser();
  const updateQuestionMutation = useUpdateQuestion();
  const deleteQuestionMutation = useDeleteQuestion();

  // Check if current user is the question owner
  const isOwner = currentUser && question && question.createdBy === currentUser.id;

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
    if (!confirm('Are you sure you want to delete this question? This action cannot be undone.')) return;

    try {
      await deleteQuestionMutation.mutateAsync(questionId);
      // Redirect to home page after successful delete
      router.push('/');
    } catch (error) {
      console.error('Failed to delete question:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white rounded-xl p-5 shadow-sm border border-red-200">
        <div className="flex items-center gap-2 text-red-600">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>Error: {error.message}</span>
        </div>
      </div>
    );
  }
  
  if (!question) {
    return (
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
        <div className="text-center py-8">
          <p className="text-gray-500">Question not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
            <textarea
              value={editQuestion}
              onChange={(e) => setEditQuestion(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#046cb8] focus:border-transparent resize-none"
              rows={4}
              placeholder="Ask locals about destinations, prices, recommendations, or travel tips..."
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="edit-urgent"
              checked={editIsUrgent}
              onChange={(e) => setEditIsUrgent(e.target.checked)}
              className="w-4 h-4 text-[#046cb8] border-gray-300 rounded focus:ring-[#046cb8]"
            />
            <label htmlFor="edit-urgent" className="ml-2 text-sm text-gray-700">
              Mark as urgent
            </label>
          </div>
          <div className="flex gap-2 pt-2">
            <Button 
              onClick={handleUpdate}
              disabled={updateQuestionMutation.isPending || !editQuestion.trim()}
              className="bg-[#046cb8] hover:bg-[#035a9e] text-white"
            >
              {updateQuestionMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsEditing(false)}
              disabled={updateQuestionMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div>
          {/* Question Header */}
          <div className="flex items-start gap-4 mb-4">
            {/* User Avatar */}
            <div className="w-12 h-12 bg-gradient-to-br from-[#046cb8] to-[#035a9e] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-medium">
                {question.user?.firstName?.charAt(0) || question.user?.name?.charAt(0) || 'A'}
              </span>
            </div>
            
            {/* Question Content */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-gray-500 text-sm font-medium">
                  {question.user?.name || `${question.user?.firstName || 'Anonymous'} ${question.user?.lastName || ''}`}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-500 text-sm">{new Date(question.createdAt).toLocaleDateString()}</span>
                {question.isUrgent && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-1 rounded-full">
                      Urgent
                    </span>
                  </>
                )}
              </div>
              
              <h1 className="text-gray-900 text-xl font-semibold leading-relaxed mb-3">
                {question.question}
              </h1>
              
              {/* Categories */}
              {question.questionsToCategories && question.questionsToCategories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {question.questionsToCategories.map((qtc) => {
                    const colors = getCategoryColors(qtc.category?.category || '');
                    return (
                      <span
                        key={qtc.categoryId}
                        className={`px-2.5 py-1 ${colors.bgColor} ${colors.textColor} text-xs rounded-full font-medium border ${colors.borderColor}`}
                      >
                        {qtc.category?.category}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          
          {/* Owner Actions */}
          {isOwner && (
            <div className="flex gap-2 pt-4 border-t border-gray-200">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditing(true);
                  setEditQuestion(question.question);
                  setEditIsUrgent(question.isUrgent || false);
                }}
                className="text-sm"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={deleteQuestionMutation.isPending}
                className="text-sm"
              >
                {deleteQuestionMutation.isPending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
