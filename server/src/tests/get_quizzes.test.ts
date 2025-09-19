import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { quizzesTable } from '../db/schema';
import { type CreateQuizInput } from '../schema';
import { getQuizzes } from '../handlers/get_quizzes';

describe('getQuizzes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no quizzes exist', async () => {
    const result = await getQuizzes();
    expect(result).toEqual([]);
  });

  it('should return all quizzes', async () => {
    // Create test quizzes
    const testQuizzes: CreateQuizInput[] = [
      {
        title: 'Math Quiz',
        description: 'Test your math skills'
      },
      {
        title: 'Science Quiz',
        description: 'Basic science questions'
      },
      {
        title: 'History Quiz',
        description: null
      }
    ];

    // Insert test data
    for (const quiz of testQuizzes) {
      await db.insert(quizzesTable)
        .values({
          title: quiz.title,
          description: quiz.description
        })
        .execute();
    }

    const result = await getQuizzes();

    expect(result).toHaveLength(3);
    
    // Verify all quizzes are returned with correct structure
    result.forEach(quiz => {
      expect(quiz.id).toBeDefined();
      expect(typeof quiz.id).toBe('number');
      expect(typeof quiz.title).toBe('string');
      expect(quiz.created_at).toBeInstanceOf(Date);
      // description can be string or null
      expect(quiz.description === null || typeof quiz.description === 'string').toBe(true);
    });

    // Check specific quiz data
    const titles = result.map(quiz => quiz.title);
    expect(titles).toContain('Math Quiz');
    expect(titles).toContain('Science Quiz');
    expect(titles).toContain('History Quiz');
  });

  it('should return quizzes ordered by creation date (newest first)', async () => {
    // Create quizzes with slight delays to ensure different timestamps
    await db.insert(quizzesTable)
      .values({
        title: 'First Quiz',
        description: 'Created first'
      })
      .execute();

    // Add small delay
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(quizzesTable)
      .values({
        title: 'Second Quiz',
        description: 'Created second'
      })
      .execute();

    // Add small delay
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(quizzesTable)
      .values({
        title: 'Third Quiz',
        description: 'Created third'
      })
      .execute();

    const result = await getQuizzes();

    expect(result).toHaveLength(3);
    
    // Should be ordered newest first
    expect(result[0].title).toBe('Third Quiz');
    expect(result[1].title).toBe('Second Quiz');
    expect(result[2].title).toBe('First Quiz');

    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should handle quizzes with null descriptions', async () => {
    await db.insert(quizzesTable)
      .values({
        title: 'Quiz without description',
        description: null
      })
      .execute();

    const result = await getQuizzes();

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Quiz without description');
    expect(result[0].description).toBeNull();
  });

  it('should return all required fields for each quiz', async () => {
    await db.insert(quizzesTable)
      .values({
        title: 'Complete Quiz',
        description: 'A quiz with all fields'
      })
      .execute();

    const result = await getQuizzes();
    const quiz = result[0];

    // Verify all required fields are present
    expect(quiz).toHaveProperty('id');
    expect(quiz).toHaveProperty('title');
    expect(quiz).toHaveProperty('description');
    expect(quiz).toHaveProperty('created_at');

    // Verify field types
    expect(typeof quiz.id).toBe('number');
    expect(typeof quiz.title).toBe('string');
    expect(quiz.created_at).toBeInstanceOf(Date);
    expect(quiz.description === null || typeof quiz.description === 'string').toBe(true);
  });
});