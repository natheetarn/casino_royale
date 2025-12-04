'use client';

import { useState, useEffect } from 'react';
import { useUser } from '../UserProvider';

interface MathTaskProps {
  onComplete: () => void;
  onCancel: () => void;
}

interface Problem {
  num1: number;
  num2: number;
  operator: '+' | '-' | '*' | '/';
  answer: number;
}

function generateProblem(): Problem {
  const operators: ('+' | '-' | '*' | '/')[] = ['+', '-', '*', '/'];
  const operator = operators[Math.floor(Math.random() * operators.length)];
  let num1: number, num2: number, answer: number;

  switch (operator) {
    case '+':
      num1 = Math.floor(Math.random() * 100) + 1;
      num2 = Math.floor(Math.random() * 100) + 1;
      answer = num1 + num2;
      break;
    case '-':
      num1 = Math.floor(Math.random() * 100) + 1;
      num2 = Math.floor(Math.random() * num1) + 1;
      answer = num1 - num2;
      break;
    case '*':
      num1 = Math.floor(Math.random() * 12) + 1;
      num2 = Math.floor(Math.random() * 12) + 1;
      answer = num1 * num2;
      break;
    case '/':
      num2 = Math.floor(Math.random() * 12) + 1;
      answer = Math.floor(Math.random() * 12) + 1;
      num1 = num2 * answer;
      break;
  }

  return { num1, num2, operator, answer };
}

export function MathTask({ onComplete, onCancel }: MathTaskProps) {
  const { user, setUser } = useUser();
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [problemsSolved, setProblemsSolved] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const REQUIRED_COUNT = 20;

  useEffect(() => {
    setCurrentProblem(generateProblem());
  }, []);

  const handleSubmit = async () => {
    if (!currentProblem) return;

    const answer = parseInt(userAnswer, 10);
    if (isNaN(answer)) {
      setError('Please enter a valid number');
      return;
    }

    const isCorrect = answer === currentProblem.answer;
    const newSolved = problemsSolved + 1;
    const newCorrect = isCorrect ? correctCount + 1 : correctCount;

    setProblemsSolved(newSolved);
    setCorrectCount(newCorrect);
    setUserAnswer('');
    setError(null);

    if (newSolved >= REQUIRED_COUNT) {
      // Complete task
      await completeTask(newCorrect);
    } else {
      // Generate next problem
      setCurrentProblem(generateProblem());
    }
  };

  const completeTask = async (correctCount: number) => {
    if (correctCount < REQUIRED_COUNT) {
      setError(`You need ${REQUIRED_COUNT} correct answers. You got ${correctCount}.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Start task
      const startRes = await fetch('/api/tasks/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskType: 'math' }),
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
          taskType: 'math',
          completionData: {
            problemsSolved: REQUIRED_COUNT,
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

  if (!currentProblem) {
    return <div>Loading...</div>;
  }

  const getOperatorSymbol = (op: string) => {
    switch (op) {
      case '+': return '+';
      case '-': return '−';
      case '*': return '×';
      case '/': return '÷';
      default: return op;
    }
  };

  return (
    <div className="bg-casino-black-lighter border border-casino-gray-darker rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display text-casino-white">Math Homework</h2>
          <p className="text-sm text-casino-gray-light mt-1">
            Solve 20 arithmetic problems correctly
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
        <div className="text-center mb-4">
          <p className="text-sm text-casino-gray-light mb-2">Progress</p>
          <p className="text-2xl font-mono text-casino-white">
            {problemsSolved} / {REQUIRED_COUNT}
          </p>
          <p className="text-xs text-casino-gray-light mt-1">
            Correct: {correctCount} / {problemsSolved}
          </p>
        </div>

        <div className="bg-casino-black-lighter rounded-lg p-6 mb-4">
          <div className="text-center">
            <p className="text-4xl font-mono text-casino-white mb-4">
              {currentProblem.num1} {getOperatorSymbol(currentProblem.operator)} {currentProblem.num2} = ?
            </p>
            <input
              type="number"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit();
                }
              }}
              autoFocus
              className="w-32 px-4 py-3 bg-casino-black border border-casino-gray rounded-lg text-casino-white font-mono text-2xl text-center focus:outline-none focus:border-casino-accent-primary transition-colors"
              placeholder="?"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !userAnswer}
          className="w-full px-6 py-3 bg-casino-accent-primary text-casino-white font-semibold rounded-lg hover:bg-red-700 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Answer'}
        </button>
      </div>

      {error && (
        <div className="bg-casino-accent-primary/10 border border-casino-accent-primary text-casino-accent-primary px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  );
}

