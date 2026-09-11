import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { RequireAuth } from '@/modules/auth/guards/RequireAuth'
import { useAuth } from '@/store/auth'

describe('core routes', () => {
  beforeEach(() => {
    useAuth.setState({ token: null, role: null, user: null, isAuthenticated: false })
  })

  it('redirects unauthenticated dashboard access to /login', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/login" element={<p>Login page</p>} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <p>Private dashboard</p>
              </RequireAuth>
            }
          />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.queryByText('Private dashboard')).not.toBeInTheDocument()
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('renders the dashboard for an authenticated session', () => {
    useAuth.setState({
      token: 'token',
      role: null,
      user: { id: '1', name: 'Admin', phone: null },
      isAuthenticated: true,
    })

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <p>Private dashboard</p>
              </RequireAuth>
            }
          />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Private dashboard')).toBeInTheDocument()
  })
})
