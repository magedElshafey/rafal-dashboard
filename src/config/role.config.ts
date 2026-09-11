import type { AuthPortal, AppRole } from '@/modules/auth/types/auth.types'

type RoleConfig = {
  portal: AuthPortal
  apiBasePath: string

  /**
   * Optional override.
   * Use it only if a specific role should land on a different page
   * than the portal default homePath.
   *
   * Example:
   * assistant -> /teacher/submissions
   */
  homePath?: string
}

export const ROLE_CONFIG: Record<AppRole, RoleConfig> = {
  student: {
    portal: 'user',
    apiBasePath: '/student/v1',
  },

  parent: {
    portal: 'user',
    apiBasePath: '/parent/v1',
  },

  teacher: {
    portal: 'teacher',
    apiBasePath: '/teacher/v1',
  },

  admin: {
    portal: 'teacher',
    apiBasePath: '/teacher/v1/admin',
  },

  assistant: {
    portal: 'teacher',
    apiBasePath: '/teacher/v1/assistant',
  },
}
