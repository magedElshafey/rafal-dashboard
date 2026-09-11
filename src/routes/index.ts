import { ErrorRoutes } from '@/routes/errorRoutes'
import { AuthRoutes } from '@/routes/authRoutes'
import { PrivateRoutes } from '@/routes/privateRoutes'
import { createBrowserRouter, type RouteObject } from 'react-router-dom'

export const AppRoutes: RouteObject[] = [...AuthRoutes, ...PrivateRoutes, ...ErrorRoutes]

export const router = createBrowserRouter(AppRoutes)
