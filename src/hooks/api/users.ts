import { useQuery } from '@tanstack/react-query';

// Types based on your database schema
export interface User {
  id: number;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

// Query keys for consistent caching
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: number) => [...userKeys.details(), id] as const,
};

// Hook to fetch all users
export function useUsers() {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: async (): Promise<User[]> => {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      return response.json();
    },
  });
}

// Hook to fetch a single user by ID
export function useUser(id: number) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: async (): Promise<User> => {
      const response = await fetch(`/api/users/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      return response.json();
    },
    enabled: !!id, // Only run query if id is provided
  });
}
