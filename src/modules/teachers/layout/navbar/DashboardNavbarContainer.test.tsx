import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuth } from '@/store/auth'
import DashboardNavbarContainer from './DashboardNavbarContainer'

const mocks = vi.hoisted(() => ({ count: vi.fn() }))
vi.mock('@/modules/teachers/shared/notifications/hooks/useTeacherNotifications', () => ({
  useTeacherUnreadNotificationCount: mocks.count,
}))
vi.mock('./DashboardNavbar', () => ({ default: () => <div>Navbar</div> }))

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <DashboardNavbarContainer onOpenMobileSidebar={vi.fn()} />
    </MemoryRouter>
  )
}

describe('DashboardNavbarContainer notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.count.mockReturnValue({ unreadCount: 0 })
  })

  it('does not make a duplicate count request on the notifications page', () => {
    useAuth.setState({ role: 'admin' })
    renderAt('/teacher/notifications')
    expect(mocks.count).toHaveBeenCalledWith({ enabled: false })
  })

  it('enables the count for admin, assistant, and teacher away from the page', () => {
    useAuth.setState({ role: 'admin' })
    const adminView = renderAt('/teacher/home')
    expect(mocks.count).toHaveBeenLastCalledWith({ enabled: true })

    adminView.unmount()
    useAuth.setState({ role: 'assistant' })
    const view = renderAt('/teacher/home')
    expect(mocks.count).toHaveBeenLastCalledWith({ enabled: true })

    view.unmount()
    useAuth.setState({ role: 'teacher' })
    renderAt('/teacher/home')
    expect(mocks.count).toHaveBeenLastCalledWith({ enabled: true })
  })
})
