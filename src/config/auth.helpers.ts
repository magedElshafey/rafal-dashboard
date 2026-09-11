import { joinPath } from '@/components/core/portal-link/utils/url'
import { PORTAL_CONFIG } from '@/config/portal.config'
import { ROLE_CONFIG } from '@/config/role.config'

import type { AuthPortal, AppRole } from '@/modules/auth/types/auth.types'

export function getPortalByRole(role: AppRole): AuthPortal {
  return ROLE_CONFIG[role].portal
}

export function getPortalConfig(portal: AuthPortal) {
  return PORTAL_CONFIG[portal]
}

export function getRoleConfig(role: AppRole) {
  return ROLE_CONFIG[role]
}

export function getHomePathByPortal(portal: AuthPortal) {
  return PORTAL_CONFIG[portal].homePath
}

export function getHomePathByRole(role: AppRole) {
  const roleConfig = ROLE_CONFIG[role]
  const portalConfig = PORTAL_CONFIG[roleConfig.portal]

  return roleConfig.homePath ?? portalConfig.homePath
}

export function getLoginPathByPortal(portal: AuthPortal) {
  return PORTAL_CONFIG[portal].loginPath
}

export function getLoginPathByRole(role: AppRole) {
  const portal = getPortalByRole(role)

  return PORTAL_CONFIG[portal].loginPath
}

export function getApiBasePathByRole(role: AppRole) {
  return ROLE_CONFIG[role].apiBasePath
}

export function isRoleAllowedInPortal(portal: AuthPortal, role: AppRole) {
  return PORTAL_CONFIG[portal].allowedRoles.includes(role)
}

export function getDefaultLoginPath() {
  return PORTAL_CONFIG.user.loginPath
}

export function pathnameMatchesRootPath(pathname: string, rootPath: string) {
  const normalizedPathname = pathname.split(/[?#]/)[0]

  return normalizedPathname === rootPath || normalizedPathname.startsWith(`${rootPath}/`)
}

export function getLoginPathByPathname(pathname: string) {
  const portalConfig = Object.values(PORTAL_CONFIG).find((config) => pathnameMatchesRootPath(pathname, config.rootPath))

  return portalConfig?.loginPath ?? getDefaultLoginPath()
}

export function getPortalByPathname(pathname: string): AuthPortal | null {
  const portalEntry = Object.entries(PORTAL_CONFIG).find(([, config]) =>
    pathnameMatchesRootPath(pathname, config.rootPath)
  )

  return (portalEntry?.[0] as AuthPortal | undefined) ?? null
}

export function getAuthPathByPortal(portal: AuthPortal, endpoint: string) {
  return joinPath(PORTAL_CONFIG[portal].authEndpoint, endpoint)
}
