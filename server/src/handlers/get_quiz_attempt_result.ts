import { db } from '../db';
import { quizAttemptsTable, answerSubmissionsTable } from '../db/schema';
import { type QuizAttemptResult } from '../schema';
import { eq } from 'drizzle-orm';

export async function getQuizAttemptResult(attemptId: number): Promise<QuizAttemptResult | null> {
  try {
    // First, fetch the quiz attempt
    const attempts = await db.select()
      .from(quizAttemptsTable)
      .where(eq(quizAttemptsTable.id, attemptId))
      .execute();

    if (attempts.length === 0) {
      return null;
    }

    const attempt = attempts[0];

    // Then fetch all answer submissions for this attempt
    const answerSubmissions = await db.select()
      .from(answerSubmissionsTable)
      .where(eq(answerSubmissionsTable.attempt_id, attemptId))
      .execute();

    // Return the complete quiz attempt result
    return {
      id: attempt.id,
      quiz_id: attempt.quiz_id,
      score: attempt.score,
      total_questions: attempt.total_questions,
      completed_at: attempt.completed_at,
      answers: answerSubmissions
    };
  } catch (error) {
    console.error('Failed to get quiz attempt result:', error);
    throw error;
  }
}