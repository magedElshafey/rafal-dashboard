import { lazy } from 'react'
import type { RouteObject } from 'react-router'
import { Navigate, Outlet } from 'react-router-dom'

import { RequireAuth } from '@/modules/auth/guards/RequireAuth'
import { DashboardShell } from '@/modules/dashboard/layout/DashboardShell'
import { Routes } from '@/routes/routes'

const DashboardPage = lazy(() => import('@/modules/dashboard/pages/DashboardPage'))
const RolesPage = lazy(() => import('@/modules/roles/pages/RolesPage'))
const AdminsPage = lazy(() => import('@/modules/admins/pages/AdminsPage'))
const BannersPage = lazy(() => import('@/modules/banners/pages/BannersPage'))
const CategoriesPage = lazy(() => import('@/modules/categories/pages/CategoriesPage'))
const WarehousesPage = lazy(() => import('@/modules/warehouses/pages/WarehousesPage'))
const RegionsPage = lazy(() => import('@/modules/regions/pages/RegionsPage'))
const CitiesPage = lazy(() => import('@/modules/cities/pages/CitiesPage'))
const SettingsPage = lazy(() => import('@/modules/settings/pages/SettingsPage'))
const ShippingMethodsPage = lazy(() => import('@/modules/shipping-methods/pages/ShippingMethodsPage'))
const ProductsPage = lazy(() => import('@/modules/products/pages/ProductsPage'))
const ProductCreatePage = lazy(() => import('@/modules/products/pages/ProductCreatePage'))
const ProductEditPage = lazy(() => import('@/modules/products/pages/ProductEditPage'))
const CouponsPage = lazy(() => import('@/modules/coupons/pages/CouponsPage'))
const AboutUsPage = lazy(() => import('@/modules/about-us/pages/AboutUsPage'))
const CustomersPage = lazy(() => import('@/modules/customers/pages/CustomersPage'))
const CustomerDetailPage = lazy(() => import('@/modules/customers/pages/CustomerDetailPage'))
const ReviewsPage = lazy(() => import('@/modules/reviews/pages/ReviewsPage'))
const StaticPagesPage = lazy(() => import('@/modules/static-pages/pages/StaticPagesPage'))
const StaticPageCreatePage = lazy(() => import('@/modules/static-pages/pages/StaticPageCreatePage'))
const StaticPageEditPage = lazy(() => import('@/modules/static-pages/pages/StaticPageEditPage'))

export const PrivateRoutes: RouteObject[] = [
  {
    path: Routes.root,
    element: <Navigate to={Routes.dashboard} replace />,
  },
  {
    element: (
      <RequireAuth>
        <DashboardShell>
          <Outlet />
        </DashboardShell>
      </RequireAuth>
    ),
    children: [
      { path: Routes.dashboard, Component: DashboardPage },
      { path: Routes.roles, Component: RolesPage },
      { path: Routes.admins, Component: AdminsPage },
      { path: Routes.banners, Component: BannersPage },
      { path: Routes.categories, Component: CategoriesPage },
      { path: Routes.warehouses, Component: WarehousesPage },
      { path: Routes.regions, Component: RegionsPage },
      { path: Routes.cities, Component: CitiesPage },
      { path: Routes.settings, Component: SettingsPage },
      { path: Routes.shippingMethods, Component: ShippingMethodsPage },
      { path: Routes.products, Component: ProductsPage },
      { path: Routes.productNew, Component: ProductCreatePage },
      { path: Routes.productEdit, Component: ProductEditPage },
      { path: Routes.coupons, Component: CouponsPage },
      { path: Routes.aboutUs, Component: AboutUsPage },
      { path: Routes.customers, Component: CustomersPage },
      { path: Routes.customerDetail, Component: CustomerDetailPage },
      { path: Routes.reviews, Component: ReviewsPage },
      { path: Routes.staticPages, Component: StaticPagesPage },
      { path: Routes.staticPageNew, Component: StaticPageCreatePage },
      { path: Routes.staticPageEdit, Component: StaticPageEditPage },
    ],
  },
]
