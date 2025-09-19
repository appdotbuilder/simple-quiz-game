import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { quizzesTable, questionsTable, quizAttemptsTable, answerSubmissionsTable } from '../db/schema';
import { type CompleteQuizAttemptInput } from '../schema';
import { completeQuizAttempt } from '../handlers/complete_quiz_attempt';
import { eq } from 'drizzle-orm';

describe('completeQuizAttempt', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should complete a quiz attempt with correct score calculation', async () => {
    // Create a quiz
    const quizResult = await db.insert(quizzesTable)
      .values({
        title: 'Test Quiz',
        description: 'A test quiz'
      })
      .returning()
      .execute();
    const quiz = quizResult[0];

    // Create questions
    const questionsResult = await db.insert(questionsTable)
      .values([
        {
          quiz_id: quiz.id,
          question_text: 'What is 2+2?',
          correct_answer: 'A',
          option_a: '4',
          option_b: '3',
          option_c: '5',
          option_d: '6'
        },
        {
          quiz_id: quiz.id,
          question_text: 'What is 3+3?',
          correct_answer: 'B',
          option_a: '5',
          option_b: '6',
          option_c: '7',
          option_d: '8'
        },
        {
          quiz_id: quiz.id,
          question_text: 'What is 4+4?',
          correct_answer: 'C',
          option_a: '7',
          option_b: '6',
          option_c: '8',
          option_d: '9'
        }
      ])
      .returning()
      .execute();

    // Create a quiz attempt
    const attemptResult = await db.insert(quizAttemptsTable)
      .values({
        quiz_id: quiz.id
      })
      .returning()
      .execute();
    const attempt = attemptResult[0];

    // Create answer submissions (2 correct, 1 incorrect)
    await db.insert(answerSubmissionsTable)
      .values([
        {
          attempt_id: attempt.id,
          question_id: questionsResult[0].id,
          selected_answer: 'A', // Correct
          is_correct: true
        },
        {
          attempt_id: attempt.id,
          question_id: questionsResult[1].id,
          selected_answer: 'B', // Correct
          is_correct: true
        },
        {
          attempt_id: attempt.id,
          question_id: questionsResult[2].id,
          selected_answer: 'A', // Incorrect (should be C)
          is_correct: false
        }
      ])
      .execute();

    const input: CompleteQuizAttemptInput = {
      attempt_id: attempt.id
    };

    const result = await completeQuizAttempt(input);

    // Verify the result
    expect(result.id).toEqual(attempt.id);
    expect(result.quiz_id).toEqual(quiz.id);
    expect(result.score).toEqual(2); // 2 correct answers
    expect(result.total_questions).toEqual(3); // 3 total questions
    expect(result.completed_at).toBeInstanceOf(Date);
    expect(result.answers).toHaveLength(3);

    // Verify answer submissions are included
    expect(result.answers[0].selected_answer).toEqual('A');
    expect(result.answers[0].is_correct).toBe(true);
    expect(result.answers[1].selected_answer).toEqual('B');
    expect(result.answers[1].is_correct).toBe(true);
    expect(result.answers[2].selected_answer).toEqual('A');
    expect(result.answers[2].is_correct).toBe(false);
  });

  it('should update the quiz attempt record in database', async () => {
    // Create a quiz
    const quizResult = await db.insert(quizzesTable)
      .values({
        title: 'Test Quiz',
        description: 'A test quiz'
      })
      .returning()
      .execute();
    const quiz = quizResult[0];

    // Create one question
    const questionsResult = await db.insert(questionsTable)
      .values({
        quiz_id: quiz.id,
        question_text: 'What is 2+2?',
        correct_answer: 'A',
        option_a: '4',
        option_b: '3',
        option_c: '5',
        option_d: '6'
      })
      .returning()
      .execute();

    // Create a quiz attempt
    const attemptResult = await db.insert(quizAttemptsTable)
      .values({
        quiz_id: quiz.id
      })
      .returning()
      .execute();
    const attempt = attemptResult[0];

    // Create one correct answer submission
    await db.insert(answerSubmissionsTable)
      .values({
        attempt_id: attempt.id,
        question_id: questionsResult[0].id,
        selected_answer: 'A',
        is_correct: true
      })
      .execute();

    const input: CompleteQuizAttemptInput = {
      attempt_id: attempt.id
    };

    await completeQuizAttempt(input);

    // Verify the database record was updated
    const updatedAttempts = await db.select()
      .from(quizAttemptsTable)
      .where(eq(quizAttemptsTable.id, attempt.id))
      .execute();

    const updatedAttempt = updatedAttempts[0];
    expect(updatedAttempt.score).toEqual(1);
    expect(updatedAttempt.total_questions).toEqual(1);
    expect(updatedAttempt.completed_at).toBeInstanceOf(Date);
  });

  it('should handle quiz attempt with perfect score', async () => {
    // Create a quiz
    const quizResult = await db.insert(quizzesTable)
      .values({
        title: 'Perfect Quiz',
        description: 'All answers correct'
      })
      .returning()
      .execute();
    const quiz = quizResult[0];

    // Create questions
    const questionsResult = await db.insert(questionsTable)
      .values([
        {
          quiz_id: quiz.id,
          question_text: 'Question 1',
          correct_answer: 'A',
          option_a: 'Correct',
          option_b: 'Wrong',
          option_c: 'Wrong',
          option_d: 'Wrong'
        },
        {
          quiz_id: quiz.id,
          question_text: 'Question 2',
          correct_answer: 'B',
          option_a: 'Wrong',
          option_b: 'Correct',
          option_c: 'Wrong',
          option_d: 'Wrong'
        }
      ])
      .returning()
      .execute();

    // Create a quiz attempt
    const attemptResult = await db.insert(quizAttemptsTable)
      .values({
        quiz_id: quiz.id
      })
      .returning()
      .execute();
    const attempt = attemptResult[0];

    // Create all correct answer submissions
    await db.insert(answerSubmissionsTable)
      .values([
        {
          attempt_id: attempt.id,
          question_id: questionsResult[0].id,
          selected_answer: 'A',
          is_correct: true
        },
        {
          attempt_id: attempt.id,
          question_id: questionsResult[1].id,
          selected_answer: 'B',
          is_correct: true
        }
      ])
      .execute();

    const input: CompleteQuizAttemptInput = {
      attempt_id: attempt.id
    };

    const result = await completeQuizAttempt(input);

    expect(result.score).toEqual(2);
    expect(result.total_questions).toEqual(2);
    expect(result.answers.every(answer => answer.is_correct)).toBe(true);
  });

  it('should handle quiz attempt with zero score', async () => {
    // Create a quiz
    const quizResult = await db.insert(quizzesTable)
      .values({
        title: 'Failed Quiz',
        description: 'All answers wrong'
      })
      .returning()
      .execute();
    const quiz = quizResult[0];

    // Create one question
    const questionsResult = await db.insert(questionsTable)
      .values({
        quiz_id: quiz.id,
        question_text: 'Question 1',
        correct_answer: 'A',
        option_a: 'Correct',
        option_b: 'Wrong',
        option_c: 'Wrong',
        option_d: 'Wrong'
      })
      .returning()
      .execute();

    // Create a quiz attempt
    const attemptResult = await db.insert(quizAttemptsTable)
      .values({
        quiz_id: quiz.id
      })
      .returning()
      .execute();
    const attempt = attemptResult[0];

    // Create incorrect answer submission
    await db.insert(answerSubmissionsTable)
      .values({
        attempt_id: attempt.id,
        question_id: questionsResult[0].id,
        selected_answer: 'B', // Wrong answer
        is_correct: false
      })
      .execute();

    const input: CompleteQuizAttemptInput = {
      attempt_id: attempt.id
    };

    const result = await completeQuizAttempt(input);

    expect(result.score).toEqual(0);
    expect(result.total_questions).toEqual(1);
    expect(result.answers[0].is_correct).toBe(false);
  });

  it('should handle quiz attempt with no answer submissions', async () => {
    // Create a quiz
    const quizResult = await db.insert(quizzesTable)
      .values({
        title: 'Empty Quiz',
        description: 'No answers submitted'
      })
      .returning()
      .execute();
    const quiz = quizResult[0];

    // Create one question
    await db.insert(questionsTable)
      .values({
        quiz_id: quiz.id,
        question_text: 'Question 1',
        correct_answer: 'A',
        option_a: 'Correct',
        option_b: 'Wrong',
        option_c: 'Wrong',
        option_d: 'Wrong'
      })
      .execute();

    // Create a quiz attempt
    const attemptResult = await db.insert(quizAttemptsTable)
      .values({
        quiz_id: quiz.id
      })
      .returning()
      .execute();
    const attempt = attemptResult[0];

    // No answer submissions created

    const input: CompleteQuizAttemptInput = {
      attempt_id: attempt.id
    };

    const result = await completeQuizAttempt(input);

    expect(result.score).toEqual(0);
    expect(result.total_questions).toEqual(1);
    expect(result.answers).toHaveLength(0);
  });

  it('should throw error for non-existent attempt', async () => {
    const input: CompleteQuizAttemptInput = {
      attempt_id: 999999
    };

    await expect(completeQuizAttempt(input)).rejects.toThrow(/not found/i);
  });
});