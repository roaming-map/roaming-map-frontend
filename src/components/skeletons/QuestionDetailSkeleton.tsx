'use client';

import { Skeleton } from '@/components/ui/skeleton';

/**
 * Matches QuestionDetail card layout (avatar, meta, title, categories, actions area).
 * Prevents layout shift on the question detail page while the question loads.
 */
export function QuestionDetailSkeleton() {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
      <div className="flex items-start gap-4 mb-4">
        <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-6 w-full max-w-xl" />
          <Skeleton className="h-6 w-[85%] max-w-lg" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="pt-4 border-t border-gray-200 flex gap-2">
        <Skeleton className="h-9 w-20 rounded-md" />
        <Skeleton className="h-9 w-20 rounded-md" />
      </div>
    </div>
  );
}
