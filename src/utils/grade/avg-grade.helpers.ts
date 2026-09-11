import type { AvgGrade } from '@/types/avg-grade.types'

export function formatAvgGrade(value: AvgGrade | null | undefined, fallback = '-'): string {
  if (!value || typeof value !== 'object') return fallback

  const percentage = `${value.percentage}%`
  return value.letter === null ? percentage : `${percentage} · ${value.letter}`
}
