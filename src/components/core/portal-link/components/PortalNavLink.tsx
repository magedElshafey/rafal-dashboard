import { forwardRef } from 'react'
import { Link, type LinkProps, useMatch, useResolvedPath } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { usePortalPath } from '@/components/core/portal-link/hooks/usePortalPath'

type PortalNavLinkProps = Omit<LinkProps, 'to'> & {
  to: string
  activeClassName?: string
  inactiveClassName?: string
  end?: boolean
  caseSensitive?: boolean
}

const PORTAL_NAV_LINK_FOCUS_CLASS_NAME =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2'

export const PortalNavLink = forwardRef<HTMLAnchorElement, PortalNavLinkProps>(function PortalNavLink(
  { to, className, activeClassName, inactiveClassName, children, end = false, caseSensitive = false, ...props },
  ref
) {
  const portalPath = usePortalPath(to)
  const resolvedPath = useResolvedPath(portalPath)

  const match = useMatch({
    path: resolvedPath.pathname,
    end: resolvedPath.pathname === '/' ? true : end,
    caseSensitive,
  })

  const isActive = Boolean(match)

  return (
    <Link
      ref={ref}
      to={portalPath}
      {...props}
      data-active={isActive}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        PORTAL_NAV_LINK_FOCUS_CLASS_NAME,
        'transition-colors',
        isActive ? activeClassName : inactiveClassName,
        className
      )}
    >
      {children}
    </Link>
  )
})
