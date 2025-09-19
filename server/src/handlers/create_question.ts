import { db } from '../db';
import { questionsTable, quizzesTable } from '../db/schema';
import { type CreateQuestionInput, type Question } from '../schema';
import { eq } from 'drizzle-orm';

export const createQuestion = async (input: CreateQuestionInput): Promise<Question> => {
  try {
    // First verify that the quiz exists
    const existingQuiz = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, input.quiz_id))
      .execute();

    if (existingQuiz.length === 0) {
      throw new Error(`Quiz with id ${input.quiz_id} not found`);
    }

    // Insert question record
    const result = await db.insert(questionsTable)
      .values({
        quiz_id: input.quiz_id,
        question_text: input.question_text,
        correct_answer: input.correct_answer,
        option_a: input.option_a,
        option_b: input.option_b,
        option_c: input.option_c,
        option_d: input.option_d
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Question creation failed:', error);
    throw error;
  }
};