import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createQuizInputSchema,
  createQuestionInputSchema,
  startQuizAttemptInputSchema,
  submitAnswerInputSchema,
  completeQuizAttemptInputSchema
} from './schema';

// Import handlers
import { createQuiz } from './handlers/create_quiz';
import { getQuizzes } from './handlers/get_quizzes';
import { getQuizWithQuestions } from './handlers/get_quiz_with_questions';
import { createQuestion } from './handlers/create_question';
import { startQuizAttempt } from './handlers/start_quiz_attempt';
import { submitAnswer } from './handlers/submit_answer';
import { completeQuizAttempt } from './handlers/complete_quiz_attempt';
import { getQuizAttemptResult } from './handlers/get_quiz_attempt_result';
import { seedGeneralKnowledgeQuiz } from './handlers/seed_general_knowledge_quiz';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Quiz management
  createQuiz: publicProcedure
    .input(createQuizInputSchema)
    .mutation(({ input }) => createQuiz(input)),

  getQuizzes: publicProcedure
    .query(() => getQuizzes()),

  getQuizWithQuestions: publicProcedure
    .input(z.object({ quizId: z.number() }))
    .query(({ input }) => getQuizWithQuestions(input.quizId)),

  // Question management
  createQuestion: publicProcedure
    .input(createQuestionInputSchema)
    .mutation(({ input }) => createQuestion(input)),

  // Quiz attempt management
  startQuizAttempt: publicProcedure
    .input(startQuizAttemptInputSchema)
    .mutation(({ input }) => startQuizAttempt(input)),

  submitAnswer: publicProcedure
    .input(submitAnswerInputSchema)
    .mutation(({ input }) => submitAnswer(input)),

  completeQuizAttempt: publicProcedure
    .input(completeQuizAttemptInputSchema)
    .mutation(({ input }) => completeQuizAttempt(input)),

  getQuizAttemptResult: publicProcedure
    .input(z.object({ attemptId: z.number() }))
    .query(({ input }) => getQuizAttemptResult(input.attemptId)),

  // Utility for seeding demo data
  seedGeneralKnowledgeQuiz: publicProcedure
    .mutation(() => seedGeneralKnowledgeQuiz()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();