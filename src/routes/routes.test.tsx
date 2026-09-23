import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RequireAuth } from '@/modules/auth/guards/RequireAuth'
import { PrivateRoutes } from '@/routes/privateRoutes'
import { Routes as AppRoutes } from '@/routes/routes'
import { useAuth } from '@/store/auth'

const environment = vi.hoisted(() => ({ authBypass: false }))

vi.mock('@/config/env', () => ({
  default: {
    get AUTH_BYPASS() {
      return environment.authBypass
    },
  },
}))

describe('core routes', () => {
  beforeEach(() => {
    environment.authBypass = false
    useAuth.setState({ token: null, role: null, user: null, isAuthenticated: false })
  })

  it('defines Product Index, Create, and Edit routes without future child-resource routes', () => {
    const privatePaths = PrivateRoutes.flatMap((route) => route.children?.map((child) => child.path) ?? [])

    expect(AppRoutes.products).toBe('/dashboard/products')
    expect(AppRoutes.productNew).toBe('/dashboard/products/new')
    expect(privatePaths).toContain('/dashboard/products')
    expect(privatePaths).toContain('/dashboard/products/new')
    expect(AppRoutes.productEdit).toBe('/dashboard/products/:id/edit')
    expect(AppRoutes.productEditPath(17)).toBe('/dashboard/products/17/edit')
    expect(privatePaths).toContain('/dashboard/products/:id/edit')
    expect(privatePaths).not.toContain('/dashboard/products/:id/variants')
    expect(privatePaths).not.toContain('/dashboard/products/:id/stocks')
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

  it('renders the dashboard without a session when the development bypass is enabled', () => {
    environment.authBypass = true

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
