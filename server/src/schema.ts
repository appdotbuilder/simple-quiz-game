import { z } from 'zod';

// Quiz schema
export const quizSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Quiz = z.infer<typeof quizSchema>;

// Question schema
export const questionSchema = z.object({
  id: z.number(),
  quiz_id: z.number(),
  question_text: z.string(),
  correct_answer: z.string(),
  option_a: z.string(),
  option_b: z.string(),
  option_c: z.string(),
  option_d: z.string(),
  created_at: z.coerce.date()
});

export type Question = z.infer<typeof questionSchema>;

// Quiz attempt schema
export const quizAttemptSchema = z.object({
  id: z.number(),
  quiz_id: z.number(),
  score: z.number().int(),
  total_questions: z.number().int(),
  completed_at: z.coerce.date()
});

export type QuizAttempt = z.infer<typeof quizAttemptSchema>;

// Answer submission schema
export const answerSubmissionSchema = z.object({
  id: z.number(),
  attempt_id: z.number(),
  question_id: z.number(),
  selected_answer: z.string(),
  is_correct: z.boolean(),
  created_at: z.coerce.date()
});

export type AnswerSubmission = z.infer<typeof answerSubmissionSchema>;

// Input schema for creating a quiz
export const createQuizInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().nullable()
});

export type CreateQuizInput = z.infer<typeof createQuizInputSchema>;

// Input schema for creating a question
export const createQuestionInputSchema = z.object({
  quiz_id: z.number(),
  question_text: z.string().min(1, "Question text is required"),
  correct_answer: z.enum(['A', 'B', 'C', 'D']),
  option_a: z.string().min(1, "Option A is required"),
  option_b: z.string().min(1, "Option B is required"),
  option_c: z.string().min(1, "Option C is required"),
  option_d: z.string().min(1, "Option D is required")
});

export type CreateQuestionInput = z.infer<typeof createQuestionInputSchema>;

// Input schema for starting a quiz attempt
export const startQuizAttemptInputSchema = z.object({
  quiz_id: z.number()
});

export type StartQuizAttemptInput = z.infer<typeof startQuizAttemptInputSchema>;

// Input schema for submitting an answer
export const submitAnswerInputSchema = z.object({
  attempt_id: z.number(),
  question_id: z.number(),
  selected_answer: z.enum(['A', 'B', 'C', 'D'])
});

export type SubmitAnswerInput = z.infer<typeof submitAnswerInputSchema>;

// Input schema for completing a quiz attempt
export const completeQuizAttemptInputSchema = z.object({
  attempt_id: z.number()
});

export type CompleteQuizAttemptInput = z.infer<typeof completeQuizAttemptInputSchema>;

// Quiz with questions schema for full quiz data
export const quizWithQuestionsSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  questions: z.array(questionSchema)
});

export type QuizWithQuestions = z.infer<typeof quizWithQuestionsSchema>;

// Quiz attempt result schema
export const quizAttemptResultSchema = z.object({
  id: z.number(),
  quiz_id: z.number(),
  score: z.number().int(),
  total_questions: z.number().int(),
  completed_at: z.coerce.date(),
  answers: z.array(answerSubmissionSchema)
});

export type QuizAttemptResult = z.infer<typeof quizAttemptResultSchema>;