import { serial, text, pgTable, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Quizzes table
export const quizzesTable = pgTable('quizzes', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Questions table
export const questionsTable = pgTable('questions', {
  id: serial('id').primaryKey(),
  quiz_id: integer('quiz_id').notNull(),
  question_text: text('question_text').notNull(),
  correct_answer: text('correct_answer').notNull(), // 'A', 'B', 'C', or 'D'
  option_a: text('option_a').notNull(),
  option_b: text('option_b').notNull(),
  option_c: text('option_c').notNull(),
  option_d: text('option_d').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Quiz attempts table
export const quizAttemptsTable = pgTable('quiz_attempts', {
  id: serial('id').primaryKey(),
  quiz_id: integer('quiz_id').notNull(),
  score: integer('score').notNull().default(0),
  total_questions: integer('total_questions').notNull().default(0),
  completed_at: timestamp('completed_at').defaultNow().notNull(),
});

// Answer submissions table
export const answerSubmissionsTable = pgTable('answer_submissions', {
  id: serial('id').primaryKey(),
  attempt_id: integer('attempt_id').notNull(),
  question_id: integer('question_id').notNull(),
  selected_answer: text('selected_answer').notNull(), // 'A', 'B', 'C', or 'D'
  is_correct: boolean('is_correct').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Define relations
export const quizzesRelations = relations(quizzesTable, ({ many }) => ({
  questions: many(questionsTable),
  attempts: many(quizAttemptsTable),
}));

export const questionsRelations = relations(questionsTable, ({ one, many }) => ({
  quiz: one(quizzesTable, {
    fields: [questionsTable.quiz_id],
    references: [quizzesTable.id],
  }),
  answerSubmissions: many(answerSubmissionsTable),
}));

export const quizAttemptsRelations = relations(quizAttemptsTable, ({ one, many }) => ({
  quiz: one(quizzesTable, {
    fields: [quizAttemptsTable.quiz_id],
    references: [quizzesTable.id],
  }),
  answerSubmissions: many(answerSubmissionsTable),
}));

export const answerSubmissionsRelations = relations(answerSubmissionsTable, ({ one }) => ({
  attempt: one(quizAttemptsTable, {
    fields: [answerSubmissionsTable.attempt_id],
    references: [quizAttemptsTable.id],
  }),
  question: one(questionsTable, {
    fields: [answerSubmissionsTable.question_id],
    references: [questionsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Quiz = typeof quizzesTable.$inferSelect;
export type NewQuiz = typeof quizzesTable.$inferInsert;

export type Question = typeof questionsTable.$inferSelect;
export type NewQuestion = typeof questionsTable.$inferInsert;

export type QuizAttempt = typeof quizAttemptsTable.$inferSelect;
export type NewQuizAttempt = typeof quizAttemptsTable.$inferInsert;

export type AnswerSubmission = typeof answerSubmissionsTable.$inferSelect;
export type NewAnswerSubmission = typeof answerSubmissionsTable.$inferInsert;

// Export all tables for proper query building
export const tables = {
  quizzes: quizzesTable,
  questions: questionsTable,
  quizAttempts: quizAttemptsTable,
  answerSubmissions: answerSubmissionsTable,
};