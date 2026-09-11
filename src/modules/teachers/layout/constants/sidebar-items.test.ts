import { describe, expect, it } from 'vitest'

import { SIDEBAR_ITEMS_BY_ROLE } from './sidebar-items'

describe('teacher sidebar items', () => {
  it('exposes Exams in the Teacher navigation', () => {
    expect(SIDEBAR_ITEMS_BY_ROLE.teacher).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          labelKey: 'teachers_layout.exams',
          path: '/exams',
        }),
      ])
    )
  })

  it('labels the Assistant registration route as Students without changing its target', () => {
    expect(SIDEBAR_ITEMS_BY_ROLE.assistant).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          labelKey: 'teachers_layout.students',
          path: '/registration',
        }),
      ])
    )
    expect(SIDEBAR_ITEMS_BY_ROLE.assistant).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          labelKey: 'teachers_layout.registration',
          path: '/registration',
        }),
      ])
    )
  })
})
