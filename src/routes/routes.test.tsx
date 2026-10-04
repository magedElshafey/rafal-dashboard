import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { RequireAuth } from '@/modules/auth/guards/RequireAuth'
import { PrivateRoutes } from '@/routes/privateRoutes'
import { Routes as AppRoutes } from '@/routes/routes'
import { useAuth } from '@/store/auth'

describe('core routes', () => {
  it('registers only Orders Index and full-page Detail as lazy routes', () => {
    const children = PrivateRoutes.flatMap((route) => route.children ?? [])
    expect(children.find((route) => route.path === AppRoutes.orders)?.Component).toBeDefined()
    expect(children.find((route) => route.path === AppRoutes.orderDetail)?.Component).toBeDefined()
    expect(AppRoutes.orderDetailPath(21)).toBe('/dashboard/orders/21')
    expect(children.filter((route) => route.path?.startsWith('/dashboard/orders')).map((route) => route.path)).toEqual([
      '/dashboard/orders',
      '/dashboard/orders/:id',
    ])
  })
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

  it('defines the About Us singleton route', () => {
    const privatePaths = PrivateRoutes.flatMap((route) => route.children?.map((child) => child.path) ?? [])

    expect(AppRoutes.aboutUs).toBe('/dashboard/about-us')
    expect(privatePaths).toContain('/dashboard/about-us')
  })

  it('defines the Customer Index and Detail routes', () => {
    const privatePaths = PrivateRoutes.flatMap((route) => route.children?.map((child) => child.path) ?? [])

    expect(AppRoutes.customers).toBe('/dashboard/customers')
    expect(AppRoutes.customerDetail).toBe('/dashboard/customers/:id')
    expect(AppRoutes.customerDetailPath(6)).toBe('/dashboard/customers/6')
    expect(privatePaths).toContain('/dashboard/customers')
    expect(privatePaths).toContain('/dashboard/customers/:id')
  })

  it('defines only the Product Reviews Index route', () => {
    const privatePaths = PrivateRoutes.flatMap((route) => route.children?.map((child) => child.path) ?? [])

    expect(AppRoutes.reviews).toBe('/dashboard/reviews')
    expect(privatePaths).toContain('/dashboard/reviews')
    expect(privatePaths).not.toContain('/dashboard/reviews/:id')
  })

  it('defines only the Testimonials Index route', () => {
    const privatePaths = PrivateRoutes.flatMap((route) => route.children?.map((child) => child.path) ?? [])

    expect(AppRoutes.testimonials).toBe('/dashboard/testimonials')
    expect(privatePaths).toContain('/dashboard/testimonials')
    expect(privatePaths).not.toContain('/dashboard/testimonials/:id')
  })

  it('defines the Static Pages Index, Create, and Edit routes without unsupported actions', () => {
    const privatePaths = PrivateRoutes.flatMap((route) => route.children?.map((child) => child.path) ?? [])

    expect(AppRoutes.staticPages).toBe('/dashboard/pages')
    expect(AppRoutes.staticPageNew).toBe('/dashboard/pages/new')
    expect(AppRoutes.staticPageEdit).toBe('/dashboard/pages/:id/edit')
    expect(AppRoutes.staticPageEditPath(9)).toBe('/dashboard/pages/9/edit')
    expect(privatePaths).toEqual(
      expect.arrayContaining(['/dashboard/pages', '/dashboard/pages/new', '/dashboard/pages/:id/edit'])
    )
    expect(privatePaths).not.toContain('/dashboard/pages/:id/delete')
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
