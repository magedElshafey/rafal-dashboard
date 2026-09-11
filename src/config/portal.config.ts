import type { AuthPortal, AppRole } from '@/modules/auth/types/auth.types'

type PortalConfig = {
  rootPath: string
  loginPath: string
  homePath: string
  authEndpoint: string
  allowedRoles: AppRole[]
}

export const PORTAL_CONFIG: Record<AuthPortal, PortalConfig> = {
  user: {
    rootPath: '/user',
    loginPath: '/user/login',
    homePath: '/user/home',
    authEndpoint: '/user/v1/auth',
    allowedRoles: ['student', 'parent'],
  },

  teacher: {
    rootPath: '/teacher',
    loginPath: '/teacher/login',
    homePath: '/teacher/home',
    authEndpoint: '/teacher/v1/auth',
    allowedRoles: ['teacher', 'admin', 'assistant'],
  },
}
