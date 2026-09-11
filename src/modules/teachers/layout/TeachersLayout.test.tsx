import { fireEvent, render, screen } from '@testing-library/react'
import { lazy, useEffect } from 'react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import TeachersLayout from '@/modules/teachers/layout/TeachersLayout'

const runtime = vi.hoisted(() => ({ mounts: 0, unmounts: 0 }))

vi.mock('@/modules/teachers/layout/components/DashboardChrome', () => ({
  default: () => <nav>teacher-navigation</nav>,
}))

vi.mock('@/modules/teachers/Teacher/session/persistent/TeacherSessionMeetingProvider', () => ({
  TeacherSessionMeetingProvider: ({ children }: { children: ReactNode }) => children,
  TeacherSessionMeetingHost: () => {
    useEffect(() => {
      runtime.mounts += 1
      return () => {
        runtime.unmounts += 1
      }
    }, [])
    return <div data-testid="persistent-meeting-host">persistent-meeting</div>
  },
}))

function HomePage() {
  const navigate = useNavigate()
  return (
    <button type="button" onClick={() => navigate('/teacher/lazy-route')}>
      open-lazy-route
    </button>
  )
}

describe('TeachersLayout persistent meeting boundary', () => {
  beforeEach(() => {
    runtime.mounts = 0
    runtime.unmounts = 0
  })

  it('keeps the persistent host mounted while a child route suspends', () => {
    const LazyRoute = lazy(() => new Promise<never>(() => undefined))

    render(
      <MemoryRouter initialEntries={['/teacher/home']}>
        <Routes>
          <Route path="/teacher" element={<TeachersLayout />}>
            <Route path="home" element={<HomePage />} />
            <Route path="lazy-route" element={<LazyRoute />} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    expect(runtime.mounts).toBe(1)
    fireEvent.click(screen.getByRole('button', { name: 'open-lazy-route' }))

    expect(screen.getByTestId('persistent-meeting-host')).toBeInTheDocument()
    expect(runtime.mounts).toBe(1)
    expect(runtime.unmounts).toBe(0)
  })
})
