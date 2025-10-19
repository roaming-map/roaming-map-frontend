'use client';

import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { SignedIn, SignedOut, UserButton, useUser, SignInButton } from '@clerk/nextjs';
import { useState } from "react";
import Image from "next/image";
import Header from '@/components/Header';
import QuestionForm from '@/components/QuestionForm';
import QuestionsList from '@/components/QuestionsList';
import CategorySelector from '@/components/CategorySelector';
import { useQuestions, useCreateQuestion } from "@/hooks/api";

export default function Home() {
  const [question, setQuestion] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // TanStack Query hooks
  const { data: questions, isLoading, error } = useQuestions();
  const createQuestionMutation = useCreateQuestion();
  const { user } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    try {
      await createQuestionMutation.mutateAsync({
        question,
        isUrgent,
        categoryIds: selectedCategoryIds,
      });
      
      setMessage('✅ Question submitted successfully!');
      setQuestion('');
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
    <div className="min-h-screen bg-white">
      {/* Navigation with Logo and User Profile */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Image
                src="/short-logo.png"
                alt="Roaming Map Logo"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="text-xl font-semibold text-[#046cb8]">Roaming Map</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="text-gray-600 hover:text-gray-900 text-sm font-medium">How it works</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Community</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 text-sm font-medium">FAQ</a>
              
              {/* User Profile */}
              <SignedIn>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#046cb8] rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user?.firstName?.charAt(0) || user?.emailAddresses[0]?.emailAddress?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {user?.firstName || 'User'}
                    </span>
                  </div>
                  <UserButton afterSignOutUrl="/" />
                </div>
              </SignedIn>
              
                  <SignedOut>
                    <SignInButton mode="modal">
                      <button className="bg-[#046cb8] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#046cb8]/90 transition-colors">
                        Sign In
                      </button>
                    </SignInButton>
                  </SignedOut>
            </div>
          </div>
        </div>
      </nav>

      {/* Clean Header with Blue Gradient */}
      <div className="bg-gradient-to-br from-[#046cb8]/10 via-[#046cb8]/5 to-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-6">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3 leading-tight">
              Ask Locals About
              <span className="block text-[#046cb8]">Where to Go & Prices</span>
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Get authentic local recommendations about what to do, where to eat, and real prices from verified locals who live there.
            </p>
          </div>
        </div>
      </div>

      {/* Thin Search Bar - Sticky */}
      <div className="bg-gradient-to-r from-[#046cb8]/5 to-blue-50/50 py-4 sticky top-16 z-40 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4">
          <form onSubmit={handleSubmit} className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 shadow-sm p-3">
            <div className="flex items-center text-[#046cb8]">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
            </div>
            
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What would you like to know about traveling? Ask locals for instant answers..."
              className="flex-1 border-0 focus:ring-0 focus:outline-none text-gray-900 placeholder-gray-500"
            />
            
            <button
              type="submit"
              disabled={createQuestionMutation.isPending || !question.trim()}
              className="bg-[#046cb8] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#035a9e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {createQuestionMutation.isPending ? 'Asking...' : 'Ask Question'}
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </form>

          {message && (
            <div className={`mt-3 p-3 rounded-lg text-sm ${
              message.includes('Error') 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {message}
            </div>
          )}

          {/* Category Pills */}
          <div className="mt-4 flex justify-center">
            <div className="flex flex-wrap gap-2">
              {[
                { id: 1, name: 'Transport', icon: '🚗' },
                { id: 2, name: 'Food', icon: '🍽️' },
                { id: 3, name: 'Accommodation', icon: '🏨' },
                { id: 4, name: 'Attractions', icon: '🎯' },
                { id: 5, name: 'Culture', icon: '🎭' }
              ].map((category) => {
                const isSelected = selectedCategoryIds.includes(category.id);
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      if (createQuestionMutation.isPending) return;
                      
                      const newSelection = isSelected
                        ? selectedCategoryIds.filter(id => id !== category.id)
                        : [...selectedCategoryIds, category.id];
                      
                      setSelectedCategoryIds(newSelection);
                    }}
                    disabled={createQuestionMutation.isPending}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200
                      ${isSelected
                        ? 'bg-[#046cb8] text-white shadow-sm'
                        : 'bg-white text-gray-600 hover:bg-[#046cb8]/10 hover:text-[#046cb8] border border-gray-200'
                      }
                      ${createQuestionMutation.isPending 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'cursor-pointer'
                      }
                    `}
                  >
                    <span className="text-sm">{category.icon}</span>
                    <span>{category.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Three-Column Layout */}
      <div className="bg-gradient-to-br from-blue-50/30 to-white pt-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-6">
          
          {/* Left Sidebar - Navigation (Reddit style) */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-[#046cb8]/20 sticky top-20 space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">Menu</h3>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-[#046cb8]/10 rounded-lg font-medium transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                Home
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-[#046cb8]/10 rounded-lg font-medium transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                Popular
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-[#046cb8]/10 rounded-lg font-medium transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                My Questions
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-[#046cb8]/10 rounded-lg font-medium transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                All Categories
              </button>
              
              <div className="pt-4 mt-4 border-t border-gray-100">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">Categories</h3>
                {[
                  { name: 'Transport', icon: '🚗' },
                  { name: 'Food', icon: '🍽️' },
                  { name: 'Accommodation', icon: '🏨' },
                  { name: 'Attractions', icon: '🎯' },
                  { name: 'Culture', icon: '🎭' }
                ].map((cat) => (
                  <button
                    key={cat.name}
                    className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-[#046cb8]/10 rounded-lg text-sm transition-colors"
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Center - Questions Feed */}
          <main className="flex-1 min-w-0">
            <QuestionsList 
              questions={questions || []}
              loading={isLoading}
            />
      </main>
  
          {/* Right Sidebar - How It Works Cards */}
          <aside className="hidden xl:block w-72 flex-shrink-0">
            <div className="sticky top-20 space-y-3">
              
              {/* Card 1 - Ask Question */}
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg p-4 border border-[#046cb8]/30 hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-[#046cb8] rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[#046cb8] text-xs font-semibold">STEP 01</div>
                    <h3 className="text-sm font-bold text-gray-900">Ask Your Question</h3>
                  </div>
                </div>
                <p className="text-gray-600 text-xs leading-relaxed pl-11">
                  Post with categories and get instant answers from verified locals worldwide.
                </p>
              </div>

              {/* Card 2 - Get Answers */}
              <div className="bg-gradient-to-br from-green-50 to-white rounded-lg p-4 border border-[#046cb8]/30 hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-[#046cb8] rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[#046cb8] text-xs font-semibold">STEP 02</div>
                    <h3 className="text-sm font-bold text-gray-900">Get Local Insights</h3>
                  </div>
                </div>
                <p className="text-gray-600 text-xs leading-relaxed pl-11">
                  Authentic recommendations and transparent pricing from verified locals.
                </p>
              </div>

              {/* Card 3 - Travel Confidently */}
              <div className="bg-gradient-to-br from-purple-50 to-white rounded-lg p-4 border border-[#046cb8]/30 hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-[#046cb8] rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[#046cb8] text-xs font-semibold">STEP 03</div>
                    <h3 className="text-sm font-bold text-gray-900">Travel Confidently</h3>
                  </div>
                </div>
                <p className="text-gray-600 text-xs leading-relaxed pl-11">
                  Make informed decisions with trusted community-driven travel advice.
                </p>
              </div>

              {/* Stats Card */}
              <div className="bg-gradient-to-br from-[#046cb8] to-[#035a9e] rounded-lg p-5 text-white">
                <h3 className="font-semibold text-sm mb-3">Community Stats</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-white/90 text-xs">Questions</span>
                    <span className="font-bold text-lg">{questions?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/90 text-xs">Answers</span>
                    <span className="font-bold text-lg">
                      {questions?.reduce((acc, q) => acc + (q.answers?.length || 0), 0) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/90 text-xs">Active Locals</span>
                    <span className="font-bold text-lg">190+</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
          </div>
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
