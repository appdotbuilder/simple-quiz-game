import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Play } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { QuizQuestion } from '@/components/QuizQuestion';
import { QuizResults } from '@/components/QuizResults';
import type { Quiz, QuizWithQuestions, QuizAttempt, QuizAttemptResult } from '../../server/src/schema';

type GameState = 'start' | 'playing' | 'completed';

function App() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [currentQuiz, setCurrentQuiz] = useState<QuizWithQuestions | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState<QuizAttempt | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [attemptResult, setAttemptResult] = useState<QuizAttemptResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load available quizzes on mount
  const loadQuizzes = useCallback(async () => {
    try {
      const result = await trpc.getQuizzes.query();
      setQuizzes(result);
      
      // If no quizzes exist, seed the general knowledge quiz
      if (result.length === 0) {
        await trpc.seedGeneralKnowledgeQuiz.mutate();
        const newResult = await trpc.getQuizzes.query();
        setQuizzes(newResult);
      }
    } catch (error) {
      console.error('Failed to load quizzes:', error);
    }
  }, []);

  useEffect(() => {
    loadQuizzes();
  }, [loadQuizzes]);

  const startQuiz = async (quizId: number) => {
    setIsLoading(true);
    try {
      // Get quiz with questions
      const quiz = await trpc.getQuizWithQuestions.query({ quizId });
      if (!quiz) {
        console.error('Quiz not found');
        return;
      }
      
      // Start quiz attempt
      const attempt = await trpc.startQuizAttempt.mutate({ quiz_id: quizId });
      
      setCurrentQuiz(quiz);
      setCurrentAttempt(attempt);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setGameState('playing');
    } catch (error) {
      console.error('Failed to start quiz:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitAnswer = async (questionId: number, answer: string) => {
    if (!currentAttempt) return;
    
    try {
      await trpc.submitAnswer.mutate({
        attempt_id: currentAttempt.id,
        question_id: questionId,
        selected_answer: answer as 'A' | 'B' | 'C' | 'D'
      });
      
      setSelectedAnswers(prev => ({ ...prev, [questionId]: answer }));
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }
  };

  const nextQuestion = () => {
    if (!currentQuiz) return;
    
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      completeQuiz();
    }
  };

  const completeQuiz = async () => {
    if (!currentAttempt) return;
    
    setIsLoading(true);
    try {
      await trpc.completeQuizAttempt.mutate({ attempt_id: currentAttempt.id });
      const result = await trpc.getQuizAttemptResult.query({ attemptId: currentAttempt.id });
      
      setAttemptResult(result);
      setGameState('completed');
    } catch (error) {
      console.error('Failed to complete quiz:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetGame = () => {
    setGameState('start');
    setCurrentQuiz(null);
    setCurrentAttempt(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setAttemptResult(null);
  };

  // Start screen
  if (gameState === 'start') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="container mx-auto max-w-2xl">
          <div className="text-center py-8">
            <div className="mb-6">
              <Trophy className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
              <h1 className="text-4xl font-bold text-gray-900 mb-2">🧠 Quiz Game</h1>
              <p className="text-lg text-gray-600">Test your knowledge with our fun quizzes!</p>
            </div>

            {quizzes.length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <p className="text-gray-500">Loading quizzes... 📚</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {quizzes.map((quiz: Quiz) => (
                  <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span>📝</span>
                        {quiz.title}
                      </CardTitle>
                      {quiz.description && (
                        <CardDescription>{quiz.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={() => startQuiz(quiz.id)} 
                        disabled={isLoading}
                        className="w-full"
                        size="lg"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {isLoading ? 'Starting...' : 'Start Quiz'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Playing screen
  if (gameState === 'playing' && currentQuiz) {
    const currentQuestion = currentQuiz.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100;
    const hasAnswered = selectedAnswers[currentQuestion.id];

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="container mx-auto max-w-2xl">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-gray-900">🧠 {currentQuiz.title}</h1>
              <Badge variant="outline">
                Question {currentQuestionIndex + 1} of {currentQuiz.questions.length}
              </Badge>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          <QuizQuestion
            question={currentQuestion}
            selectedAnswer={selectedAnswers[currentQuestion.id]}
            onAnswerSelect={(answer) => submitAnswer(currentQuestion.id, answer)}
            disabled={!!hasAnswered}
          />

          <div className="text-center">
            {hasAnswered ? (
              <Button onClick={nextQuestion} size="lg" className="min-w-[200px]">
                {currentQuestionIndex < currentQuiz.questions.length - 1 ? 'Next Question →' : 'Complete Quiz 🏁'}
              </Button>
            ) : (
              <p className="text-gray-500 animate-pulse-custom">Select an answer to continue ✨</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Completed screen
  if (gameState === 'completed' && attemptResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="container mx-auto max-w-2xl">
          <QuizResults result={attemptResult} onPlayAgain={resetGame} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center py-8">
          <p className="text-gray-500">Loading... 🔄</p>
        </div>
      </div>
    </div>
  );
}

export default App;