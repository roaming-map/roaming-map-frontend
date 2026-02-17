'use client';

import { Skeleton } from '@/components/ui/skeleton';

/**
 * Matches the layout of the questions feed (filters + cards) to avoid CLS.
 * Used only while questions are loading on the home page.
 */
export function QuestionsFeedSkeleton() {
  return (
    <div>
      {/* Filter row - matches QuestionsList (search card + filter pills) */}
      <div className="mb-4 sm:mb-6 space-y-3">
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <div className="flex items-center gap-2 overflow-hidden">
          <Skeleton className="h-7 w-10 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-lg" />
          <Skeleton className="h-7 w-24 rounded-lg" />
          <Skeleton className="h-7 w-20 rounded-lg" />
          <Skeleton className="h-7 w-28 rounded-lg" />
        </div>
      </div>

      {/* Question cards - match real card structure (avatar, meta, title, pills, footer) */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100"
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full flex-shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-5 w-full max-w-md" />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-7 w-16 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
