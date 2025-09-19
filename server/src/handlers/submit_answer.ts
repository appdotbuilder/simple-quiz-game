import { db } from '../db';
import { answerSubmissionsTable, questionsTable } from '../db/schema';
import { type SubmitAnswerInput, type AnswerSubmission } from '../schema';
import { eq } from 'drizzle-orm';

export async function submitAnswer(input: SubmitAnswerInput): Promise<AnswerSubmission> {
  try {
    // First, get the question to determine the correct answer
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, input.question_id))
      .execute();

    if (questions.length === 0) {
      throw new Error(`Question with id ${input.question_id} not found`);
    }

    const question = questions[0];
    const isCorrect = input.selected_answer === question.correct_answer;

    // Insert the answer submission
    const result = await db.insert(answerSubmissionsTable)
      .values({
        attempt_id: input.attempt_id,
        question_id: input.question_id,
        selected_answer: input.selected_answer,
        is_correct: isCorrect
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Answer submission failed:', error);
    throw error;
  }
}