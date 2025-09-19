import { db } from '../db';
import { quizzesTable, questionsTable } from '../db/schema';
import { type QuizWithQuestions } from '../schema';
import { eq } from 'drizzle-orm';

export async function getQuizWithQuestions(quizId: number): Promise<QuizWithQuestions | null> {
  try {
    // First, get the quiz
    const quizResult = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, quizId))
      .execute();

    if (quizResult.length === 0) {
      return null;
    }

    const quiz = quizResult[0];

    // Then get all questions for this quiz
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.quiz_id, quizId))
      .execute();

    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      created_at: quiz.created_at,
      questions: questions
    };
  } catch (error) {
    console.error('Failed to get quiz with questions:', error);
    throw error;
  }
}