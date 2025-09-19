import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { quizzesTable, questionsTable } from '../db/schema';
import { getQuizWithQuestions } from '../handlers/get_quiz_with_questions';

describe('getQuizWithQuestions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return quiz with questions when quiz exists', async () => {
    // Create a quiz
    const quizResult = await db.insert(quizzesTable)
      .values({
        title: 'Sample Quiz',
        description: 'A test quiz'
      })
      .returning()
      .execute();

    const quiz = quizResult[0];

    // Create questions for the quiz
    await db.insert(questionsTable)
      .values([
        {
          quiz_id: quiz.id,
          question_text: 'What is 2 + 2?',
          correct_answer: 'A',
          option_a: '4',
          option_b: '5',
          option_c: '6',
          option_d: '7'
        },
        {
          quiz_id: quiz.id,
          question_text: 'What is the capital of France?',
          correct_answer: 'B',
          option_a: 'London',
          option_b: 'Paris',
          option_c: 'Berlin',
          option_d: 'Madrid'
        }
      ])
      .execute();

    const result = await getQuizWithQuestions(quiz.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(quiz.id);
    expect(result!.title).toEqual('Sample Quiz');
    expect(result!.description).toEqual('A test quiz');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.questions).toHaveLength(2);

    // Check first question
    expect(result!.questions[0].question_text).toEqual('What is 2 + 2?');
    expect(result!.questions[0].correct_answer).toEqual('A');
    expect(result!.questions[0].option_a).toEqual('4');
    expect(result!.questions[0].option_b).toEqual('5');
    expect(result!.questions[0].option_c).toEqual('6');
    expect(result!.questions[0].option_d).toEqual('7');
    expect(result!.questions[0].quiz_id).toEqual(quiz.id);
    expect(result!.questions[0].created_at).toBeInstanceOf(Date);

    // Check second question
    expect(result!.questions[1].question_text).toEqual('What is the capital of France?');
    expect(result!.questions[1].correct_answer).toEqual('B');
    expect(result!.questions[1].option_a).toEqual('London');
    expect(result!.questions[1].option_b).toEqual('Paris');
    expect(result!.questions[1].option_c).toEqual('Berlin');
    expect(result!.questions[1].option_d).toEqual('Madrid');
  });

  it('should return quiz with empty questions array when quiz has no questions', async () => {
    // Create a quiz without questions
    const quizResult = await db.insert(quizzesTable)
      .values({
        title: 'Empty Quiz',
        description: null
      })
      .returning()
      .execute();

    const quiz = quizResult[0];

    const result = await getQuizWithQuestions(quiz.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(quiz.id);
    expect(result!.title).toEqual('Empty Quiz');
    expect(result!.description).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.questions).toHaveLength(0);
  });

  it('should return null when quiz does not exist', async () => {
    const result = await getQuizWithQuestions(999);
    expect(result).toBeNull();
  });

  it('should handle quiz with null description', async () => {
    // Create a quiz with null description
    const quizResult = await db.insert(quizzesTable)
      .values({
        title: 'Quiz with null description',
        description: null
      })
      .returning()
      .execute();

    const quiz = quizResult[0];

    // Add a question
    await db.insert(questionsTable)
      .values({
        quiz_id: quiz.id,
        question_text: 'Test question?',
        correct_answer: 'C',
        option_a: 'Option A',
        option_b: 'Option B',
        option_c: 'Option C',
        option_d: 'Option D'
      })
      .execute();

    const result = await getQuizWithQuestions(quiz.id);

    expect(result).not.toBeNull();
    expect(result!.description).toBeNull();
    expect(result!.questions).toHaveLength(1);
  });

  it('should return questions in database order', async () => {
    // Create a quiz
    const quizResult = await db.insert(quizzesTable)
      .values({
        title: 'Ordered Quiz',
        description: 'Testing question order'
      })
      .returning()
      .execute();

    const quiz = quizResult[0];

    // Create questions in specific order
    const questionResults = await db.insert(questionsTable)
      .values([
        {
          quiz_id: quiz.id,
          question_text: 'First question',
          correct_answer: 'A',
          option_a: 'Answer A',
          option_b: 'Answer B',
          option_c: 'Answer C',
          option_d: 'Answer D'
        },
        {
          quiz_id: quiz.id,
          question_text: 'Second question',
          correct_answer: 'B',
          option_a: 'Answer A',
          option_b: 'Answer B',
          option_c: 'Answer C',
          option_d: 'Answer D'
        },
        {
          quiz_id: quiz.id,
          question_text: 'Third question',
          correct_answer: 'C',
          option_a: 'Answer A',
          option_b: 'Answer B',
          option_c: 'Answer C',
          option_d: 'Answer D'
        }
      ])
      .returning()
      .execute();

    const result = await getQuizWithQuestions(quiz.id);

    expect(result).not.toBeNull();
    expect(result!.questions).toHaveLength(3);
    expect(result!.questions[0].question_text).toEqual('First question');
    expect(result!.questions[1].question_text).toEqual('Second question');
    expect(result!.questions[2].question_text).toEqual('Third question');
  });

  it('should only return questions for the specific quiz', async () => {
    // Create two quizzes
    const quiz1Result = await db.insert(quizzesTable)
      .values({
        title: 'Quiz 1',
        description: 'First quiz'
      })
      .returning()
      .execute();

    const quiz2Result = await db.insert(quizzesTable)
      .values({
        title: 'Quiz 2',
        description: 'Second quiz'
      })
      .returning()
      .execute();

    const quiz1 = quiz1Result[0];
    const quiz2 = quiz2Result[0];

    // Create questions for both quizzes
    await db.insert(questionsTable)
      .values([
        {
          quiz_id: quiz1.id,
          question_text: 'Quiz 1 Question',
          correct_answer: 'A',
          option_a: 'A1',
          option_b: 'B1',
          option_c: 'C1',
          option_d: 'D1'
        },
        {
          quiz_id: quiz2.id,
          question_text: 'Quiz 2 Question',
          correct_answer: 'B',
          option_a: 'A2',
          option_b: 'B2',
          option_c: 'C2',
          option_d: 'D2'
        }
      ])
      .execute();

    // Get quiz 1 with questions
    const result1 = await getQuizWithQuestions(quiz1.id);
    expect(result1).not.toBeNull();
    expect(result1!.questions).toHaveLength(1);
    expect(result1!.questions[0].question_text).toEqual('Quiz 1 Question');
    expect(result1!.questions[0].quiz_id).toEqual(quiz1.id);

    // Get quiz 2 with questions
    const result2 = await getQuizWithQuestions(quiz2.id);
    expect(result2).not.toBeNull();
    expect(result2!.questions).toHaveLength(1);
    expect(result2!.questions[0].question_text).toEqual('Quiz 2 Question');
    expect(result2!.questions[0].quiz_id).toEqual(quiz2.id);
  });
});