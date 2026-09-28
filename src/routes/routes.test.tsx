import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { RequireAuth } from '@/modules/auth/guards/RequireAuth'
import { PrivateRoutes } from '@/routes/privateRoutes'
import { Routes as AppRoutes } from '@/routes/routes'
import { useAuth } from '@/store/auth'

describe('core routes', () => {
  beforeEach(() => {
    useAuth.setState({ token: null, admin: null, isAuthenticated: false })
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

  it('defines the Coupons route', () => {
    const privatePaths = PrivateRoutes.flatMap((route) => route.children?.map((child) => child.path) ?? [])

    expect(AppRoutes.coupons).toBe('/dashboard/coupons')
    expect(privatePaths).toContain('/dashboard/coupons')
  })

  it('redirects unauthenticated dashboard access to login', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path={'/login'} element={<p>Login page</p>} />
          <Route
            path={'/dashboard'}
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

  it('renders the dashboard for an authenticated persisted session', () => {
    useAuth.setState({
      token: 'token',
      admin: {
        id: 1,
        name: 'Admin',
        email: 'admin@example.com',
        roles: ['Super Admin'],
      },
      isAuthenticated: true,
    })

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path={'/dashboard'}
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
