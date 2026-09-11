import { joinPath } from '@/components/core/portal-link/utils/url'
import { getPortalByPathname, getPortalConfig } from '@/config/auth.helpers'

import type { AuthPortal } from '@/modules/auth/types/auth.types'

type BuildPortalPathOptions = {
  portal?: AuthPortal | null
  pathname?: string
}

export function buildPortalPath(to: string, options: BuildPortalPathOptions = {}) {
  if (!to) return to

  const portal = options.portal ?? (options.pathname ? getPortalByPathname(options.pathname) : null)

  if (!portal) {
    return to
  }

  const portalRootPath = getPortalConfig(portal).rootPath
  const normalizedTo = joinPath(to)

  if (normalizedTo === portalRootPath || normalizedTo.startsWith(`${portalRootPath}/`)) {
    return normalizedTo
  }

  return joinPath(portalRootPath, normalizedTo)
}
