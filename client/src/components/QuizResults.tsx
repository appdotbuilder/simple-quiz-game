import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, AlertCircle, RotateCcw, Star } from 'lucide-react';
import type { QuizAttemptResult } from '../../../server/src/schema';

interface QuizResultsProps {
  result: QuizAttemptResult;
  onPlayAgain: () => void;
}

export function QuizResults({ result, onPlayAgain }: QuizResultsProps) {
  const percentage = Math.round((result.score / result.total_questions) * 100);
  const isExcellent = percentage >= 90;
  const isGood = percentage >= 70;
  const isPassing = percentage >= 50;

  const getResultMessage = () => {
    if (isExcellent) return { emoji: '🏆', title: 'Outstanding!', message: 'You\'re a quiz master!' };
    if (isGood) return { emoji: '🎉', title: 'Great Job!', message: 'Well done on your performance!' };
    if (isPassing) return { emoji: '👍', title: 'Good Try!', message: 'You\'re on the right track!' };
    return { emoji: '📚', title: 'Keep Learning!', message: 'Practice makes perfect!' };
  };

  const { emoji, title, message } = getResultMessage();

  const getProgressColor = () => {
    if (isExcellent) return 'bg-gradient-to-r from-yellow-400 to-yellow-500';
    if (isGood) return 'bg-gradient-to-r from-green-400 to-green-500';
    if (isPassing) return 'bg-gradient-to-r from-blue-400 to-blue-500';
    return 'bg-gradient-to-r from-gray-400 to-gray-500';
  };

  return (
    <div className="text-center py-8 animate-fade-in">
      <div className="mb-6">
        <div className="mb-4">
          {isExcellent ? (
            <Trophy className="mx-auto h-16 w-16 text-yellow-500 celebration-bounce" />
          ) : isGood ? (
            <Star className="mx-auto h-16 w-16 text-green-500" />
          ) : (
            <AlertCircle className="mx-auto h-16 w-16 text-blue-500" />
          )}
        </div>
        <div className="text-5xl mb-2">{emoji}</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-lg text-gray-600">{message}</p>
      </div>

      <Card className="mb-6 max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Your Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-blue-600 mb-2">
              {result.score}
              <span className="text-2xl text-gray-400">/{result.total_questions}</span>
            </div>
            <div className="text-2xl font-semibold text-gray-700 mb-4">
              {percentage}% correct
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Score</span>
              <span>{percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ease-out ${getProgressColor()}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {result.answers && result.answers.length > 0 && (
            <div className="text-sm text-gray-500 space-y-1">
              <div className="flex justify-between">
                <span>✅ Correct answers:</span>
                <span className="font-semibold text-green-600">
                  {result.answers.filter(a => a.is_correct).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>❌ Incorrect answers:</span>
                <span className="font-semibold text-red-600">
                  {result.answers.filter(a => !a.is_correct).length}
                </span>
              </div>
            </div>
          )}

          <div className="text-xs text-gray-400 pt-2 border-t">
            Completed on {result.completed_at.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </CardContent>
      </Card>

      <Button onClick={onPlayAgain} size="lg" className="w-full max-w-md">
        <RotateCcw className="w-4 h-4 mr-2" />
        Play Again
      </Button>

      {isExcellent && (
        <p className="text-sm text-yellow-600 mt-4 font-medium">
          🌟 Perfect score achieved! Share your success!
        </p>
      )}
    </div>
  );
}