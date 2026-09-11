import { render, screen } from '@testing-library/react'
import { Package } from 'lucide-react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import i18n from '@/config/i18'
import { DashboardNavItem } from '@/modules/dashboard/layout/DashboardNavItem'
import type { DashboardNavigationItem } from '@/modules/dashboard/layout/dashboard-navigation'

const item: DashboardNavigationItem = {
  to: '/dashboard/products',
  labelKey: 'dashboard.products',
  icon: Package,
  match: 'prefix',
}

describe('DashboardNavItem', () => {
  beforeEach(() => void i18n.changeLanguage('en'))

  it('keeps a prefix-matched feature active on deep routes', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/products/123/edit']}>
        <DashboardNavItem item={item} collapsed={false} onNavigate={vi.fn()} />
      </MemoryRouter>
    )

    expect(screen.getByRole('link')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link')).toHaveClass('bg-accent', 'text-primary')
  })

  it('supports exact matching for the dashboard root', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/products']}>
        <DashboardNavItem item={{ ...item, to: '/dashboard', match: 'exact' }} collapsed={false} onNavigate={vi.fn()} />
      </MemoryRouter>
    )

    expect(screen.getByRole('link')).not.toHaveAttribute('aria-current')
  })
})
