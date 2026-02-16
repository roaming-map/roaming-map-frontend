import { SRI_LANKA_CITIES } from '@/lib/cities';
import Image from "next/image";
import { getCategoryColors } from "@/lib/category-colors";
import { useState, useRef, useEffect } from 'react';
import { Category } from '@/hooks/api/categories';
import { UserResource } from '@clerk/types';
import { Skeleton } from '@/components/ui/skeleton';

type ClerkUser = UserResource | null | undefined;

interface QuestionFormProps {
  question: string;
  destination: string;
  isUrgent: boolean;
  selectedCategoryIds: number[];
  setQuestion: (value: string) => void;
  setDestination: (value: string) => void;
  setIsUrgent: (value: boolean) => void;
  setSelectedCategoryIds: (value: number[]) => void;
  submitting: boolean;
  user: ClerkUser;
  categories: Category[];
  /** When true, shows skeleton pills so the Categories section doesn’t shift during load */
  categoriesLoading?: boolean;
  showCategoryError: boolean;
  setShowCategoryError: (value: boolean) => void;
}

const QuestionForm = ({
  question,
  destination,
  isUrgent,
  selectedCategoryIds,
  setQuestion,
  setDestination,
  setIsUrgent,
  setSelectedCategoryIds,
  submitting,
  user,
  categories,
  categoriesLoading = false,
  showCategoryError,
  setShowCategoryError
}: QuestionFormProps) => {
  const [isDestinationOpen, setIsDestinationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter cities based on search query
  const filteredCities = SRI_LANKA_CITIES.filter(city =>
    city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDestinationOpen(false);
        setSearchQuery('');
      }
    };

    if (isDestinationOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDestinationOpen]);

  return (
    <>
      <div className="flex items-start gap-2 sm:gap-3">
        {user?.imageUrl ? (
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden flex-shrink-0 border border-gray-200">
            <Image
              src={user.imageUrl}
              alt="Profile"
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#046cb8] rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-medium">
              {user?.firstName?.charAt(0) || user?.lastName?.charAt(0) || user?.emailAddresses?.[0]?.emailAddress?.charAt(0).toUpperCase() || '?'}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask locals about destinations, prices, recommendations, or travel tips..."
            className="w-full min-h-[72px] border-0 focus:ring-0 focus:outline-none text-gray-900 placeholder-gray-500 resize-none text-base sm:text-lg bg-blue-50/30 rounded-lg p-3 overflow-hidden"
            rows={3}
          />

          {/* Category Pills */}
          <div className="mt-2 sm:mt-3">
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
              <span>Categories</span>
              <div className="relative group">
                <svg className="w-3 h-3 text-gray-400 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  Required
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {categoriesLoading ? (
                <>
                  <Skeleton className="h-7 w-28 rounded-full" />
                  <Skeleton className="h-7 w-20 rounded-full" />
                  <Skeleton className="h-7 w-24 rounded-full" />
                  <Skeleton className="h-7 w-16 rounded-full" />
                  <Skeleton className="h-7 w-20 rounded-full" />
                </>
              ) : (
                categories?.map((category) => {
                  const isSelected = selectedCategoryIds.includes(category.id);
                  const colors = getCategoryColors(category.category);
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        if (submitting) return;

                        const newSelection = isSelected
                          ? selectedCategoryIds.filter(id => id !== category.id)
                          : [...selectedCategoryIds, category.id];

                        setSelectedCategoryIds(newSelection);
                        setShowCategoryError(false);
                      }}
                      disabled={submitting}
                      className={`
                        px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap
                        ${isSelected
                          ? `${colors.bgColor} ${colors.textColor} shadow-sm border-2 border-current`
                          : `${colors.bgColor} ${colors.textColor} hover:opacity-80`
                        }
                        ${submitting
                          ? 'opacity-50 cursor-not-allowed'
                          : 'cursor-pointer'
                        }
                      `}
                    >
                      {category.category}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Gentle category validation message */}
          {showCategoryError && (
            <div className="mt-2 text-sm text-amber-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Please select a category to post your question
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-gray-100 mt-3">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <button type="button" className="flex items-center gap-1.5 text-gray-500 hover:text-[#046cb8] transition-colors flex-shrink-0">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <span className="text-sm whitespace-nowrap">Photos</span>
          </button>

          {/* Destination Dropdown */}
          <div className="relative min-w-0" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsDestinationOpen(!isDestinationOpen);
                setSearchQuery('');
              }}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#046cb8] transition-colors whitespace-nowrap"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span className="truncate max-w-[120px] sm:max-w-none">{destination || 'Destination'}</span>
              <svg 
                className={`w-3 h-3 flex-shrink-0 transition-transform ${isDestinationOpen ? 'rotate-180' : ''}`} 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isDestinationOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                {/* Search Input */}
                <div className="p-2 border-b border-gray-100">
                  <input
                    type="text"
                    placeholder="Search city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#046cb8] focus:border-transparent outline-none"
                    autoFocus
                  />
                </div>

                {/* Cities List */}
                <div className="max-h-64 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setDestination('');
                      setIsDestinationOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      !destination ? 'bg-[#046cb8]/10 text-[#046cb8] font-medium' : 'text-gray-700'
                    }`}
                  >
                    All Destinations
                  </button>
                  {filteredCities.length > 0 ? (
                    filteredCities.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => {
                          setDestination(city);
                          setIsDestinationOpen(false);
                          setSearchQuery('');
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                          destination === city ? 'bg-[#046cb8]/10 text-[#046cb8] font-medium' : 'text-gray-700'
                        }`}
                      >
                        {city}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      No cities found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsUrgent(!isUrgent)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex-shrink-0 ${isUrgent
              ? 'bg-red-100 text-red-700 border border-red-200 hover:bg-red-200'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
          >
            <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${isUrgent ? 'bg-red-500' : 'bg-gray-300'
              }`}>
              {isUrgent && (
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className="whitespace-nowrap">Urgent</span>
          </button>
        </div>

        <button
          type="submit"
          disabled={submitting || !question.trim() || selectedCategoryIds.length === 0}
          className="bg-[#046cb8] text-white px-5 py-2 rounded-lg font-medium hover:bg-[#035a9e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 w-full sm:w-auto"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Ask
        </button>
      </div>
    </>
  );
};

export default QuestionForm;
