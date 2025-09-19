import { db } from '../db';
import { quizzesTable, questionsTable, quizAttemptsTable } from '../db/schema';
import { type StartQuizAttemptInput, type QuizAttempt } from '../schema';
import { eq, count } from 'drizzle-orm';

export const startQuizAttempt = async (input: StartQuizAttemptInput): Promise<QuizAttempt> => {
  try {
    // First verify the quiz exists
    const quiz = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, input.quiz_id))
      .execute();

    if (quiz.length === 0) {
      throw new Error(`Quiz with ID ${input.quiz_id} not found`);
    }

    // Count the number of questions for this quiz
    const questionCountResult = await db.select({ count: count() })
      .from(questionsTable)
      .where(eq(questionsTable.quiz_id, input.quiz_id))
      .execute();

    const totalQuestions = questionCountResult[0]?.count || 0;

    // Create the quiz attempt record
    const result = await db.insert(quizAttemptsTable)
      .values({
        quiz_id: input.quiz_id,
        score: 0, // Initial score
        total_questions: totalQuestions
        // completed_at will be set by the database default (now)
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Quiz attempt creation failed:', error);
    throw error;
  }
};