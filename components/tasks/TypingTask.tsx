'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '../UserProvider';

interface TypingTaskProps {
  onComplete: () => void;
  onCancel: () => void;
}

const TYPING_TEXTS = [
  'The quick brown fox jumps over the lazy dog',
  'How much wood would a woodchuck chuck if a woodchuck could chuck wood',
  'She sells seashells by the seashore',
  'Peter Piper picked a peck of pickled peppers',
  'Unique New York, unique New York, unique New York',
];

export function TypingTask({ onComplete, onCancel }: TypingTaskProps) {
  const { user, setUser } = useUser();
  const [targetText, setTargetText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const MIN_TIME_SECONDS = 10; // Minimum 10 seconds to prevent cheating

  useEffect(() => {
    // Combine 3 random texts for a longer typing challenge
    const selected = [];
    for (let i = 0; i < 3; i++) {
      selected.push(TYPING_TEXTS[Math.floor(Math.random() * TYPING_TEXTS.length)]);
    }
    setTargetText(selected.join(' '));
  }, []);

  useEffect(() => {
    if (inputRef.current && !startTime) {
      inputRef.current.focus();
    }
  }, [startTime]);

  const handleInputChange = (value: string) => {
    if (!startTime) {
      setStartTime(Date.now());
    }

    setUserInput(value);

    // Check if completed
    if (value === targetText) {
      setCompleted(true);
    } else {
      setCompleted(false);
    }
  };

  const calculateAccuracy = (): number => {
    if (userInput.length === 0) return 100;
    let correct = 0;
    const minLength = Math.min(userInput.length, targetText.length);
    for (let i = 0; i < minLength; i++) {
      if (userInput[i] === targetText[i]) {
        correct++;
      }
    }
    return Math.floor((correct / userInput.length) * 100);
  };

  const calculateWPM = (): number => {
    if (!startTime) return 0;
    const timeMinutes = (Date.now() - startTime) / 1000 / 60;
    const words = userInput.split(/\s+/).filter(w => w.length > 0).length;
    return Math.floor(words / timeMinutes) || 0;
  };

  const handleComplete = async () => {
    if (!completed || !startTime) return;

    const timeElapsed = (Date.now() - startTime) / 1000;
    const accuracy = calculateAccuracy();

    if (timeElapsed < MIN_TIME_SECONDS) {
      setError(`You must spend at least ${MIN_TIME_SECONDS} seconds typing.`);
      return;
    }

    if (accuracy < 95) {
      setError('Accuracy must be at least 95%. Please type more carefully.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Start task
      const startRes = await fetch('/api/tasks/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskType: 'typing' }),
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
          taskType: 'typing',
          completionData: {
            completed: true,
            timeElapsed: timeElapsed,
            minTime: MIN_TIME_SECONDS,
            accuracy: accuracy,
            wpm: calculateWPM(),
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

  const accuracy = calculateAccuracy();
  const wpm = calculateWPM();
  const timeElapsed = startTime ? (Date.now() - startTime) / 1000 : 0;

  return (
    <div className="bg-casino-black-lighter border border-casino-gray-darker rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display text-casino-white">Typing Test</h2>
          <p className="text-sm text-casino-gray-light mt-1">
            Type the text below exactly as shown (case-sensitive)
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
            <p className="text-xs text-casino-gray-light mb-1">WPM</p>
            <p className="text-lg font-mono text-casino-white">{wpm}</p>
          </div>
          <div>
            <p className="text-xs text-casino-gray-light mb-1">Accuracy</p>
            <p className={`text-lg font-mono ${accuracy >= 95 ? 'text-casino-accent-secondary' : 'text-casino-accent-primary'}`}>
              {accuracy}%
            </p>
          </div>
          <div>
            <p className="text-xs text-casino-gray-light mb-1">Time</p>
            <p className="text-lg font-mono text-casino-white">{Math.floor(timeElapsed)}s</p>
          </div>
        </div>

        <div className="bg-casino-black-lighter rounded-lg p-4 mb-4">
          <p className="text-sm text-casino-gray-light mb-2">Type this:</p>
          <p className="text-lg font-mono text-casino-white mb-4 whitespace-pre-wrap break-words">
            {targetText}
          </p>
          <div className="h-px bg-casino-gray-darker my-4" />
          <textarea
            ref={inputRef}
            value={userInput}
            onChange={(e) => handleInputChange(e.target.value)}
            className="w-full h-32 px-4 py-3 bg-casino-black border border-casino-gray rounded-lg text-casino-white font-mono text-sm focus:outline-none focus:border-casino-accent-primary transition-colors resize-none"
            placeholder="Start typing here..."
            disabled={isSubmitting || completed}
          />
          <div className="mt-2">
            <div className="h-2 bg-casino-gray-darker rounded-full overflow-hidden">
              <div
                className="h-full bg-casino-accent-secondary transition-all duration-300"
                style={{
                  width: `${Math.min(100, (userInput.length / targetText.length) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        {completed && (
          <button
            type="button"
            onClick={handleComplete}
            disabled={isSubmitting || accuracy < 95 || timeElapsed < MIN_TIME_SECONDS}
            className="w-full px-6 py-3 bg-casino-accent-primary text-casino-white font-semibold rounded-lg hover:bg-red-700 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Complete Task'}
          </button>
        )}

        {completed && (accuracy < 95 || timeElapsed < MIN_TIME_SECONDS) && (
          <p className="text-xs text-casino-accent-primary mt-2 text-center">
            {accuracy < 95 && 'Accuracy must be at least 95%. '}
            {timeElapsed < MIN_TIME_SECONDS && `Must type for at least ${MIN_TIME_SECONDS} seconds.`}
          </p>
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

