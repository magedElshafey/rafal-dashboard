import { usePortalPath } from '@/components/core/portal-link/hooks/usePortalPath'
import { forwardRef } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

type PortalLinkProps = Omit<LinkProps, 'to'> & {
  to: string
}

export const PortalLink = forwardRef<HTMLAnchorElement, PortalLinkProps>(function PortalLink({ to, ...props }, ref) {
  const portalPath = usePortalPath(to)

  return <Link ref={ref} to={portalPath} {...props} />
})
