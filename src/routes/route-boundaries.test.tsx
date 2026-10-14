import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { useAuth } from '@/store/auth'
import i18n from '@/config/i18'

// Fixtures exercise both supported custom-boundary forms without changing production routes.
const custom = vi.hoisted(() => ({ Boundary: () => null }))
vi.mock('./authRoutes', () => ({
  AuthRoutes: [
    { path: '/custom', ErrorBoundary: custom.Boundary, children: [{ index: true, errorElement: 'Custom child' }] },
    {
      path: '/custom-element',
      errorElement: 'Custom parent',
      children: [{ index: true, ErrorBoundary: custom.Boundary }],
    },
  ],
}))

describe('boundary registration', () => {
  it('preserves custom boundaries and the actual dashboard layout on a child failure', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {})
    useAuth.setState({ isAuthenticated: true })
    const { AppRoutes, router } = await import('./index')
    try {
      expect(AppRoutes[0].ErrorBoundary).toBe(custom.Boundary)
      expect(AppRoutes[0].children?.[0].errorElement).toBe('Custom child')
      expect(AppRoutes[0].children?.[0].ErrorBoundary).toBeUndefined()
      expect(AppRoutes[1].errorElement).toBe('Custom parent')
      expect(AppRoutes[1].ErrorBoundary).toBeUndefined()
      expect(AppRoutes[1].children?.[0].ErrorBoundary).toBe(custom.Boundary)
      expect(AppRoutes.flatMap((r) => r.children ?? []).every((r) => !r.children)).toBe(true)
      const layout = AppRoutes.find((r) => r.children?.some((c) => c.path === '/dashboard/pages'))!
      if (layout.index || !layout.children) throw new Error('Expected dashboard layout children')
      const page = layout.children.find((c) => c.path === '/dashboard/pages')!
      function BrokenPage(): never {
        throw new Error('Render failure')
      }
      const memory = createMemoryRouter([{ ...layout, children: [{ ...page, Component: BrokenPage }] }], {
        initialEntries: ['/dashboard/pages'],
      })
      const view = render(
        <ThemeProvider>
          <RouterProvider router={memory} />
        </ThemeProvider>
      )
      expect(await screen.findByRole('heading', { name: i18n.t('routeRecovery.unexpected.title') })).toBeVisible()
      expect(screen.getByTestId('dashboard-shell')).toBeVisible()
      expect(screen.getByRole('navigation')).toBeVisible()
      expect(screen.getByRole('banner')).toBeVisible()
      view.unmount()
      memory.dispose()
    } finally {
      router.dispose()
      useAuth.setState({ isAuthenticated: false, token: null, admin: null })
      errorLog.mockRestore()
      vi.unstubAllGlobals()
    }
  })
})
