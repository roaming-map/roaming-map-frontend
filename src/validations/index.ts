// Main validation exports - organized by domain
export * from './questions';
export * from './users';
export * from './answers';

// Re-export commonly used schemas for convenience
export { 
  createQuestionSchema, 
  updateQuestionSchema, 
  questionIdSchema,
  questionQuerySchema 
} from './questions';

export { 
  userIdSchema,
  userPreferencesSchema 
} from './users';

export { 
  createAnswerSchema,
  updateAnswerSchema,
  answerIdSchema,
  markHelpfulSchema
} from './answers';
