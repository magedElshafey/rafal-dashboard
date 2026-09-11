import { describe, expect, it } from 'vitest'

import { resources } from '@/lang/resources'

type StringLeaf = { path: string; value: string }

function getStringLeaves(value: unknown, path = ''): StringLeaf[] {
  if (typeof value === 'string') return [{ path, value }]
  if (!value || typeof value !== 'object' || Array.isArray(value)) return []

  return Object.entries(value).flatMap(([key, child]) => getStringLeaves(child, path ? `${path}.${key}` : key))
}

describe('upcoming status presentation copy', () => {
  it('contains no user-visible Upcoming copy in English translations', () => {
    const remaining = getStringLeaves(resources.en.translation).filter(({ value }) => /\bupcoming\b/i.test(value))

    expect(remaining).toEqual([])
    expect(resources.en.translation.assignments.tabs.upcoming).toBe('Pending')
    expect(resources.en.translation.exams.statuses.upcoming).toBe('Pending')
  })

  it('uses قيد الانتظار for every Arabic translation path representing upcoming', () => {
    const upcomingValues = getStringLeaves(resources.ar.translation).filter(({ path }) =>
      path.split('.').some((segment) => segment.toLocaleLowerCase('en-US').includes('upcoming'))
    )

    expect(upcomingValues.length).toBeGreaterThan(0)
    upcomingValues.forEach(({ value }) => expect(value).toContain('قيد الانتظار'))
    expect(resources.ar.translation.assignments.tabs.upcoming).toBe('قيد الانتظار')
    expect(resources.ar.translation.exams.statuses.upcoming).toBe('قيد الانتظار')
    expect(resources.ar.translation.teachers.home.assistant.pending_tasks.description).toContain('قيد الانتظار')
  })
})
