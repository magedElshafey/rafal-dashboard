import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { vi } from 'vitest'
import ContactMessagesPage from '../pages/ContactMessagesPage'
import ContactMessageDetailPage from '../pages/ContactMessageDetailPage'

export function installDomMocks() {
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
}
function Location() {
  return <output data-testid="location">{useLocation().pathname}</output>
}
export function createClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  })
}
export function renderMessages(path = '/dashboard/contact-messages') {
  const client = createClient()
  const result = render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Location />
        <Routes>
          <Route path="/dashboard/contact-messages" element={<ContactMessagesPage />} />
          <Route path="/dashboard/contact-messages/:id" element={<ContactMessageDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
  return { ...result, client }
}
export function queryWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}
