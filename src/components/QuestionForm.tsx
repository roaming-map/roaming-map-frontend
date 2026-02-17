import { SRI_LANKA_CITIES } from '@/lib/cities';
import Image from 'next/image';
import { getCategoryColors } from '@/lib/category-colors';
import { useState, useRef, useEffect } from 'react';
import { Category } from '@/hooks/api/categories';
import { UserResource } from '@clerk/types';
import { Skeleton } from '@/components/ui/skeleton';

type ClerkUser = UserResource | null | undefined;

const categoryIcons: Record<string, React.ReactNode> = {
  Accommodation: (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
    </svg>
  ),
  Food: (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M3 1a1 1 0 000 2h1v22a1 1 0 102 0V3h1a1 1 0 100-2H3zm4 0a1 1 0 000 2h1v22a1 1 0 102 0V3h1a1 1 0 100-2H7zm4 0a1 1 0 00-1 1v6a1 1 0 01-2 0V2a1 1 0 00-2 0v6a1 1 0 01-2 0V2a1 1 0 00-2 0v14a3 3 0 006 0V2a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v14a3 3 0 006 0V2a1 1 0 00-2 0v6a1 1 0 01-2 0V2a1 1 0 00-2 0z" />
    </svg>
  ),
  Transport: (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
      <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a2.5 2.5 0 014.9 0H17a1 1 0 001-1V5a1 1 0 00-1-1H3zM3 5h14v10h-1.05a2.5 2.5 0 00-4.9 0H8.05a2.5 2.5 0 00-4.9 0H3V5z" />
    </svg>
  ),
  Attraction: (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
    </svg>
  ),
  'Culture/Other': (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
    </svg>
  ),
};

interface QuestionFormProps {
  title: string;
  question: string;
  destination: string;
  isUrgent: boolean;
  selectedCategoryIds: number[];
  setTitle: (value: string) => void;
  setQuestion: (value: string) => void;
  setDestination: (value: string) => void;
  setIsUrgent: (value: boolean) => void;
  setSelectedCategoryIds: (value: number[]) => void;
  submitting: boolean;
  user: ClerkUser;
  categories: Category[];
  categoriesLoading?: boolean;
  showCategoryError: boolean;
  setShowCategoryError: (value: boolean) => void;
}

const QuestionForm = ({
  title,
  question,
  destination,
  isUrgent,
  selectedCategoryIds,
  setTitle,
  setQuestion,
  setDestination,
  setIsUrgent,
  setSelectedCategoryIds,
  submitting,
  user,
  categories,
  categoriesLoading = false,
  showCategoryError,
  setShowCategoryError,
}: QuestionFormProps) => {
  const [isDestinationOpen, setIsDestinationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const filteredCities = SRI_LANKA_CITIES.filter((city) =>
    city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDestinationOpen(false);
        setSearchQuery('');
      }
    };
    if (isDestinationOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDestinationOpen]);

  const displayName = user?.firstName || user?.lastName || 'Guest';

  return (
    <div className="space-y-3">
      {/* Header: Posting as [Name] | PUBLIC */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {user?.imageUrl ? (
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-gray-200">
              <Image src={user.imageUrl} alt="" width={32} height={32} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#046cb8] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-medium">
                {user?.firstName?.charAt(0) || user?.lastName?.charAt(0) || '?'}
              </span>
            </div>
          )}
          <span className="text-xs text-gray-500 truncate">
            Posting as <span className="text-[#046cb8] font-medium">{displayName}</span>
          </span>
        </div>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-[#046cb8] text-[10px] font-semibold uppercase tracking-wide flex-shrink-0">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
          </svg>
          Public
        </span>
      </div>

      {/* Main input: title + details with subtle separation and tap-friendly spacing */}
      <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a short title..."
          className="w-full px-3 py-3 min-h-[44px] text-sm font-medium text-gray-900 placeholder-gray-400 bg-transparent border-0 focus:ring-0 focus:outline-none"
        />
        <div className="border-t border-gray-200/70 mx-3" aria-hidden />
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What do you want to know about your next destination?"
          className="w-full px-3 py-3 min-h-[80px] text-sm text-gray-900 placeholder-gray-400 bg-transparent border-0 focus:ring-0 focus:outline-none resize-none"
          rows={3}
        />
      </div>

      {/* Category row: horizontal pills with icons */}
      <div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-0.5 scrollbar-hide">
          {categoriesLoading ? (
            <>
              <Skeleton className="h-8 w-24 rounded-full flex-shrink-0" />
              <Skeleton className="h-8 w-20 rounded-full flex-shrink-0" />
              <Skeleton className="h-8 w-28 rounded-full flex-shrink-0" />
            </>
          ) : (
            categories?.map((category) => {
              const isSelected = selectedCategoryIds.includes(category.id);
              const colors = getCategoryColors(category.category);
              const icon = categoryIcons[category.category];
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    if (submitting) return;
                    const newSelection = isSelected
                      ? selectedCategoryIds.filter((id) => id !== category.id)
                      : [...selectedCategoryIds, category.id];
                    setSelectedCategoryIds(newSelection);
                    setShowCategoryError(false);
                  }}
                  disabled={submitting}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex-shrink-0 ${colors.bgColor} ${colors.textColor} ${
                    isSelected ? 'border-2 border-current shadow-sm' : 'hover:opacity-90'
                  } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {icon}
                  {category.category}
                </button>
              );
            })
          )}
        </div>
        {showCategoryError && (
          <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92z" clipRule="evenodd" />
            </svg>
            Select a category
          </p>
        )}
      </div>

      {/* Footer: icons left, Ask Community right */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1 sm:gap-2">
          <button type="button" className="p-2 text-gray-400 hover:text-[#046cb8] rounded-lg transition-colors" aria-label="Add photos">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </button>
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => { setIsDestinationOpen(!isDestinationOpen); setSearchQuery(''); }}
              className="p-2 text-gray-400 hover:text-[#046cb8] rounded-lg transition-colors"
              aria-label="Add destination"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </button>
            {isDestinationOpen && (
              <div className="absolute left-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-[100] overflow-hidden">
                <div className="p-2 border-b border-gray-100">
                  <input
                    type="text"
                    placeholder="Search city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-[#046cb8] outline-none"
                    autoFocus
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => { setDestination(''); setIsDestinationOpen(false); setSearchQuery(''); }}
                    className={`w-full text-left px-3 py-2 text-sm ${!destination ? 'bg-[#046cb8]/10 text-[#046cb8] font-medium' : 'hover:bg-gray-50'}`}
                  >
                    All
                  </button>
                  {filteredCities.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => { setDestination(city); setIsDestinationOpen(false); setSearchQuery(''); }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${destination === city ? 'bg-[#046cb8]/10 text-[#046cb8] font-medium' : ''}`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsUrgent(!isUrgent)}
            className={`p-2 rounded-lg transition-colors ${isUrgent ? 'text-red-600 bg-red-50' : 'text-gray-400 hover:text-[#046cb8]'}`}
            aria-label="Mark as urgent"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <button
          type="submit"
          disabled={submitting || !title.trim() || !question.trim() || selectedCategoryIds.length === 0}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#046cb8] text-white text-sm font-medium rounded-xl hover:bg-[#035a9e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Ask Community
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default QuestionForm;
