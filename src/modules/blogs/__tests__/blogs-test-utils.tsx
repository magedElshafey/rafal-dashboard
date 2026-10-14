import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { vi } from 'vitest'
import i18n from '@/config/i18'
export async function setupBlogs() {
  await i18n.changeLanguage('en')
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  )
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  )
  Element.prototype.scrollIntoView = vi.fn()
  HTMLElement.prototype.hasPointerCapture = vi.fn(() => false)
  HTMLElement.prototype.setPointerCapture = vi.fn()
  HTMLElement.prototype.releasePointerCapture = vi.fn()
  URL.createObjectURL = vi.fn(() => 'blob:blog-cover')
  URL.revokeObjectURL = vi.fn()
}
function Location() {
  const location = useLocation()
  return <output data-testid="location">{location.search}</output>
}
export function renderBlogs(ui: ReactNode, search = '') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity, staleTime: 300000 }, mutations: { retry: false } },
  })
  return {
    ...render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/dashboard/blogs' + search]}>
          <Location />
          {ui}
        </MemoryRouter>
      </QueryClientProvider>
    ),
    client,
  }
}
export function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}
