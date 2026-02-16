'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCategoryColors } from '@/lib/category-colors';
import { useCategories, useCurrentUser, useDeleteQuestion } from '@/hooks/api';
import { QuestionsFeedSkeleton } from '@/components/skeletons/QuestionsFeedSkeleton';

interface Question {
  id: number;
  question: string;
  destination: string | null;
  isUrgent: boolean;
  usefulCount?: number;
  createdAt: string;
  createdBy: number | null;
  user?: {
    id: number;
    name: string | null;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
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
      email: string;
      firstName: string | null;
      lastName: string | null;
    };
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
}

const QuestionsList = ({ questions, loading, selectedDestination, onDestinationChange, showMyQuestions, currentUserId, onClearMyQuestions }: QuestionsListProps) => {
  const router = useRouter();
  const [expandedAnswers, setExpandedAnswers] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [reactingQuestionId, setReactingQuestionId] = useState<number | null>(null);
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

  const toggleAnswers = (questionId: number) => {
    const newExpanded = new Set(expandedAnswers);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedAnswers(newExpanded);
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

  // Filter questions based on search query, selected category, destination, and user filter
  const filteredQuestions = questions.filter(question => {
    // Filter by "My Questions" if enabled
    if (showMyQuestions && currentUserId) {
      if (question.createdBy !== currentUserId) {
        return false;
      }
    }
    
    const matchesSearch = question.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
          {/* Filter: search full-width on mobile; filters scroll */}
          <div className="mb-4 sm:mb-6 space-y-3">
            <div className="relative w-full sm:w-48 sm:ml-auto">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-8 py-2 sm:py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-0 focus:outline-none focus:border-[#046cb8] w-full"
              />
              <svg className="w-4 h-4 sm:w-3 sm:h-3 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 scrollbar-hide">
              <button 
                onClick={() => {
                  setSelectedCategory('');
                  setSearchQuery('');
                  onDestinationChange?.(null);
                  onClearMyQuestions?.();
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex-shrink-0 ${
                  !selectedCategory && !searchQuery && !selectedDestination && !showMyQuestions
                    ? 'text-gray-900 bg-[#046cb8]/10' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                All
              </button>
              {selectedDestination && (
                <button
                  onClick={() => onDestinationChange?.(null)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-100 flex items-center gap-1 flex-shrink-0"
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
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex-shrink-0 ${
                    selectedCategory === category.category 
                      ? 'text-gray-900 bg-[#046cb8]/10' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {category.category}
                </button>
              ))}
            </div>
          </div>
      
      {filteredQuestions.length === 0 ? (
        <div className="text-center py-12">
          {showMyQuestions ? (
            <>
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" />
              </svg>
              <p className="text-gray-500 text-lg">You haven&apos;t asked any questions yet</p>
              <p className="text-gray-400 text-sm mt-1">Start by asking your first travel question!</p>
            </>
          ) : searchQuery ? (
            <>
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
                  <p className="text-gray-500 text-lg">No travel questions found for &quot;{searchQuery}&quot;</p>
                  <p className="text-gray-400 text-sm mt-1">Try different keywords or ask a new travel question!</p>
            </>
          ) : (
            <>
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 text-lg">No travel questions yet</p>
              <p className="text-gray-400 text-sm mt-1">Be the first to ask a travel question!</p>
            </>
          )}
        </div>
      ) : (
            <div className="space-y-4">
              {filteredQuestions.map((q) => (
                <div key={q.id} className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 relative">
                  {/* Question Header: avatar + meta + owner actions (no overlap) */}
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#046cb8] to-[#035a9e] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-medium">
                        {q.user?.firstName?.charAt(0) || q.user?.name?.charAt(0) || 'A'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                        <span className="text-gray-700 font-medium truncate">
                          {q.user?.name || `${q.user?.firstName || 'Anonymous'} ${q.user?.lastName || ''}`.trim() || 'Anonymous'}
                        </span>
                        <span className="text-gray-400 flex-shrink-0">·</span>
                        <span className="text-gray-500 text-xs sm:text-sm flex-shrink-0">{new Date(q.createdAt).toLocaleDateString()}</span>
                        {q.destination && (
                          <>
                            <span className="text-gray-400 flex-shrink-0">·</span>
                            <span className="text-gray-500 text-xs flex items-center gap-1 flex-shrink-0">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                              <span className="truncate max-w-[100px] sm:max-w-none">{q.destination}</span>
                            </span>
                          </>
                        )}
                        {q.isUrgent && (
                          <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0">
                            Urgent
                          </span>
                        )}
                      </div>
                      <a
                        href={`/questions/${q.id}`}
                        className="text-gray-900 text-base font-medium leading-snug hover:text-[#046cb8] transition-colors cursor-pointer block mt-1 break-words"
                      >
                        {q.question}
                      </a>
                    </div>
                    {/* Owner actions - in flow, no overlap */}
                    {isQuestionOwner(q) && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            router.push(`/questions/${q.id}`);
                          }}
                          className="p-2 text-gray-500 hover:text-[#046cb8] hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit question"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete question"
                          disabled={deleteQuestionMutation.isPending && showDeleteConfirm === q.id}
                        >
                          {showDeleteConfirm === q.id ? (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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

                  {/* Category pills - own row, no overlap with avatar */}
                  {q.questionsToCategories && q.questionsToCategories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {q.questionsToCategories.map((qtc) => {
                        const colors = getCategoryColors(qtc.category?.category || '');
                        return (
                          <span
                            key={qtc.categoryId}
                            className={`px-2 py-1 ${colors.bgColor} ${colors.textColor} text-xs rounded-full font-medium border ${colors.borderColor}`}
                          >
                            {qtc.category?.category}
                          </span>
                        );
                      })}
                    </div>
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
              
              {/* Answer Previews */}
              {q.answers && q.answers.length > 0 && (
                <div className="mt-4">
                  <button
                    onClick={() => toggleAnswers(q.id)}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#046cb8] transition-colors cursor-pointer mb-3"
                  >
                    <svg className="w-4 h-4 text-[#046cb8]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium text-sm">{q.answers.length} Answer{q.answers.length !== 1 ? 's' : ''}</span>
                    <svg 
                      className={`w-4 h-4 transition-transform ${expandedAnswers.has(q.id) ? 'rotate-180' : ''}`} 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* Collapsible Answer Content */}
                  {expandedAnswers.has(q.id) && (
                    <div className="space-y-3">
                      {/* Show up to 2 answer previews */}
                      {q.answers.slice(0, 2).map((answer) => (
                        <div key={answer.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs font-medium">
                                {answer.user?.firstName?.charAt(0) || answer.user?.name?.charAt(0) || 'L'}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-gray-700">
                                  {answer.user?.name || `${answer.user?.firstName || 'Local'} ${answer.user?.lastName || ''}`}
                                </span>
                                <span className="text-xs text-gray-500">•</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(answer.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">
                                {answer.content.length > 120 
                                  ? `${answer.content.substring(0, 120)}...` 
                                  : answer.content
                                }
                              </p>
                              {answer.content.length > 120 && (
                                <a 
                                  href={`/questions/${q.id}`}
                                  className="text-xs text-[#046cb8] hover:text-[#035a9e] font-medium mt-1 inline-block"
                                >
                                  Read more
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Show "View more" if there are more than 2 answers */}
                      {q.answers.length > 2 && (
                        <div className="text-center">
                          <a 
                            href={`/questions/${q.id}`}
                            className="text-sm text-[#046cb8] hover:text-[#035a9e] font-medium"
                          >
                            View {q.answers.length - 2} more answer{q.answers.length - 2 !== 1 ? 's' : ''}
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
                  {/* Question Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-4">
                      <button className="flex items-center gap-2 hover:text-[#046cb8] transition-colors cursor-pointer">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium text-gray-600">{q.answers?.length || 0} answers</span>
                      </button>
                    </div>
                    
                    {/* Useful Reaction Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleMarkUseful(q.id);
                      }}
                      disabled={reactingQuestionId === q.id}
                      className={`
                        flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors
                        ${(questionUsefulCounts[q.id] || q.usefulCount || 0) > 0 
                          ? 'bg-blue-50 text-[#046cb8] hover:bg-blue-100' 
                          : 'text-gray-600 hover:bg-gray-100'
                        }
                        ${reactingQuestionId === q.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                      style={{ minWidth: '80px' }}
                    >
                      <span className="text-base flex-shrink-0">👍</span>
                      <span className="text-sm font-medium whitespace-nowrap">
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
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionsList;
