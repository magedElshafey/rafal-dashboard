import { act, fireEvent, render, screen } from '@testing-library/react'
import { lazy, Suspense } from 'react'
import { MemoryRouter, useRoutes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ThemeProvider } from '@/components/theme/ThemeProvider'
import i18n from '@/config/i18'
import { PrivateRoutes } from '@/routes/privateRoutes'
import { Routes } from '@/routes/routes'
import { useAuth } from '@/store/auth'

describe('dashboard route chunk loading', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuth.setState({ isAuthenticated: true })
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  })

  afterEach(() => {
    useAuth.setState({ token: null, admin: null, isAuthenticated: false })
    vi.unstubAllGlobals()
  })

  it.each([
    ['navigation', 'en'],
    ['navigation', 'ar'],
    ['initial visit', 'en'],
    ['initial visit', 'ar'],
  ] as const)('keeps the real private shell visible during %s in %s', async (entry, language) => {
    await i18n.changeLanguage(language)
    const Destination = () => <h1>Destination page</h1>
    let resolveModule!: (module: { default: typeof Destination }) => void
    const pendingModule = new Promise<{ default: typeof Destination }>((resolve) => {
      resolveModule = resolve
    })
    const LazyDestination = lazy(() => pendingModule)
    const privateLayout = PrivateRoutes.find((route) => route.children)
    if (!privateLayout) throw new Error('Expected the private dashboard layout')
    const layoutElement = privateLayout.element

    function TestRoutes() {
      return useRoutes([
        {
          element: layoutElement,
          children: [
            { path: Routes.dashboard, element: <h1>Current page</h1> },
            { path: Routes.products, Component: LazyDestination },
          ],
        },
      ])
    }
    const { unmount } = render(
      <ThemeProvider>
        <Suspense fallback={<p>Outer route fallback</p>}>
          <MemoryRouter initialEntries={[entry === 'navigation' ? Routes.dashboard : Routes.products]}>
            <TestRoutes />
          </MemoryRouter>
        </Suspense>
      </ThemeProvider>
    )

    const shell = screen.getByTestId('dashboard-shell')
    const sidebar = screen.getByRole('navigation').closest('aside')
    const topbar = screen.getByRole('banner')
    const content = shell.querySelector('.dashboard-content')
    const shellWidth = shell.style.getPropertyValue('--dashboard-sidebar-width')
    const theme = document.documentElement.className
    const direction = document.documentElement.dir

    if (entry === 'navigation') {
      expect(screen.getByRole('heading', { name: 'Current page' })).toBeVisible()
      fireEvent.click(screen.getByRole('link', { name: i18n.t('dashboard.sidebar.products') }))
    }

    const status = await screen.findByRole('status')
    expect(status).toHaveTextContent(i18n.t('routeLoading.label'))
    expect(content).toContainElement(status)
    expect(shell).toBeVisible()
    expect(sidebar).toBeVisible()
    expect(topbar).toBeVisible()
    expect(screen.queryByText('Outer route fallback')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Destination page' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Current page' })).not.toBeInTheDocument()

    await act(async () => {
      resolveModule({ default: Destination })
      await pendingModule
    })

    expect(screen.getByRole('heading', { name: 'Destination page' })).toBeVisible()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByTestId('dashboard-shell')).toBe(shell)
    expect(screen.getByRole('navigation').closest('aside')).toBe(sidebar)
    expect(screen.getByRole('banner')).toBe(topbar)
    expect(shell.querySelector('.dashboard-content')).toBe(content)
    expect(shell.style.getPropertyValue('--dashboard-sidebar-width')).toBe(shellWidth)
    expect(document.documentElement.className).toBe(theme)
    expect(document.documentElement.dir).toBe(direction)
    unmount()
  })
})
