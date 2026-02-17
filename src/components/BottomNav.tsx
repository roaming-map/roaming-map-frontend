'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

function ExploreIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0h.5a2.5 2.5 0 002.5-2.5V3.935M12 12v4m0 0l2 2 2-2m-2 2l-2 2-2-2" />
    </svg>
  );
}

function ExploreIconActive({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.236l6.5 3.25L12 11l-6.5-3.514L12 4.236zM4 8.236l8 4 8-4v7.528l-8 4-8-4V8.236z" />
    </svg>
  );
}

function QuestionsIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function QuestionsIconActive({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z" />
    </svg>
  );
}

function MapIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  );
}

function ProfileIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function ProfileIconActive({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" d="M12 2a4 4 0 00-4 4v2a4 4 0 008 0V6a4 4 0 00-4-4zm6 10a6 6 0 00-12 0c0 1.5.5 2.9 1.4 4H4a2 2 0 00-2 2v2a2 2 0 002 2h16a2 2 0 002-2v-2a2 2 0 00-2-2h-1.6c.9-1.1 1.4-2.5 1.4-4z" clipRule="evenodd" />
    </svg>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isHome = pathname === '/' && searchParams.get('my') !== 'questions';
  const isMyQuestionsView = pathname === '/' && searchParams.get('my') === 'questions';
  const isQuestionDetailPage = pathname.startsWith('/questions/');

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 rounded-t-2xl shadow-[0_-2px_10px_rgba(0,0,0,0.06)]"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-end justify-around px-1 pb-3 pt-1 h-16">
        {/* Explore */}
        <Link
          href="/"
          className="flex flex-col items-center justify-end flex-1 min-h-[44px] pt-2 pb-2 gap-0.5 transition-colors touch-manipulation"
          style={{ minWidth: 44 }}
        >
          <span className={isHome ? 'text-[#046cb8]' : 'text-gray-500'}>
            {isHome ? <ExploreIconActive className="w-6 h-6" /> : <ExploreIcon className="w-6 h-6" />}
          </span>
          <span className={`text-[10px] font-medium uppercase tracking-wide ${isHome ? 'text-[#046cb8]' : 'text-gray-500'}`}>
            Explore
          </span>
        </Link>

        {/* Questions - takes user to "My Questions" (questions they asked) */}
        <Link
          href="/?my=questions"
          className="flex flex-col items-center justify-end flex-1 min-h-[44px] pt-2 pb-2 gap-0.5 transition-colors touch-manipulation"
          style={{ minWidth: 44 }}
          aria-label="My questions"
        >
          <span className={isMyQuestionsView || isQuestionDetailPage ? 'text-[#046cb8]' : 'text-gray-500'}>
            {(isMyQuestionsView || isQuestionDetailPage) ? <QuestionsIconActive className="w-6 h-6" /> : <QuestionsIcon className="w-6 h-6" />}
          </span>
          <span className={`text-[10px] font-medium uppercase tracking-wide ${isMyQuestionsView || isQuestionDetailPage ? 'text-[#046cb8]' : 'text-gray-500'}`}>
            Questions
          </span>
        </Link>

        {/* Central Ask FAB */}
        <Link
          href="/#ask"
          className="flex flex-col items-center justify-center flex-1 min-h-[44px] -mt-5 touch-manipulation"
          style={{ minWidth: 56 }}
          aria-label="Ask a question"
        >
          <span className="flex items-center justify-center w-12 h-12 rounded-full bg-[#046cb8] text-white shadow-lg hover:bg-[#035a9e] active:scale-95 transition-all">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 5a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H6a1 1 0 110-2h5V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wide text-gray-500 mt-1">Ask</span>
        </Link>

        {/* Map */}
        <Link
          href="#"
          className="flex flex-col items-center justify-end flex-1 min-h-[44px] pt-2 pb-2 gap-0.5 transition-colors text-gray-500 touch-manipulation"
          style={{ minWidth: 44 }}
        >
          <MapIcon className="w-6 h-6" />
          <span className="text-[10px] font-medium uppercase tracking-wide">Map</span>
        </Link>

        {/* Profile */}
        <Link
          href="#"
          className="flex flex-col items-center justify-end flex-1 min-h-[44px] pt-2 pb-2 gap-0.5 transition-colors touch-manipulation"
          style={{ minWidth: 44 }}
        >
          <span className="text-gray-500">
            <ProfileIcon className="w-6 h-6" />
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wide text-gray-500">Profile</span>
        </Link>
      </div>
    </nav>
  );
}
