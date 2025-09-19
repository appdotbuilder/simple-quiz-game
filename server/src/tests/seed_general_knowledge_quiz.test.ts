import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { quizzesTable, questionsTable } from '../db/schema';
import { seedGeneralKnowledgeQuiz } from '../handlers/seed_general_knowledge_quiz';
import { eq } from 'drizzle-orm';

describe('seedGeneralKnowledgeQuiz', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a general knowledge quiz', async () => {
    const result = await seedGeneralKnowledgeQuiz();

    // Basic field validation
    expect(result.title).toEqual('General Knowledge Quiz');
    expect(result.description).toEqual('Test your general knowledge with these 5 questions!');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save quiz to database', async () => {
    const result = await seedGeneralKnowledgeQuiz();

    // Query the quiz from database
    const quizzes = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, result.id))
      .execute();

    expect(quizzes).toHaveLength(1);
    expect(quizzes[0].title).toEqual('General Knowledge Quiz');
    expect(quizzes[0].description).toEqual('Test your general knowledge with these 5 questions!');
    expect(quizzes[0].created_at).toBeInstanceOf(Date);
  });

  it('should create exactly 5 questions for the quiz', async () => {
    const result = await seedGeneralKnowledgeQuiz();

    // Query questions from database
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.quiz_id, result.id))
      .execute();

    expect(questions).toHaveLength(5);
    
    // Verify all questions belong to the created quiz
    questions.forEach(question => {
      expect(question.quiz_id).toEqual(result.id);
      expect(question.question_text).toBeDefined();
      expect(question.correct_answer).toMatch(/^[ABCD]$/);
      expect(question.option_a).toBeDefined();
      expect(question.option_b).toBeDefined();
      expect(question.option_c).toBeDefined();
      expect(question.option_d).toBeDefined();
      expect(question.created_at).toBeInstanceOf(Date);
    });
  });

  it('should create questions with correct general knowledge content', async () => {
    const result = await seedGeneralKnowledgeQuiz();

    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.quiz_id, result.id))
      .execute();

    // Map questions by their text for easier verification
    const questionMap = new Map(
      questions.map(q => [q.question_text, q])
    );

    // Verify Australia capital question
    const australiaQuestion = questionMap.get("What is the capital of Australia?");
    expect(australiaQuestion).toBeDefined();
    expect(australiaQuestion!.correct_answer).toEqual("B");
    expect(australiaQuestion!.option_b).toEqual("Canberra");

    // Verify Mars question
    const marsQuestion = questionMap.get("Which planet is known as the Red Planet?");
    expect(marsQuestion).toBeDefined();
    expect(marsQuestion!.correct_answer).toEqual("C");
    expect(marsQuestion!.option_c).toEqual("Mars");

    // Verify Blue Whale question
    const whaleQuestion = questionMap.get("What is the largest mammal in the world?");
    expect(whaleQuestion).toBeDefined();
    expect(whaleQuestion!.correct_answer).toEqual("A");
    expect(whaleQuestion!.option_a).toEqual("Blue Whale");

    // Verify WWII question
    const wwiiQuestion = questionMap.get("In which year did World War II end?");
    expect(wwiiQuestion).toBeDefined();
    expect(wwiiQuestion!.correct_answer).toEqual("D");
    expect(wwiiQuestion!.option_d).toEqual("1945");

    // Verify Gold question
    const goldQuestion = questionMap.get("What is the chemical symbol for gold?");
    expect(goldQuestion).toBeDefined();
    expect(goldQuestion!.correct_answer).toEqual("B");
    expect(goldQuestion!.option_b).toEqual("Au");
  });

  it('should create unique quiz each time it runs', async () => {
    const firstQuiz = await seedGeneralKnowledgeQuiz();
    const secondQuiz = await seedGeneralKnowledgeQuiz();

    // Should have different IDs
    expect(firstQuiz.id).not.toEqual(secondQuiz.id);

    // Both should exist in database
    const allQuizzes = await db.select()
      .from(quizzesTable)
      .execute();

    expect(allQuizzes).toHaveLength(2);

    // Both should have 5 questions each
    const firstQuizQuestions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.quiz_id, firstQuiz.id))
      .execute();
    
    const secondQuizQuestions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.quiz_id, secondQuiz.id))
      .execute();

    expect(firstQuizQuestions).toHaveLength(5);
    expect(secondQuizQuestions).toHaveLength(5);
  });

  it('should have all questions with valid answer options', async () => {
    const result = await seedGeneralKnowledgeQuiz();

    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.quiz_id, result.id))
      .execute();

    questions.forEach(question => {
      // All options should be non-empty strings
      expect(question.option_a.length).toBeGreaterThan(0);
      expect(question.option_b.length).toBeGreaterThan(0);
      expect(question.option_c.length).toBeGreaterThan(0);
      expect(question.option_d.length).toBeGreaterThan(0);

      // Question text should be non-empty
      expect(question.question_text.length).toBeGreaterThan(0);

      // Correct answer should be A, B, C, or D
      expect(['A', 'B', 'C', 'D']).toContain(question.correct_answer);
    });
  });
});