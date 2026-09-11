import { Home } from 'lucide-react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { useAuth } from '@/store/auth'
import DashboardContent from './DashboardContent'

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))

describe('DashboardContent account actions', () => {
  it('removes Settings and Logout without changing legitimate sidebar items', () => {
    useAuth.setState({ portal: 'teacher', role: 'teacher' })
    render(
      <MemoryRouter
        initialEntries={['/teacher/home']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <DashboardContent sidebarItems={[{ labelKey: 'teachers_layout.home', path: '/home', icon: Home }]} />
      </MemoryRouter>
    )

    const home = screen.getByRole('link', { name: 'teachers_layout.home' })

    expect(home).toHaveAttribute('href', '/teacher/home')
    expect(home).not.toHaveClass('lg:hidden')
    expect(screen.queryByRole('link', { name: 'settings.title' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'button.logout' })).not.toBeInTheDocument()
  })
})
