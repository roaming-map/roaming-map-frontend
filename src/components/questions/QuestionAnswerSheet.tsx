'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ExternalLink,
  MapPin,
  MessageCircle,
  Send,
  ThumbsUp,
  X,
} from 'lucide-react';
import { getCategoryColors } from '@/lib/category-colors';
import { questionKeys, useQuestion } from '@/hooks/api/questions';
import { userKeys } from '@/hooks/api/users';
import AnswersList from '@/components/questions/AnswersList';
import type { Answer } from '@/types/answer';

interface ReplyTo {
  answerId: number;
  name: string;
}

interface QuestionAnswerSheetProps {
  questionId: number | null;
  onClose: () => void;
}

export function QuestionAnswerSheet({ questionId, onClose }: QuestionAnswerSheetProps) {
  const queryClient = useQueryClient();
  const isOpen = questionId != null;
  const activeQuestionId = questionId ?? 0;
  const { data: question, isLoading: questionLoading } = useQuestion(activeQuestionId);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [answersLoading, setAnswersLoading] = useState(false);
  const [answerContent, setAnswerContent] = useState('');
  const [replyTo, setReplyTo] = useState<ReplyTo | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [liking, setLiking] = useState(false);
  const [localUsefulCount, setLocalUsefulCount] = useState<number | null>(null);
  const [localIsUseful, setLocalIsUseful] = useState(false);

  const fetchAnswers = useCallback(async () => {
    if (!questionId) return;
    setAnswersLoading(true);
    try {
      const response = await fetch(`/api/questions/${questionId}/answers`);
      if (!response.ok) throw new Error('Failed to fetch answers');
      setAnswers(await response.json());
    } catch {
      setAnswers([]);
    } finally {
      setAnswersLoading(false);
    }
  }, [questionId]);

  useEffect(() => {
    if (!isOpen) return;
    fetchAnswers();
  }, [fetchAnswers, isOpen]);

  useEffect(() => {
    if (!question) return;
    setLocalUsefulCount(question.usefulCount ?? 0);
    setLocalIsUseful(question.isUseful === true);
  }, [question]);

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setAnswers([]);
      setAnswerContent('');
      setReplyTo(null);
      setMessage('');
    }
  }, [isOpen]);

  const submitAnswer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!questionId || !answerContent.trim()) return;

    setSubmitting(true);
    setMessage('');
    try {
      const response = await fetch(`/api/questions/${questionId}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: answerContent,
          questionId,
          ...(replyTo?.answerId != null && { parentId: replyTo.answerId }),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const firstValidationMessage = Array.isArray(errorData.details)
          ? errorData.details[0]?.message
          : undefined;
        throw new Error(firstValidationMessage || errorData.error || 'Failed to post answer');
      }

      setAnswerContent('');
      setReplyTo(null);
      setMessage('Answer posted');
      await fetchAnswers();
      queryClient.invalidateQueries({ queryKey: questionKeys.detail(questionId) });
      queryClient.invalidateQueries({ queryKey: questionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: userKeys.active() });
      setTimeout(() => setMessage(''), 2500);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to post answer');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleUseful = async () => {
    if (!questionId || liking) return;
    const nextIsUseful = !localIsUseful;
    const previousCount = localUsefulCount ?? question?.usefulCount ?? 0;
    const nextCount = Math.max(0, previousCount + (nextIsUseful ? 1 : -1));

    setLiking(true);
    setLocalIsUseful(nextIsUseful);
    setLocalUsefulCount(nextCount);
    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isUseful: nextIsUseful }),
      });
      if (!response.ok) throw new Error('Failed to update useful reaction');
      const data = await response.json();
      setLocalUsefulCount(data.question?.usefulCount ?? nextCount);
      queryClient.invalidateQueries({ queryKey: questionKeys.detail(questionId) });
      queryClient.invalidateQueries({ queryKey: questionKeys.lists() });
    } catch {
      setLocalIsUseful(!nextIsUseful);
      setLocalUsefulCount(previousCount);
    } finally {
      setLiking(false);
    }
  };

  if (!isOpen) return null;

  const displayName = question?.user?.name
    || [question?.user?.firstName, question?.user?.lastName].filter(Boolean).join(' ')
    || 'Anonymous';
  const initial = question?.user?.firstName?.charAt(0) || question?.user?.name?.charAt(0) || 'A';
  const usefulCount = localUsefulCount ?? question?.usefulCount ?? 0;

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Question answers">
      <button
        type="button"
        aria-label="Close answers"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]"
      />
      <section className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:bottom-auto sm:top-1/2 sm:max-h-[86vh] sm:-translate-y-1/2 sm:rounded-2xl">
        <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-300 sm:hidden" />
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#046cb8]">Answers</p>
              <h2 className="truncate text-base font-semibold text-gray-950">
                {question?.title || question?.question || 'Question'}
              </h2>
            </div>
            <div className="flex items-center gap-1">
              {questionId && (
                <Link
                  href={`/questions/${questionId}`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                  aria-label="Open full question page"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              )}
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-36 sm:px-5">
          {questionLoading ? (
            <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="h-4 w-36 animate-pulse rounded bg-gray-200" />
              <div className="h-5 w-4/5 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
            </div>
          ) : question ? (
            <article className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              {question.isUrgent && (
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-red-700">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Urgent
                </div>
              )}
              {question.questionsToCategories && question.questionsToCategories.length > 0 && (
                <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  {question.questionsToCategories.map((qtc) => {
                    const colors = getCategoryColors(qtc.category?.category || '');
                    return (
                      <span
                        key={qtc.categoryId}
                        className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium uppercase ${colors.bgColor} ${colors.textColor}`}
                      >
                        {qtc.category?.category}
                      </span>
                    );
                  })}
                </div>
              )}
              <div className="mb-3 flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#046cb8] text-sm font-semibold text-white">
                  {initial}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-950">{displayName}</p>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                    <span>{new Date(question.createdAt).toLocaleDateString()}</span>
                    {question.destination && (
                      <>
                        <span aria-hidden>·</span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {question.destination}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-semibold leading-snug text-gray-950">
                {question.title || question.question}
              </h3>
              {question.title && (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
                  {question.question}
                </p>
              )}
              <div className="mt-4 flex items-center gap-2 border-t border-gray-200 pt-3">
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600">
                  <MessageCircle className="h-4 w-4 text-[#046cb8]" />
                  {answers.length} {answers.length === 1 ? 'answer' : 'answers'}
                </span>
                <button
                  type="button"
                  onClick={toggleUseful}
                  disabled={liking}
                  className={`ml-auto inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                    localIsUseful
                      ? 'border-amber-200 bg-amber-50 text-amber-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  } ${liking ? 'opacity-60' : ''}`}
                >
                  <ThumbsUp className="h-4 w-4" />
                  {usefulCount > 0 ? usefulCount : 'Useful'}
                </button>
              </div>
            </article>
          ) : (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              Question could not be loaded.
            </div>
          )}

          <div className="mt-5">
            <AnswersList
              answers={answers}
              loading={answersLoading}
              onAnswerUpdate={fetchAnswers}
              onReply={(answerId, name) => setReplyTo({ answerId, name })}
              surface="sheet"
            />
          </div>
        </div>

        <form onSubmit={submitAnswer} className="absolute inset-x-0 bottom-0 border-t border-gray-100 bg-white p-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)]">
          {replyTo && (
            <div className="mb-2 flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-[#046cb8]">
              Replying to {replyTo.name}
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="ml-auto text-[#046cb8]/70 hover:text-[#046cb8]"
              >
                Clear
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <textarea
              value={answerContent}
              onChange={(event) => setAnswerContent(event.target.value)}
              placeholder="Add a helpful local answer..."
              rows={1}
              className="max-h-28 min-h-[44px] flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-950 outline-none transition-colors placeholder:text-gray-400 focus:border-[#046cb8] focus:bg-white focus:ring-2 focus:ring-[#046cb8]/10"
            />
            <button
              type="submit"
              disabled={submitting || !answerContent.trim()}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#046cb8] text-white transition-colors hover:bg-[#035a9e] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Post answer"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-1 flex min-h-5 items-center justify-between px-1 text-xs text-gray-400">
            <span>{answerContent.length}/2000</span>
            {message && (
              <span className={message === 'Answer posted' ? 'text-green-600' : 'text-red-600'}>
                {message}
              </span>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
