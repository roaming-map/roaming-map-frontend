import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateQuestionData, UpdateQuestionData } from '@/validations/questions';

// Types based on your database schema
export interface Question {
  id: number;
  question: string;
  isUrgent: boolean;
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
      name: string;
    };
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
        throw new Error(error.error || `Failed to create question (Status: ${response.status})`);
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch questions list
      queryClient.invalidateQueries({ queryKey: questionKeys.lists() });
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

      return response.json();
    },
    onSuccess: (updatedQuestion) => {
      // Update the specific question in cache
      queryClient.setQueryData(questionKeys.detail(updatedQuestion.id), updatedQuestion);
      // Invalidate questions list to refetch
      queryClient.invalidateQueries({ queryKey: questionKeys.lists() });
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
      // Remove the question from cache
      queryClient.removeQueries({ queryKey: questionKeys.detail(deletedId) });
      // Invalidate questions list to refetch
      queryClient.invalidateQueries({ queryKey: questionKeys.lists() });
    },
  });
}
