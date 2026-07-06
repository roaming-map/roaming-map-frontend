'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCategoryColors } from '@/lib/category-colors';
import { useCategories, useCurrentUser, useDeleteQuestion } from '@/hooks/api';
import { QuestionsFeedSkeleton } from '@/components/skeletons/QuestionsFeedSkeleton';

interface Question {
  id: number;
  title: string | null;
  question: string;
  destination: string | null;
  isUrgent: boolean;
  usefulCount?: number;
  createdAt: string;
  createdBy: number | null;
  user?: {
    id: number;
    name: string | null;
    email?: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  author?: {
    id: number;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
  } | null;
  categories?: Array<{
    id: number;
    category: string;
  }>;
  answerCount?: number;
  latestAnswer?: {
    id: number;
    contentPreview: string;
    createdBy: number | null;
    createdAt: string;
    user?: {
      id: number;
      name: string | null;
      firstName: string | null;
      lastName: string | null;
    } | null;
  } | null;
  answers?: Array<{
    id: number;
    content: string;
    questionId: number;
    createdBy: number | null;
    createdAt: string;
    helpfulCount?: number;
    user?: {
      id: number;
      name: string | null;
      email?: string;
      firstName: string | null;
      lastName: string | null;
    } | null;
  }>;
  questionsToCategories?: Array<{
    questionId: number;
    categoryId: number;
    category?: {
      id: number;
      category: string;
    };
  }>;
}

interface QuestionsListProps {
  questions: Question[];
  loading: boolean;
  selectedDestination?: string | null;
  onDestinationChange?: (destination: string | null) => void;
  showMyQuestions?: boolean;
  currentUserId?: number;
  onClearMyQuestions?: () => void;
  /** When provided, filter is controlled by parent (e.g. unified sticky header); search/filter bar is not rendered here */
  searchQuery?: string;
  setSearchQuery?: (value: string) => void;
  selectedCategory?: string;
  setSelectedCategory?: (value: string) => void;
  onQuestionSelect?: (questionId: number) => void;
}

const QuestionsList = ({
  questions,
  loading,
  selectedDestination,
  onDestinationChange,
  showMyQuestions,
  currentUserId,
  onClearMyQuestions,
  searchQuery: searchQueryProp,
  setSearchQuery: setSearchQueryProp,
  selectedCategory: selectedCategoryProp,
  setSelectedCategory: setSelectedCategoryProp,
  onQuestionSelect,
}: QuestionsListProps) => {
  const router = useRouter();
  const [internalSearch, setInternalSearch] = useState<string>('');
  const [internalCategory, setInternalCategory] = useState<string>('');
  const [reactingQuestionId, setReactingQuestionId] = useState<number | null>(null);

  const isControlled = setSearchQueryProp !== undefined;
  const searchQuery = isControlled ? (searchQueryProp ?? '') : internalSearch;
  const setSearchQuery = isControlled ? setSearchQueryProp! : setInternalSearch;
  const selectedCategory = isControlled ? (selectedCategoryProp ?? '') : internalCategory;
  const setSelectedCategory = isControlled ? setSelectedCategoryProp! : setInternalCategory;
  const [questionUsefulCounts, setQuestionUsefulCounts] = useState<Record<number, number>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  // Fetch categories dynamically
  const { data: categories } = useCategories();
  const { data: currentUser } = useCurrentUser();
  const deleteQuestionMutation = useDeleteQuestion();

  // Initialize useful counts from questions
  useEffect(() => {
    const counts: Record<number, number> = {};
    questions.forEach(q => {
      if (q.usefulCount !== undefined) {
        counts[q.id] = q.usefulCount;
      }
    });
    setQuestionUsefulCounts(counts);
  }, [questions]);

  // Handle marking question as useful
  const handleMarkUseful = async (questionId: number) => {
    setReactingQuestionId(questionId);
    
    try {
      const currentCount = questionUsefulCounts[questionId] || 0;
      const isUseful = currentCount > 0; // If it has count, assume it's already marked
      
      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isUseful: !isUseful, // Toggle
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setQuestionUsefulCounts(prev => ({
          ...prev,
          [questionId]: data.question.usefulCount || 0,
        }));
      } else {
        const errorData = await response.json();
        console.error('Error marking useful:', errorData.error);
      }
    } catch (error) {
      console.error('Error marking useful:', error);
    } finally {
      setReactingQuestionId(null);
    }
  };

