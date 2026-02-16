import { cn } from '@/lib/utils';

/**
 * Minimal skeleton primitive for loading states.
 * CSS-only (animate-pulse); no layout shift when replaced by content.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-gray-200', className)}
      aria-hidden
      {...props}
    />
  );
}

export { Skeleton };
