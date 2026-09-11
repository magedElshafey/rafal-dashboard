import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

type ContentSidebarLayoutProps = {
  main: ReactNode
  side: ReactNode
  className?: string
  contentClassName?: string
}
const ContentSidebarLayout = ({ main, side, className, contentClassName }: ContentSidebarLayoutProps) => {
  return (
    <div className={cn('mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]', className)}>
      <div className={contentClassName}>{main}</div>
      {side}
    </div>
  )
}

export default ContentSidebarLayout