  const openQuestion = (questionId: number) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('questionsScrollPosition', String(window.scrollY));
    }
    if (onQuestionSelect) {
      onQuestionSelect(questionId);
      return;
    }
    router.push(`/questions/${questionId}`);
  };

  const handleDeleteQuestion = async (questionId: number) => {
    try {
      await deleteQuestionMutation.mutateAsync(questionId);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete question:', error);
    }
  };

  const isQuestionOwner = (question: Question) => {
    return currentUser && question.createdBy === currentUser.id;
  };

  // Server-filtered feeds pass controlled filters from the parent, so avoid duplicate client filtering.
  const filteredQuestions = isControlled ? questions : questions.filter(question => {
    // Filter by "My Questions" if enabled
    if (showMyQuestions && currentUserId) {
      if (question.createdBy !== currentUserId) {
        return false;
      }
    }
    
    const matchesSearch = (question.title?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      question.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      question.questionsToCategories?.some(qtc => 
        qtc.category?.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    const matchesCategory = !selectedCategory || 
      question.questionsToCategories?.some(qtc => 
        qtc.category?.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    
    const matchesDestination = !selectedDestination || 
      (question.destination && question.destination.toLowerCase() === selectedDestination.toLowerCase());
    
    return matchesSearch && matchesCategory && matchesDestination;
  });
  if (loading) {
    return <QuestionsFeedSkeleton />;
  }

      return (
        <div>
          {/* Search + filter bar only when not controlled by parent (e.g. unified sticky header) */}
          {!isControlled && (
            <div className="sticky top-14 sm:top-16 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm mb-4 sm:mb-6 py-3 space-y-3 overflow-visible">
              <div className="bg-white rounded-xl p-2.5 shadow-sm border border-gray-100">
                <div className="relative w-full">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-9 py-2.5 sm:py-2 bg-gray-50 border-0 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#046cb8]/20 focus:ring-offset-0 w-full"
                  />
                  <svg className="w-5 h-5 sm:w-4 sm:h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto overflow-y-visible pb-1 scrollbar-hide pr-4">
                <button
                  onClick={() => {
                    setSelectedCategory('');
                    setSearchQuery('');
                    onDestinationChange?.(null);
                    onClearMyQuestions?.();
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-colors flex-shrink-0 ${
                    !selectedCategory && !searchQuery && !selectedDestination && !showMyQuestions
                      ? 'text-white bg-[#046cb8]'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  All
                </button>
                {selectedDestination && (
                  <button
                    onClick={() => onDestinationChange?.(null)}
                    className="px-4 py-2 text-sm font-medium rounded-full transition-colors bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 flex items-center gap-1 flex-shrink-0"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span className="truncate max-w-[80px] sm:max-w-none">{selectedDestination}</span>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
                {categories?.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.category);
                      setSearchQuery('');
                    }}
                    className={`px-4 py-2 text-sm font-medium rounded-full transition-colors flex-shrink-0 ${
                      selectedCategory === category.category
                        ? 'text-white bg-[#046cb8]'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {category.category}
                  </button>
                ))}
              </div>
            </div>
          )}

      {filteredQuestions.length === 0 ? (
        <div className="text-center py-12">
          {searchQuery || selectedCategory || selectedDestination || showMyQuestions ? (
            /* No results for active filters – reference-style empty state */
            <div className="max-w-sm mx-auto px-4 space-y-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="space-y-2">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">No matches for your filters</h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  We couldn&apos;t find any questions matching your filters. Try adjusting them or ask our local travel community directly.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('');
                    onDestinationChange?.(null);
                    onClearMyQuestions?.();
                  }}
                  className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-white text-[#046cb8] text-sm font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors min-h-[44px]"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                  </svg>
                  Clear all filters
                </button>
              </div>
            </div>
          ) : (
            /* No questions at all (no filters applied) */
            <>
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 text-base">No travel questions yet</p>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">Be the first to ask a travel question!</p>
            </>
          )}
        </div>
      ) : (
            <div className="space-y-6">
              {filteredQuestions.map((q) => (
                <div key={q.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:border-gray-300 transition-colors relative overflow-hidden">
                  {/* Urgent header strip - red, subtle, full-width */}
                  {q.isUrgent && (
                    <div className="bg-red-50 border-b border-red-100 px-4 py-2 sm:px-6 flex items-center gap-2 rounded-t-xl">
                      <svg className="w-3.5 h-3.5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-red-700 text-[10px] sm:text-xs font-semibold uppercase tracking-wide">Urgent</span>
                    </div>
                  )}
                  <div className="px-4 py-4 sm:p-5">
                  {/* Category pills - top of card */}
                  {q.questionsToCategories && q.questionsToCategories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {q.questionsToCategories.map((qtc) => {
                        const colors = getCategoryColors(qtc.category?.category || '');
                        return (
                          <span
                            key={qtc.categoryId}
                            className={`px-1.5 py-0.5 ${colors.bgColor} ${colors.textColor} text-[10px] font-normal rounded-full uppercase tracking-wide opacity-90`}
                          >
                            {qtc.category?.category}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Avatar + username row: name full, date aligned right */}
                  <div className="flex items-center justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-[#046cb8] to-[#035a9e] rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-[10px] sm:text-xs font-medium">
                          {q.user?.firstName?.charAt(0) || q.user?.name?.charAt(0) || 'A'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs min-w-0">
                        <span className="text-gray-900 font-semibold break-words">
                          {q.user?.name || `${q.user?.firstName || 'Anonymous'} ${q.user?.lastName || ''}`.trim() || 'Anonymous'}
                        </span>
                        {q.destination && (
                          <>
                            <span className="text-gray-400 flex-shrink-0">·</span>
                            <span className="text-gray-500 flex items-center gap-0.5 flex-shrink-0 min-w-0">
                              <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                              <span className="truncate max-w-[70px] sm:max-w-none">{q.destination}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-gray-500 text-xs whitespace-nowrap">{new Date(q.createdAt).toLocaleDateString()}</span>
                      {isQuestionOwner(q) && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            router.push(`/questions/${q.id}`);
                          }}
                          className="p-1.5 sm:p-2 text-gray-500 hover:text-[#046cb8] hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit question"
                        >
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (showDeleteConfirm === q.id) {
                              handleDeleteQuestion(q.id);
                            } else {
                              setShowDeleteConfirm(q.id);
                            }
                          }}
                          className="p-1.5 sm:p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete question"
                          disabled={deleteQuestionMutation.isPending && showDeleteConfirm === q.id}
                        >
                          {showDeleteConfirm === q.id ? (
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    )}
                    </div>
                  </div>

                  {/* Question title + details - same left edge as category pills and username */}
                  <button
                    type="button"
                    className="block mt-2 w-full text-left"
                    onClick={() => openQuestion(q.id)}
                  >
                    {q.title != null && q.title !== '' ? (
                      <>
                        <h3 className="text-gray-900 text-sm sm:text-base font-semibold leading-snug hover:text-[#046cb8] transition-colors break-words">
                          {q.title}
                        </h3>
                        <p className="text-gray-600 text-xs sm:text-sm mt-1 leading-relaxed line-clamp-2 break-words">
                          {q.question}
                        </p>
                      </>
                    ) : (
                      <p className="text-gray-900 text-sm sm:text-base font-medium leading-relaxed hover:text-[#046cb8] transition-colors break-words">
                        {q.question}
                      </p>
                    )}
                  </button>

                  {q.latestAnswer && (
                    <button
                      type="button"
                      onClick={() => openQuestion(q.id)}
                      className="mt-3 flex w-full items-start gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-left transition-colors hover:border-gray-200 hover:bg-gray-100"
                    >
                      <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-500 text-[10px] font-semibold text-white">
                        {q.latestAnswer.user?.firstName?.charAt(0) || q.latestAnswer.user?.name?.charAt(0) || 'A'}
                      </span>
                      <span className="min-w-0 text-xs sm:text-sm">
                        <span className="font-semibold text-gray-700">
                          {q.latestAnswer.user?.name || q.latestAnswer.user?.firstName || 'Anonymous'}
                        </span>
                        <span className="text-gray-500"> replied: </span>
                        <span className="text-gray-600">{q.latestAnswer.contentPreview}</span>
                      </span>
                    </button>
                  )}

                  {/* Delete Confirmation - below actions */}
                  {showDeleteConfirm === q.id && (
                    <div className="mt-3 p-3 bg-gray-50 border border-red-200 rounded-lg flex flex-col sm:flex-row sm:items-center gap-2">
                      <p className="text-sm text-gray-700 flex-1">Delete this question?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteQuestion(q.id);
                          }}
                          className="flex-1 sm:flex-none px-3 py-1.5 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors"
                          disabled={deleteQuestionMutation.isPending}
                        >
                          {deleteQuestionMutation.isPending ? 'Deleting...' : 'Delete'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowDeleteConfirm(null);
                          }}
                          className="flex-1 sm:flex-none px-3 py-1.5 bg-gray-200 text-gray-700 text-xs rounded-md hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

              {/* Answers / liking block - single row, no duplicate "X answers" */}
              <div className="mt-4 -mx-4 -mb-4 px-4 pt-3 pb-4 sm:-mx-5 sm:-mb-5 sm:px-5 sm:pt-4 sm:pb-5 bg-gray-50/70 rounded-b-xl">
                {/* Question Footer - single row: answers + useful */}
                <div className="flex items-center justify-between min-h-[44px]">
                  <div className="flex items-center gap-2 sm:gap-4 py-1">
                    {(q.answerCount ?? q.answers?.length ?? 0) > 0 ? (
                      <button
                        onClick={() => openQuestion(q.id)}
                        className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-600 hover:text-[#046cb8] transition-colors cursor-pointer"
                      >
                        <svg className="w-4 h-4 text-[#046cb8]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                        {q.answerCount ?? q.answers?.length ?? 0} Answer{(q.answerCount ?? q.answers?.length ?? 0) !== 1 ? 's' : ''}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openQuestion(q.id)}
                        className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-600 hover:text-[#046cb8] transition-colors"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                        0 answers
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleMarkUseful(q.id);
                    }}
                    disabled={reactingQuestionId === q.id}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
                      ${(questionUsefulCounts[q.id] || q.usefulCount || 0) > 0 
                        ? 'bg-amber-50 text-amber-800 hover:bg-amber-100' 
                        : 'text-gray-600 hover:bg-gray-100'
                      }
                      ${reactingQuestionId === q.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                    style={{ minWidth: '80px' }}
                  >
                    <span className="text-sm flex-shrink-0">👍</span>
                    <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
                      {reactingQuestionId === q.id 
                        ? '...' 
                        : (questionUsefulCounts[q.id] || q.usefulCount || 0) > 0
                          ? `${questionUsefulCounts[q.id] || q.usefulCount || 0} useful`
                          : 'Useful'
                      }
                    </span>
                  </button>
                </div>
              </div>
                  </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionsList;
