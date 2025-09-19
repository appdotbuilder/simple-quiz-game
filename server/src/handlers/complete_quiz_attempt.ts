import { db } from '../db';
import { quizAttemptsTable, answerSubmissionsTable, questionsTable } from '../db/schema';
import { type CompleteQuizAttemptInput, type QuizAttemptResult } from '../schema';
import { eq, count } from 'drizzle-orm';

export async function completeQuizAttempt(input: CompleteQuizAttemptInput): Promise<QuizAttemptResult> {
  try {
    // First, fetch the quiz attempt to get quiz_id and verify it exists
    const attempts = await db.select()
      .from(quizAttemptsTable)
      .where(eq(quizAttemptsTable.id, input.attempt_id))
      .execute();

    if (attempts.length === 0) {
      throw new Error(`Quiz attempt with ID ${input.attempt_id} not found`);
    }

    const attempt = attempts[0];

    // Get all answer submissions for this attempt
    const answerSubmissions = await db.select()
      .from(answerSubmissionsTable)
      .where(eq(answerSubmissionsTable.attempt_id, input.attempt_id))
      .execute();

    // Calculate score from correct answers
    const score = answerSubmissions.filter(answer => answer.is_correct).length;

    // Get total number of questions in the quiz
    const totalQuestionsResult = await db.select({ count: count() })
      .from(questionsTable)
      .where(eq(questionsTable.quiz_id, attempt.quiz_id))
      .execute();

    const totalQuestions = totalQuestionsResult[0]?.count || 0;

    // Update the quiz attempt with final score and total questions
    const updatedAttempts = await db.update(quizAttemptsTable)
      .set({
        score: score,
        total_questions: totalQuestions,
        completed_at: new Date()
      })
      .where(eq(quizAttemptsTable.id, input.attempt_id))
      .returning()
      .execute();

    const updatedAttempt = updatedAttempts[0];

    // Return the complete quiz attempt result
    return {
      id: updatedAttempt.id,
      quiz_id: updatedAttempt.quiz_id,
      score: updatedAttempt.score,
      total_questions: updatedAttempt.total_questions,
      completed_at: updatedAttempt.completed_at,
      answers: answerSubmissions.map(answer => ({
        id: answer.id,
        attempt_id: answer.attempt_id,
        question_id: answer.question_id,
        selected_answer: answer.selected_answer,
        is_correct: answer.is_correct,
        created_at: answer.created_at
      }))
    };
  } catch (error) {
    console.error('Complete quiz attempt failed:', error);
    throw error;
  }
}