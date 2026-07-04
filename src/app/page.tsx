'use client';

import { SignedIn, SignedOut, UserButton, useUser, SignInButton } from '@clerk/nextjs';
import { Suspense, useState, useEffect, useMemo } from "react";
import { usePathname, useSearchParams } from 'next/navigation';
import Image from "next/image";
import QuestionForm from '@/components/QuestionForm';
import QuestionsList from '@/components/QuestionsList';
import { QuestionAnswerSheet } from '@/components/questions/QuestionAnswerSheet';
import { useQuestions, useCreateQuestion, useCategories, useStats, useActiveUsers, usePopularDestinations, useCurrentUser } from "@/hooks/api";

const SCROLL_POSITION_KEY = 'questionsScrollPosition';

function HomeContent() {
  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [destination, setDestination] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [message, setMessage] = useState('');
  const [showCategoryError, setShowCategoryError] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  const [showMyQuestions, setShowMyQuestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [isAskComposerOpen, setIsAskComposerOpen] = useState(false);

  const questionFilters = useMemo(() => ({
    limit: 20,
    category: selectedCategory || undefined,
    destination: selectedDestination || undefined,
    search: searchQuery.trim() || undefined,
    my: showMyQuestions || undefined,
  }), [selectedCategory, selectedDestination, searchQuery, showMyQuestions]);

  // TanStack Query hooks
  const {
    data: questionPages,
    isLoading,
    isError: questionsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useQuestions(questionFilters);
  const questions = useMemo(
    () => questionPages?.pages.flatMap((page) => page.items) ?? [],
    [questionPages]
  );
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: stats } = useStats();
  const { data: activeUsers } = useActiveUsers();
  const { data: popularDestinations } = usePopularDestinations();
  const createQuestionMutation = useCreateQuestion();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { data: currentUser } = useCurrentUser();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasAskDraft = Boolean(
    title.trim() ||
    question.trim() ||
    destination ||
    isUrgent ||
    selectedCategoryIds.length > 0
  );
  const showFullAskComposer = isAskComposerOpen || hasAskDraft;

  // Sync "My Questions" filter with URL ?my=questions (e.g. from bottom nav Questions tab)
  useEffect(() => {
    const myQuestions = searchParams.get('my') === 'questions';
    setShowMyQuestions(myQuestions);
  }, [searchParams]);

  // Restore scroll position when returning from a question detail page (after content has loaded)
  useEffect(() => {
    if (pathname !== '/') return;
    const saved = sessionStorage.getItem(SCROLL_POSITION_KEY);
    if (saved == null) return;
    const y = parseInt(saved, 10);
    if (Number.isNaN(y)) {
      sessionStorage.removeItem(SCROLL_POSITION_KEY);
      return;
    }
    // Wait for feed to finish loading so page height is correct, then restore
    const restore = () => {
      sessionStorage.removeItem(SCROLL_POSITION_KEY);
      window.scrollTo({ top: y, behavior: 'instant' });
    };
    if (!isLoading) {
      // Content ready: run after paint so we don't get overridden by framework scroll
      requestAnimationFrame(() => {
        requestAnimationFrame(() => restore());
      });
    } else {
      // Will re-run when isLoading becomes false
    }
  }, [pathname, isLoading]);

  // Prevent browser from scrolling to top on back (so our restore sticks)
  useEffect(() => {
    if (pathname !== '/' || typeof window === 'undefined') return;
    const prev = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => { window.history.scrollRestoration = prev; };
  }, [pathname]);

  // Scroll to Ask form when opening /#ask (e.g. from bottom nav FAB)
  useEffect(() => {
    if (pathname !== '/' || typeof window === 'undefined') return;
    const openAskComposer = () => {
      setShowMyQuestions(false);
      if (window.location.hash === '#ask') {
        setIsAskComposerOpen(true);
        const el = document.getElementById('ask');
        if (el) requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      }
    };
    openAskComposer();
    window.addEventListener('hashchange', openAskComposer);
    window.addEventListener('roaming-map:open-ask', openAskComposer);
    return () => {
      window.removeEventListener('hashchange', openAskComposer);
      window.removeEventListener('roaming-map:open-ask', openAskComposer);
    };
  }, [pathname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setShowCategoryError(false);

    // Gentle validation - only show error if user tries to submit without category
    if (selectedCategoryIds.length === 0) {
      setShowCategoryError(true);
      return;
    }

    try {
      await createQuestionMutation.mutateAsync({
        title,
        question,
        destination,
        isUrgent,
        categoryIds: selectedCategoryIds,
      });
      
      setMessage('✅ Question submitted successfully!');
      setTitle('');
      setQuestion('');
      setDestination('');
      setIsUrgent(false);
      setSelectedCategoryIds([]);
      setIsAskComposerOpen(false);
      
      // Auto-dismiss success message after 3 seconds
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (error) {
      setMessage('❌ Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
      
      // Auto-dismiss error message after 5 seconds
      setTimeout(() => {
        setMessage('');
      }, 5000);
    }
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSearchQuery('');
    setSelectedDestination(null);
    setShowMyQuestions(false);
    window.history.replaceState(null, '', '/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav only – stays sticky; search + pills come after Ask box and stick when you scroll past it */}
      <nav className="sticky top-0 z-50 bg-gray-100 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16 gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Image
                src="/short-logo.png"
                alt="Roaming Map Logo"
                width={32}
                height={32}
                className="rounded-lg flex-shrink-0"
              />
              <span className="text-lg sm:text-xl font-semibold text-[#046cb8] truncate">Roaming Map</span>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="bg-[#046cb8] text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm font-medium hover:bg-[#046cb8]/90 transition-colors whitespace-nowrap">
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content - match reference spacing and openness */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex gap-4 sm:gap-6">
          
          {/* Left Sidebar - User Profile & Navigation */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-20 space-y-4">
              
              {/* User Profile Card */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <SignedIn>
                  <div className="text-center">
                    <div className="relative inline-block mb-3">
                      {user?.imageUrl ? (
                        <div className="w-16 h-16 rounded-full overflow-hidden mx-auto border-2 border-white shadow-lg">
                          <Image
                            src={user.imageUrl}
                            alt="Profile"
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-[#046cb8] to-[#035a9e] rounded-full flex items-center justify-center mx-auto">
                        <span className="text-white text-xl font-bold">
                          {user?.firstName?.charAt(0) || user?.emailAddresses[0]?.emailAddress?.charAt(0) || 'U'}
                        </span>
                      </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {user?.firstName || 'User'} {user?.lastName || ''}
                    </h3>
                    <p className="text-gray-500 text-sm">@{user?.emailAddresses[0]?.emailAddress?.split('@')[0] || 'user'}</p>
                  </div>
                </SignedIn>
                
                <SignedOut>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg">Guest User</h3>
                    <p className="text-gray-500 text-sm">Sign in to join the community</p>
                  </div>
                </SignedOut>
              </div>

                  {/* Navigation Menu */}
                  <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-200">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Menu</h3>
                    <nav className="space-y-1">
                      <button type="button" className="w-full flex items-center gap-2 px-2 py-2 text-gray-900 bg-[#046cb8]/10 rounded-lg font-medium transition-colors">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                        </svg>
                        <span className="text-sm">Home</span>
                      </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !showMyQuestions;
                      setShowMyQuestions(next);
                      setSelectedDestination(null);
                      // Update URL so bottom nav Questions tab reflects state
                      const url = next ? '/?my=questions' : '/';
                      window.history.replaceState(null, '', url);
                    }}
                    className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg font-medium transition-colors ${
                      showMyQuestions
                        ? 'text-gray-900 bg-[#046cb8]/10'
                        : 'text-gray-700 hover:bg-[#046cb8]/10'
                    }`}
                  >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                    <span className="text-sm">My Questions</span>
                      </button>
                    </nav>
                  </div>

              {/* Travel Tips Card */}
              <div className="bg-gradient-to-br from-[#046cb8] to-[#035a9e] rounded-xl p-4 text-white">
                <div className="text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-sm mb-2">Travel Tips</h3>
                  <p className="text-white/80 text-xs mb-3">Ask specific travel questions with destination context</p>
                  <div className="flex justify-center gap-1">
                    <span className="text-lg">✈️</span>
                    <span className="text-lg">🏨</span>
                    <span className="text-lg">🍽️</span>
                    <span className="text-lg">🎯</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Center - Questions Feed */}
          <main className="flex-1 min-w-0">
            {/* Ask Question card - compact until the user is ready to write */}
            <div id="ask" className={`bg-white rounded-xl shadow-sm border border-gray-100 mb-4 overflow-visible ${showFullAskComposer ? 'p-3 sm:p-5' : 'p-2.5'}`}>
              {showFullAskComposer ? (
                <form onSubmit={handleSubmit}>
                  <QuestionForm
                    title={title}
                    question={question}
                    destination={destination}
                    isUrgent={isUrgent}
                    selectedCategoryIds={selectedCategoryIds}
                    setTitle={setTitle}
                    setQuestion={setQuestion}
                    setDestination={setDestination}
                    setIsUrgent={setIsUrgent}
                    setSelectedCategoryIds={setSelectedCategoryIds}
                    submitting={createQuestionMutation.isPending}
                    user={user}
                    userLoading={!isUserLoaded}
                    categories={categories || []}
                    categoriesLoading={categoriesLoading}
                    showCategoryError={showCategoryError}
                    setShowCategoryError={setShowCategoryError}
                  />
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAskComposerOpen(true)}
                  className="flex w-full items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5 text-left transition-colors hover:bg-gray-100"
                >
                  {user?.imageUrl ? (
                    <Image
                      src={user.imageUrl}
                      alt=""
                      width={36}
                      height={36}
                      className="h-9 w-9 flex-shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#046cb8] text-sm font-semibold text-white">
                      {user?.firstName?.charAt(0) || 'U'}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 text-sm text-gray-500">
                    Ask about prices, routes, food, or places...
                  </span>
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#046cb8] text-white">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  </span>
                </button>
              )}

              {message && (
                <div className={`mt-3 p-3 rounded-lg text-sm ${message.includes('Error')
                    ? 'bg-red-50 text-red-700 border border-red-200' 
                    : 'bg-green-50 text-green-700 border border-green-200'
                }`}>
                  {message}
                </div>
              )}
            </div>

            {/* Sticky search + filter: only sticks after you scroll past the Ask box */}
            <div className="sticky top-14 sm:top-16 z-10 bg-white rounded-xl shadow-sm border border-gray-100 py-2.5 px-2.5 sm:px-4 space-y-2.5 mb-4 sm:mb-6">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search destinations, locals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-100 border-0 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-[#046cb8]/20 focus:outline-none"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-hide pr-1">
                <button
                  type="button"
                  onClick={clearFilters}
                  className={`px-3.5 py-1.5 text-sm font-medium rounded-full transition-colors flex-shrink-0 ${
                    !selectedCategory && !searchQuery && !selectedDestination && !showMyQuestions
                      ? 'text-white bg-[#046cb8]'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  All
                </button>
                {selectedDestination && (
                  <button
                    type="button"
                    onClick={() => setSelectedDestination(null)}
                    className="px-3.5 py-1.5 text-sm font-medium rounded-full flex items-center gap-1 flex-shrink-0 bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
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
                {(categories || []).map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(category.category);
                      setSearchQuery('');
                    }}
                    className={`px-3.5 py-1.5 text-sm font-medium rounded-full transition-colors flex-shrink-0 ${
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

            {/* Questions Feed */}
            <div className="space-y-4">
              {questionsError && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  Couldn&apos;t load questions. Please refresh and try again.
                </div>
              )}
              <QuestionsList 
                questions={questions}
                loading={isLoading}
                selectedDestination={selectedDestination}
                onDestinationChange={setSelectedDestination}
                showMyQuestions={showMyQuestions}
                currentUserId={currentUser?.id}
                onClearMyQuestions={() => {
                  setShowMyQuestions(false);
                  window.history.replaceState(null, '', '/');
                }}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                onQuestionSelect={setSelectedQuestionId}
              />
              {hasNextPage && (
                <div className="flex justify-center pt-2 pb-6">
                  <button
                    type="button"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="min-h-[44px] rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#046cb8] shadow-sm transition-colors hover:bg-[#046cb8]/5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isFetchingNextPage ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </div>
      </main>
  
          {/* Right Sidebar - Stories, Suggestions, Recommendations */}
          <aside className="hidden xl:block w-64 flex-shrink-0">
            <div className="sticky top-20 space-y-4">
              
              {/* Active Locals */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Active Locals</h3>
                <div className="space-y-3">
                  {activeUsers?.map((activeUser) => (
                    <div key={activeUser.id} className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {activeUser.firstName?.charAt(0) || activeUser.name?.charAt(0) || 'U'}
                          </span>
                      </div>
                      <div className="absolute inset-0 rounded-full border-2 border-green-500"></div>
                    </div>
                    <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {activeUser.firstName || activeUser.name || 'User'}
                        </p>
                        <p className="text-gray-500 text-xs">Active recently</p>
                      </div>
                    </div>
                  ))}
                  {(!activeUsers || activeUsers.length === 0) && (
                    <p className="text-gray-500 text-sm">No active locals yet.</p>
                  )}
                </div>
              </div>

              {/* Popular Destinations */}
              <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">Popular Destinations</h3>
                <div className="space-y-2">
                  {popularDestinations?.map((dest, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        // Toggle: if already selected, deselect; otherwise select
                        setSelectedDestination(
                          selectedDestination === dest.destination ? null : dest.destination
                        );
                      }}
                      className={`w-full flex items-center gap-2 rounded-lg p-1 transition-colors text-left ${
                        selectedDestination === dest.destination 
                          ? 'bg-[#046cb8]/10 hover:bg-[#046cb8]/20' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-[#046cb8] to-[#035a9e] rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-medium">
                          {dest.destination.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-xs truncate">{dest.destination}</p>
                        <p className="text-gray-500 text-xs">{dest.count} {dest.count === 1 ? 'question' : 'questions'}</p>
                      </div>
                      </button>
                  ))}
                  {(!popularDestinations || popularDestinations.length === 0) && (
                    <p className="text-gray-500 text-sm">No popular destinations yet.</p>
                  )}
                </div>
              </div>

              {/* Travel Categories */}
              <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">Travel Categories</h3>
                <div className="grid grid-cols-2 gap-2">
                  {categories?.map((category) => {
                    // Map category names to appropriate icons
                    const getCategoryIcon = (categoryName: string) => {
                      const iconMap: Record<string, string> = {
                        'Transport': '🚗',
                        'Food': '🍽️',
                        'Accommodation': '🏨',
                        'Attraction': '🎯',
                        'Culture/Other': '🎭'
                      };
                      return iconMap[categoryName] || '📝';
                    };

                    return (
                      <button
                        key={category.id}
                        type="button"
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                          selectedCategory === category.category
                            ? 'bg-[#046cb8]/10 text-[#046cb8]'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          setSelectedCategory(
                            selectedCategory === category.category ? '' : category.category
                          );
                          setSearchQuery('');
                          setSelectedDestination(null);
                          setShowMyQuestions(false);
                          window.history.replaceState(null, '', '/');
                        }}
                      >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        selectedCategory === category.category ? 'bg-[#046cb8]/15' : 'bg-[#046cb8]/10'
                      }`}>
                          <span className="text-lg">{getCategoryIcon(category.category)}</span>
                      </div>
                        <span className={`text-xs font-medium ${
                          selectedCategory === category.category ? 'text-[#046cb8]' : 'text-gray-700'
                        }`}>{category.category}</span>
                    </button>
                    );
                  })}
                </div>
              </div>

              {/* Community Stats */}
              <div className="bg-gradient-to-br from-[#046cb8] to-[#035a9e] rounded-xl p-5 text-white">
                <h3 className="font-semibold text-sm mb-3">Community Stats</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-white/90 text-xs">Questions</span>
                    <span className="font-bold text-lg">{stats?.questions || 0}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white/90 text-xs">Answers</span>
                    <span className="font-bold text-lg">
                      {stats?.answers || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/90 text-xs">Active Locals</span>
                    <span className="font-bold text-lg">{stats?.activeLocals || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <QuestionAnswerSheet
        questionId={selectedQuestionId}
        onClose={() => setSelectedQuestionId(null)}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <HomeContent />
    </Suspense>
  );
}
