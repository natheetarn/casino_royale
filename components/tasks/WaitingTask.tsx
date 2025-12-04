'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '../UserProvider';

interface WaitingTaskProps {
  onComplete: () => void;
  onCancel: () => void;
}

const WAIT_TIME_SECONDS = 300; // 5 minutes

export function WaitingTask({ onComplete, onCancel }: WaitingTaskProps) {
  const { user, setUser } = useUser();
  const [timeRemaining, setTimeRemaining] = useState(WAIT_TIME_SECONDS);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [tabFocused, setTabFocused] = useState(true);
  const [tabBlurCount, setTabBlurCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Tab focus/blur detection
  useEffect(() => {
    const handleFocus = () => {
      setTabFocused(true);
    };

    const handleBlur = () => {
      setTabFocused(false);
      if (isActive) {
        setTabBlurCount((prev) => prev + 1);
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isActive]);

  // Countdown timer
  useEffect(() => {
    if (!isActive || !startTime) return;

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, WAIT_TIME_SECONDS - elapsed);
      setTimeRemaining(remaining);

      if (remaining === 0) {
        setIsActive(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, startTime]);

  const handleStart = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      // Start task
      const startRes = await fetch('/api/tasks/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskType: 'waiting' }),
      });

      if (!startRes.ok) {
        const startData = await startRes.json();
        setError(startData.error || 'Failed to start task');
        setIsSubmitting(false);
        return;
      }

      // Start the waiting timer
      const now = Date.now();
      setStartTime(now);
      startTimeRef.current = now;
      setIsActive(true);
      setTimeRemaining(WAIT_TIME_SECONDS);
      setTabBlurCount(0);
      setIsSubmitting(false);
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!startTimeRef.current) return;

    const timeElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);

    if (timeElapsed < WAIT_TIME_SECONDS) {
      setError(`You must wait the full ${WAIT_TIME_SECONDS} seconds.`);
      return;
    }

    if (tabBlurCount > 0) {
      setError('You switched tabs during the wait. Task failed.');
      setIsActive(false);
      setStartTime(null);
      startTimeRef.current = null;
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Complete task
      const completeRes = await fetch('/api/tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskType: 'waiting',
          completionData: {
            completed: true,
            timeElapsed: timeElapsed,
            minTime: WAIT_TIME_SECONDS,
            tabFocused: tabFocused && tabBlurCount === 0,
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

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((WAIT_TIME_SECONDS - timeRemaining) / WAIT_TIME_SECONDS) * 100;

  return (
    <div className="bg-casino-black-lighter border border-casino-gray-darker rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display text-casino-white">The Waiting Game</h2>
          <p className="text-sm text-casino-gray-light mt-1">
            Wait 5 minutes without switching tabs
          </p>
        </div>
        {!isActive && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-casino-gray-darker border border-casino-gray text-casino-gray-light rounded-lg hover:bg-casino-gray-dark transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="bg-casino-gray-darker rounded-lg p-6">
        {!isActive && !startTime && (
          <div className="text-center space-y-4">
            <p className="text-lg text-casino-white mb-4">
              You must wait exactly 5 minutes (300 seconds) with this tab open.
            </p>
            <p className="text-sm text-casino-gray-light mb-2">
              Rules:
            </p>
            <ul className="text-sm text-casino-gray-light text-left max-w-md mx-auto space-y-1 mb-6">
              <li>• Keep this tab active (don't switch tabs)</li>
              <li>• Don't minimize the window</li>
              <li>• Wait the full 5 minutes</li>
              <li>• No interaction required - just wait</li>
            </ul>
            <button
              type="button"
              onClick={handleStart}
              disabled={isSubmitting}
              className="px-6 py-3 bg-casino-accent-primary text-casino-white font-semibold rounded-lg hover:bg-red-700 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Starting...' : 'Start Waiting'}
            </button>
          </div>
        )}

        {isActive && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mb-4">
                <div className="text-6xl font-mono text-casino-white mb-2">
                  {formatTime(timeRemaining)}
                </div>
                <p className="text-sm text-casino-gray-light">
                  {timeRemaining === 0 ? 'Time\'s up!' : 'Time remaining'}
                </p>
              </div>

              <div className="w-full bg-casino-black-lighter rounded-full h-3 mb-4 overflow-hidden">
                <div
                  className="h-full bg-casino-accent-secondary transition-all duration-300 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-casino-black-lighter rounded-lg p-3">
                <p className="text-xs text-casino-gray-light mb-1">Tab Status</p>
                <p
                  className={`text-sm font-mono ${
                    tabFocused
                      ? 'text-casino-accent-secondary'
                      : 'text-casino-accent-primary'
                  }`}
                >
                  {tabFocused ? '✓ Active' : '✗ Inactive'}
                </p>
              </div>
              <div className="bg-casino-black-lighter rounded-lg p-3">
                <p className="text-xs text-casino-gray-light mb-1">Tab Switches</p>
                <p className="text-sm font-mono text-casino-white">
                  {tabBlurCount}
                </p>
              </div>
            </div>

            {!tabFocused && (
              <div className="bg-casino-accent-primary/10 border border-casino-accent-primary text-casino-accent-primary px-4 py-3 rounded-lg text-sm text-center">
                ⚠️ Tab is not active! Switch back to continue.
              </div>
            )}

            {tabBlurCount > 0 && (
              <div className="bg-casino-accent-primary/10 border border-casino-accent-primary text-casino-accent-primary px-4 py-3 rounded-lg text-sm text-center">
                ⚠️ You switched tabs {tabBlurCount} time{tabBlurCount > 1 ? 's' : ''}. Task will fail if you complete it.
              </div>
            )}

            {timeRemaining === 0 && (
              <button
                type="button"
                onClick={handleComplete}
                disabled={isSubmitting || tabBlurCount > 0}
                className="w-full px-6 py-3 bg-casino-accent-primary text-casino-white font-semibold rounded-lg hover:bg-red-700 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Complete Task'}
              </button>
            )}
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

