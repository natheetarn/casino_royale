// Pure crash game math helpers (shared server/client).

export interface CrashRoundConfig {
  crashMultiplier: number;
  startedAt: string; // ISO string
}

// Generate a random crash multiplier with a heavy tail.
// Low crashes are common, big ones are rare. Max 100x.
export function generateCrashMultiplier(): number {
  const r = Math.random();

  // Exponential-ish tail: most crashes between 1x–5x, very rare near 100x.
  const raw = 1 + -Math.log(1 - r) * 3.5;
  const clamped = Math.min(Math.max(raw, 1.01), 100);
  return Number(clamped.toFixed(2));
}

// Given elapsed seconds, compute the multiplier at that time.
// Uses a FIXED growth rate (same speed for all games) to prevent
// players from predicting crashes based on animation speed.
// The multiplier grows exponentially at a constant rate.
export function getMultiplierAtTimeSeconds(
  elapsedSeconds: number,
  crashMultiplier: number, // Only used to cap the result, not to determine speed
  crashTimeSeconds: number, // Not used, kept for API compatibility
): number {
  if (elapsedSeconds <= 0) return 1;

  // Fixed exponential growth rate: multiplier = 1 * e^(rate * time)
  // Rate chosen so multiplier reaches ~50x at 12 seconds (reasonable max)
  // This ensures consistent speed regardless of actual crash multiplier
  const GROWTH_RATE = Math.log(50) / 12; // ~0.33 per second
  const value = Math.exp(GROWTH_RATE * elapsedSeconds);

  // Cap at the actual crash multiplier (don't show beyond crash point)
  return Number(Math.min(value, crashMultiplier).toFixed(2));
}

// Default crash duration for the curve (used client-side).
export const DEFAULT_CRASH_TIME_SECONDS = 12;


