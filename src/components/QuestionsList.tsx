'use client';

import { useState, useEffect } from 'react';
import { getCategoryColors } from '@/lib/category-colors';
import { useCategories } from '@/hooks/api';

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
}

const QuestionsList = ({ questions, loading, selectedDestination, onDestinationChange }: QuestionsListProps) => {
  const [expandedAnswers, setExpandedAnswers] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [reactingQuestionId, setReactingQuestionId] = useState<number | null>(null);
  const [questionUsefulCounts, setQuestionUsefulCounts] = useState<Record<number, number>>({});

  // Fetch categories dynamically
  const { data: categories } = useCategories();

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

  // Filter questions based on search query, selected category, and destination
  const filteredQuestions = questions.filter(question => {
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
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#046cb8] mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading questions...</p>
        </div>
      </div>
    );
  }

      return (
        <div>
          {/* Filter Buttons and Search Bar Row */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setSelectedCategory('');
                setSearchQuery('');
                onDestinationChange?.(null);
              }}
              className={`px-2 py-1 text-xs font-medium rounded-lg transition-colors ${
                !selectedCategory && !searchQuery && !selectedDestination
                  ? 'text-gray-900 bg-[#046cb8]/10' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            {selectedDestination && (
              <button
                onClick={() => onDestinationChange?.(null)}
                className="px-2 py-1 text-xs font-medium rounded-lg transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-100 flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                {selectedDestination}
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
                  className={`px-2 py-1 text-xs font-medium rounded-lg transition-colors ${
                    selectedCategory === category.category 
                      ? 'text-gray-900 bg-[#046cb8]/10' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {category.category}
                </button>
              ))}
            </div>
            
            <div className="relative w-48 flex-shrink-0 overflow-hidden">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-4 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-0 focus:outline-none focus:border-gray-300 w-full min-w-0"
                style={{ width: '100%', minWidth: 0 }}
              />
              <svg className="w-3 h-3 text-gray-400 absolute left-2.5 top-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>
      
      {filteredQuestions.length === 0 ? (
        <div className="text-center py-12">
          {searchQuery ? (
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
                <div key={q.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 relative">
                  {/* Category Flags - Top Right */}
                  {q.questionsToCategories && q.questionsToCategories.length > 0 && (
                    <div className="absolute top-4 right-4 flex flex-wrap gap-1">
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
                  
                  {/* Question Header */}
                  <div className="flex items-start gap-4 mb-4">
                    {/* User Avatar */}
                    <div className="w-12 h-12 bg-gradient-to-br from-[#046cb8] to-[#035a9e] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-medium">
                        {q.user?.firstName?.charAt(0) || q.user?.name?.charAt(0) || 'A'}
                      </span>
                    </div>
                    
                    {/* Question Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-gray-500 text-sm font-medium">
                          {q.user?.name || `${q.user?.firstName || 'Anonymous'} ${q.user?.lastName || ''}`}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500 text-sm">{new Date(q.createdAt).toLocaleDateString()}</span>
                        {q.destination && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-400 text-xs flex items-center gap-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                              {q.destination}
                            </span>
                          </>
                        )}
                        {q.isUrgent && (
                          <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-1 rounded-full">
                            Urgent
                          </span>
                        )}
                      </div>
                      
                      <a 
                        href={`/questions/${q.id}`}
                        className="text-gray-900 text-base font-medium leading-relaxed hover:text-[#046cb8] transition-colors cursor-pointer block mb-3"
                      >
                        {q.question}
                      </a>
                    </div>
                  </div>
              
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
