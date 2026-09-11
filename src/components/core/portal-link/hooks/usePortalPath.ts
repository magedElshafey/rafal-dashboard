import { useLocation } from 'react-router-dom'

import { buildPortalPath } from '@/components/core/portal-link/utils/portal-path.helpers'
import { useAuth } from '@/store/auth'

export function usePortalPath(to: string) {
  const location = useLocation()
  const portal = useAuth((state) => state.portal)

  return buildPortalPath(to, {
    portal,
    pathname: location.pathname,
  })
}
