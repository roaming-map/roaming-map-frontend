'use client';

import { useState } from 'react';

interface Question {
  id: number;
  question: string;
  isUrgent: boolean;
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
}

const QuestionsList = ({ questions, loading }: QuestionsListProps) => {
  const [expandedAnswers, setExpandedAnswers] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');

  const toggleAnswers = (questionId: number) => {
    const newExpanded = new Set(expandedAnswers);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedAnswers(newExpanded);
  };

  // Filter questions based on search query
  const filteredQuestions = questions.filter(question =>
    question.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    question.questionsToCategories?.some(qtc => 
      qtc.category?.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#046cb8]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
          </svg>
          Recent Questions
        </h2>
        <div className="flex items-center gap-4">
          <div className="relative w-64 flex-shrink-0 overflow-hidden">
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-0 focus:outline-none focus:border-gray-300 w-full min-w-0"
              style={{ width: '100%', minWidth: 0 }}
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
          <div className="text-sm text-gray-500">
            {searchQuery ? `${filteredQuestions.length} of ${questions.length} questions` : `${questions.length} questions`}
          </div>
        </div>
      </div>
      
      {filteredQuestions.length === 0 ? (
        <div className="text-center py-12">
          {searchQuery ? (
            <>
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-gray-500 text-lg">No questions found for &quot;{searchQuery}&quot;</p>
              <p className="text-gray-400 text-sm mt-1">Try different keywords or ask a new question!</p>
            </>
          ) : (
            <>
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 text-lg">No questions yet</p>
              <p className="text-gray-400 text-sm mt-1">Be the first to ask a travel question!</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q) => (
            <div key={q.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-200">
              {/* Question Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  {/* User Avatar */}
                  <div className="w-10 h-10 bg-[#046cb8] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-medium">
                      {q.user?.firstName?.charAt(0) || q.user?.name?.charAt(0) || 'A'}
                    </span>
                  </div>
                  
                  {/* Question Content */}
                  <div className="flex-1">
                    <a 
                      href={`/questions/${q.id}`}
                      className="text-gray-900 font-semibold text-lg hover:text-[#046cb8] transition-colors cursor-pointer line-clamp-2 block mb-2"
                    >
                      {q.question}
                    </a>
                    
                    {/* User Info */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                      <span className="font-medium text-gray-700">
                        {q.user?.name || `${q.user?.firstName || 'Anonymous'} ${q.user?.lastName || ''}`}
                      </span>
                      <span>•</span>
                      <span>{new Date(q.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{new Date(q.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                    </div>
                  </div>
                </div>
                
                {/* Urgent Badge */}
                {q.isUrgent && (
                  <span className="bg-red-100 text-red-700 text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1 flex-shrink-0">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Urgent
                  </span>
                )}
              </div>
              
              {/* Categories */}
              {q.questionsToCategories && q.questionsToCategories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {q.questionsToCategories.map((qtc) => (
                    <span
                      key={qtc.categoryId}
                      className="px-3 py-1 bg-[#046cb8]/10 text-[#046cb8] text-xs rounded-full font-medium"
                    >
                      {qtc.category?.category}
                    </span>
                  ))}
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
                    <span className="font-medium">{q.answers.length} Answer{q.answers.length !== 1 ? 's' : ''}</span>
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
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <span className="flex items-center gap-1 hover:text-[#046cb8] transition-colors cursor-pointer">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
                    {q.answers?.length || 0} answers
                  </span>
                  <span className="flex items-center gap-1 hover:text-[#046cb8] transition-colors cursor-pointer">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                    Helpful
                  </span>
                  <span className="flex items-center gap-1 hover:text-[#046cb8] transition-colors cursor-pointer">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                    </svg>
                    Share
                  </span>
                </div>
                
                <div className="text-xs text-gray-400">
                  Question #{q.id}
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
