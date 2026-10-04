import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { vi } from 'vitest'

export function installDomMocks() {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  )
  vi.stubGlobal(
    'ResizeObserver',
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
}
function Location() {
  const location = useLocation()
  const navigate = useNavigate()
  return (
    <>
      <output data-testid="location">
        {location.pathname}
        {location.search}
      </output>
      <button onClick={() => navigate(-1)}>Test back</button>
    </>
  )
}
export function renderOrders(element: ReactNode, path = '/dashboard/orders') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  const result = render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Location />
        <Routes>
          <Route path="/dashboard/orders" element={element} />
          <Route path="/dashboard/orders/:id" element={element} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
  return { ...result, client }
}
