export const Routes = {
  root: '/',

  login: '/login',
  dashboard: '/dashboard',
  forgotPassword: '/forget-password',
  resetPassword: '/reset-password',
  resetPasswordVerification: '/reset-password-verifications',

  errors: {
    unAuthorized: '/401',
    forbidden: '/403',
    internalServerError: '/500',
    maintenanceError: '/maintenance',
    notFound: '*',
  },
} as const
