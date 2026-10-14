import { act, fireEvent, render, screen, within, waitFor } from '@testing-library/react'
import { lazy, Suspense } from 'react'
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/config/i18'
import { RouteErrorBoundary } from './RouteErrorBoundary'
import * as recovery from './chunk-recovery'

function mountPage(load: () => Promise<{ default: () => React.ReactNode }>) {
  const Page = lazy(load)
  const router = createMemoryRouter([
    {
      element: (
        <>
          <header>Persistent shell</header>
          <Suspense fallback={<p>Loading</p>}>
            <Outlet />
          </Suspense>
        </>
      ),
      children: [{ path: '/', Component: Page, ErrorBoundary: RouteErrorBoundary }],
    },
  ])
  render(<RouterProvider router={router} />)
  return router
}

describe('route recovery', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(recovery, 'refreshApplication').mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  it('renders a successful lazy route without recovery or reload', async () => {
    mountPage(async () => ({ default: () => <h1>Loaded page</h1> }))
    expect(await screen.findByText('Loaded page')).toBeVisible()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(recovery.refreshApplication).not.toHaveBeenCalled()
  })

  it.each(['en', 'ar'])(
    'handles a rejected lazy import with a persistent shell and explicit refresh in %s',
    async (language) => {
      await i18n.changeLanguage(language)
      mountPage(() =>
        Promise.reject(
          new TypeError('Failed to fetch dynamically imported module: https://example.test/assets/Page-12345678.js')
        )
      )
      const button = await screen.findByRole('button', { name: i18n.t('routeRecovery.refresh') })
      expect(screen.getByText('Persistent shell')).toBeVisible()
      expect(screen.getByRole('heading')).toHaveFocus()
      expect(document.documentElement.dir).toBe(language === 'ar' ? 'rtl' : 'ltr')
      expect(recovery.refreshApplication).not.toHaveBeenCalled()
      fireEvent.click(button)
      const dialog = screen.getByRole('alertdialog')
      expect(dialog).toHaveAccessibleDescription(i18n.t('routeRecovery.unsaved'))
      const cancel = within(dialog).getByRole('button', { name: i18n.t('button.cancel') })
      expect(cancel).toHaveFocus()
      fireEvent.click(cancel)
      expect(recovery.refreshApplication).not.toHaveBeenCalled()
      await waitFor(() => expect(button).toHaveFocus())
      fireEvent.click(button)
      fireEvent.click(
        within(screen.getByRole('alertdialog')).getByRole('button', { name: i18n.t('routeRecovery.refresh') })
      )
      expect(recovery.refreshApplication).toHaveBeenCalledTimes(1)
    }
  )

  it('does not describe an unrelated runtime exception as a deployment failure', async () => {
    mountPage(async () => ({
      default: () => {
        throw new Error('Render bug')
      },
    }))
    expect(await screen.findByRole('heading')).toHaveTextContent(i18n.t('routeRecovery.unexpected.title'))
    expect(screen.queryByText(i18n.t('routeRecovery.description'))).not.toBeInTheDocument()
    expect(recovery.refreshApplication).not.toHaveBeenCalled()
  })

  it.each([
    [401, 'unauthorized'],
    [403, 'forbidden'],
    [404, 'notFound'],
    [500, 'server'],
    [503, 'server'],
    [400, 'request'],
  ] as const)('classifies HTTP %s and offers appropriate actions', async (status, kind) => {
    const router = createMemoryRouter([
      {
        path: '/',
        loader: () => {
          throw new Response('Sensitive response must not be rendered', { status })
        },
        ErrorBoundary: RouteErrorBoundary,
      },
    ])
    render(<RouterProvider router={router} />)
    expect(await screen.findByText(i18n.t('routeRecovery.status', { status }))).toBeVisible()
    expect(screen.queryByText(i18n.t('routeRecovery.description'))).not.toBeInTheDocument()
    expect(screen.getByRole('heading')).toHaveTextContent(i18n.t(`routeRecovery.${kind}.title`))
    expect(screen.getByRole('link', { name: i18n.t('errors.back_to_home') })).toHaveAttribute('href', '/')
    expect(screen.queryByRole('link', { name: i18n.t('routeRecovery.signIn') }) !== null).toBe(status === 401)
    expect(screen.queryByRole('button', { name: i18n.t('routeRecovery.refresh') }) !== null).toBe(status >= 500)
    expect(screen.queryByText('Sensitive response must not be rendered')).not.toBeInTheDocument()
  })

  it('offers recovery offline without asserting that a deployment happened', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    mountPage(() => Promise.reject(new TypeError('Importing a module script failed.')))
    expect(await screen.findByText(i18n.t('routeRecovery.description'))).toBeVisible()
    expect(console.warn).toHaveBeenCalledWith(
      'Application chunk unavailable',
      expect.objectContaining({ connectivity: 'offline' })
    )
    expect(recovery.refreshApplication).not.toHaveBeenCalled()
  })

  it('does not suppress Vite rejections, deduplicates diagnostics, and cleans up the listener', () => {
    const remove = recovery.installChunkErrorListener()
    const error = new TypeError(
      'Failed to fetch dynamically imported module: https://example.test/assets/Page-12345678.js?token=secret'
    )
    const event = Object.assign(new Event('vite:preloadError', { cancelable: true }), { payload: error })
    act(() => {
      window.dispatchEvent(event)
    })
    recovery.reportChunkLoadError(error)
    expect(event.defaultPrevented).toBe(false)
    expect(console.warn).toHaveBeenCalledTimes(1)
    expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain('secret')
    remove()
    window.dispatchEvent(
      Object.assign(new Event('vite:preloadError'), { payload: new TypeError('Importing a module script failed.') })
    )
    expect(console.warn).toHaveBeenCalledTimes(1)
  })

  it.each([new TypeError('Failed to fetch'), new Error('Render bug'), { status: 404 }, null])(
    'does not classify unrelated errors: %s',
    (error) => {
      expect(recovery.isChunkLoadError(error)).toBe(false)
    }
  )
})

