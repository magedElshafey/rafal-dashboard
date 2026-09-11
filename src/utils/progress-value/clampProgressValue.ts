export function clampProgressValue(value: number) {
  if (!Number.isFinite(value)) return 0

  return Math.min(Math.max(value, 0), 100)
}
