export function calculatePoints(
  isCorrect: boolean,
  timeTaken: number,
  timeLimit: number
): number {
  if (!isCorrect) {
    return 0
  }

  const timeRatio = timeTaken / timeLimit
  const points = 1000 - timeRatio * 500

  return Math.max(500, Math.round(points))
}

