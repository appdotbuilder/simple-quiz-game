import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import type { Question } from '../../../server/src/schema';

interface QuizQuestionProps {
  question: Question;
  selectedAnswer?: string;
  onAnswerSelect: (answer: string) => void;
  disabled?: boolean;
}

export function QuizQuestion({ 
  question, 
  selectedAnswer, 
  onAnswerSelect, 
  disabled = false 
}: QuizQuestionProps) {
  const options = [
    { key: 'A', text: question.option_a },
    { key: 'B', text: question.option_b },
    { key: 'C', text: question.option_c },
    { key: 'D', text: question.option_d }
  ];

  return (
    <Card className="quiz-card animate-fade-in">
      <CardHeader>
        <CardTitle className="text-lg flex items-start gap-3">
          <span className="text-2xl">❓</span>
          <span>{question.question_text}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {options.map((option) => {
          const isSelected = selectedAnswer === option.key;
          
          return (
            <button
              key={option.key}
              onClick={() => !disabled && onAnswerSelect(option.key)}
              disabled={disabled}
              className={`
                quiz-option-button
                ${isSelected ? 'quiz-option-selected' : 'quiz-option-default'}
                ${disabled ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}
                ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-blue-600 text-lg">
                    {option.key}.
                  </span>
                  <span className="text-gray-800">{option.text}</span>
                </div>
                {isSelected && (
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                )}
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}