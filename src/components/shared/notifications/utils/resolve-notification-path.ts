import {
  NotificationNavigation,
  NotificationNavigationType,
} from '@/components/shared/notifications/types/notifications.types'
import { getPortalConfig } from '@/config/auth.helpers'

import type { AppRole, AuthPortal } from '@/modules/auth/types/auth.types'

const RELATIVE_NOTIFICATION_PATH_BY_TYPE: Partial<Record<NotificationNavigationType, string>> = {
  home: '/home',
  assignments: '/assignments',
  exams: '/exams',
  reports: '/reports',
  profile: '/profile',
  settings: '/profile',
}

function isSafePortalPath(path: string, portalRootPath: string) {
  return path.startsWith(`${portalRootPath}/`) || path === portalRootPath
}

function canonicalizeBackendPath(path: string, portalRootPath: string, role: AppRole | null) {
  if (!path.startsWith('/') || path.startsWith('//') || !isSafePortalPath(path, portalRootPath)) {
    return null
  }

  if (portalRootPath === '/user') {
    if (role === 'parent' && /^\/user\/(?:tasks|course|library|to-do-list)(?:[/?#]|$)/.test(path)) {
      return '/user/reports'
    }

    if (/^\/user\/courses(?:[/?#]|$)/.test(path)) {
      return role === 'parent' ? '/user/reports' : '/user/course'
    }

    const examPathMatch = path.match(/^\/user\/exams(?:\/([^/?#]+))?/)
    const examSegment = examPathMatch?.[1]

    if (
      examSegment &&
      examSegment !== 'extension-sent' &&
      examSegment !== 'mcq' &&
      examSegment !== 'online' &&
      examSegment !== 'parent-supervision'
    ) {
      return '/user/exams'
    }
  }

  return path
}

export function resolveNotificationPath(
  navigation: NotificationNavigation,
  portal: AuthPortal | null,
  role: AppRole | null = null
) {
  if (!portal) {
    return null
  }

  const portalRootPath = getPortalConfig(portal).rootPath

  if (navigation.path) {
    const backendPath = canonicalizeBackendPath(navigation.path, portalRootPath, role)

    if (backendPath) {
      return backendPath
    }
  }

  if (navigation.type === 'none') {
    return null
  }

  const entityId = navigation.entityId

  switch (navigation.type) {
    case 'assignment-details':
      return entityId ? `${portalRootPath}/assignments/${entityId}` : `${portalRootPath}/assignments`

    case 'exam-details':
      // Exam detail routes require a subtype. The notification contract does
      // not provide one, so routing by ID would recreate the removed ambiguous
      // URL and could expose the wrong role flow. Fall back to type selection.
      return `${portalRootPath}/exams`

    case 'course-details':
    case 'courses':
      if (portalRootPath === '/user') {
        return role === 'parent' ? `${portalRootPath}/reports` : `${portalRootPath}/course`
      }

      return entityId ? `${portalRootPath}/courses/${entityId}` : `${portalRootPath}/courses`

    default: {
      const relativePath = RELATIVE_NOTIFICATION_PATH_BY_TYPE[navigation.type]

      return relativePath ? `${portalRootPath}${relativePath}` : null
    }
  }
}
