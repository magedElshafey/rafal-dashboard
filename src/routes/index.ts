import { ErrorRoutes } from '@/routes/errorRoutes'
import { AuthRoutes } from '@/routes/authRoutes'
import { PrivateRoutes } from '@/routes/privateRoutes'
import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import { RouteErrorBoundary } from './RouteErrorBoundary'

export const AppRoutes: RouteObject[] = [...AuthRoutes, ...PrivateRoutes, ...ErrorRoutes].map((route) => {
  // Current routes have one child level. Keep custom component/element boundaries.
  const ErrorBoundary = route.errorElement != null ? undefined : RouteErrorBoundary
  if (route.index) return { ErrorBoundary, ...route }
  return {
    ErrorBoundary,
    ...route,
    children: route.children?.map((child) => ({
      ErrorBoundary: child.errorElement != null ? undefined : RouteErrorBoundary,
      ...child,
    })),
  }
})

export const router = createBrowserRouter(AppRoutes)
