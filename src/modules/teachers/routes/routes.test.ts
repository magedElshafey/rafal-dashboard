import { describe, expect, it } from 'vitest'

import { TeachersRoutes } from '@/modules/teachers/routes/routes'
import { RoleOnly } from '@/modules/auth/guards/RoleOnly'
import type { ReactElement } from 'react'

describe('teacher live-session route', () => {
  it('keeps the live meeting inside the Teacher layout route', () => {
    const layoutRoute = TeachersRoutes.find((route) => route.children)
    const liveRoute = layoutRoute?.children?.find((route) => route.path === 'session/:id/live')

    expect(layoutRoute).toBeDefined()
    expect(liveRoute?.element).toBeDefined()
    expect(TeachersRoutes.find((route) => route.path === 'session/:id/live')).toBeUndefined()
  })
})

describe('teacher portal notifications route', () => {
  it('is exposed to admin, assistant, and teacher only', () => {
    const layoutRoute = TeachersRoutes.find((route) => route.children)
    const notificationsRoute = layoutRoute?.children?.find((route) => route.path === 'notifications')
    const guard = notificationsRoute?.element as ReactElement<{ allowedRoles: string[] }>

    expect(guard.type).toBe(RoleOnly)
    expect(guard.props.allowedRoles).toEqual(['admin', 'assistant', 'teacher'])
    expect(guard.props.allowedRoles).not.toContain('student')
  })
})

describe('Assistant Profile routes', () => {
  it.each(['profile', 'profile/edit'])('guards %s for Assistant only', (path) => {
    const layoutRoute = TeachersRoutes.find((route) => route.children)
    const profileRoute = layoutRoute?.children?.find((route) => route.path === path)
    const guard = profileRoute?.element as ReactElement<{ allowedRoles: string[] }>

    expect(guard.type).toBe(RoleOnly)
    expect(guard.props.allowedRoles).toEqual(['assistant'])
  })
})

describe('teacher exams routes', () => {
  it('allows Teacher to use the Admin-style exams module routes', () => {
    const layoutRoute = TeachersRoutes.find((route) => route.children)
    const children = layoutRoute?.children ?? []
    const examsRoute = children.find((route) => route.path === 'exams')
    const createRoute = children.find((route) => route.path === 'exams/create')
    const detailsRoute = children.find((route) => route.path === 'exams/:examId')
    const analysisRoute = children.find((route) => route.path === 'exams/:examId/analysis')

    expect((examsRoute?.element as ReactElement<{ allowedRoles: string[] }>).props.allowedRoles).toEqual([
      'teacher',
      'assistant',
      'admin',
    ])
    expect((createRoute?.element as ReactElement<{ allowedRoles: string[] }>).props.allowedRoles).toEqual([
      'teacher',
      'admin',
    ])
    expect((detailsRoute?.element as ReactElement<{ allowedRoles: string[] }>).props.allowedRoles).toEqual([
      'teacher',
      'assistant',
      'admin',
    ])
    expect((analysisRoute?.element as ReactElement<{ allowedRoles: string[] }>).props.allowedRoles).toEqual([
      'teacher',
      'admin',
    ])
  })
})

describe('teacher announcement details route', () => {
  it('allows teachers to open announcement details', () => {
    const layoutRoute = TeachersRoutes.find((route) => route.children)
    const detailsRoute = layoutRoute?.children?.find((route) => route.path === 'announcement/:announcementId')
    const guard = detailsRoute?.element as ReactElement<{ allowedRoles: string[] }>

    expect(guard.type).toBe(RoleOnly)
    expect(guard.props.allowedRoles).toEqual(['teacher', 'assistant', 'admin'])
  })
})
