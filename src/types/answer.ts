/**
 * Shared type for answer data from the API (question detail answers list).
 * Used by the question detail page and AnswersList to avoid duplication.
 */
export interface Answer {
  id: number;
  content: string;
  questionId: number;
  parentId?: number | null;
  createdBy: number | null;
  createdAt: string;
  isHelpful?: boolean;
  helpfulCount?: number;
  user?: {
    id: number;
    firstName: string | null;
    lastName: string | null;
  };
}
