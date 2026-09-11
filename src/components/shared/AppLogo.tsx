import Image from '@/components/core/Image'
import { PortalLink } from '@/components/core/portal-link/components/PortalLink'
import appLogo from '@/assets/logo.svg'
import { cn } from '@/lib/utils'

type AppLogoSize = 'sm' | 'md' | 'lg'

type AppLogoProps = {
  size?: AppLogoSize
  className?: string
  priority?: boolean
}

const sizeClassNames: Record<AppLogoSize, string> = {
  sm: 'w-[90px]',
  md: 'w-[135px]',
  lg: 'w-[180px]',
}

const AppLogo = ({ size = 'md', className, priority = false }: AppLogoProps) => {
  return (
    <PortalLink
      to="/home"
      className={cn(
        'inline-flex max-w-full shrink-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        className
      )}
    >
      <Image
        src={appLogo}
        alt="Smart Hub"
        width={135}
        height={33}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        className={cn('block h-auto max-w-full object-contain', sizeClassNames[size])}
      />
    </PortalLink>
  )
}

export default AppLogo
