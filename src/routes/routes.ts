export const Routes = {
  root: '/',

  login: '/login',
  dashboard: '/dashboard',
  roles: '/dashboard/roles',
  admins: '/dashboard/admins',
  banners: '/dashboard/banners',
  categories: '/dashboard/categories',
  warehouses: '/dashboard/warehouses',
  regions: '/dashboard/regions',
  cities: '/dashboard/cities',
  settings: '/dashboard/settings',
  shippingMethods: '/dashboard/shipping-methods',
  errors: {
    unAuthorized: '/401',
    forbidden: '/403',
    internalServerError: '/500',
    maintenanceError: '/maintenance',
    notFound: '*',
  },
} as const
