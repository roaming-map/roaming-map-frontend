'use client';

import { useState } from 'react';
import { useCurrentUser } from '@/hooks/api';
import { AnswersListSkeleton } from '@/components/skeletons/AnswersListSkeleton';
import type { Answer } from '@/types/answer';

interface AnswersListProps {
  answers: Answer[];
  loading: boolean;
  onAnswerUpdate?: () => void;
  onReply?: (answerId: number, name: string) => void;
}

const AnswersList = ({ answers, loading, onAnswerUpdate, onReply }: AnswersListProps) => {
  const { data: currentUser } = useCurrentUser();
  const [votingAnswerId, setVotingAnswerId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'helpful' | 'newest'>('helpful');
  const [editingAnswerId, setEditingAnswerId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deletingAnswerId, setDeletingAnswerId] = useState<number | null>(null);
  const [collapsedReplies, setCollapsedReplies] = useState<Set<number>>(new Set());

  const handleMarkHelpful = async (answerId: number, currentIsHelpful: boolean) => {
    setVotingAnswerId(answerId);
    try {
      const response = await fetch(`/api/answers/${answerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isHelpful: !currentIsHelpful }),
      });
      if (response.ok && onAnswerUpdate) {
        await onAnswerUpdate();
      }
    } catch (err) {
      console.error('Mark helpful error:', err);
    } finally {
      setVotingAnswerId(null);
    }
  };

  const handleUpdateAnswer = async (answerId: number, content: string) => {
    try {
      const res = await fetch(`/api/answers/${answerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (res.ok && onAnswerUpdate) {
        await onAnswerUpdate();
        setEditingAnswerId(null);
        setEditContent('');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update answer');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to update answer');
    }
  };

  const handleDeleteAnswer = async (answerId: number) => {
    if (!confirm('Delete this answer? This cannot be undone.')) return;
    setDeletingAnswerId(answerId);
    try {
      const res = await fetch(`/api/answers/${answerId}`, { method: 'DELETE' });
      if (res.ok && onAnswerUpdate) {
        await onAnswerUpdate();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete answer');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to delete answer');
    } finally {
      setDeletingAnswerId(null);
    }
  };

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
      if (days < 30) return `${days}d ago`;
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  if (loading) {
    return <AnswersListSkeleton />;
  }

  // Build thread tree: root answers (no parent) and replies grouped by parentId
  const roots = answers.filter((a) => a.parentId == null);
  const repliesByParentId = answers.reduce<Record<number, Answer[]>>((acc, a) => {
    if (a.parentId == null) return acc;
    if (!acc[a.parentId]) acc[a.parentId] = [];
    acc[a.parentId].push(a);
    return acc;
  }, {});
  const sortRoots = (a: Answer, b: Answer) => {
    if (sortBy === 'helpful') return (b.helpfulCount ?? 0) - (a.helpfulCount ?? 0);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  };
  const sortedRoots = [...roots].sort(sortRoots);
  const sortRepliesByDate = (a: Answer, b: Answer) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

  const renderAnswerCard = (answer: Answer, isReply: boolean) => {
    const displayName = answer.user?.firstName || answer.user?.lastName
      ? [answer.user.firstName, answer.user.lastName].filter(Boolean).join(' ')
      : 'Anonymous';
    const initial = answer.user?.firstName?.charAt(0) || answer.user?.lastName?.charAt(0) || 'A';
    const isHelpful = answer.isHelpful === true;
    const count = answer.helpfulCount ?? 0;
    const isOwner = currentUser != null && answer.createdBy === currentUser.id;
    const isEditing = editingAnswerId === answer.id;
    const isDeleting = deletingAnswerId === answer.id;
    const hasAtMention = answer.content.trim().startsWith('@');
    const renderContent = () => {
      if (!hasAtMention) return answer.content;
      const match = answer.content.match(/^@(\S+(?:\s\S+)?)\s/);
      if (!match) return answer.content;
      const mentionedName = match[1];
      const rest = answer.content.slice(match[0].length);
      return (
        <>
          <span className="text-[#046cb8] font-semibold">@{mentionedName}</span>{' '}
          {rest}
        </>
      );
    };

    return (
      <div key={answer.id} className={isReply ? 'ml-8 sm:ml-12 mt-3' : ''}>
        <div
          className={`rounded-2xl p-4 sm:p-5 ${
            isReply
              ? 'bg-gray-50 border border-gray-200 shadow-sm border-l-[3px] border-l-[#046cb8]'
              : 'bg-white shadow-md border border-gray-100'
          } ${isDeleting ? 'opacity-60 pointer-events-none' : ''}`}
        >
          <div className="flex items-center gap-2.5 mb-3">
            <div className={`${isReply ? 'w-7 h-7 sm:w-8 sm:h-8' : 'w-8 h-8 sm:w-9 sm:h-9'} bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0`}>
              <span className="text-white text-[10px] sm:text-xs font-medium">{initial}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <span className="font-semibold text-gray-900">{displayName}</span>
              </div>
              <span className="text-[10px] sm:text-xs text-gray-500">{timeAgo(answer.createdAt)}</span>
            </div>
            {isOwner && !isEditing && (
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setEditingAnswerId(answer.id);
                    setEditContent(answer.content);
                  }}
                  className="p-1.5 text-gray-400 hover:text-[#046cb8] hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteAnswer(answer.id)}
                  disabled={isDeleting}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Delete"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="mb-4">
              <textarea
                value={editingAnswerId === answer.id ? editContent : answer.content}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full min-h-[80px] p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#046cb8] focus:border-transparent resize-none"
                placeholder="Your answer..."
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => handleUpdateAnswer(answer.id, editContent)}
                  disabled={editContent.trim().length < 10}
                  className="px-3 py-1.5 bg-[#046cb8] text-white text-sm font-medium rounded-lg hover:bg-[#035a9e] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => { setEditingAnswerId(null); setEditContent(''); }}
                  className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className={`text-gray-800 leading-relaxed mb-4 ${isReply ? 'text-sm' : 'text-sm sm:text-base'}`}>
              {renderContent()}
            </p>
          )}

          <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                if (votingAnswerId !== answer.id) handleMarkHelpful(answer.id, isHelpful);
              }}
              disabled={votingAnswerId === answer.id}
              className={`
                inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold py-1.5 rounded-full border transition-colors
                ${count > 0 ? 'pl-2.5 pr-3' : 'px-2.5'}
                ${votingAnswerId === answer.id
                  ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200'
                  : isHelpful
                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                    : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                }
              `}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
              {votingAnswerId === answer.id ? '...' : count > 0 ? count : null}
            </button>
            <button
              type="button"
              onClick={() => onReply?.(answer.id, displayName)}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#046cb8] hover:text-[#035a9e] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              Reply
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors ml-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Community Answers</h3>
        {roots.length > 1 && (
          <button
            type="button"
            onClick={() => setSortBy(sortBy === 'helpful' ? 'newest' : 'helpful')}
            className="text-xs text-[#046cb8] font-medium hover:text-[#035a9e] transition-colors"
          >
            Sort by: {sortBy === 'helpful' ? 'Helpful' : 'Newest'} ↓
          </button>
        )}
      </div>

      {answers.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 text-center text-gray-500">
          <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-sm">No answers yet. Be the first to help!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedRoots.map((root) => {
            const replies = (repliesByParentId[root.id] ?? []).sort(sortRepliesByDate);
            const hasReplies = replies.length > 0;
            const isCollapsed = hasReplies && collapsedReplies.has(root.id);
            const toggleCollapsed = () => {
              setCollapsedReplies((prev) => {
                const next = new Set(prev);
                if (next.has(root.id)) next.delete(root.id);
                else next.add(root.id);
                return next;
              });
            };
            return (
              <div key={root.id}>
                {renderAnswerCard(root, false)}
                {hasReplies && (
                  <>
                    <button
                      type="button"
                      onClick={toggleCollapsed}
                      className="ml-8 sm:ml-12 mt-2 flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#046cb8] transition-colors"
                    >
                      {isCollapsed ? (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          Show {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                          Hide {replies.length === 1 ? 'reply' : 'replies'}
                        </>
                      )}
                    </button>
                    {!isCollapsed && replies.map((reply) => renderAnswerCard(reply, true))}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AnswersList;
