import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateQuestionData, UpdateQuestionData } from '@/validations/questions';
import { userKeys } from './users';

// Types based on your database schema
export interface Question {
  id: number;
  title: string | null;
  question: string;
  destination: string | null;
  isUrgent: boolean;
  usefulCount?: number;
  /** True if the current user has marked this question as useful (from API when authenticated) */
  isUseful?: boolean;
  createdAt: string;
  createdBy: number | null;
  user?: {
    id: number;
    name: string | null;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  questionsToCategories?: Array<{
    id: number;
    questionId: number;
    categoryId: number;
    category: {
      id: number;
      category: string;
    };
  }>;
  answers?: Array<{
    id: number;
    content: string;
    questionId: number;
    createdBy: number | null;
    createdAt: string;
    user?: { id: number; name: string | null; firstName: string | null; lastName: string | null };
  }>;
}

export interface CreateQuestionResponse {
  message: string;
  question: Question;
}

// Query keys for consistent caching
export const questionKeys = {
  all: ['questions'] as const,
  lists: () => [...questionKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...questionKeys.lists(), { filters }] as const,
  details: () => [...questionKeys.all, 'detail'] as const,
  detail: (id: number) => [...questionKeys.details(), id] as const,
  destinations: () => [...questionKeys.all, 'destinations'] as const,
};

// Hook to fetch all questions
export function useQuestions() {
  return useQuery({
    queryKey: questionKeys.lists(),
    queryFn: async (): Promise<Question[]> => {
      const response = await fetch('/api/questions');
      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }
      return response.json();
    },
  });
}

// Hook to fetch a single question by ID
export function useQuestion(id: number) {
  return useQuery({
    queryKey: questionKeys.detail(id),
    queryFn: async (): Promise<Question> => {
      const response = await fetch(`/api/questions/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch question');
      }
      return response.json();
    },
    enabled: !!id, // Only run query if id is provided
  });
}

// Hook to create a new question
export function useCreateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateQuestionData): Promise<CreateQuestionResponse> => {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('API Error:', error);
        
        // Extract user-friendly error message from validation details
        let errorMessage = error.error || `Failed to create question (Status: ${response.status})`;
        
        if (error.details && Array.isArray(error.details) && error.details.length > 0) {
          // Show the first validation error message
          errorMessage = error.details[0].message || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all question-related queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: questionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: questionKeys.destinations() });
      
      // Invalidate stats (question count will increase)
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      
      // Note: All related data will automatically refetch and update the UI
    },
  });
}

// Hook to update a question
export function useUpdateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data
    }: {
      id: number;
      data: UpdateQuestionData
    }): Promise<Question> => {
      const response = await fetch(`/api/questions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update question');
      }

      const responseData = await response.json();
      // Return the question object from the response
      return responseData.question || responseData;
    },
    onSuccess: (updatedQuestion) => {
      // Update the specific question in cache
      queryClient.setQueryData(questionKeys.detail(updatedQuestion.id), updatedQuestion);
      
      // Invalidate all question-related queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: questionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: questionKeys.destinations() });
      
      // Note: Stats don't change on update, only on create/delete
    },
  });
}

// Hook to delete a question
export function useDeleteQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      const response = await fetch(`/api/questions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete question');
      }
    },
    onSuccess: (_, deletedId) => {
      // Remove the deleted question from cache
      queryClient.removeQueries({ queryKey: questionKeys.detail(deletedId) });
      
      // Invalidate all question-related queries to ensure UI updates immediately
      queryClient.invalidateQueries({ queryKey: questionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: questionKeys.destinations() });
      
      // Invalidate stats (question count will decrease)
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      
      // Invalidate active users (they might have only answered this deleted question)
      queryClient.invalidateQueries({ queryKey: userKeys.active() });
      
      // Note: All related data (stats, destinations, active users, question list)
      // will automatically refetch and update the UI without requiring a page refresh
    },
  });
}
// Hook to fetch popular destinations
export function usePopularDestinations() {
  return useQuery({
    queryKey: questionKeys.destinations(),
    queryFn: async (): Promise<{ destination: string; count: number }[]> => {
      const response = await fetch('/api/destinations/popular');
      if (!response.ok) {
        throw new Error('Failed to fetch popular destinations');
      }
      return response.json();
    },
  });
}
