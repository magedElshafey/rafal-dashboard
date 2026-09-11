import { BookOpen, ChartNoAxesColumn, GraduationCap } from 'lucide-react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuth } from '@/store/auth'
import type { TSidebarItem } from '@/modules/teachers/layout/constants/sidebar-items'
import SidebarItemsList from './SidebarItemsList'

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))

const sidebarItems: TSidebarItem[] = [
  { labelKey: 'exams', path: '/exams', icon: GraduationCap },
  {
    labelKey: 'reports',
    path: '/reports',
    icon: ChartNoAxesColumn,
    children: [
      { labelKey: 'required-report', path: '/required-report' },
      { labelKey: 'previous-report', path: '/previous-report' },
    ],
  },
  {
    labelKey: 'library',
    path: '/library',
    icon: BookOpen,
    children: [
      { labelKey: 'videos', path: '/library/videos' },
      { labelKey: 'documents', path: '/library/documents' },
    ],
  },
]

function renderSidebar(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SidebarItemsList sidebarItems={sidebarItems} />
    </MemoryRouter>
  )
}

describe('SidebarItemsList active and expanded state', () => {
  beforeEach(() => {
    useAuth.setState({ portal: 'teacher', role: 'teacher' })
  })

  it('activates a single item without activating an unrelated parent', () => {
    renderSidebar('/teacher/exams')

    expect(screen.getByRole('link', { name: 'exams' })).toHaveAttribute('data-active', 'true')
    expect(screen.getByRole('button', { name: 'reports' })).toHaveAttribute('data-active', 'false')
  })

  it('does not activate a parent for a partial route-segment match', () => {
    renderSidebar('/teacher/reports-archive')

    expect(screen.getByRole('button', { name: 'reports' })).toHaveAttribute('data-active', 'false')
    expect(screen.getByRole('button', { name: 'reports' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('marks a manually expanded parent as open and active', async () => {
    const user = userEvent.setup()
    renderSidebar('/teacher/exams')
    const reports = screen.getByRole('button', { name: 'reports' })

    await user.click(reports)

    expect(reports).toHaveAttribute('aria-expanded', 'true')
    expect(reports).toHaveAttribute('data-active', 'true')
    expect(screen.getByRole('link', { name: 'required-report' })).toBeInTheDocument()
  })

  it('hydrates the parent and matching child from a direct deep link', () => {
    renderSidebar('/teacher/required-report/details')

    expect(screen.getByRole('button', { name: 'reports' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: 'reports' })).toHaveAttribute('data-active', 'true')
    expect(screen.getByRole('link', { name: 'required-report' })).toHaveAttribute('data-active', 'true')
    expect(screen.getByRole('link', { name: 'previous-report' })).toHaveAttribute('data-active', 'false')
  })

  it('clears the old parent branch after navigating to a single item', async () => {
    const user = userEvent.setup()
    renderSidebar('/teacher/required-report')

    await user.click(screen.getByRole('link', { name: 'exams' }))

    expect(screen.getByRole('link', { name: 'exams' })).toHaveAttribute('data-active', 'true')
    expect(screen.getByRole('button', { name: 'reports' })).toHaveAttribute('data-active', 'false')
    expect(screen.getByRole('button', { name: 'reports' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('link', { name: 'required-report' })).not.toBeInTheDocument()
  })

  it('clears stale manual expansion after navigation', async () => {
    const user = userEvent.setup()
    renderSidebar('/teacher/home')

    await user.click(screen.getByRole('button', { name: 'reports' }))
    expect(screen.getByRole('button', { name: 'reports' })).toHaveAttribute('data-active', 'true')

    await user.click(screen.getByRole('link', { name: 'exams' }))

    expect(screen.getByRole('button', { name: 'reports' })).toHaveAttribute('data-active', 'false')
    expect(screen.getByRole('button', { name: 'reports' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('link', { name: 'exams' })).toHaveAttribute('data-active', 'true')
  })

  it('switches active and expanded state between parent branches', async () => {
    const user = userEvent.setup()
    renderSidebar('/teacher/required-report')

    await user.click(screen.getByRole('button', { name: 'library' }))
    await user.click(screen.getByRole('link', { name: 'videos' }))

    expect(screen.getByRole('button', { name: 'reports' })).toHaveAttribute('data-active', 'false')
    expect(screen.getByRole('button', { name: 'reports' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('button', { name: 'library' })).toHaveAttribute('data-active', 'true')
    expect(screen.getByRole('button', { name: 'library' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('link', { name: 'videos' })).toHaveAttribute('data-active', 'true')
    expect(screen.getByRole('link', { name: 'documents' })).toHaveAttribute('data-active', 'false')
  })
})
