import { Link } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { Routes } from '@/routes/routes'

type AppLogoSize = 'sm' | 'md' | 'lg'

type AppLogoProps = {
  size?: AppLogoSize
  className?: string
  priority?: boolean
}

const sizeClassNames: Record<AppLogoSize, string> = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
}

const AppLogo = ({ size = 'md', className }: AppLogoProps) => (
  <Link
    to={Routes.root}
    aria-label="Rafal Dashboard"
    className={cn(
      'inline-flex max-w-full shrink-0 rounded-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
      sizeClassNames[size],
      className
    )}
  >
    Rafal Dashboard
  </Link>
)

export default AppLogo
