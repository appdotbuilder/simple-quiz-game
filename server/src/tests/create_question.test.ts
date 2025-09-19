import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { questionsTable, quizzesTable } from '../db/schema';
import { type CreateQuestionInput } from '../schema';
import { createQuestion } from '../handlers/create_question';
import { eq } from 'drizzle-orm';

describe('createQuestion', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testQuizId: number;

  beforeEach(async () => {
    // Create a test quiz first for foreign key constraint
    const quiz = await db.insert(quizzesTable)
      .values({
        title: 'Test Quiz',
        description: 'A quiz for testing questions'
      })
      .returning()
      .execute();
    
    testQuizId = quiz[0].id;
  });

  const testInput: CreateQuestionInput = {
    quiz_id: 0, // Will be set to testQuizId in tests
    question_text: 'What is the capital of France?',
    correct_answer: 'A',
    option_a: 'Paris',
    option_b: 'London',
    option_c: 'Berlin',
    option_d: 'Madrid'
  };

  it('should create a question', async () => {
    const input = { ...testInput, quiz_id: testQuizId };
    const result = await createQuestion(input);

    // Basic field validation
    expect(result.quiz_id).toEqual(testQuizId);
    expect(result.question_text).toEqual('What is the capital of France?');
    expect(result.correct_answer).toEqual('A');
    expect(result.option_a).toEqual('Paris');
    expect(result.option_b).toEqual('London');
    expect(result.option_c).toEqual('Berlin');
    expect(result.option_d).toEqual('Madrid');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save question to database', async () => {
    const input = { ...testInput, quiz_id: testQuizId };
    const result = await createQuestion(input);

    // Query using proper drizzle syntax
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, result.id))
      .execute();

    expect(questions).toHaveLength(1);
    expect(questions[0].quiz_id).toEqual(testQuizId);
    expect(questions[0].question_text).toEqual('What is the capital of France?');
    expect(questions[0].correct_answer).toEqual('A');
    expect(questions[0].option_a).toEqual('Paris');
    expect(questions[0].option_b).toEqual('London');
    expect(questions[0].option_c).toEqual('Berlin');
    expect(questions[0].option_d).toEqual('Madrid');
    expect(questions[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple questions for the same quiz', async () => {
    const input1 = { ...testInput, quiz_id: testQuizId };
    const input2 = {
      ...testInput,
      quiz_id: testQuizId,
      question_text: 'What is 2 + 2?',
      correct_answer: 'B' as const,
      option_a: '3',
      option_b: '4',
      option_c: '5',
      option_d: '6'
    };

    const result1 = await createQuestion(input1);
    const result2 = await createQuestion(input2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.quiz_id).toEqual(testQuizId);
    expect(result2.quiz_id).toEqual(testQuizId);

    // Verify both questions exist in database
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.quiz_id, testQuizId))
      .execute();

    expect(questions).toHaveLength(2);
    const questionTexts = questions.map(q => q.question_text);
    expect(questionTexts).toContain('What is the capital of France?');
    expect(questionTexts).toContain('What is 2 + 2?');
  });

  it('should handle different correct answer options', async () => {
    const answerOptions: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
    
    for (const correctAnswer of answerOptions) {
      const input = {
        ...testInput,
        quiz_id: testQuizId,
        question_text: `Test question with correct answer ${correctAnswer}`,
        correct_answer: correctAnswer
      };

      const result = await createQuestion(input);
      expect(result.correct_answer).toEqual(correctAnswer);
    }

    // Verify all questions were created
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.quiz_id, testQuizId))
      .execute();

    expect(questions).toHaveLength(4);
    const correctAnswers = questions.map(q => q.correct_answer).sort();
    expect(correctAnswers).toEqual(['A', 'B', 'C', 'D']);
  });

  it('should throw error when quiz does not exist', async () => {
    const nonExistentQuizId = 99999;
    const input = { ...testInput, quiz_id: nonExistentQuizId };

    await expect(createQuestion(input)).rejects.toThrow(/quiz with id .* not found/i);
  });

  it('should create question with all required options', async () => {
    const input = { ...testInput, quiz_id: testQuizId };
    const result = await createQuestion(input);

    // Verify all options are properly stored
    expect(result.option_a).toBeDefined();
    expect(result.option_b).toBeDefined();
    expect(result.option_c).toBeDefined();
    expect(result.option_d).toBeDefined();
    
    expect(result.option_a).toHaveLength(5); // 'Paris'
    expect(result.option_b).toHaveLength(6); // 'London'
    expect(result.option_c).toHaveLength(6); // 'Berlin'
    expect(result.option_d).toHaveLength(6); // 'Madrid'
  });
});