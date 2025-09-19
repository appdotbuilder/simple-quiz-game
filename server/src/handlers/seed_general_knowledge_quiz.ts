import { db } from '../db';
import { quizzesTable, questionsTable } from '../db/schema';
import { type Quiz } from '../schema';

export const seedGeneralKnowledgeQuiz = async (): Promise<Quiz> => {
  try {
    // Create the quiz
    const quizResult = await db.insert(quizzesTable)
      .values({
        title: "General Knowledge Quiz",
        description: "Test your general knowledge with these 5 questions!"
      })
      .returning()
      .execute();

    const quiz = quizResult[0];

    // Create 5 general knowledge questions
    const questions = [
      {
        quiz_id: quiz.id,
        question_text: "What is the capital of Australia?",
        correct_answer: "B",
        option_a: "Sydney",
        option_b: "Canberra", 
        option_c: "Melbourne",
        option_d: "Perth"
      },
      {
        quiz_id: quiz.id,
        question_text: "Which planet is known as the Red Planet?",
        correct_answer: "C",
        option_a: "Venus",
        option_b: "Jupiter",
        option_c: "Mars",
        option_d: "Saturn"
      },
      {
        quiz_id: quiz.id,
        question_text: "What is the largest mammal in the world?",
        correct_answer: "A",
        option_a: "Blue Whale",
        option_b: "African Elephant",
        option_c: "Giraffe",
        option_d: "Hippopotamus"
      },
      {
        quiz_id: quiz.id,
        question_text: "In which year did World War II end?",
        correct_answer: "D",
        option_a: "1943",
        option_b: "1944",
        option_c: "1946",
        option_d: "1945"
      },
      {
        quiz_id: quiz.id,
        question_text: "What is the chemical symbol for gold?",
        correct_answer: "B",
        option_a: "Go",
        option_b: "Au",
        option_c: "Ag",
        option_d: "Gd"
      }
    ];

    // Insert all questions
    await db.insert(questionsTable)
      .values(questions)
      .execute();

    return quiz;
  } catch (error) {
    console.error('General knowledge quiz seeding failed:', error);
    throw error;
  }
};