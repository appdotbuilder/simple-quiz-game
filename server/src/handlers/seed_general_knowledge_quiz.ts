import { type Quiz } from '../schema';

export async function seedGeneralKnowledgeQuiz(): Promise<Quiz> {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is creating a pre-populated general knowledge quiz
    // with 5 questions and their multiple choice answers for demonstration purposes.
    // This will create the quiz and all its questions in a single operation.
    return Promise.resolve({
        id: 0, // Placeholder ID
        title: "General Knowledge Quiz",
        description: "Test your general knowledge with these 5 questions!",
        created_at: new Date() // Placeholder date
    } as Quiz);
}