// These assertions check rule scope; Vercel preview must still verify HTTP behavior.
describe('deployment configuration and boundary registration', () => {
  it('installs eager recovery on the deployed routes and dashboard children', async () => {
    const { AppRoutes, router } = await import('./index')
    expect(AppRoutes.every((route) => route.ErrorBoundary === RouteErrorBoundary)).toBe(true)
    const pages = AppRoutes.flatMap((route) => route.children ?? []).find((route) => route.path === '/dashboard/pages')
    expect(pages?.ErrorBoundary).toBe(RouteErrorBoundary)
    expect(pages?.Component).toBeDefined()
    router.dispose()
  })

  it('excludes assets and APIs from SPA HTML and keeps cache policies disjoint', async () => {
    const { default: config } = await import('../../vercel.json')
    const spa = new RegExp(`^${config.rewrites[0].source}$`)
    const immutable = new RegExp(`^${config.headers[2].source.replace(':file', '')}$`)
    for (const path of ['/', '/login', '/dashboard/pages', '/dashboard/pages/12/edit'])
      expect(spa.test(path)).toBe(true)
    for (const path of ['/assets/missing.js', '/api', '/api/orders', '/favicon.ico', '/missing.js/', '/index.html'])
      expect(spa.test(path)).toBe(false)
    for (const path of [
      '/assets/Page-Abc_1234.js',
      '/assets/index-Abc-1234.css',
      '/assets/products.keys-Abc_1234.js',
    ]) {
      expect(immutable.test(path)).toBe(true)
      expect(spa.test(path)).toBe(false)
    }
    for (const path of ['/index.html', '/assets/config.js', '/api/private']) expect(immutable.test(path)).toBe(false)
  })
})

it.each([
  new TypeError('Failed to fetch dynamically imported module: https://example.test/assets/Page-12345678.js'),
  new TypeError('error loading dynamically imported module: https://example.test/assets/Page-12345678.js'),
  new TypeError('Importing a module script failed.'),
  new Error('Unable to preload CSS for /assets/Page-12345678.css'),
])('recognizes supported native/Vite signatures: %s', (error) => {
  expect(recovery.isChunkLoadError(error)).toBe(true)
})

it('does not suppress or misreport module evaluation errors from Vite', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const remove = recovery.installChunkErrorListener()
  try {
    const event = Object.assign(new Event('vite:preloadError', { cancelable: true }), {
      payload: new SyntaxError('Invalid module'),
    })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
    expect(warn).not.toHaveBeenCalled()
    recovery.reportChunkLoadError(
      new TypeError(
        'Failed to fetch dynamically imported module: https://example.test/assets/products.keys-12345678.js?secret=hidden'
      )
    )
    expect(warn).toHaveBeenCalledWith(
      'Application chunk unavailable',
      expect.objectContaining({ asset: 'products.keys-12345678.js' })
    )
    expect(JSON.stringify(warn.mock.calls)).not.toContain('hidden')
  } finally {
    remove()
    warn.mockRestore()
  }
})
