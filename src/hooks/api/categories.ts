import { useQuery } from '@tanstack/react-query';

// Type matching the database schema
export interface Category {
  id: number;
  category: string;
}

// Query keys for consistent caching
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
};

// Hook to fetch all categories
export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.lists(),
    queryFn: async (): Promise<Category[]> => {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Categories don't change often, cache for 5 minutes
  });
}

