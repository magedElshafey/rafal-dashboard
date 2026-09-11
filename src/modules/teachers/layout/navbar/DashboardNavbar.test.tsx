import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AUTH_STORAGE_KEY, useAuth } from '@/store/auth'
import DashboardNavbar from './DashboardNavbar'

const mocks = vi.hoisted(() => ({ logout: vi.fn() }))

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
vi.mock('@/modules/auth/hooks/useLogout', () => ({ useLogout: () => mocks.logout }))

describe('DashboardNavbar account dropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    useAuth.setState({ portal: 'teacher', role: 'admin', user: { name: 'Teacher Account' } as never })
  })

  it.each(['admin', 'assistant', 'teacher'] as const)('renders the shared account menu for the %s role', (role) => {
    useAuth.setState({ portal: 'teacher', role, user: { name: 'Teacher Account' } as never })
    render(
      <MemoryRouter
        initialEntries={['/teacher/home']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <DashboardNavbar onOpenMobileSidebar={vi.fn()} />
      </MemoryRouter>
    )

    const trigger = screen.getByRole('button', { name: 'users_layout.user_menu' })
    expect(trigger).toHaveClass('flex')
    expect(trigger).not.toHaveClass('hidden', 'lg:flex')
    expect(trigger.parentElement).toHaveClass('ms-auto')
  })

  it('renders the canonical Notifications link for Teacher when enabled', () => {
    useAuth.setState({ portal: 'teacher', role: 'teacher', user: { name: 'Teacher Account' } as never })
    render(
      <MemoryRouter
        initialEntries={['/teacher/home']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <DashboardNavbar showNotifications unreadCount={0} onOpenMobileSidebar={vi.fn()} />
      </MemoryRouter>
    )

    expect(screen.getByRole('link', { name: 'shared.notification.aria.trigger' })).toHaveAttribute(
      'href',
      '/teacher/notifications'
    )
  })

  it('opens a portal-aware menu containing only Settings and Logout', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter
        initialEntries={['/teacher/home']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <DashboardNavbar onOpenMobileSidebar={vi.fn()} />
      </MemoryRouter>
    )

    const trigger = screen.getByRole('button', { name: 'users_layout.user_menu' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await user.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(await screen.findAllByRole('menuitem')).toHaveLength(2)
    expect(screen.getByRole('menuitem', { name: 'settings.title' })).toHaveAttribute('href', '/teacher/settings')
    expect(screen.getByRole('menuitem', { name: 'button.logout' })).toBeInTheDocument()
  })

  it('adds Profile only for Assistant while preserving Settings and Logout', async () => {
    const user = userEvent.setup()
    useAuth.setState({ portal: 'teacher', role: 'assistant', user: { name: 'Assistant Account' } as never })
    render(
      <MemoryRouter
        initialEntries={['/teacher/home']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <DashboardNavbar onOpenMobileSidebar={vi.fn()} />
      </MemoryRouter>
    )

    await user.click(screen.getByRole('button', { name: 'users_layout.user_menu' }))

    expect(screen.getByRole('menuitem', { name: 'profile.title' })).toHaveAttribute('href', '/teacher/profile')
    expect(screen.getByRole('menuitem', { name: 'settings.title' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'button.logout' })).toBeInTheDocument()
  })

  it('reflects an authenticated Assistant name merge immediately', () => {
    const storedUser = {
      id: 'assistant-1',
      role: 'assistant',
      name: 'Old Assistant',
      email: 'old@example.com',
      phone: '1200000002',
      group: { id: 'group-1', name: 'Group', parent: { id: 'main-1', name: 'Main' } },
      has_notifications: true,
    }
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        token: 'test-token',
        role: 'assistant',
        portal: 'teacher',
        persistence: 'persistent',
        user: storedUser,
      })
    )
    useAuth.setState({ portal: 'teacher', role: 'assistant', user: storedUser as never, isAuthenticated: true })
    render(
      <MemoryRouter
        initialEntries={['/teacher/home']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <DashboardNavbar onOpenMobileSidebar={vi.fn()} />
      </MemoryRouter>
    )

    expect(screen.getByText('Old Assistant')).toBeInTheDocument()
    act(() => useAuth.getState().updateUserData({ name: 'Updated Assistant' }))

    expect(screen.getByText('Updated Assistant')).toBeInTheDocument()
    expect(useAuth.getState().user).toMatchObject({
      name: 'Updated Assistant',
      email: 'old@example.com',
      has_notifications: true,
    })
  })

  it.each(['admin', 'teacher'] as const)('does not add the Assistant Profile entry for %s', async (role) => {
    const user = userEvent.setup()
    useAuth.setState({ portal: 'teacher', role, user: { name: 'Teacher Account' } as never })
    render(
      <MemoryRouter
        initialEntries={['/teacher/home']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <DashboardNavbar onOpenMobileSidebar={vi.fn()} />
      </MemoryRouter>
    )

    await user.click(screen.getByRole('button', { name: 'users_layout.user_menu' }))

    expect(screen.queryByRole('menuitem', { name: 'profile.title' })).not.toBeInTheDocument()
  })

  it('uses the shared confirmation before Teacher Portal logout', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter
        initialEntries={['/teacher/home']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <DashboardNavbar onOpenMobileSidebar={vi.fn()} />
      </MemoryRouter>
    )

    await user.click(screen.getByRole('button', { name: 'users_layout.user_menu' }))
    await user.click(await screen.findByRole('menuitem', { name: 'button.logout' }))

    expect(await screen.findByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'auth.logout.title' })).toBeInTheDocument()
    expect(mocks.logout).not.toHaveBeenCalled()
  })
})
