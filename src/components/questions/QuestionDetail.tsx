'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuestion, useUpdateQuestion, useDeleteQuestion } from '@/hooks/api';
import { useCurrentUser } from '@/hooks/api';
import { useQueryClient } from '@tanstack/react-query';
import { getCategoryColors } from '@/lib/category-colors';
import { QuestionDetailSkeleton } from '@/components/skeletons/QuestionDetailSkeleton';

interface QuestionDetailProps {
  questionId: number;
  /** Pass from parent when answers are loaded separately (e.g. detail page) so the card shows correct count */
  answersCount?: number;
}

export function QuestionDetail({ questionId, answersCount: answersCountProp }: QuestionDetailProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editQuestion, setEditQuestion] = useState('');
  const [editIsUrgent, setEditIsUrgent] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const { data: question, isLoading, error } = useQuestion(questionId);
  const { data: currentUser } = useCurrentUser();
  const updateQuestionMutation = useUpdateQuestion();
  const deleteQuestionMutation = useDeleteQuestion();

  useEffect(() => {
    if (question?.isUseful !== undefined) setIsLiked(question.isUseful);
  }, [question?.isUseful]);

  const handleToggleUseful = async () => {
    if (isLiking || !question) return;
    setIsLiking(true);
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    try {
      await fetch(`/api/questions/${questionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isUseful: newLiked }),
      });
      queryClient.invalidateQueries({ queryKey: ['question', questionId] });
    } catch (err) {
      console.error('Toggle useful error:', err);
      setIsLiked(!newLiked);
    } finally {
      setIsLiking(false);
    }
  };

  // Check if current user is the question owner
  const isOwner = currentUser && question && question.createdBy === currentUser.id;

  const handleUpdate = async () => {
    if (!question) return;

    try {
      await updateQuestionMutation.mutateAsync({
        id: questionId,
        data: {
          title: editTitle,
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
    return <QuestionDetailSkeleton />;
  }
  
  if (error) {
    return (
      <div className="bg-white rounded-2xl px-4 py-5 sm:p-6 shadow-md border border-red-200">
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
      <div className="bg-white rounded-2xl px-4 py-5 sm:p-6 shadow-md border border-gray-100">
        <div className="text-center py-8">
          <p className="text-gray-500">Question not found</p>
        </div>
      </div>
    );
  }

  const answersCount = answersCountProp ?? question.answers?.length ?? 0;

  const timeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      if (seconds < 60) return 'just now';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  const displayName = question.user?.name
    || `${question.user?.firstName || 'Anonymous'} ${question.user?.lastName || ''}`.trim()
    || 'Anonymous';

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow overflow-hidden">
      {isEditing ? (
        <div className="px-4 py-5 sm:p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-[#046cb8] focus:ring-1 focus:ring-[#046cb8] focus:outline-none bg-white"
                placeholder="Question title (e.g. Hidden beaches near port?)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Details</label>
              <textarea
                value={editQuestion}
                onChange={(e) => setEditQuestion(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-[#046cb8] focus:ring-1 focus:ring-[#046cb8] focus:outline-none resize-none bg-white"
                rows={4}
                placeholder="Add more details – destinations, prices, recommendations, or travel tips..."
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-urgent"
                checked={editIsUrgent}
                onChange={(e) => setEditIsUrgent(e.target.checked)}
                className="w-4 h-4 text-[#046cb8] border-gray-300 rounded focus:ring-[#046cb8] focus:ring-offset-0"
              />
              <label htmlFor="edit-urgent" className="text-sm font-medium text-gray-600">
                Mark as urgent
              </label>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={handleUpdate}
                disabled={updateQuestionMutation.isPending || !editTitle.trim() || !editQuestion.trim()}
                className="px-4 py-2.5 bg-[#046cb8] text-white text-sm font-medium rounded-xl hover:bg-[#035a9e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateQuestionMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={updateQuestionMutation.isPending}
                className="px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Urgent header strip - red, subtle, full-width */}
          {question.isUrgent && (
            <div className="bg-red-50 border-b border-red-100 px-4 py-2 sm:px-6 flex items-center gap-2 rounded-t-2xl">
              <svg className="w-3.5 h-3.5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-red-700 text-[10px] sm:text-xs font-semibold uppercase tracking-wide">Urgent</span>
            </div>
          )}
          <div className="px-4 py-5 sm:p-6">
          {/* Category pills */}
          {question.questionsToCategories && question.questionsToCategories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {question.questionsToCategories.map((qtc) => {
                const colors = getCategoryColors(qtc.category?.category || '');
                return (
                  <span
                    key={qtc.categoryId}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 ${colors.bgColor} ${colors.textColor} text-[11px] sm:text-xs font-medium rounded-lg uppercase tracking-wide`}
                  >
                    <svg className="w-3 h-3 opacity-70" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    {qtc.category?.category}
                  </span>
                );
              })}
            </div>
          )}

          {/* Avatar + name row */}
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-[#046cb8] to-[#035a9e] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs sm:text-sm font-medium">
                  {question.user?.firstName?.charAt(0) || question.user?.name?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-sm sm:text-base text-gray-900 font-semibold break-words">
                  {displayName}
                </span>
                <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
                  Asked {timeAgo(question.createdAt)}
                  {question.destination && (
                    <span> &bull; {question.destination}</span>
                  )}
                </p>
              </div>
            </div>
            {/* Owner actions */}
            {isOwner && (
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(true);
                    setEditTitle(question.title ?? question.question.split(/\n/)[0]?.trim() ?? '');
                    setEditQuestion(question.title ? question.question : question.question);
                    setEditIsUrgent(question.isUrgent || false);
                  }}
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-[#046cb8] hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit question"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteQuestionMutation.isPending}
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete question"
                >
                  {deleteQuestionMutation.isPending ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Question title + body */}
          <div className="mt-3">
            <h1 className="text-gray-900 text-base sm:text-lg font-bold leading-snug break-words">
              {question.title ?? question.question}
            </h1>
            {question.title != null && question.title !== '' && (
              <p className="text-gray-600 text-sm sm:text-base mt-2 leading-relaxed whitespace-pre-wrap break-words">
                {question.question}
              </p>
            )}
          </div>

          {/* Stats row */}
          <div className="mt-4 flex items-center gap-5 pt-3 border-t border-gray-100">
            <a href="#answers" className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#046cb8] hover:text-[#035a9e] transition-colors">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
              {answersCount === 1 ? '1 answer' : `${answersCount} answers`}
            </a>
            <button
              type="button"
              onClick={handleToggleUseful}
              disabled={isLiking}
              className={`
                inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold py-1.5 rounded-full border transition-colors
                ${(question.usefulCount ?? 0) > 0 ? 'pl-2.5 pr-3' : 'px-2.5'}
                ${isLiking
                  ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200'
                  : isLiked
                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                    : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                }
              `}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
              {(question.usefulCount ?? 0) > 0 ? question.usefulCount : null}
            </button>
          </div>

          </div>
        </>
      )}
    </div>
  );
}
