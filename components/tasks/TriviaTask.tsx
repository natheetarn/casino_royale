'use client';

import { useState, useEffect } from 'react';
import { useUser } from '../UserProvider';
import { getRandomQuestions, type TriviaQuestion } from '@/lib/tasks/triviaQuestions';

interface TriviaTaskProps {
  onComplete: () => void;
  onCancel: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Science: 'bg-blue-600/20 border-blue-500 text-blue-400',
  History: 'bg-amber-600/20 border-amber-500 text-amber-400',
  Geography: 'bg-green-600/20 border-green-500 text-green-400',
  Entertainment: 'bg-purple-600/20 border-purple-500 text-purple-400',
  Sports: 'bg-orange-600/20 border-orange-500 text-orange-400',
  Technology: 'bg-cyan-600/20 border-cyan-500 text-cyan-400',
  General: 'bg-gray-600/20 border-gray-500 text-gray-400',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

export function TriviaTask({ onComplete, onCancel }: TriviaTaskProps) {
  const { user, setUser } = useUser();
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const REQUIRED_CORRECT = 5;

  useEffect(() => {
    const randomQuestions = getRandomQuestions(15); // Get 15 questions, need 5 correct
    setQuestions(randomQuestions);
  }, []);

  const handleAnswer = (answerIndex: number) => {
    if (selectedAnswer !== null) return; // Already answered
    setSelectedAnswer(answerIndex);
  };

  const handleNext = async () => {
    if (selectedAnswer === null) return;

    const currentQuestion = questions[currentIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    const newCorrectCount = isCorrect ? correctCount + 1 : correctCount;
    
    // Update streak and show feedback
    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setMaxStreak(Math.max(maxStreak, newStreak));
      if (newStreak >= 3) {
        setFeedback(`🔥 ${newStreak} in a row! Keep it up!`);
      } else {
        setFeedback('✓ Correct!');
      }
    } else {
      setStreak(0);
      setFeedback('✗ Incorrect');
    }
    
    // Clear feedback after 2 seconds
    setTimeout(() => setFeedback(null), 2000);
    
    setCorrectCount(newCorrectCount);

    if (currentIndex + 1 >= questions.length || newCorrectCount >= REQUIRED_CORRECT) {
      // Complete task
      await completeTask(newCorrectCount);
    } else {
      // Next question
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
    }
  };

  const completeTask = async (correctCount: number) => {
    if (correctCount < REQUIRED_CORRECT) {
      setError(`You need ${REQUIRED_CORRECT} correct answers. You got ${correctCount}.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Start task
      const startRes = await fetch('/api/tasks/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskType: 'trivia' }),
      });

      if (!startRes.ok) {
        const startData = await startRes.json();
        setError(startData.error || 'Failed to start task');
        setIsSubmitting(false);
        return;
      }

      // Complete task
      const completeRes = await fetch('/api/tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskType: 'trivia',
          completionData: {
            questionsAnswered: currentIndex + 1,
            correctCount: correctCount,
          },
        }),
      });

      const completeData = await completeRes.json();

      if (!completeRes.ok) {
        setError(completeData.error || 'Failed to complete task');
        setIsSubmitting(false);
        return;
      }

      // Update user balance
      if (user) {
        setUser({ ...user, chip_balance: completeData.balance });
      }

      onComplete();
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (questions.length === 0) {
    return <div>Loading questions...</div>;
  }

  const currentQuestion = questions[currentIndex];
  const isAnswered = selectedAnswer !== null;
  const isCorrect = isAnswered && selectedAnswer === currentQuestion.correctAnswer;

  return (
    <div className="bg-casino-black-lighter border border-casino-gray-darker rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display text-casino-white">Trivia Quiz</h2>
          <p className="text-sm text-casino-gray-light mt-1">
            Answer 5 questions correctly
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-casino-gray-darker border border-casino-gray text-casino-gray-light rounded-lg hover:bg-casino-gray-dark transition-colors"
        >
          Cancel
        </button>
      </div>

      <div className="bg-casino-gray-darker rounded-lg p-4">
        <div className="grid grid-cols-3 gap-4 mb-4 text-center">
          <div>
            <p className="text-xs text-casino-gray-light mb-1">Correct</p>
            <p className="text-xl font-mono text-casino-accent-secondary">
              {correctCount} / {REQUIRED_CORRECT}
            </p>
          </div>
          <div>
            <p className="text-xs text-casino-gray-light mb-1">Streak</p>
            <p className="text-xl font-mono text-casino-white">
              {streak} {streak > 0 && '🔥'}
            </p>
          </div>
          <div>
            <p className="text-xs text-casino-gray-light mb-1">Question</p>
            <p className="text-xl font-mono text-casino-white">
              {currentIndex + 1} / {questions.length}
            </p>
          </div>
        </div>

        {feedback && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-center font-semibold ${
            feedback.includes('✓') || feedback.includes('🔥')
              ? 'bg-casino-accent-secondary/10 border border-casino-accent-secondary text-casino-accent-secondary'
              : 'bg-casino-accent-primary/10 border border-casino-accent-primary text-casino-accent-primary'
          }`}>
            {feedback}
          </div>
        )}

        <div className="bg-casino-black-lighter rounded-lg p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
              CATEGORY_COLORS[currentQuestion.category] || CATEGORY_COLORS.General
            }`}>
              {currentQuestion.category}
            </span>
            <span className="text-xs text-casino-gray-light">
              {DIFFICULTY_LABELS[currentQuestion.difficulty]}
            </span>
          </div>
          <h3 className="text-xl font-display text-casino-white mb-6">
            {currentQuestion.question}
          </h3>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrectOption = index === currentQuestion.correctAnswer;
              let buttonClass = 'w-full px-4 py-3 rounded-lg text-left transition-all duration-150 ';

              if (isAnswered) {
                if (isCorrectOption) {
                  buttonClass += 'bg-casino-accent-secondary/25 border-2 border-casino-accent-secondary text-casino-accent-secondary';
                } else if (isSelected && !isCorrectOption) {
                  buttonClass += 'bg-casino-accent-primary/25 border-2 border-casino-accent-primary text-casino-accent-primary';
                } else {
                  buttonClass += 'bg-casino-gray-darker border border-casino-gray text-casino-gray-light opacity-60';
                }
              } else {
                buttonClass += 'bg-casino-gray-darker border border-casino-gray text-casino-white hover:bg-casino-gray-dark hover:border-casino-gray-light cursor-pointer';
              }

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleAnswer(index)}
                  disabled={isAnswered || isSubmitting}
                  className={buttonClass}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        {isAnswered && (
          <div className="space-y-2">
            {maxStreak >= 3 && (
              <p className="text-xs text-center text-casino-accent-secondary">
                Best streak: {maxStreak} 🔥
              </p>
            )}
            <button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
              className="w-full px-6 py-3 bg-casino-accent-primary text-casino-white font-semibold rounded-lg hover:bg-red-700 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : correctCount >= REQUIRED_CORRECT ? 'Complete Task' : 'Next Question'}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-casino-accent-primary/10 border border-casino-accent-primary text-casino-accent-primary px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  );
}

