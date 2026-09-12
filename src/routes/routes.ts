export const Routes = {
  root: '/',

  login: '/login',
  dashboard: '/dashboard',
  roles: '/dashboard/roles',
  admins: '/dashboard/admins',
  errors: {
    unAuthorized: '/401',
    forbidden: '/403',
    internalServerError: '/500',
    maintenanceError: '/maintenance',
    notFound: '*',
  },
} as const
