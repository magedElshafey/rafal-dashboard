import { cn } from '@/lib/utils'
import { PropsWithChildren } from 'react'

type AppContainerProps = PropsWithChildren<{
  className?: string
}>
const AppContainer: React.FC<AppContainerProps> = ({ children, className }) => {
  return (
    <div className={cn('mx-auto w-full max-w-[1440px] px-4 md:px-8 lg:px-10 xl:px-16 2xl:px-20 gap-4', className)}>
      {children}
    </div>
  )
}

export default AppContainer
