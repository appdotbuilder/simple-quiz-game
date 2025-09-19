import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { quizzesTable, questionsTable, quizAttemptsTable, answerSubmissionsTable } from '../db/schema';
import { type SubmitAnswerInput } from '../schema';
import { submitAnswer } from '../handlers/submit_answer';
import { eq } from 'drizzle-orm';

describe('submitAnswer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let quizId: number;
  let questionId: number;
  let attemptId: number;

  beforeEach(async () => {
    // Create a quiz
    const quizResult = await db.insert(quizzesTable)
      .values({
        title: 'Test Quiz',
        description: 'A quiz for testing answer submission'
      })
      .returning()
      .execute();
    quizId = quizResult[0].id;

    // Create a question
    const questionResult = await db.insert(questionsTable)
      .values({
        quiz_id: quizId,
        question_text: 'What is 2 + 2?',
        correct_answer: 'B',
        option_a: '3',
        option_b: '4',
        option_c: '5',
        option_d: '6'
      })
      .returning()
      .execute();
    questionId = questionResult[0].id;

    // Create a quiz attempt
    const attemptResult = await db.insert(quizAttemptsTable)
      .values({
        quiz_id: quizId,
        score: 0,
        total_questions: 1
      })
      .returning()
      .execute();
    attemptId = attemptResult[0].id;
  });

  it('should submit a correct answer', async () => {
    const input: SubmitAnswerInput = {
      attempt_id: attemptId,
      question_id: questionId,
      selected_answer: 'B' // Correct answer
    };

    const result = await submitAnswer(input);

    // Verify return values
    expect(result.attempt_id).toEqual(attemptId);
    expect(result.question_id).toEqual(questionId);
    expect(result.selected_answer).toEqual('B');
    expect(result.is_correct).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should submit an incorrect answer', async () => {
    const input: SubmitAnswerInput = {
      attempt_id: attemptId,
      question_id: questionId,
      selected_answer: 'A' // Incorrect answer
    };

    const result = await submitAnswer(input);

    // Verify return values
    expect(result.attempt_id).toEqual(attemptId);
    expect(result.question_id).toEqual(questionId);
    expect(result.selected_answer).toEqual('A');
    expect(result.is_correct).toBe(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save answer submission to database', async () => {
    const input: SubmitAnswerInput = {
      attempt_id: attemptId,
      question_id: questionId,
      selected_answer: 'C'
    };

    const result = await submitAnswer(input);

    // Query database to verify record was saved
    const submissions = await db.select()
      .from(answerSubmissionsTable)
      .where(eq(answerSubmissionsTable.id, result.id))
      .execute();

    expect(submissions).toHaveLength(1);
    const submission = submissions[0];
    expect(submission.attempt_id).toEqual(attemptId);
    expect(submission.question_id).toEqual(questionId);
    expect(submission.selected_answer).toEqual('C');
    expect(submission.is_correct).toBe(false); // 'C' is incorrect for this question
    expect(submission.created_at).toBeInstanceOf(Date);
  });

  it('should handle all correct answer options', async () => {
    // Test each possible correct answer
    const correctAnswers = ['A', 'B', 'C', 'D'] as const;

    for (const correctAnswer of correctAnswers) {
      // Create a new question with this correct answer
      const questionResult = await db.insert(questionsTable)
        .values({
          quiz_id: quizId,
          question_text: `Test question for ${correctAnswer}`,
          correct_answer: correctAnswer,
          option_a: 'Option A',
          option_b: 'Option B',
          option_c: 'Option C',
          option_d: 'Option D'
        })
        .returning()
        .execute();

      const testQuestionId = questionResult[0].id;

      // Submit the correct answer
      const correctInput: SubmitAnswerInput = {
        attempt_id: attemptId,
        question_id: testQuestionId,
        selected_answer: correctAnswer
      };

      const correctResult = await submitAnswer(correctInput);
      expect(correctResult.is_correct).toBe(true);

      // Submit an incorrect answer
      const incorrectAnswer = correctAnswer === 'A' ? 'B' : 'A';
      const incorrectInput: SubmitAnswerInput = {
        attempt_id: attemptId,
        question_id: testQuestionId,
        selected_answer: incorrectAnswer
      };

      const incorrectResult = await submitAnswer(incorrectInput);
      expect(incorrectResult.is_correct).toBe(false);
    }
  });

  it('should throw error for non-existent question', async () => {
    const input: SubmitAnswerInput = {
      attempt_id: attemptId,
      question_id: 99999, // Non-existent question ID
      selected_answer: 'A'
    };

    await expect(submitAnswer(input)).rejects.toThrow(/Question with id 99999 not found/i);
  });

  it('should allow multiple submissions for the same attempt', async () => {
    // Create another question
    const secondQuestionResult = await db.insert(questionsTable)
      .values({
        quiz_id: quizId,
        question_text: 'What is 3 + 3?',
        correct_answer: 'A',
        option_a: '6',
        option_b: '7',
        option_c: '8',
        option_d: '9'
      })
      .returning()
      .execute();
    const secondQuestionId = secondQuestionResult[0].id;

    // Submit answers for both questions
    const firstInput: SubmitAnswerInput = {
      attempt_id: attemptId,
      question_id: questionId,
      selected_answer: 'B'
    };

    const secondInput: SubmitAnswerInput = {
      attempt_id: attemptId,
      question_id: secondQuestionId,
      selected_answer: 'A'
    };

    const firstResult = await submitAnswer(firstInput);
    const secondResult = await submitAnswer(secondInput);

    // Verify both submissions were saved
    expect(firstResult.id).toBeDefined();
    expect(secondResult.id).toBeDefined();
    expect(firstResult.id).not.toEqual(secondResult.id);

    // Verify both are in database
    const allSubmissions = await db.select()
      .from(answerSubmissionsTable)
      .where(eq(answerSubmissionsTable.attempt_id, attemptId))
      .execute();

    expect(allSubmissions).toHaveLength(2);
  });

  it('should correctly determine answer correctness across different questions', async () => {
    // Create questions with different correct answers
    const questionsData = [
      { correct: 'A', question: 'Question with A correct' },
      { correct: 'B', question: 'Question with B correct' },
      { correct: 'C', question: 'Question with C correct' },
      { correct: 'D', question: 'Question with D correct' }
    ] as const;

    for (const questionData of questionsData) {
      const questionResult = await db.insert(questionsTable)
        .values({
          quiz_id: quizId,
          question_text: questionData.question,
          correct_answer: questionData.correct,
          option_a: 'Option A',
          option_b: 'Option B',
          option_c: 'Option C',
          option_d: 'Option D'
        })
        .returning()
        .execute();

      const testQuestionId = questionResult[0].id;

      // Test submitting the correct answer
      const correctInput: SubmitAnswerInput = {
        attempt_id: attemptId,
        question_id: testQuestionId,
        selected_answer: questionData.correct
      };

      const correctResult = await submitAnswer(correctInput);
      expect(correctResult.is_correct).toBe(true);
      expect(correctResult.selected_answer).toEqual(questionData.correct);
    }
  });
});