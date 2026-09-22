import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ThemeProvider } from '@/components/theme/ThemeProvider'
import i18n from '@/config/i18'
import { DashboardShell } from '@/modules/dashboard/layout/DashboardShell'
import { DASHBOARD_SIDEBAR_STORAGE_KEY } from '@/modules/dashboard/layout/sidebar.constants'

function renderShell() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <ThemeProvider>
        <DashboardShell>
          <p>Dashboard content</p>
        </DashboardShell>
      </ThemeProvider>
    </MemoryRouter>
  )
}

function stubDesktopViewport(matches: boolean) {
  vi.stubGlobal('matchMedia', () => ({
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
}

describe('DashboardShell', () => {
  beforeEach(async () => {
    localStorage.clear()
    await i18n.changeLanguage('en')
  })

  afterEach(() => vi.unstubAllGlobals())

  it('uses a valid persisted preference during the initial render', () => {
    localStorage.setItem(DASHBOARD_SIDEBAR_STORAGE_KEY, JSON.stringify({ collapsed: true, width: 320 }))

    renderShell()

    expect(screen.getByTestId('dashboard-shell')).toHaveStyle('--dashboard-sidebar-width: 64px')
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Products' })).toHaveAttribute('href', '/dashboard/products')
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Switch to Arabic' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Use light theme' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open user menu' })).toBeInTheDocument()
  })

  it('updates only the shell width during pointer movement and persists at pointer release', () => {
    renderShell()

    const shell = screen.getByTestId('dashboard-shell')
    const resizeHandle = screen.getByRole('separator', { name: 'Resize sidebar' })

    fireEvent.pointerDown(resizeHandle, { clientX: 256, pointerId: 1 })
    fireEvent.pointerMove(resizeHandle, { clientX: 306, pointerId: 1 })

    expect(shell).toHaveStyle('--dashboard-sidebar-width: 306px')
    expect(localStorage.getItem(DASHBOARD_SIDEBAR_STORAGE_KEY)).toBeNull()

    fireEvent.pointerUp(resizeHandle, { clientX: 306, pointerId: 1 })

    expect(JSON.parse(localStorage.getItem(DASHBOARD_SIDEBAR_STORAGE_KEY) ?? '{}')).toEqual({
      collapsed: false,
      width: 306,
    })
  })

  it('collapses to a navigation rail and restores the expanded width', () => {
    renderShell()

    const shell = screen.getByTestId('dashboard-shell')
    fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }))

    expect(shell).toHaveStyle('--dashboard-sidebar-width: 64px')
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Expand sidebar' }))

    expect(shell).toHaveStyle('--dashboard-sidebar-width: 256px')
  })

  it('supports keyboard resizing within the configured bounds', () => {
    renderShell()

    const resizeHandle = screen.getByRole('separator', { name: 'Resize sidebar' })
    fireEvent.keyDown(resizeHandle, { key: 'End' })

    expect(screen.getByTestId('dashboard-shell')).toHaveStyle('--dashboard-sidebar-width: 360px')
    expect(resizeHandle).toHaveAttribute('aria-valuenow', '360')
  })

  it('resizes toward inline-end in RTL and keeps the desktop sidebar visible', async () => {
    stubDesktopViewport(true)
    await i18n.changeLanguage('ar')
    renderShell()

    const sidebar = screen.getByRole('navigation').closest('aside')
    const resizeHandle = screen.getByRole('separator', { name: 'تغيير حجم الشريط الجانبي' })
    fireEvent.pointerDown(resizeHandle, { clientX: 256, pointerId: 2 })
    fireEvent.pointerMove(resizeHandle, { clientX: 206, pointerId: 2 })
    fireEvent.pointerUp(resizeHandle, { clientX: 206, pointerId: 2 })

    expect(sidebar).toHaveAttribute('data-direction', 'rtl')
    expect(sidebar).not.toHaveAttribute('inert')
    expect(sidebar).not.toHaveClass('md:static')
    expect(screen.getByTestId('dashboard-shell')).toHaveStyle('--dashboard-sidebar-width: 306px')
  })

  it('uses explicit shell areas and preserves sidebar preferences when direction changes', async () => {
    stubDesktopViewport(true)
    localStorage.setItem(DASHBOARD_SIDEBAR_STORAGE_KEY, JSON.stringify({ collapsed: false, width: 320 }))
    renderShell()

    const shell = screen.getByTestId('dashboard-shell')
    const application = screen.getByTestId('dashboard-application')

    expect(shell).toHaveClass('dashboard-shell', 'w-full')
    expect(application).toHaveClass('dashboard-application', 'min-w-0')
    expect(shell).toHaveStyle('--dashboard-sidebar-width: 320px')

    await i18n.changeLanguage('ar')

    expect(document.documentElement).toHaveAttribute('dir', 'rtl')
    expect(shell).toHaveStyle('--dashboard-sidebar-width: 320px')
    expect(JSON.parse(localStorage.getItem(DASHBOARD_SIDEBAR_STORAGE_KEY) ?? '{}')).toEqual({
      collapsed: false,
      width: 320,
    })
  })

  it('recovers from malformed stored preferences', () => {
    localStorage.setItem(DASHBOARD_SIDEBAR_STORAGE_KEY, '{bad json')

    renderShell()

    expect(screen.getByTestId('dashboard-shell')).toHaveStyle('--dashboard-sidebar-width: 256px')
  })

  it('opens and closes the same navigation tree as a mobile overlay', () => {
    stubDesktopViewport(false)

    renderShell()

    const navigation = screen.getByRole('navigation', { hidden: true })
    expect(navigation.closest('aside')).toHaveAttribute('inert')

    fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }))
    expect(navigation.closest('aside')).not.toHaveAttribute('inert')

    fireEvent.click(navigation.closest('aside')!.querySelector('button[aria-label="Close navigation"]')!)
    expect(navigation.closest('aside')).toHaveAttribute('inert')
  })

  it.each([
    ['tablet', 'en', 'ltr'],
    ['tablet', 'ar', 'rtl'],
    ['mobile', 'en', 'ltr'],
    ['mobile', 'ar', 'rtl'],
  ] as const)('keeps the %s drawer direction-aware for %s', async (_viewport, language, direction) => {
    stubDesktopViewport(false)
    await i18n.changeLanguage(language)
    renderShell()

    const sidebar = screen.getByRole('navigation', { hidden: true }).closest('aside')
    expect(document.documentElement).toHaveAttribute('dir', direction)
    expect(sidebar).toHaveAttribute('data-direction', direction)
    expect(sidebar).toHaveAttribute('data-mobile-open', 'false')

    fireEvent.click(screen.getByRole('button', { name: i18n.t('dashboard.topbar.openNavigation') }))
    expect(sidebar).toHaveAttribute('data-mobile-open', 'true')
  })
})
