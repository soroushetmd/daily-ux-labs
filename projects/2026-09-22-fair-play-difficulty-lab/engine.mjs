export const MIN_WINDOW = 900;
export const MAX_WINDOW = 2600;
export const STEP = 180;

export function clamp(value, min = MIN_WINDOW, max = MAX_WINDOW) {
  return Math.min(max, Math.max(min, value));
}

export function nextWindow(currentWindow, recentResults, locked = false) {
  if (locked || recentResults.length < 2) {
    return { window: currentWindow, reason: locked ? "Pace locked by player." : "Collecting more play data." };
  }

  const recent = recentResults.slice(-3);
  const hits = recent.filter(result => result.hit).length;
  const fastHits = recent.filter(result => result.hit && result.elapsed <= currentWindow * 0.55).length;

  if (hits === 0) {
    const window = clamp(currentWindow + STEP);
    return { window, reason: window === currentWindow ? "Pace is already at its most generous." : "More time added after repeated misses." };
  }

  if (hits === recent.length && fastHits >= 2) {
    const window = clamp(currentWindow - STEP);
    return { window, reason: window === currentWindow ? "Pace is already at its quickest." : "Pace increased after consistent, quick hits." };
  }

  return { window: currentWindow, reason: "Pace held steady while performance settles." };
}

export function scoreHit(elapsed, activeWindow) {
  const speed = Math.max(0, 1 - elapsed / activeWindow);
  return 100 + Math.round(speed * 100);
}

export function summarize(results) {
  const hits = results.filter(result => result.hit);
  const accuracy = results.length ? Math.round((hits.length / results.length) * 100) : 0;
  const average = hits.length ? Math.round(hits.reduce((sum, result) => sum + result.elapsed, 0) / hits.length) : 0;
  const score = hits.reduce((sum, result) => sum + result.score, 0);
  return { hits: hits.length, accuracy, average, score };
}
