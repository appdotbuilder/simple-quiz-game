import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { quizzesTable, questionsTable, quizAttemptsTable, answerSubmissionsTable } from '../db/schema';
import { getQuizAttemptResult } from '../handlers/get_quiz_attempt_result';

describe('getQuizAttemptResult', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return quiz attempt result with answer submissions', async () => {
    // Create a quiz
    const quiz = await db.insert(quizzesTable)
      .values({
        title: 'Test Quiz',
        description: 'A test quiz'
      })
      .returning()
      .execute();

    const quizId = quiz[0].id;

    // Create questions
    const questions = await db.insert(questionsTable)
      .values([
        {
          quiz_id: quizId,
          question_text: 'What is 2+2?',
          correct_answer: 'A',
          option_a: '4',
          option_b: '3',
          option_c: '5',
          option_d: '6'
        },
        {
          quiz_id: quizId,
          question_text: 'What is 3+3?',
          correct_answer: 'B',
          option_a: '5',
          option_b: '6',
          option_c: '7',
          option_d: '8'
        }
      ])
      .returning()
      .execute();

    // Create quiz attempt
    const attempt = await db.insert(quizAttemptsTable)
      .values({
        quiz_id: quizId,
        score: 1,
        total_questions: 2
      })
      .returning()
      .execute();

    const attemptId = attempt[0].id;

    // Create answer submissions
    await db.insert(answerSubmissionsTable)
      .values([
        {
          attempt_id: attemptId,
          question_id: questions[0].id,
          selected_answer: 'A',
          is_correct: true
        },
        {
          attempt_id: attemptId,
          question_id: questions[1].id,
          selected_answer: 'A',
          is_correct: false
        }
      ])
      .execute();

    // Test the handler
    const result = await getQuizAttemptResult(attemptId);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(attemptId);
    expect(result!.quiz_id).toEqual(quizId);
    expect(result!.score).toEqual(1);
    expect(result!.total_questions).toEqual(2);
    expect(result!.completed_at).toBeInstanceOf(Date);
    expect(result!.answers).toHaveLength(2);

    // Check answer submissions
    const answers = result!.answers;
    expect(answers[0].attempt_id).toEqual(attemptId);
    expect(answers[0].question_id).toEqual(questions[0].id);
    expect(answers[0].selected_answer).toEqual('A');
    expect(answers[0].is_correct).toEqual(true);
    expect(answers[0].created_at).toBeInstanceOf(Date);

    expect(answers[1].attempt_id).toEqual(attemptId);
    expect(answers[1].question_id).toEqual(questions[1].id);
    expect(answers[1].selected_answer).toEqual('A');
    expect(answers[1].is_correct).toEqual(false);
    expect(answers[1].created_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent attempt', async () => {
    const result = await getQuizAttemptResult(999);
    expect(result).toBeNull();
  });

  it('should return attempt with empty answers array if no submissions exist', async () => {
    // Create a quiz
    const quiz = await db.insert(quizzesTable)
      .values({
        title: 'Test Quiz',
        description: 'A test quiz'
      })
      .returning()
      .execute();

    const quizId = quiz[0].id;

    // Create quiz attempt without any answer submissions
    const attempt = await db.insert(quizAttemptsTable)
      .values({
        quiz_id: quizId,
        score: 0,
        total_questions: 0
      })
      .returning()
      .execute();

    const attemptId = attempt[0].id;

    // Test the handler
    const result = await getQuizAttemptResult(attemptId);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(attemptId);
    expect(result!.quiz_id).toEqual(quizId);
    expect(result!.score).toEqual(0);
    expect(result!.total_questions).toEqual(0);
    expect(result!.completed_at).toBeInstanceOf(Date);
    expect(result!.answers).toHaveLength(0);
  });

  it('should handle perfect score attempt', async () => {
    // Create a quiz
    const quiz = await db.insert(quizzesTable)
      .values({
        title: 'Perfect Quiz',
        description: 'All correct answers'
      })
      .returning()
      .execute();

    const quizId = quiz[0].id;

    // Create questions
    const questions = await db.insert(questionsTable)
      .values([
        {
          quiz_id: quizId,
          question_text: 'Easy question 1',
          correct_answer: 'A',
          option_a: 'Correct',
          option_b: 'Wrong',
          option_c: 'Wrong',
          option_d: 'Wrong'
        },
        {
          quiz_id: quizId,
          question_text: 'Easy question 2',
          correct_answer: 'B',
          option_a: 'Wrong',
          option_b: 'Correct',
          option_c: 'Wrong',
          option_d: 'Wrong'
        }
      ])
      .returning()
      .execute();

    // Create perfect score attempt
    const attempt = await db.insert(quizAttemptsTable)
      .values({
        quiz_id: quizId,
        score: 2,
        total_questions: 2
      })
      .returning()
      .execute();

    const attemptId = attempt[0].id;

    // Create all correct answer submissions
    await db.insert(answerSubmissionsTable)
      .values([
        {
          attempt_id: attemptId,
          question_id: questions[0].id,
          selected_answer: 'A',
          is_correct: true
        },
        {
          attempt_id: attemptId,
          question_id: questions[1].id,
          selected_answer: 'B',
          is_correct: true
        }
      ])
      .execute();

    // Test the handler
    const result = await getQuizAttemptResult(attemptId);

    expect(result).toBeDefined();
    expect(result!.score).toEqual(2);
    expect(result!.total_questions).toEqual(2);
    expect(result!.answers).toHaveLength(2);
    expect(result!.answers.every(answer => answer.is_correct)).toBe(true);
  });
});