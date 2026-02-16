'use client';

import { SignedIn, SignedOut, UserButton, useUser, SignInButton } from '@clerk/nextjs';
import { useState } from "react";
import Image from "next/image";
import QuestionForm from '@/components/QuestionForm';
import QuestionsList from '@/components/QuestionsList';
import { useQuestions, useCreateQuestion, useCategories, useStats, useActiveUsers, usePopularDestinations, useCurrentUser } from "@/hooks/api";

export default function Home() {
  const [question, setQuestion] = useState('');
  const [destination, setDestination] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [message, setMessage] = useState('');
  const [showCategoryError, setShowCategoryError] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  const [showMyQuestions, setShowMyQuestions] = useState(false);

  // TanStack Query hooks
  const { data: questions, isLoading } = useQuestions();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: stats } = useStats();
  const { data: activeUsers } = useActiveUsers();
  const { data: popularDestinations } = usePopularDestinations();
  const createQuestionMutation = useCreateQuestion();
  const { user } = useUser();
  const { data: currentUser } = useCurrentUser();

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
        question,
        destination,
        isUrgent,
        categoryIds: selectedCategoryIds,
      });
      
      setMessage('✅ Question submitted successfully!');
      setQuestion('');
      setDestination('');
      setIsUrgent(false);
      setSelectedCategoryIds([]);
      
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar - mobile-first, no overlap */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
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
            <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0">
              <a href="#" className="hidden md:inline text-gray-600 hover:text-gray-900 text-sm font-medium">How it works</a>
              <a href="#" className="hidden md:inline text-gray-600 hover:text-gray-900 text-sm font-medium">Community</a>
              <a href="#" className="hidden md:inline text-gray-600 hover:text-gray-900 text-sm font-medium">FAQ</a>

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

      {/* Main Content Area - single column on mobile, three on large */}
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
                      <button className="w-full flex items-center gap-2 px-2 py-2 text-gray-900 bg-[#046cb8]/10 rounded-lg font-medium transition-colors">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                        </svg>
                        <span className="text-sm">Home</span>
                      </button>
                  <button 
                    onClick={() => {
                      setShowMyQuestions(!showMyQuestions);
                      setSelectedDestination(null); // Clear destination filter when toggling
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
                      <button className="w-full flex items-center gap-2 px-2 py-2 text-gray-700 hover:bg-[#046cb8]/10 rounded-lg font-medium transition-colors">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                        </svg>
                        <span className="text-sm">Verified Locals</span>
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
                  <p className="text-white/80 text-xs mb-3">Get instant answers from verified locals</p>
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
            {/* Ask Question Section */}
            <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200 mb-4 sm:mb-6 overflow-hidden">
              <form onSubmit={handleSubmit}>
                <QuestionForm
                  question={question}
                  destination={destination}
                  isUrgent={isUrgent}
                  selectedCategoryIds={selectedCategoryIds}
                  setQuestion={setQuestion}
                  setDestination={setDestination}
                  setIsUrgent={setIsUrgent}
                  setSelectedCategoryIds={setSelectedCategoryIds}
                  submitting={createQuestionMutation.isPending}
                  user={user}
                  categories={categories || []}
                  categoriesLoading={categoriesLoading}
                  showCategoryError={showCategoryError}
                  setShowCategoryError={setShowCategoryError}
                />
              </form>

              {message && (
                <div className={`mt-3 p-3 rounded-lg text-sm ${message.includes('Error')
                    ? 'bg-red-50 text-red-700 border border-red-200' 
                    : 'bg-green-50 text-green-700 border border-green-200'
                }`}>
                  {message}
                </div>
              )}
            </div>

            {/* Questions Feed */}
            <div className="space-y-4">
              <QuestionsList 
                questions={questions || []}
                loading={isLoading}
                selectedDestination={selectedDestination}
                onDestinationChange={setSelectedDestination}
                showMyQuestions={showMyQuestions}
                currentUserId={currentUser?.id}
                onClearMyQuestions={() => setShowMyQuestions(false)}
              />
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
                        className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                        onClick={() => {
                          // Scroll to question form and focus on categories
                          const questionForm = document.querySelector('textarea');
                          if (questionForm) {
                            questionForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            questionForm.focus();
                          }
                        }}
                      >
                      <div className="w-8 h-8 bg-[#046cb8]/10 rounded-full flex items-center justify-center">
                          <span className="text-lg">{getCategoryIcon(category.category)}</span>
                      </div>
                        <span className="text-xs font-medium text-gray-700">{category.category}</span>
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

      {/* Features Section */}
      <div className="bg-gradient-to-br from-blue-50/50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center">
            <h3 className="text-3xl font-bold text-gray-900 mb-8">Join Thousands of Travelers</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-[#046cb8]/20 hover:shadow-md transition-shadow">
                <div className="w-16 h-16 bg-[#046cb8]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#046cb8]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Real-time Q&A</h4>
                <p className="text-gray-600 text-sm">Get instant answers from verified locals worldwide</p>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-[#046cb8]/20 hover:shadow-md transition-shadow">
                <div className="w-16 h-16 bg-[#046cb8]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#046cb8]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Transparent Pricing</h4>
                <p className="text-gray-600 text-sm">No hidden costs or surprises - know what you pay upfront</p>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-[#046cb8]/20 hover:shadow-md transition-shadow">
                <div className="w-16 h-16 bg-[#046cb8]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#046cb8]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Verified Locals</h4>
                <p className="text-gray-600 text-sm">Trusted community members with authentic local knowledge</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simple Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/short-logo.png"
                  alt="Roaming Map Logo"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
                <span className="text-xl font-bold">Roaming Map</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Connect with verified locals worldwide for authentic travel insights, real-time Q&A, and transparent pricing.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">How it works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Connect</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition-colors">LinkedIn</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Roaming Map. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
