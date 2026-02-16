'use client';

import { Skeleton } from '@/components/ui/skeleton';

/**
 * Matches AnswersList layout (heading + answer cards) to avoid CLS.
 * Used while answers are loading on the question detail page.
 */
export function AnswersListSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <Skeleton className="h-6 w-24 mb-4" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-[75%] mb-3" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
