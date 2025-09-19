import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { quizzesTable, questionsTable, quizAttemptsTable } from '../db/schema';
import { type StartQuizAttemptInput } from '../schema';
import { startQuizAttempt } from '../handlers/start_quiz_attempt';
import { eq } from 'drizzle-orm';

describe('startQuizAttempt', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a quiz attempt with correct question count', async () => {
    // Create a test quiz
    const quizResult = await db.insert(quizzesTable)
      .values({
        title: 'Test Quiz',
        description: 'A test quiz'
      })
      .returning()
      .execute();

    const quiz = quizResult[0];

    // Create test questions for the quiz
    await db.insert(questionsTable)
      .values([
        {
          quiz_id: quiz.id,
          question_text: 'Question 1?',
          correct_answer: 'A',
          option_a: 'Correct Answer',
          option_b: 'Wrong Answer 1',
          option_c: 'Wrong Answer 2',
          option_d: 'Wrong Answer 3'
        },
        {
          quiz_id: quiz.id,
          question_text: 'Question 2?',
          correct_answer: 'B',
          option_a: 'Wrong Answer 1',
          option_b: 'Correct Answer',
          option_c: 'Wrong Answer 2',
          option_d: 'Wrong Answer 3'
        },
        {
          quiz_id: quiz.id,
          question_text: 'Question 3?',
          correct_answer: 'C',
          option_a: 'Wrong Answer 1',
          option_b: 'Wrong Answer 2',
          option_c: 'Correct Answer',
          option_d: 'Wrong Answer 3'
        }
      ])
      .execute();

    const testInput: StartQuizAttemptInput = {
      quiz_id: quiz.id
    };

    const result = await startQuizAttempt(testInput);

    // Validate the basic fields
    expect(result.id).toBeDefined();
    expect(result.quiz_id).toEqual(quiz.id);
    expect(result.score).toEqual(0);
    expect(result.total_questions).toEqual(3);
    expect(result.completed_at).toBeInstanceOf(Date);
  });

  it('should save quiz attempt to database', async () => {
    // Create a test quiz
    const quizResult = await db.insert(quizzesTable)
      .values({
        title: 'Database Test Quiz',
        description: 'Testing database persistence'
      })
      .returning()
      .execute();

    const quiz = quizResult[0];

    // Create one question
    await db.insert(questionsTable)
      .values({
        quiz_id: quiz.id,
        question_text: 'Single question?',
        correct_answer: 'A',
        option_a: 'Answer A',
        option_b: 'Answer B',
        option_c: 'Answer C',
        option_d: 'Answer D'
      })
      .execute();

    const testInput: StartQuizAttemptInput = {
      quiz_id: quiz.id
    };

    const result = await startQuizAttempt(testInput);

    // Query the database to verify the record was saved
    const attempts = await db.select()
      .from(quizAttemptsTable)
      .where(eq(quizAttemptsTable.id, result.id))
      .execute();

    expect(attempts).toHaveLength(1);
    expect(attempts[0].quiz_id).toEqual(quiz.id);
    expect(attempts[0].score).toEqual(0);
    expect(attempts[0].total_questions).toEqual(1);
    expect(attempts[0].completed_at).toBeInstanceOf(Date);
  });

  it('should handle quiz with no questions', async () => {
    // Create a quiz without any questions
    const quizResult = await db.insert(quizzesTable)
      .values({
        title: 'Empty Quiz',
        description: 'Quiz with no questions'
      })
      .returning()
      .execute();

    const quiz = quizResult[0];

    const testInput: StartQuizAttemptInput = {
      quiz_id: quiz.id
    };

    const result = await startQuizAttempt(testInput);

    expect(result.quiz_id).toEqual(quiz.id);
    expect(result.score).toEqual(0);
    expect(result.total_questions).toEqual(0);
    expect(result.completed_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent quiz', async () => {
    const testInput: StartQuizAttemptInput = {
      quiz_id: 99999 // Non-existent quiz ID
    };

    await expect(startQuizAttempt(testInput)).rejects.toThrow(/Quiz with ID 99999 not found/i);
  });

  it('should create multiple attempts for same quiz', async () => {
    // Create a test quiz
    const quizResult = await db.insert(quizzesTable)
      .values({
        title: 'Multi-Attempt Quiz',
        description: 'Quiz that allows multiple attempts'
      })
      .returning()
      .execute();

    const quiz = quizResult[0];

    // Create two questions
    await db.insert(questionsTable)
      .values([
        {
          quiz_id: quiz.id,
          question_text: 'Question 1?',
          correct_answer: 'A',
          option_a: 'Answer A',
          option_b: 'Answer B',
          option_c: 'Answer C',
          option_d: 'Answer D'
        },
        {
          quiz_id: quiz.id,
          question_text: 'Question 2?',
          correct_answer: 'B',
          option_a: 'Answer A',
          option_b: 'Answer B',
          option_c: 'Answer C',
          option_d: 'Answer D'
        }
      ])
      .execute();

    const testInput: StartQuizAttemptInput = {
      quiz_id: quiz.id
    };

    // Create first attempt
    const firstAttempt = await startQuizAttempt(testInput);
    
    // Create second attempt
    const secondAttempt = await startQuizAttempt(testInput);

    // Both attempts should be valid but have different IDs
    expect(firstAttempt.id).not.toEqual(secondAttempt.id);
    expect(firstAttempt.quiz_id).toEqual(quiz.id);
    expect(secondAttempt.quiz_id).toEqual(quiz.id);
    expect(firstAttempt.total_questions).toEqual(2);
    expect(secondAttempt.total_questions).toEqual(2);

    // Verify both are saved in database
    const allAttempts = await db.select()
      .from(quizAttemptsTable)
      .where(eq(quizAttemptsTable.quiz_id, quiz.id))
      .execute();

    expect(allAttempts).toHaveLength(2);
  });
});