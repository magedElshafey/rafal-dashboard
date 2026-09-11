import { describe, expect, it } from 'vitest'

import { resolveNotificationPath } from '@/components/shared/notifications/utils/resolve-notification-path'

describe('resolveNotificationPath', () => {
  it('falls back to Exam type selection when a notification has no Exam subtype', () => {
    expect(resolveNotificationPath({ type: 'exam-details', entityId: 'exam-1' }, 'user')).toBe('/user/exams')
  })

  it('keeps canonical backend-provided paths intact', () => {
    expect(
      resolveNotificationPath({ type: 'exam-details', entityId: 'exam-1', path: '/user/exams/mcq/exam-1' }, 'user')
    ).toBe('/user/exams/mcq/exam-1')
  })

  it('replaces an obsolete untyped Exam detail path with the Exam landing route', () => {
    expect(
      resolveNotificationPath(
        { type: 'exam-details', entityId: 'exam-1', path: '/user/exams/exam-1' },
        'user',
        'student'
      )
    ).toBe('/user/exams')
  })

  it('does not send a Parent to Student-only Tasks from a backend path', () => {
    expect(resolveNotificationPath({ type: 'home', path: '/user/tasks' }, 'user', 'parent')).toBe('/user/reports')
  })

  it('ignores an external backend path and uses the typed fallback', () => {
    expect(resolveNotificationPath({ type: 'profile', path: 'https://example.com' }, 'user', 'student')).toBe(
      '/user/profile'
    )
  })

  it('uses the singular Student Course route for typed and legacy backend course notifications', () => {
    expect(resolveNotificationPath({ type: 'course-details', entityId: 'course-1' }, 'user', 'student')).toBe(
      '/user/course'
    )
    expect(
      resolveNotificationPath(
        { type: 'course-details', entityId: 'course-1', path: '/user/courses/course-1' },
        'user',
        'student'
      )
    ).toBe('/user/course')
  })

  it('does not send a Parent to the Student-only Course route', () => {
    expect(resolveNotificationPath({ type: 'courses' }, 'user', 'parent')).toBe('/user/reports')
  })
})
