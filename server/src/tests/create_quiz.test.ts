import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { quizzesTable } from '../db/schema';
import { type CreateQuizInput } from '../schema';
import { createQuiz } from '../handlers/create_quiz';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateQuizInput = {
  title: 'JavaScript Fundamentals Quiz',
  description: 'A quiz covering the basics of JavaScript programming'
};

// Test input with null description
const testInputNullDescription: CreateQuizInput = {
  title: 'Quick Quiz',
  description: null
};

describe('createQuiz', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a quiz with description', async () => {
    const result = await createQuiz(testInput);

    // Basic field validation
    expect(result.title).toEqual('JavaScript Fundamentals Quiz');
    expect(result.description).toEqual('A quiz covering the basics of JavaScript programming');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a quiz with null description', async () => {
    const result = await createQuiz(testInputNullDescription);

    // Basic field validation
    expect(result.title).toEqual('Quick Quiz');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save quiz to database', async () => {
    const result = await createQuiz(testInput);

    // Query using proper drizzle syntax
    const quizzes = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, result.id))
      .execute();

    expect(quizzes).toHaveLength(1);
    expect(quizzes[0].title).toEqual('JavaScript Fundamentals Quiz');
    expect(quizzes[0].description).toEqual('A quiz covering the basics of JavaScript programming');
    expect(quizzes[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple quizzes with unique IDs', async () => {
    const quiz1 = await createQuiz({
      title: 'Quiz 1',
      description: 'First quiz'
    });

    const quiz2 = await createQuiz({
      title: 'Quiz 2', 
      description: 'Second quiz'
    });

    // Verify unique IDs
    expect(quiz1.id).not.toEqual(quiz2.id);
    expect(quiz1.title).toEqual('Quiz 1');
    expect(quiz2.title).toEqual('Quiz 2');

    // Verify both are in database
    const allQuizzes = await db.select()
      .from(quizzesTable)
      .execute();

    expect(allQuizzes).toHaveLength(2);
  });

  it('should handle empty description as null', async () => {
    const result = await createQuiz({
      title: 'Test Quiz',
      description: null
    });

    expect(result.description).toBeNull();

    // Verify in database
    const savedQuiz = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, result.id))
      .execute();

    expect(savedQuiz[0].description).toBeNull();
  });

  it('should preserve created_at timestamp accuracy', async () => {
    const beforeCreation = new Date();
    const result = await createQuiz(testInput);
    const afterCreation = new Date();

    // Verify timestamp is within reasonable bounds
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });
});