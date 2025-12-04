'use client';

import { useState, useEffect } from 'react';
import { useUser } from '../UserProvider';

interface CaptchaTaskProps {
  onComplete: () => void;
  onCancel: () => void;
}

type CaptchaType = 'math' | 'word' | 'sequence';

interface Captcha {
  question: string;
  answer: number;
  type: CaptchaType;
}

function generateCaptcha(): Captcha {
  const types: CaptchaType[] = ['math', 'word', 'sequence'];
  const type = types[Math.floor(Math.random() * types.length)];

  switch (type) {
    case 'math': {
      const num1 = Math.floor(Math.random() * 20) + 1;
      const num2 = Math.floor(Math.random() * 20) + 1;
      const operators = ['+', '-', '*'];
      const operator = operators[Math.floor(Math.random() * operators.length)];

      let answer: number;
      let question: string;

      switch (operator) {
        case '+':
          answer = num1 + num2;
          question = `${num1} + ${num2}`;
          break;
        case '-':
          answer = num1 - num2;
          question = `${num1} - ${num2}`;
          break;
        case '*':
          answer = num1 * num2;
          question = `${num1} × ${num2}`;
          break;
        default:
          answer = num1 + num2;
          question = `${num1} + ${num2}`;
      }

      return { question, answer, type: 'math' };
    }

    case 'word': {
      // Word problems that result in a number
      const problems = [
        { q: 'How many letters in "CAPTCHA"?', a: 7 },
        { q: 'How many sides does a triangle have?', a: 3 },
        { q: 'How many legs does a spider have?', a: 8 },
        { q: 'How many days in a week?', a: 7 },
        { q: 'How many hours in a day?', a: 24 },
        { q: 'How many fingers on one hand?', a: 5 },
        { q: 'How many wheels on a car?', a: 4 },
        { q: 'How many minutes in an hour?', a: 60 },
        { q: 'How many months in a year?', a: 12 },
        { q: 'How many seconds in a minute?', a: 60 },
      ];
      const problem = problems[Math.floor(Math.random() * problems.length)];
      return { question: problem.q, answer: problem.a, type: 'word' };
    }

    case 'sequence': {
      // Number sequences - find the next number
      const sequences = [
        { q: '2, 4, 6, 8, ?', a: 10 },
        { q: '1, 3, 5, 7, ?', a: 9 },
        { q: '5, 10, 15, 20, ?', a: 25 },
        { q: '1, 4, 9, 16, ?', a: 25 }, // squares: 1², 2², 3², 4², 5²
        { q: '1, 2, 4, 8, ?', a: 16 }, // powers of 2
        { q: '10, 20, 30, 40, ?', a: 50 },
        { q: '3, 6, 9, 12, ?', a: 15 },
        { q: '7, 14, 21, 28, ?', a: 35 },
      ];
      const seq = sequences[Math.floor(Math.random() * sequences.length)];
      return { question: seq.q, answer: seq.a, type: 'sequence' };
    }

    default:
      // Fallback to math
      const num1 = Math.floor(Math.random() * 20) + 1;
      const num2 = Math.floor(Math.random() * 20) + 1;
      return { question: `${num1} + ${num2}`, answer: num1 + num2, type: 'math' };
  }
}

export function CaptchaTask({ onComplete, onCancel }: CaptchaTaskProps) {
  const { user, setUser } = useUser();
  const [captcha, setCaptcha] = useState<Captcha | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [captchasSolved, setCaptchasSolved] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const REQUIRED_COUNT = 10;

  useEffect(() => {
    setCaptcha(generateCaptcha());
  }, []);

  const handleSubmit = async () => {
    if (!captcha) return;

    const answer = parseInt(userAnswer, 10);
    if (isNaN(answer)) {
      setError('Please enter a valid number');
      return;
    }

    if (answer !== captcha.answer) {
      setError('Incorrect answer. Try again.');
      setUserAnswer('');
      setCaptcha(generateCaptcha());
      return;
    }

    // Correct answer
    const newSolved = captchasSolved + 1;
    setCaptchasSolved(newSolved);
    setUserAnswer('');
    setError(null);

    if (newSolved >= REQUIRED_COUNT) {
      // Complete task
      await completeTask();
    } else {
      // Generate next captcha
      setCaptcha(generateCaptcha());
    }
  };

  const completeTask = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Start task
      const startRes = await fetch('/api/tasks/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskType: 'captcha' }),
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
          taskType: 'captcha',
          completionData: {
            captchasSolved: REQUIRED_COUNT,
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

  if (!captcha) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-casino-black-lighter border border-casino-gray-darker rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display text-casino-white">CAPTCHA Hell</h2>
          <p className="text-sm text-casino-gray-light mt-1">
            Solve 10 captchas correctly (math, word problems, sequences)
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
            {captchasSolved} / {REQUIRED_COUNT}
          </p>
        </div>

        <div className="bg-casino-black-lighter rounded-lg p-6 mb-4">
          <div className="text-center">
            <p className="text-sm text-casino-gray-light mb-2">Solve this:</p>
            <div className="mb-6">
              <p className={`font-mono text-casino-white ${
                captcha.type === 'word' || captcha.type === 'sequence' 
                  ? 'text-2xl' 
                  : 'text-4xl'
              }`}>
                {captcha.question}
                {captcha.type === 'math' && ' = ?'}
              </p>
              {captcha.type === 'word' && (
                <p className="text-xs text-casino-gray-light mt-2">Enter the number</p>
              )}
              {captcha.type === 'sequence' && (
                <p className="text-xs text-casino-gray-light mt-2">What number comes next?</p>
              )}
            </div>
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

